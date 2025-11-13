import type { VercelRequest, VercelResponse } from '@vercel/node'

// Return Deepgram API key for client-side use
// In production, consider using Deepgram's project key management for better security
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const apiKey = process.env.DEEPGRAM_API_KEY

    if (!apiKey) {
      return res.status(500).json({
        error: 'Deepgram API key not configured',
      })
    }

    // For MVP: Return API key directly
    // TODO: Implement proper token generation using Deepgram's REST API
    // or use Deepgram's project key management for better security
    return res.status(200).json({
      token: apiKey,
      expires_in: 3600, // Not enforced, but indicates token validity
    })
  } catch (error: any) {
    console.error('Token generation error:', error)
    return res.status(500).json({
      error: error.message || 'Failed to generate transcription token',
    })
  }
}

