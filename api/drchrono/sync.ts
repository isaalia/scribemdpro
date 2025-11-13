import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getAccessToken(practiceId: string) {
  const { data: integration, error } = await supabase
    .from('integrations')
    .select('credentials')
    .eq('practice_id', practiceId)
    .eq('type', 'drchrono')
    .eq('status', 'active')
    .single()

  if (error || !integration) {
    throw new Error('DrChrono integration not found or inactive')
  }

  const creds = integration.credentials as any

  // Check if token needs refresh
  if (creds.expires_at && Date.now() >= creds.expires_at) {
    // Refresh token logic would go here
    // For now, return existing token
  }

  return creds.access_token
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { practice_id, encounter_id } = req.body

  if (!practice_id || !encounter_id) {
    return res.status(400).json({ error: 'practice_id and encounter_id are required' })
  }

  try {
    const accessToken = await getAccessToken(practice_id)

    // Get encounter data
    const { data: encounter, error: encounterError } = await supabase
      .from('encounters')
      .select('*, patients(*), users(*)')
      .eq('id', encounter_id)
      .single()

    if (encounterError || !encounter) {
      throw new Error('Encounter not found')
    }

    // Format encounter for DrChrono API
    const drchronoData = {
      patient: encounter.patients?.drchrono_patient_id || null,
      exam_notes: encounter.soap_note?.objective?.physical_exam || '',
      clinical_notes: encounter.soap_note?.subjective?.hpi || '',
      assessment: encounter.soap_note?.assessment?.primary_diagnosis || '',
      plan: encounter.soap_note?.plan?.treatment || '',
      chief_complaint: encounter.chief_complaint || '',
      // Map ICD-10 codes
      diagnosis_codes: encounter.icd10_codes?.map((code: any) => code.code) || [],
    }

    // Send to DrChrono API
    const drchronoResponse = await fetch('https://drchrono.com/api/clinical_notes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(drchronoData),
    })

    if (!drchronoResponse.ok) {
      const errorData = await drchronoResponse.json()
      throw new Error(errorData.detail || 'Failed to sync to DrChrono')
    }

    const result = await drchronoResponse.json()

    // Update encounter with sync status
    await supabase
      .from('encounters')
      .update({
        exported_at: new Date().toISOString(),
        exported_to: 'drchrono',
      })
      .eq('id', encounter_id)

    return res.status(200).json({
      success: true,
      drchrono_id: result.id,
    })
  } catch (error: any) {
    console.error('DrChrono sync error:', error)
    return res.status(500).json({
      error: error.message || 'Failed to sync to DrChrono',
    })
  }
}

