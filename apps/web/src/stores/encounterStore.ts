import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useEmailStore } from './emailStore'
import { logAuditEvent, AuditActions, ResourceTypes } from '../lib/audit'

export interface Encounter {
  id: string
  practice_id: string
  patient_id: string
  provider_id?: string
  encounter_type: string
  encounter_date: string
  status: 'in_progress' | 'completed' | 'signed' | 'exported'
  chief_complaint?: string
  vitals?: any
  raw_transcript?: string
  transcript_segments?: any[]
  soap_note?: any
  icd10_codes?: any[]
  em_level?: string
  em_reasoning?: string
  differential_diagnosis?: any[]
  clinical_flags?: any[]
  orders?: any[]
  prescriptions?: any[]
  files?: any[]
  duration_seconds?: number
  word_count?: number
  completed_at?: string
  signed_at?: string
  signed_by?: string
  exported_at?: string
  exported_to?: string
  created_at: string
  updated_at: string
}

interface EncounterStore {
  encounters: Encounter[]
  currentEncounter: Encounter | null
  loading: boolean
  error: string | null
  fetchEncounters: (patientId?: string) => Promise<void>
  fetchEncounter: (id: string) => Promise<void>
  createEncounter: (encounter: Omit<Encounter, 'id' | 'practice_id' | 'created_at' | 'updated_at'>) => Promise<Encounter>
  updateEncounter: (id: string, encounter: Partial<Encounter>) => Promise<void>
  deleteEncounter: (id: string) => Promise<void>
  signEncounter: (id: string) => Promise<void>
  generateSOAP: (id: string) => Promise<void>
}

export const useEncounterStore = create<EncounterStore>((set, get) => ({
  encounters: [],
  currentEncounter: null,
  loading: false,
  error: null,

  fetchEncounters: async (patientId?: string) => {
    set({ loading: true, error: null })
    try {
      let query = supabase
        .from('encounters')
        .select('*')
        .order('encounter_date', { ascending: false })

      if (patientId) {
        query = query.eq('patient_id', patientId)
      }

      const { data, error } = await query

      if (error) throw error
      set({ encounters: data || [], loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  fetchEncounter: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('encounters')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      set({ currentEncounter: data, loading: false })
      
      // Audit log
      await logAuditEvent({
        action: AuditActions.VIEW,
        resource_type: ResourceTypes.ENCOUNTER,
        resource_id: id,
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  createEncounter: async (encounterData) => {
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
        .from('encounters')
        .insert({
          ...encounterData,
          practice_id: userData.practice_id,
          provider_id: user.id,
          status: 'in_progress',
        })
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        encounters: [data, ...state.encounters],
        currentEncounter: data,
        loading: false,
      }))

      // Audit log
      await logAuditEvent({
        action: AuditActions.CREATE,
        resource_type: ResourceTypes.ENCOUNTER,
        resource_id: data.id,
      })

      return data
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  updateEncounter: async (id: string, encounterData: Partial<Encounter>) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('encounters')
        .update(encounterData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        encounters: state.encounters.map(e => e.id === id ? data : e),
        currentEncounter: state.currentEncounter?.id === id ? data : state.currentEncounter,
        loading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  deleteEncounter: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('encounters')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        encounters: state.encounters.filter(e => e.id !== id),
        currentEncounter: state.currentEncounter?.id === id ? null : state.currentEncounter,
        loading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

    signEncounter: async (id: string) => {
      set({ loading: true, error: null })
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data, error } = await supabase
          .from('encounters')
          .update({
            status: 'signed',
            signed_at: new Date().toISOString(),
            signed_by: user.id,
          })
          .eq('id', id)
          .select(`
            *,
            patients (*),
            users (*)
          `)
          .single()

        if (error) throw error

        set((state) => ({
          encounters: state.encounters.map(e => e.id === id ? data : e),
          currentEncounter: state.currentEncounter?.id === id ? data : state.currentEncounter,
          loading: false,
        }))

        // Audit log
        await logAuditEvent({
          action: AuditActions.SIGN,
          resource_type: ResourceTypes.ENCOUNTER,
          resource_id: id,
        })

        // Send email notification (non-blocking)
        try {
          const { sendEmail } = useEmailStore.getState()
          await sendEmail({
            to: (data.users as any)?.email || '',
            subject: 'Encounter Signed - ScribeMD Pro',
            template: 'encounter_signed',
            data: {
              patientName: `${(data.patients as any)?.first_name} ${(data.patients as any)?.last_name}`,
              providerName: (data.users as any)?.full_name,
              encounterDate: new Date(data.encounter_date).toLocaleDateString(),
              encounterType: data.encounter_type?.replace('_', ' '),
              encounterUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/encounters/${id}`,
            },
          })
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError)
          // Don't fail the sign operation if email fails
        }
      } catch (error: any) {
        set({ error: error.message, loading: false })
        throw error
      }
    },

  generateSOAP: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const encounter = get().currentEncounter || get().encounters.find(e => e.id === id)
      if (!encounter) throw new Error('Encounter not found')
      if (!encounter.raw_transcript) throw new Error('No transcript available. Please complete transcription first.')

      // Get patient info for context
      const { data: patient } = await supabase
        .from('patients')
        .select('date_of_birth')
        .eq('id', encounter.patient_id)
        .single()

      const patientAge = patient?.date_of_birth 
        ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : undefined

      // Call SOAP generation API
      const response = await fetch('/api/soap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encounter_id: id,
          transcript: encounter.raw_transcript,
          encounter_type: encounter.encounter_type,
          patient_age: patientAge,
          chief_complaint: encounter.chief_complaint,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate SOAP note')
      }

      const { soap_note } = await response.json()

      // Update encounter with SOAP note
      const { data, error } = await supabase
        .from('encounters')
        .update({
          soap_note,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        encounters: state.encounters.map(e => e.id === id ? data : e),
        currentEncounter: state.currentEncounter?.id === id ? data : state.currentEncounter,
        loading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
}))

