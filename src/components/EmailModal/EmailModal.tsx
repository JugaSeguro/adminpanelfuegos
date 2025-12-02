import { useState, useEffect } from 'react'
import { CateringOrder, EmailTemplate } from '@/types'
import { emailTemplates } from '@/data/mockData'
import styles from './EmailModal.module.css'

interface EmailModalProps {
  order: CateringOrder
  isOpen: boolean
  onClose: () => void
  onSend: (orderId: string, subject: string, content: string) => void
}

export default function EmailModal({ order, isOpen, onClose, onSend }: EmailModalProps) {
  // Por defecto, usar la plantilla de relance (id: '5')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('5')
  const [subject, setSubject] = useState<string>('')
  const [content, setContent] = useState<string>('')

  // Cargar plantilla cuando se abre el modal o cambia la plantilla seleccionada
  useEffect(() => {
    if (isOpen && selectedTemplate) {
      const template = emailTemplates.find(t => t.id === selectedTemplate)
      if (template) {
        setSubject(template.subject)
        setContent(template.content)
      }
    }
  }, [isOpen, selectedTemplate])

  const replaceVariables = (text: string): string => {
    return text
      .replace(/{name}/g, order.contact.name)
      .replace(/{email}/g, order.contact.email)
      .replace(/{eventDate}/g, new Date(order.contact.eventDate).toLocaleDateString('es-ES'))
      .replace(/{eventType}/g, order.contact.eventType)
      .replace(/{guestCount}/g, order.contact.guestCount.toString())
      .replace(/{phone}/g, order.contact.phone)
      .replace(/{address}/g, order.contact.address)
  }

  const handleSend = () => {
    if (subject.trim() && content.trim()) {
      onSend(order.id, subject, content)
      onClose()
      // Reset form a la plantilla de relance por defecto
      setSelectedTemplate('5')
      const relanceTemplate = emailTemplates.find(t => t.id === '5')
      if (relanceTemplate) {
        setSubject(relanceTemplate.subject)
        setContent(relanceTemplate.content)
      }
    }
  }

  const handleClose = () => {
    onClose()
    // Reset form a la plantilla de relance por defecto
    setSelectedTemplate('5')
    const relanceTemplate = emailTemplates.find(t => t.id === '5')
    if (relanceTemplate) {
      setSubject(relanceTemplate.subject)
      setContent(relanceTemplate.content)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Enviar Email</h2>
          <p className={styles.clientInfo}>
            Para: {order.contact.name} ({order.contact.email})
          </p>
        </div>

        <div className={styles.content}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Plantilla de Email</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className={styles.select}
            >
              {emailTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Asunto</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={styles.input}
              placeholder="Asunto del email..."
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Contenido</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={styles.textarea}
              placeholder="Escriba su mensaje aquí..."
            />
            <div className={styles.preview}>
              <p className={styles.previewTitle}>Vista previa (con variables reemplazadas):</p>
              <div className={styles.previewContent}>
                <strong>Asunto:</strong> {replaceVariables(subject)}
                <br /><br />
                {replaceVariables(content)}
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button onClick={handleClose} className={`${styles.button} ${styles.cancelButton}`}>
              Cancelar
            </button>
            <button
              onClick={handleSend}
              disabled={!subject.trim() || !content.trim()}
              className={`${styles.button} ${styles.sendButton}`}
            >
              Enviar Email
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}