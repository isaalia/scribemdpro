import type { VercelRequest, VercelResponse } from '@vercel/node'

const DRCHRONO_CLIENT_ID = process.env.DRCHRONO_CLIENT_ID!
const DRCHRONO_CLIENT_SECRET = process.env.DRCHRONO_CLIENT_SECRET!
const DRCHRONO_REDIRECT_URI = process.env.DRCHRONO_REDIRECT_URI || `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/drchrono/callback`

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { practice_id } = req.query

  if (!practice_id) {
    return res.status(400).json({ error: 'practice_id is required' })
  }

  // Generate state token for CSRF protection
  const state = Buffer.from(JSON.stringify({ practice_id, timestamp: Date.now() })).toString('base64')

  // DrChrono OAuth authorization URL
  const authUrl = `https://drchrono.com/o/authorize/?redirect_uri=${encodeURIComponent(DRCHRONO_REDIRECT_URI)}&response_type=code&client_id=${DRCHRONO_CLIENT_ID}&state=${state}`

  return res.redirect(authUrl)
}

