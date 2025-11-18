'use client';

import React, { useState } from 'react';
import { CalendarEvent } from '../../types';
import styles from './AddEventModal.module.css';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
  selectedDate?: Date;
}

const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedDate
}) => {
  const [formData, setFormData] = useState({
    title: '',
    date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    time: '',
    type: 'Event' as 'Event' | 'Reminder' | 'Payment Due',
    status: 'Pending' as 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled',
    clientName: '',
    location: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (!formData.date) {
      newErrors.date = 'La fecha es requerida';
    }

    if (!formData.time) {
      newErrors.time = 'La hora es requerida';
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'El nombre del cliente es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const eventData: Omit<CalendarEvent, 'id'> = {
      orderId: null,
      title: formData.title,
      date: formData.date,
      time: formData.time,
      type: formData.type,
      status: formData.status,
      clientName: formData.clientName,
      location: formData.location || '',
      notes: formData.notes || ''
    };

    onSave(eventData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
      time: '',
      type: 'Event',
      status: 'Pending',
      clientName: '',
      location: '',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Agregar Evento Manual</h2>
          <button 
            className={styles.closeButton}
            onClick={handleClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Título *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={errors.title ? styles.error : ''}
              placeholder="Ingrese el título del evento"
            />
            {errors.title && <span className={styles.errorText}>{errors.title}</span>}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="date">Fecha *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={errors.date ? styles.error : ''}
              />
              {errors.date && <span className={styles.errorText}>{errors.date}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="time">Hora *</label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className={errors.time ? styles.error : ''}
              />
              {errors.time && <span className={styles.errorText}>{errors.time}</span>}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="type">Tipo</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
              >
                <option value="Event">Evento</option>
                <option value="Reminder">Recordatorio</option>
                <option value="Payment Due">Pago Pendiente</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="status">Estado</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="Pending">Pendiente</option>
                <option value="Confirmed">Confirmado</option>
                <option value="Completed">Completado</option>
                <option value="Cancelled">Cancelado</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="clientName">Nombre del Cliente *</label>
            <input
              type="text"
              id="clientName"
              name="clientName"
              value={formData.clientName}
              onChange={handleInputChange}
              className={errors.clientName ? styles.error : ''}
              placeholder="Ingrese el nombre del cliente"
            />
            {errors.clientName && <span className={styles.errorText}>{errors.clientName}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="location">Ubicación</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Ingrese la ubicación del evento"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="notes">Notas</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Ingrese notas adicionales"
              rows={3}
            />
          </div>

          <div className={styles.actions}>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={handleClose}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className={styles.saveButton}
            >
              Guardar Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEventModal;