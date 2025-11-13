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

  const { transcript, soap_note, vitals, chief_complaint, patient_age } = req.body

  if (!transcript && !soap_note && !chief_complaint) {
    return res.status(400).json({ error: 'At least one of transcript, soap_note, or chief_complaint is required' })
  }

  try {
    const prompt = `You are a clinical decision support expert. Analyze this encounter for:
1. **Red Flags** - Urgent/emergent conditions requiring immediate attention
2. **Differential Diagnoses** - Possible diagnoses to consider
3. **Drug Interactions** - Potential medication interactions (if medications mentioned)

${patient_age ? `Patient Age: ${patient_age}` : ''}
${chief_complaint ? `Chief Complaint: ${chief_complaint}` : ''}
${vitals ? `Vital Signs: ${JSON.stringify(vitals)}` : ''}
${soap_note ? `SOAP Note: ${JSON.stringify(soap_note)}` : ''}
${transcript ? `Transcript:\n${transcript.substring(0, 3000)}` : ''}

Return JSON format:
{
  "red_flags": [
    {
      "type": "high|medium|low",
      "message": "Brief description of the red flag",
      "severity": "critical|urgent|moderate",
      "recommendation": "Suggested action"
    }
  ],
  "differential_diagnosis": [
    {
      "diagnosis": "Condition name",
      "likelihood": "high|moderate|low",
      "supporting_evidence": "Why this diagnosis is possible",
      "ruling_out": "What would help rule this out"
    }
  ],
  "drug_interactions": [
    {
      "medication1": "Drug name",
      "medication2": "Drug name",
      "interaction": "Description of interaction",
      "severity": "severe|moderate|mild",
      "recommendation": "What to do"
    }
  ],
  "vital_abnormalities": [
    {
      "vital": "blood_pressure|heart_rate|temperature|etc",
      "value": "Actual value",
      "normal_range": "Normal range",
      "severity": "critical|moderate|mild",
      "concern": "Why this is concerning"
    }
  ]
}`

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
    let result
    try {
      const jsonMatch = content.text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                       content.text.match(/(\{[\s\S]*\})/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1])
      } else {
        result = JSON.parse(content.text)
      }
    } catch (parseError) {
      return res.status(500).json({
        error: 'Failed to parse clinical flags',
        raw_response: content.text,
      })
    }

    // Ensure arrays exist
    result.red_flags = result.red_flags || []
    result.differential_diagnosis = result.differential_diagnosis || []
    result.drug_interactions = result.drug_interactions || []
    result.vital_abnormalities = result.vital_abnormalities || []

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Clinical flags error:', error)
    return res.status(500).json({
      error: error.message || 'Failed to analyze clinical flags',
      details: error.toString(),
    })
  }
}

