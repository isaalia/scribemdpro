import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './authStore'

export interface Template {
  id: string
  practice_id: string
  created_by: string | null
  name: string
  type: 'soap' | 'hpi' | 'ros' | 'exam' | 'plan' | 'custom'
  is_default: boolean
  is_active: boolean
  content: {
    sections?: Array<{
      id: string
      name: string
      fields: Array<{
        id: string
        label: string
        type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number'
        placeholder?: string
        options?: string[]
        required?: boolean
      }>
    }>
    prompts?: Record<string, string>
    style?: string
  }
  usage_count: number
  created_at: string
  updated_at: string
}

interface TemplateStore {
  templates: Template[]
  currentTemplate: Template | null
  loading: boolean
  error: string | null
  fetchTemplates: () => Promise<void>
  fetchTemplate: (id: string) => Promise<void>
  createTemplate: (template: Omit<Template, 'id' | 'practice_id' | 'created_by' | 'usage_count' | 'created_at' | 'updated_at'>) => Promise<Template>
  updateTemplate: (id: string, updates: Partial<Template>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  applyTemplate: (templateId: string, encounterId: string) => Promise<void>
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  templates: [],
  currentTemplate: null,
  loading: false,
  error: null,

  fetchTemplates: async () => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users')
        .select('practice_id')
        .eq('id', user.id)
        .single()

      if (!userData) throw new Error('User not found')

      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('practice_id', userData.practice_id)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true })

      if (error) throw error
      set({ templates: data || [], loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  fetchTemplate: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      set({ currentTemplate: data, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  createTemplate: async (template) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users')
        .select('practice_id')
        .eq('id', user.id)
        .single()

      if (!userData) throw new Error('User not found')

      // If this is set as default, unset other defaults of the same type
      if (template.is_default) {
        await supabase
          .from('templates')
          .update({ is_default: false })
          .eq('practice_id', userData.practice_id)
          .eq('type', template.type)
          .eq('is_default', true)
      }

      const { data, error } = await supabase
        .from('templates')
        .insert({
          practice_id: userData.practice_id,
          created_by: user.id,
          name: template.name,
          type: template.type,
          is_default: template.is_default,
          is_active: template.is_active,
          content: template.content,
        })
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        templates: [...state.templates, data],
        loading: false,
      }))

      return data
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  updateTemplate: async (id, updates) => {
    set({ loading: true, error: null })
    try {
      const template = get().templates.find(t => t.id === id)
      if (!template) throw new Error('Template not found')

      // If setting as default, unset other defaults of the same type
      if (updates.is_default === true) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('practice_id')
            .eq('id', user.id)
            .single()

          if (userData) {
            await supabase
              .from('templates')
              .update({ is_default: false })
              .eq('practice_id', userData.practice_id)
              .eq('type', template.type)
              .eq('is_default', true)
              .neq('id', id)
          }
        }
      }

      const { data, error } = await supabase
        .from('templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        templates: state.templates.map(t => t.id === id ? data : t),
        currentTemplate: state.currentTemplate?.id === id ? data : state.currentTemplate,
        loading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  deleteTemplate: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        templates: state.templates.filter(t => t.id !== id),
        currentTemplate: state.currentTemplate?.id === id ? null : state.currentTemplate,
        loading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  applyTemplate: async (templateId: string, encounterId: string) => {
    set({ loading: true, error: null })
    try {
      const template = get().templates.find(t => t.id === templateId)
      if (!template) throw new Error('Template not found')

      // Increment usage count
      await supabase
        .from('templates')
        .update({ 
          usage_count: template.usage_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId)

      // Apply template content to encounter
      // This would populate encounter fields based on template structure
      // For now, we'll store the template reference
      const { error } = await supabase
        .from('encounters')
        .update({
          // Store template ID in metadata or apply template structure
          updated_at: new Date().toISOString(),
        })
        .eq('id', encounterId)

      if (error) throw error

      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
}))

