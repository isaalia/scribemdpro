import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@deepgram/sdk'

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!)

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // For file uploads, the audio will be in req.body or req.files
    // This is a placeholder - actual implementation will depend on how audio is sent
    const { audioUrl, encounter_id } = req.body

    if (!audioUrl && !req.body.audio) {
      return res.status(400).json({ error: 'Audio file or URL is required' })
    }

    // Transcribe using Deepgram
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioUrl || req.body.audio,
      {
        model: 'nova-2',
        language: 'en-US',
        smart_format: true,
        punctuate: true,
        paragraphs: true,
      }
    )

    if (error) {
      throw error
    }

    const transcript = result?.results?.channels[0]?.alternatives[0]?.transcript || ''
    const paragraphs = result?.results?.channels[0]?.alternatives[0]?.paragraphs?.transcript || ''

    return res.status(200).json({
      transcript: transcript || paragraphs,
      confidence: result?.results?.channels[0]?.alternatives[0]?.confidence || 0,
      encounter_id,
    })
  } catch (error: any) {
    console.error('Transcription error:', error)
    return res.status(500).json({ 
      error: error.message || 'Failed to transcribe audio',
    })
  }
}

