
export function BaseLayout(content: string): string {
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fuegos d'Azur</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .email-container {
          background-color: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #d97706;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #d97706;
          margin: 0;
        }
        .content {
          margin-bottom: 30px;
          white-space: pre-line;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
        }
        .contact-info {
          margin-top: 10px;
        }
        .contact-info a {
          color: #d97706;
          text-decoration: none;
        }
        /* Elements from budget template */
        .highlight-box {
          background-color: #fef3c7;
          border-left: 4px solid #e2943a;
          padding: 20px;
          margin: 30px 0;
          border-radius: 8px;
        }
        .highlight-title {
          font-size: 16px;
          font-weight: 600;
          color: #78350f;
          margin-bottom: 15px;
        }
        .signature-box {
           margin-top: 40px;
           padding: 30px;
           background-color: #1f2937;
           color: white;
           border-radius: 8px;
        }
        .signature-name {
           font-size: 18px;
           font-weight: 600;
           color: #e2943a;
           margin-bottom: 5px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">🔥 Fuegos d'Azur</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Service Traiteur - Asado Argentin</p>
        </div>
        
        <div class="content">
          ${content}
        </div>
        
        <div class="footer">
          <p><strong>Fuegos d'Azur</strong></p>
          <div class="contact-info">
            <p>📞 07 50 85 35 99 • 06 70 65 97 84</p>
            <p>📧 <a href="mailto:contact@fuegosdazur.fr">contact@fuegosdazur.fr</a></p>
            <p>📍 Côte d'Azur, France</p>
          </div>
          <p style="margin-top: 20px; font-size: 11px;">
            © ${new Date().getFullYear()} Fuegos d'Azur. Tous droits réservés.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
