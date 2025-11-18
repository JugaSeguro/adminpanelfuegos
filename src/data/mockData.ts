import { CateringOrder, EmailTemplate, CalendarEvent } from '@/types'

export const mockOrders: CateringOrder[] = [
  {
    id: '1',
    contact: {
      email: 'marie.dupont@email.com',
      name: 'Marie Dupont',
      phone: '+33 6 12 34 56 78',
      eventDate: '2025-11-15',
      eventType: 'mariage',
      address: '123 Rue de la Paix, 06000 Nice',
      guestCount: 80
    },
    menu: {
      type: 'diner'
    },
    entrees: ['Empanadas de carne', 'Provoleta grillée'],
    viandes: ['Bife de chorizo', 'Côte de bœuf', 'Chorizo argentin'],
    dessert: 'Dulce de leche flan',
    extras: {
      wines: true,
      equipment: ['tables', 'chaises', 'vaisselle'],
      decoration: true,
      specialRequest: 'Musique live souhaitée'
    },
    status: 'pending',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    estimatedPrice: 3200
  },
  {
    id: '2',
    contact: {
      email: 'jean.martin@company.com',
      name: 'Jean Martin',
      phone: '+33 6 98 76 54 32',
      eventDate: '2025-11-20',
      eventType: 'corporatif',
      address: '456 Avenue des Entreprises, 06200 Cannes',
      guestCount: 50
    },
    menu: {
      type: 'dejeuner'
    },
    entrees: ['Salade mixte', 'Bruschetta'],
    viandes: ['Asado de tira', 'Pollo al disco'],
    dessert: 'Fruits de saison',
    extras: {
      wines: false,
      equipment: ['tables', 'chaises'],
      decoration: false,
      specialRequest: ''
    },
    status: 'sent',
    createdAt: '2024-01-10T14:20:00Z',
    updatedAt: '2024-01-12T09:15:00Z',
    estimatedPrice: 1800,
    notes: 'Devis envoyé le 12/01'
  },
  {
    id: '3',
    contact: {
      email: 'sophie.bernard@email.com',
      name: 'Sophie Bernard',
      phone: '+33 6 45 67 89 01',
      eventDate: '2025-11-10',
      eventType: 'anniversaire',
      address: '789 Chemin des Oliviers, 06100 Antibes',
      guestCount: 30
    },
    menu: {
      type: 'diner'
    },
    entrees: ['Empanadas mixtes', 'Charcuterie argentine'],
    viandes: ['Bife de chorizo', 'Morcilla'],
    dessert: 'Alfajores maison',
    extras: {
      wines: true,
      equipment: ['vaisselle'],
      decoration: false,
      specialRequest: 'Gâteau d\'anniversaire personnalisé'
    },
    status: 'approved',
    createdAt: '2024-01-05T16:45:00Z',
    updatedAt: '2024-01-18T11:30:00Z',
    estimatedPrice: 1200
  },
  {
    id: '4',
    contact: {
      email: 'pierre.rousseau@email.com',
      name: 'Pierre Rousseau',
      phone: '+33 6 23 45 67 89',
      eventDate: '2025-12-25',
      eventType: 'autre',
      address: '321 Boulevard de la Mer, 06400 Cannes',
      guestCount: 120
    },
    menu: {
      type: 'diner'
    },
    entrees: ['Provoleta grillée', 'Salade de quinoa'],
    viandes: ['Côte de bœuf', 'Chorizo argentin', 'Pollo al disco'],
    dessert: 'Tiramisu argentin',
    extras: {
      wines: true,
      equipment: ['tables', 'chaises', 'vaisselle', 'éclairage'],
      decoration: true,
      specialRequest: 'Événement en bord de mer, prévoir protection vent'
    },
    status: 'rejected',
    createdAt: '2024-01-08T12:00:00Z',
    updatedAt: '2024-01-20T15:45:00Z',
    estimatedPrice: 4500,
    notes: 'Client a trouvé moins cher ailleurs'
  }
]

export const emailTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Rappel de paiement',
    subject: 'Rappel - Paiement en attente pour votre événement',
    content: `Bonjour {name},

Nous espérons que vous allez bien. Nous vous contactons concernant votre événement prévu le {eventDate}.

Votre devis a été approuvé mais nous n'avons pas encore reçu le paiement d'acompte.

Merci de nous faire parvenir le règlement dans les plus brefs délais pour confirmer votre réservation.

Cordialement,
L'équipe Fuegos d'Azur`,
    type: 'reminder'
  },
  {
    id: '2',
    name: 'Devis approuvé',
    subject: 'Félicitations ! Votre devis a été approuvé',
    content: `Bonjour {name},

Excellente nouvelle ! Nous avons le plaisir de vous confirmer que votre devis pour l'événement du {eventDate} a été approuvé.

Détails de votre commande :
- Date : {eventDate}
- Nombre d'invités : {guestCount}
- Type d'événement : {eventType}

Nous vous contacterons prochainement pour finaliser les derniers détails.

Cordialement,
L'équipe Fuegos d'Azur`,
    type: 'approval'
  },
  {
    id: '3',
    name: 'Devis rejeté',
    subject: 'Concernant votre demande de devis',
    content: `Bonjour {name},

Nous vous remercions pour votre intérêt pour nos services.

Malheureusement, nous ne pourrons pas donner suite à votre demande pour l'événement du {eventDate} pour les raisons suivantes :
- [Raison à personnaliser]

Nous restons à votre disposition pour toute future demande.

Cordialement,
L'équipe Fuegos d'Azur`,
    type: 'rejection'
  },
  {
    id: '4',
    name: 'Devis mis à jour',
    subject: 'Votre devis a été mis à jour',
    content: `Bonjour {name},

Nous avons mis à jour votre devis pour l'événement du {eventDate} selon vos dernières demandes.

Vous pouvez consulter les modifications apportées dans votre espace client.

N'hésitez pas à nous contacter si vous avez des questions.

Cordialement,
L'équipe Fuegos d'Azur`,
    type: 'quote_update'
  }
]

export const sampleManualEvents: CalendarEvent[] = [
  {
    id: 'manual-1',
    orderId: null,
    title: 'Reunión con proveedor de vinos',
    date: '2025-11-18',
    time: '14:30',
    type: 'Reminder',
    status: 'Pending',
    clientName: 'Bodega San Miguel',
    location: 'Oficina central',
    notes: 'Revisar nuevos vinos para la carta de maridajes'
  },
  {
    id: 'manual-2',
    orderId: null,
    title: 'Pago de facturas mensuales',
    date: '2025-11-30',
    time: '09:00',
    type: 'Payment Due',
    status: 'Pending',
    clientName: 'Administración',
    location: '',
    notes: 'Pagar facturas de proveedores y servicios'
  },
  {
    id: 'manual-3',
    orderId: null,
    title: 'Degustación de nuevos platos',
    date: '2025-11-22',
    time: '16:00',
    type: 'Event',
    status: 'Confirmed',
    clientName: 'Equipo de cocina',
    location: 'Cocina principal',
    notes: 'Probar nuevas recetas para el menú de temporada'
  },
  {
    id: 'manual-4',
    orderId: null,
    title: 'Recordatorio: Renovar licencias',
    date: '2025-12-01',
    time: '10:00',
    type: 'Reminder',
    status: 'Pending',
    clientName: 'Administración',
    location: '',
    notes: 'Renovar licencias de funcionamiento y permisos sanitarios'
  }
]