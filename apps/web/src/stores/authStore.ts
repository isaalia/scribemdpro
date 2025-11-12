import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  practice_id: string
}

interface AuthStore {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  init: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,

  init: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Fetch user details from users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
        
        if (error) {
          console.error('Error fetching user:', error)
          set({ loading: false })
          return
        }
        
        if (userData) {
          set({ user: userData, loading: false })
        } else {
          console.warn('User session exists but no user record found in database')
          set({ loading: false })
        }
      } else {
        set({ loading: false })
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ loading: false })
    }
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    console.log('Auth user ID after login:', data.user!.id)
    
    // Fetch user details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user!.id)
      .maybeSingle()
    
    console.log('User query result:', { userData, userError })
    
    if (userError) {
      console.error('Error fetching user after login:', userError)
      throw new Error(`Database error: ${userError.message}. Auth User ID: ${data.user!.id}`)
    }
    
    if (!userData) {
      // Try to find by email as fallback
      const { data: userByEmail } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle()
      
      if (userByEmail) {
        console.warn('Found user by email but ID mismatch. Auth ID:', data.user!.id, 'DB ID:', userByEmail.id)
        throw new Error(`User ID mismatch. Auth ID: ${data.user!.id}, DB ID: ${userByEmail.id}. Please update the user record in the database.`)
      }
      
      throw new Error(`User record not found. Auth User ID: ${data.user!.id}. Please run the SQL script with this ID.`)
    }
    
    set({ user: userData })
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))

// Initialize auth on store creation
useAuthStore.getState().init()

