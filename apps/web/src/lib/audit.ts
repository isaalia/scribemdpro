import { supabase } from './supabase'

interface AuditLog {
  action: string
  resource_type: string
  resource_id?: string
  metadata?: any
}

export async function logAuditEvent(log: AuditLog) {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get user's practice_id
    const { data: userData } = await supabase
      .from('users')
      .select('practice_id')
      .eq('id', user.id)
      .single()

    if (!userData) return

    // Get IP address and user agent (if available)
    const ipAddress = await getClientIP()
    const userAgent = navigator.userAgent

    // Insert audit log
    await supabase.from('audit_logs').insert({
      practice_id: userData.practice_id,
      user_id: user.id,
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: log.metadata || {},
    })
  } catch (error) {
    // Silently fail audit logging - don't break user experience
    console.error('Audit logging failed:', error)
  }
}

async function getClientIP(): Promise<string | null> {
  try {
    // Try to get IP from a service (for production)
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip || null
  } catch {
    return null
  }
}

// Common audit actions
export const AuditActions = {
  VIEW: 'view',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  EXPORT: 'export',
  PRINT: 'print',
  SIGN: 'sign',
  LOGIN: 'login',
  LOGOUT: 'logout',
}

// Common resource types
export const ResourceTypes = {
  PATIENT: 'patient',
  ENCOUNTER: 'encounter',
  USER: 'user',
  TEMPLATE: 'template',
  FILE: 'file',
}

