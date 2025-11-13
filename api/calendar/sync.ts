import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Calendar integration placeholder
// Supports Google Calendar, Outlook, Apple Calendar via iCal format

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { encounter_id, calendar_type } = req.body

  if (!encounter_id) {
    return res.status(400).json({ error: 'encounter_id is required' })
  }

  try {
    // Get encounter data
    const { data: encounter, error: encounterError } = await supabase
      .from('encounters')
      .select('*, patients(*), users(*)')
      .eq('id', encounter_id)
      .single()

    if (encounterError || !encounter) {
      throw new Error('Encounter not found')
    }

    // Generate iCal format for calendar integration
    const icalContent = generateICal(encounter)

    return res.status(200).json({
      success: true,
      ical: icalContent,
      download_url: `/api/calendar/download/${encounter_id}.ics`,
    })
  } catch (error: any) {
    console.error('Calendar sync error:', error)
    return res.status(500).json({
      error: error.message || 'Failed to generate calendar event',
    })
  }
}

function generateICal(encounter: any): string {
  const patient = encounter.patients
  const provider = encounter.users
  const startDate = new Date(encounter.encounter_date)
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000) // 30 minutes default

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  return `BEGIN:VCALENDAR
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
}

