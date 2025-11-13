import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { logAuditEvent, AuditActions, ResourceTypes } from '../lib/audit'

export interface Patient {
  id: string
  practice_id: string
  external_id?: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender?: string
  mrn?: string
  phone?: string
  email?: string
  address?: any
  insurance?: any
  allergies?: any[]
  medications?: any[]
  medical_history?: any
  created_at: string
  updated_at: string
}

interface PatientStore {
  patients: Patient[]
  currentPatient: Patient | null
  loading: boolean
  error: string | null
  fetchPatients: () => Promise<void>
  fetchPatient: (id: string) => Promise<void>
  createPatient: (patient: Omit<Patient, 'id' | 'practice_id' | 'created_at' | 'updated_at'>) => Promise<Patient>
  updatePatient: (id: string, patient: Partial<Patient>) => Promise<void>
  deletePatient: (id: string) => Promise<void>
  searchPatients: (query: string) => Promise<Patient[]>
}

export const usePatientStore = create<PatientStore>((set) => ({
  patients: [],
  currentPatient: null,
  loading: false,
  error: null,

  fetchPatients: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('last_name', { ascending: true })
      
      if (error) throw error
      set({ patients: data || [], loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  fetchPatient: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      set({ currentPatient: data, loading: false })
      
      // Audit log
      await logAuditEvent({
        action: AuditActions.VIEW,
        resource_type: ResourceTypes.PATIENT,
        resource_id: id,
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  createPatient: async (patientData) => {
    set({ loading: true, error: null })
    try {
      // Get current user to get practice_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users')
        .select('practice_id')
        .eq('id', user.id)
        .single()

      if (!userData) throw new Error('User not found')

      const { data, error } = await supabase
        .from('patients')
        .insert({
          ...patientData,
          practice_id: userData.practice_id,
        })
        .select()
        .single()
      
      if (error) throw error
      
      set((state) => ({
        patients: [...state.patients, data],
        loading: false,
      }))
      
      return data
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  updatePatient: async (id: string, patientData: Partial<Patient>) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('patients')
        .update(patientData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        patients: state.patients.map(p => p.id === id ? data : p),
        currentPatient: state.currentPatient?.id === id ? data : state.currentPatient,
        loading: false,
      }))

      // Audit log
      await logAuditEvent({
        action: AuditActions.UPDATE,
        resource_type: ResourceTypes.PATIENT,
        resource_id: id,
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  deletePatient: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        patients: state.patients.filter(p => p.id !== id),
        currentPatient: state.currentPatient?.id === id ? null : state.currentPatient,
        loading: false,
      }))

      // Audit log
      await logAuditEvent({
        action: AuditActions.DELETE,
        resource_type: ResourceTypes.PATIENT,
        resource_id: id,
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  searchPatients: async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,mrn.ilike.%${query}%`)
        .limit(20)
      
      if (error) throw error
      return data || []
    } catch (error: any) {
      set({ error: error.message })
      return []
    }
  },
}))

