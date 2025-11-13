import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// E/M Level Guidelines (2021/2023 CMS guidelines)
const EM_LEVELS = {
  '99211': { name: 'Level 1', description: 'Minimal complexity, minimal documentation' },
  '99212': { name: 'Level 2', description: 'Straightforward, minimal complexity' },
  '99213': { name: 'Level 3', description: 'Low complexity, requires 2 of 3: problem-focused history, exam, straightforward MDM' },
  '99214': { name: 'Level 4', description: 'Moderate complexity, requires 2 of 3: detailed history, exam, moderate MDM' },
  '99215': { name: 'Level 5', description: 'High complexity, requires 2 of 3: comprehensive history, exam, high MDM' },
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { 
    transcript, 
    soap_note, 
    encounter_type, 
    chief_complaint,
    vitals,
    patient_age,
    history_complexity,
    exam_complexity,
    mdm_complexity,
  } = req.body

  try {
    // If explicit complexities provided, calculate directly
    if (history_complexity && exam_complexity && mdm_complexity) {
      const level = calculateEMLevel(history_complexity, exam_complexity, mdm_complexity)
      return res.status(200).json({
        em_level: level,
        reasoning: `Based on provided complexities: History=${history_complexity}, Exam=${exam_complexity}, MDM=${mdm_complexity}`,
        details: {
          history_complexity,
          exam_complexity,
          mdm_complexity,
        },
      })
    }

    // Otherwise, use AI to analyze and calculate
    const prompt = `You are a medical coding expert specializing in E/M (Evaluation and Management) level determination.

Analyze this encounter and determine the appropriate E/M level (99211-99215) based on 2021/2023 CMS guidelines.

${patient_age ? `Patient Age: ${patient_age}` : ''}
${encounter_type ? `Encounter Type: ${encounter_type.replace('_', ' ')}` : ''}
${chief_complaint ? `Chief Complaint: ${chief_complaint}` : ''}
${vitals ? `Vital Signs: ${JSON.stringify(vitals)}` : ''}
${soap_note ? `SOAP Note: ${JSON.stringify(soap_note)}` : ''}
${transcript ? `Transcript:\n${transcript.substring(0, 3000)}` : ''}

Determine E/M level based on THREE key components (need 2 of 3):
1. **History Complexity**: Problem-focused, Expanded problem-focused, Detailed, Comprehensive
2. **Exam Complexity**: Problem-focused, Expanded problem-focused, Detailed, Comprehensive  
3. **Medical Decision Making (MDM)**: Straightforward, Low, Moderate, High

MDM Complexity Factors:
- Number of diagnoses/management options
- Amount/complexity of data reviewed
- Risk of complications/morbidity/mortality

Return JSON format:
{
  "em_level": "99213",
  "reasoning": "Brief explanation of why this level was selected",
  "details": {
    "history_complexity": "detailed",
    "exam_complexity": "detailed", 
    "mdm_complexity": "moderate",
    "history_points": ["HPI: 4 elements", "ROS: 10 systems", "PFSH: 2 elements"],
    "exam_points": ["Constitutional: 1", "Cardiovascular: 2", "Respiratory: 2"],
    "mdm_points": ["2 diagnoses", "Lab review", "Moderate risk"]
  }
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
      // Fallback: try to extract level from text
      const levelMatch = content.text.match(/99\d{3}/)
      result = {
        em_level: levelMatch ? levelMatch[0] : '99213',
        reasoning: content.text.substring(0, 500),
        details: {},
      }
    }

    // Validate E/M level
    if (!result.em_level || !EM_LEVELS[result.em_level as keyof typeof EM_LEVELS]) {
      result.em_level = '99213' // Default to level 3
    }

    return res.status(200).json({
      em_level: result.em_level,
      reasoning: result.reasoning || 'E/M level calculated based on encounter complexity',
      details: result.details || {},
      level_info: EM_LEVELS[result.em_level as keyof typeof EM_LEVELS],
    })
  } catch (error: any) {
    console.error('E/M calculation error:', error)
    return res.status(500).json({
      error: error.message || 'Failed to calculate E/M level',
      details: error.toString(),
    })
  }
}

function calculateEMLevel(history: string, exam: string, mdm: string): string {
  // Map complexities to numeric values
  const complexityMap: Record<string, number> = {
    'problem-focused': 1,
    'expanded-problem-focused': 2,
    'detailed': 3,
    'comprehensive': 4,
    'straightforward': 1,
    'low': 2,
    'moderate': 3,
    'high': 4,
  }

  const h = complexityMap[history.toLowerCase()] || 1
  const e = complexityMap[exam.toLowerCase()] || 1
  const m = complexityMap[mdm.toLowerCase()] || 1

  // Need 2 of 3 components
  const values = [h, e, m].sort((a, b) => b - a)
  const secondHighest = values[1]

  // Map to E/M level
  if (secondHighest >= 4) return '99215'
  if (secondHighest >= 3) return '99214'
  if (secondHighest >= 2) return '99213'
  return '99212'
}

