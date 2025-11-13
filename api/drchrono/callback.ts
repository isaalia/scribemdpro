import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const DRCHRONO_CLIENT_ID = process.env.DRCHRONO_CLIENT_ID!
const DRCHRONO_CLIENT_SECRET = process.env.DRCHRONO_CLIENT_SECRET!
const DRCHRONO_REDIRECT_URI = process.env.DRCHRONO_REDIRECT_URI || `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/drchrono/callback`

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, state, error } = req.query

  if (error) {
    return res.redirect(`/admin/integrations?error=${encodeURIComponent(error as string)}`)
  }

  if (!code || !state) {
    return res.redirect('/admin/integrations?error=missing_parameters')
  }

  try {
    // Decode state to get practice_id
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString())
    const practiceId = stateData.practice_id

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://drchrono.com/o/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: DRCHRONO_REDIRECT_URI,
        client_id: DRCHRONO_CLIENT_ID,
        client_secret: DRCHRONO_CLIENT_SECRET,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      throw new Error(errorData.error || 'Failed to exchange code for token')
    }

    const tokens = await tokenResponse.json()

    // Store integration in database
    const { error: dbError } = await supabase.from('integrations').upsert({
      practice_id: practiceId,
      type: 'drchrono',
      status: 'active',
      credentials: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Date.now() + tokens.expires_in * 1000,
      },
      last_sync_at: new Date().toISOString(),
    }, {
      onConflict: 'practice_id,type',
    })

    if (dbError) {
      throw dbError
    }

    return res.redirect(`/admin/integrations?success=true`)
  } catch (error: any) {
    console.error('DrChrono callback error:', error)
    return res.redirect(`/admin/integrations?error=${encodeURIComponent(error.message)}`)
  }
}

