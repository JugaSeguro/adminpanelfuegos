
import { BudgetData } from '../types'

export function BudgetApprovedTemplate(data: BudgetData): string {
    const { clientName, eventDate, logoCid } = data

    // Note: We only return the inner content because we will likely wrap it in BaseLayout for consistency
    // However, the original design had a very specific layout. For this refactor, I will adapt it to fit the BaseLayout
    // OR keep it self-contained if it diverges too much.
    // The original one had its own html/head/body structure which is bad practice to nest.
    // I will produce the inner HTML body content here.

    return `
    <h1 style="color: #e2943a; font-size: 24px; margin-bottom: 20px;">Bonjour ${clientName},</h1>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Nous avons le plaisir de vous envoyer votre devis personnalisé pour votre événement.</p>
    
    ${eventDate ? `<p style="font-size: 16px; margin-bottom: 20px;"><strong>Date de l'événement:</strong> ${eventDate}</p>` : ''}
    
    <div class="highlight-box">
      <p class="highlight-title">Notre offre inclut :</p>
      <p style="font-size: 16px; color: #78350f; margin-bottom: 10px; font-style: italic;">Une expérience gastronomique au brasero, 100 % sur mesure</p>
      <p style="font-size: 14px; color: #78350f; margin: 0;">La préparation, Le service, et les options complémentaires demandées</p>
    </div>
    
    <div style="margin: 30px 0;">
      <p style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 15px;">Pour confirmer votre date, il vous suffit de :</p>
      <ul style="font-size: 16px; line-height: 2; padding-left: 25px;">
        <li style="margin-bottom: 10px;">Nous renvoyer le devis signé</li>
        <li style="margin-bottom: 10px;">Verser un acompte de <strong style="color: #e2943a;">30 %</strong></li>
      </ul>
    </div>
    
    <p style="font-size: 16px; margin: 30px 0;">Notre objectif est de créer une expérience aussi fluide que mémorable, parfaitement adaptée à vos attentes.</p>
    
    <p style="font-size: 16px; margin: 30px 0;">Au plaisir de vous accompagner dans l'organisation de votre événement</p>

    <p style="font-size: 16px; margin: 30px 0;">Nous restons à votre disposition pour toute modification ou précision complémentaire.</p>
    
    <div class="signature-box">
      <div style="margin-bottom: 20px;">
          <p style="font-size: 16px; margin-bottom: 10px; color: white;">Bien chaleureusement,</p>
          <p class="signature-name">Jeronimo Negrotto</p>
          <p class="signature-name">Fuegos d'Azur</p>
          <p style="font-size: 14px; color: #9ca3af; font-style: italic; letter-spacing: 1px; margin-bottom: 0;">Authenticité — Élégance — Feu</p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #374151; margin: 20px 0;">
      
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
              <td valign="middle" width="80" style="padding-right: 15px;">
                  ${logoCid ? `<img src="cid:${logoCid}" alt="Fuegos d'Azur" width="70" style="display: block;" />` : ''}
              </td>
              <td valign="middle" style="font-size: 14px; color: #e5e7eb;">
                  Tel: 07 50 85 35 99 • 06 70 65 97 84<br>
                  Email: fuegosdazur@proton.me
              </td>
          </tr>
      </table>
    </div>
  `
}
