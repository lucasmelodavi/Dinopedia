const path = require('path');
const nodemailer = require('nodemailer');

function escapeHtml(valor) {
    return String(valor || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

const createEmailTransporter = () => {
    const user = (process.env.GMAIL_EMAIL || '').trim();
    const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, '');

    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user, pass }
    });
};

function montarHtml({ nome, codigo }) {
    const primeiroNome = escapeHtml(String(nome || 'Survivor').split(' ')[0]);
    const codigoEspacado = escapeHtml(String(codigo).split('').join('  '));

    return `
      <div style="margin:0;padding:24px;background:#0b0d0b;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;margin:0 auto;background:#121612;border:1px solid #5ea33a;border-radius:16px;">
          <tr>
            <td style="padding:28px 28px 8px;" align="center">
              <img src="cid:logo-trex" width="64" height="64" alt="DinoPédia" style="display:block;border:0;border-radius:14px;" />
              <p style="margin:12px 0 0;color:#7cc04f;font-size:20px;font-weight:800;letter-spacing:0.12em;">DINO PÉDIA</p>
              <p style="margin:4px 0 0;color:#b7c2b0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;">Descubra. Aprenda. Compartilhe.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 32px 28px;color:#f4f7f2;">
              <p style="margin:16px 0 8px;font-size:18px;font-weight:700;">Olá, ${primeiroNome}!</p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#dbe6d4;">
                Você solicitou um código de verificação para acessar sua conta no DinoPédia.
                Use o código abaixo para continuar:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 16px;border:1px solid #5ea33a;background:#0e130e;">
                <tr>
                  <td align="center" style="padding:18px 12px;color:#7cc04f;font-size:32px;font-weight:800;letter-spacing:8px;font-family:Arial,Helvetica,sans-serif;">
                    ${codigoEspacado}
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 18px;text-align:center;color:#7cc04f;font-size:13px;">
                Este código é válido por 10 minutos.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0e130e;border:1px solid #5ea33a47;">
                <tr>
                  <td style="padding:14px 12px;width:52px;vertical-align:top;">
                    <img src="cid:escudo" width="36" height="36" alt="" style="display:block;border:0;border-radius:50%;" />
                  </td>
                  <td style="padding:14px 16px 14px 0;color:#b7c2b0;font-size:13px;line-height:1.45;">
                    <strong style="color:#7cc04f;">Segurança em primeiro lugar.</strong>
                    Se você não solicitou este código, ignore este e-mail ou altere sua senha imediatamente.
                  </td>
                </tr>
              </table>
              <p style="margin:22px 0 0;color:#dbe6d4;font-size:14px;line-height:1.5;">
                Obrigado,<br />Equipe DinoPédia &#129430;
              </p>
            </td>
          </tr>
        </table>
        <p style="max-width:560px;margin:16px auto 0;text-align:center;color:#7d8778;font-size:12px;line-height:1.5;">
          &copy; 2026 DinoPédia. Todos os direitos reservados.
        </p>
      </div>
    `;
}

const sendConfirmationEmail = async (email, code, nome) => {
    const transporter = createEmailTransporter();
    const primeiroNome = String(nome || 'Survivor').split(' ')[0];
    const pasta = path.join(__dirname, '..', 'assets', 'email');

    const mailOptions = {
        from: `"DinoPédia" <${process.env.GMAIL_EMAIL}>`,
        to: email,
        subject: 'Seu código de verificação do DinoPédia',
        text: `Olá, ${primeiroNome}!\n\nSeu código de verificação do DinoPédia é: ${code}\n\nEle vale por 10 minutos.\nSe você não pediu este código, ignore este e-mail.\n\nEquipe DinoPédia`,
        html: montarHtml({ nome, codigo: code }),
        attachments: [
            {
                filename: 'logo-trex.png',
                path: path.join(pasta, 'logo-trex.png'),
                cid: 'logo-trex'
            },
            {
                filename: 'escudo.png',
                path: path.join(pasta, 'escudo.png'),
                cid: 'escudo'
            }
        ]
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email personalizado enviado para ${email}`);
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        throw error;
    }
};

module.exports = {
    sendConfirmationEmail
};
