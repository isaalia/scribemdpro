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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { encounterId } = req.query

  if (!encounterId) {
    return res.status(400).json({ error: 'encounterId is required' })
  }

  try {
    // Get encounter data
    const { data: encounter, error: encounterError } = await supabase
      .from('encounters')
      .select('*, patients(*), users(*)')
      .eq('id', encounterId)
      .single()

    if (encounterError || !encounter) {
      return res.status(404).json({ error: 'Encounter not found' })
    }

    // Generate iCal format
    const patient = encounter.patients
    const provider = encounter.users
    const startDate = new Date(encounter.encounter_date)
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000)

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ScribeMD Pro//EN
BEGIN:VEVENT
UID:${encounter.id}@scribemd.co
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${encounter.encounter_type?.replace('_', ' ')} - ${patient?.first_name} ${patient?.last_name}
DESCRIPTION:Encounter with ${patient?.first_name} ${patient?.last_name}\\nProvider: ${provider?.full_name}\\nChief Complaint: ${encounter.chief_complaint || 'N/A'}
LOCATION:Medical Practice
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`

    res.setHeader('Content-Type', 'text/calendar')
    res.setHeader('Content-Disposition', `attachment; filename="encounter-${encounterId.substring(0, 8)}.ics"`)
    return res.status(200).send(icalContent)
  } catch (error: any) {
    console.error('Calendar download error:', error)
    return res.status(500).json({
      error: error.message || 'Failed to generate calendar file',
    })
  }
}

