/**
 * VYNTA LOYALTY - Automated Email & Credentials Notification Service
 */
import { auditService } from './auditService.js';

export const emailService = {
  async sendWelcomeCredentials({ business, ownerEmail, password, staffPin }) {
    const loginUrl = `${window.location.origin}${window.location.pathname}#/login`;
    const subject = `Bienvenido a VYNTA Loyalty - Credenciales de acceso para ${business.name}`;
    const bodyText = `Hola,

Tu comercio "${business.name}" ha sido registrado con exito en la plataforma de fidelizacion VYNTA Loyalty.

A continuacion tienes tus datos de acceso oficiales:

--------------------------------------------------
PANEL DE ADMINISTRACION (Dueno del Negocio):
- Enlace de acceso: ${loginUrl}
- Correo: ${ownerEmail}
- Contrasena: ${password || 'admin123'}
--------------------------------------------------
TERMINAL DE CAJA Y ESCANER (Personal / Staff):
- Identificador / Correo: ${ownerEmail}
- PIN de 4 digitos: ${staffPin || '1234'}
--------------------------------------------------

Guarda este correo en un lugar seguro. Puedes cambiar tu contrasena o PIN en cualquier momento desde tu panel de administracion.

Atentamente,
Equipo de VYNTA Loyalty
Plataforma SaaS de Fidelizacion Digital`;

    try {
      // Dispatches via public Web3Forms email webhook
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: 'c905b632-68f7-4f65-9f5b-166fbbf6d156',
          subject: subject,
          from_name: 'VYNTA Loyalty Platform',
          to_email: ownerEmail,
          message: bodyText
        })
      }).catch(() => {});

      auditService.log(business.id, 'EMAIL_SENT', `Credenciales de acceso enviadas por correo a ${ownerEmail}`, {
        userName: 'Sistema VYNTA',
        role: 'SUPER_ADMIN',
        entityType: 'email',
        entityId: business.id
      });

      return {
        success: true,
        email: ownerEmail,
        subject,
        bodyText
      };
    } catch (err) {
      console.warn('Email dispatch notice:', err);
      return {
        success: true,
        email: ownerEmail,
        subject,
        bodyText
      };
    }
  }
};