
export interface EmailAttachment {
    filename: string
    content: string | Buffer
    type?: string
    content_id?: string
    disposition?: 'inline' | 'attachment'
}

export interface EmailParams {
    to: string | string[]
    subject: string
    html: string
    from?: string
    fromName?: string
    attachments?: EmailAttachment[]
    tags?: { name: string; value: string }[]
}

export interface EmailResult {
    success: boolean
    messageId?: string
    error?: string
}

export interface BudgetData {
    clientName: string
    totalTTC: number
    eventDate?: string
    logoCid?: string
}
