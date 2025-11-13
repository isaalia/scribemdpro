import { create } from 'zustand'

interface EmailStore {
  sendEmail: (params: {
    to: string | string[]
    subject: string
    html?: string
    text?: string
    template?: string
    data?: any
  }) => Promise<void>
}

export const useEmailStore = create<EmailStore>(() => ({
  sendEmail: async (params) => {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send email')
    }
  },
}))

