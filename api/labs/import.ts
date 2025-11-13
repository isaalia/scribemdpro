import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { encounter_id, lab_results } = req.body

  if (!encounter_id || !lab_results) {
    return res.status(400).json({ error: 'encounter_id and lab_results are required' })
  }

  try {
    // Get encounter
    const { data: encounter, error: encounterError } = await supabase
      .from('encounters')
      .select('*')
      .eq('id', encounter_id)
      .single()

    if (encounterError || !encounter) {
      throw new Error('Encounter not found')
    }

    // Store lab results in encounter files or as structured data
    // For MVP, we'll add them to the encounter's files array
    const existingFiles = encounter.files || []
    const labFiles = Array.isArray(lab_results) ? lab_results : [lab_results]

    const newFiles = labFiles.map((lab: any) => ({
      id: `lab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: lab.name || `Lab Result - ${new Date().toLocaleDateString()}`,
      type: 'lab_result',
      url: lab.url || '',
      data: lab.data || lab,
      uploaded_at: new Date().toISOString(),
    }))

    // Update encounter with lab results
    const { error: updateError } = await supabase
      .from('encounters')
      .update({
        files: [...existingFiles, ...newFiles],
      })
      .eq('id', encounter_id)

    if (updateError) throw updateError

    return res.status(200).json({
      success: true,
      files_added: newFiles.length,
    })
  } catch (error: any) {
    console.error('Lab import error:', error)
    return res.status(500).json({
      error: error.message || 'Failed to import lab results',
    })
  }
}

