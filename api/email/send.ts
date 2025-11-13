import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { to, subject, html, text, template, data } = req.body

  if (!to || !subject) {
    return res.status(400).json({ error: 'to and subject are required' })
  }

  try {
    let emailContent: any = {
      from: process.env.EMAIL_FROM || 'ScribeMD Pro <noreply@scribemd.co>',
      to: Array.isArray(to) ? to : [to],
      subject,
    }

    // Use template if provided, otherwise use html/text
    if (template && data) {
      emailContent.html = renderTemplate(template, data)
    } else {
      if (html) emailContent.html = html
      if (text) emailContent.text = text
    }

    const result = await resend.emails.send(emailContent)

    return res.status(200).json({
      success: true,
      id: result.id,
    })
  } catch (error: any) {
    console.error('Email send error:', error)
    return res.status(500).json({
      error: error.message || 'Failed to send email',
    })
  }
}

function renderTemplate(template: string, data: any): string {
  const templates: Record<string, (data: any) => string> = {
    encounter_signed: (d) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Encounter Signed</h2>
        <p>An encounter has been signed and finalized.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Patient:</strong> ${d.patientName || 'N/A'}</p>
          <p><strong>Provider:</strong> ${d.providerName || 'N/A'}</p>
          <p><strong>Date:</strong> ${d.encounterDate || 'N/A'}</p>
          <p><strong>Type:</strong> ${d.encounterType || 'N/A'}</p>
        </div>
        <p><a href="${d.encounterUrl || '#'}" style="color: #0066cc;">View Encounter</a></p>
      </div>
    `,
    soap_generated: (d) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">SOAP Note Generated</h2>
        <p>A SOAP note has been generated for an encounter.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Patient:</strong> ${d.patientName || 'N/A'}</p>
          <p><strong>Encounter Date:</strong> ${d.encounterDate || 'N/A'}</p>
        </div>
        <p><a href="${d.encounterUrl || '#'}" style="color: #0066cc;">Review SOAP Note</a></p>
      </div>
    `,
    patient_added: (d) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Patient Added</h2>
        <p>A new patient has been added to the system.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Name:</strong> ${d.patientName || 'N/A'}</p>
          <p><strong>DOB:</strong> ${d.dateOfBirth || 'N/A'}</p>
          <p><strong>Added by:</strong> ${d.addedBy || 'N/A'}</p>
        </div>
        <p><a href="${d.patientUrl || '#'}" style="color: #0066cc;">View Patient</a></p>
      </div>
    `,
  }

  const renderer = templates[template]
  if (!renderer) {
    throw new Error(`Template "${template}" not found`)
  }

  return renderer(data)
}

