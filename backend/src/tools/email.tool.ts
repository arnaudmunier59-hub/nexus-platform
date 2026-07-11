import axios from 'axios'
import { logger } from '../utils/logger.js'

/**
 * Email tool - send emails via SMTP service
 */

interface EmailOptions {
  to: string | string[]
  subject: string
  body: string
  htmlBody?: string
  from?: string
  replyTo?: string
}

const SMTP_API_URL = process.env.SMTP_API_URL || 'http://localhost:2525'
const DEFAULT_FROM = process.env.EMAIL_FROM || 'noreply@nexus.local'

export async function sendEmail(options: EmailOptions): Promise<{ messageId: string }> {
  try {
    const { to, subject, body, htmlBody, from = DEFAULT_FROM, replyTo } = options

    const response = await axios.post(`${SMTP_API_URL}/send`, {
      to: Array.isArray(to) ? to : [to],
      from,
      subject,
      text: body,
      html: htmlBody || body,
      replyTo,
    })

    return { messageId: response.data.messageId }
  } catch (error) {
    logger.error('Email sending error:', error)
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function sendBulkEmails(
  recipients: string[],
  subject: string,
  body: string,
  htmlBody?: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (const recipient of recipients) {
    try {
      await sendEmail({ to: recipient, subject, body, htmlBody })
      sent++
    } catch (error) {
      logger.error(`Failed to send email to ${recipient}:`, error)
      failed++
    }
  }

  return { sent, failed }
}
