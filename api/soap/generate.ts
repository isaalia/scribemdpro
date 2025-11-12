import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { transcript, encounter_id, encounter_type, patient_age, chief_complaint } = req.body

  if (!transcript) {
    return res.status(400).json({ error: 'Transcript is required' })
  }

  try {
    const prompt = `You are a medical documentation expert. Generate a comprehensive SOAP note from this encounter transcript.

${patient_age ? `Patient Age: ${patient_age}` : ''}
${encounter_type ? `Encounter Type: ${encounter_type.replace('_', ' ')}` : ''}
${chief_complaint ? `Chief Complaint: ${chief_complaint}` : ''}

Transcript:
${transcript}

Generate a structured SOAP note with:
- Subjective: Chief complaint, History of Present Illness (HPI), Review of Systems (ROS)
- Objective: Physical examination findings, vital signs interpretation, any diagnostic tests mentioned
- Assessment: Primary diagnosis, differential diagnoses, ICD-10 codes with descriptions
- Plan: Treatment plan, medications prescribed, follow-up instructions, patient education

Format as JSON:
{
  "subjective": {
    "chief_complaint": "...",
    "hpi": "...",
    "ros": "..."
  },
  "objective": {
    "physical_exam": "...",
    "vitals": "...",
    "diagnostic_tests": "..."
  },
  "assessment": {
    "primary_diagnosis": "...",
    "differential_diagnosis": ["...", "..."],
    "icd10_codes": [
      {"code": "J02.9", "description": "Acute pharyngitis", "confidence": 0.92}
    ]
  },
  "plan": {
    "treatment": "...",
    "medications": ["..."],
    "follow_up": "...",
    "patient_education": "..."
  },
  "em_level": "99213",
  "clinical_flags": []
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Claude')
    }

    // Try to parse JSON from the response
    let soapNote
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                       content.text.match(/(\{[\s\S]*\})/)
      if (jsonMatch) {
        soapNote = JSON.parse(jsonMatch[1])
      } else {
        // If no JSON found, try parsing the whole text
        soapNote = JSON.parse(content.text)
      }
    } catch (parseError) {
      // If JSON parsing fails, return a structured response with the text
      soapNote = {
        subjective: { note: content.text },
        objective: {},
        assessment: {},
        plan: {},
        icd10_codes: [],
        em_level: null,
        clinical_flags: [],
        raw_response: content.text,
      }
    }

    return res.status(200).json({ 
      soap_note: soapNote,
      encounter_id,
    })
  } catch (error: any) {
    console.error('SOAP generation error:', error)
    return res.status(500).json({ 
      error: error.message || 'Failed to generate SOAP note',
      details: error.toString(),
    })
  }
}

