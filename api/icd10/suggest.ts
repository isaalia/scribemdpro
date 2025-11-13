import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface ICD10Suggestion {
  code: string
  description: string
  confidence: number
  rationale?: string
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { transcript, chief_complaint, assessment, patient_age, encounter_type } = req.body

  if (!transcript && !chief_complaint && !assessment) {
    return res.status(400).json({ error: 'At least one of transcript, chief_complaint, or assessment is required' })
  }

  try {
    const prompt = `You are a medical coding expert. Based on the following clinical information, suggest appropriate ICD-10 codes.

${patient_age ? `Patient Age: ${patient_age}` : ''}
${encounter_type ? `Encounter Type: ${encounter_type.replace('_', ' ')}` : ''}
${chief_complaint ? `Chief Complaint: ${chief_complaint}` : ''}
${assessment ? `Assessment: ${assessment}` : ''}
${transcript ? `Encounter Transcript:\n${transcript.substring(0, 2000)}` : ''}

Provide ICD-10 codes in JSON format as an array. For each code, include:
- code: The ICD-10 code (e.g., "J02.9")
- description: Full description of the diagnosis
- confidence: Confidence score between 0 and 1
- rationale: Brief explanation of why this code applies

Return ONLY valid JSON array format:
[
  {
    "code": "J02.9",
    "description": "Acute pharyngitis, unspecified",
    "confidence": 0.92,
    "rationale": "Patient presents with sore throat and pharyngeal erythema"
  }
]

Prioritize the most likely primary diagnosis first. Include 3-5 codes total.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Claude')
    }

    // Parse JSON from response
    let suggestions: ICD10Suggestion[]
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.text.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) || 
                       content.text.match(/(\[[\s\S]*\])/)
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[1])
      } else {
        suggestions = JSON.parse(content.text)
      }
    } catch (parseError) {
      // If JSON parsing fails, return error
      console.error('ICD-10 parsing error:', parseError)
      return res.status(500).json({
        error: 'Failed to parse ICD-10 suggestions',
        raw_response: content.text,
      })
    }

    // Validate suggestions structure
    if (!Array.isArray(suggestions)) {
      suggestions = [suggestions]
    }

    // Ensure all suggestions have required fields
    suggestions = suggestions.map((s: any) => ({
      code: s.code || '',
      description: s.description || '',
      confidence: s.confidence || 0.5,
      rationale: s.rationale || '',
    })).filter((s: any) => s.code && s.description)

    return res.status(200).json({
      suggestions,
      count: suggestions.length,
    })
  } catch (error: any) {
    console.error('ICD-10 suggestion error:', error)
    return res.status(500).json({
      error: error.message || 'Failed to generate ICD-10 suggestions',
      details: error.toString(),
    })
  }
}

