const dns = require('dns');
const nodemailer = require('nodemailer');

if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
}

function escapeHtml(valor) {
    return String(valor || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function lerGmail() {
    const user = String(process.env.GMAIL_EMAIL || 'dinopediad@gmail.com')
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/^GMAIL_EMAIL=/i, '') || 'dinopediad@gmail.com';
    const pass = String(process.env.GMAIL_APP_PASSWORD || '')
        .replace(/\s/g, '')
        .replace(/^["']|["']$/g, '')
        .replace(/^GMAIL_APP_PASSWORD=/i, '');

    return { user, pass };
}

function criarTransporter(user, pass, porta) {
    if (porta === 587) {
        return nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            family: 4,
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
            auth: { user, pass }
        });
    }

    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        family: 4,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        auth: { user, pass }
    });
}

function montarHtml({ nome, codigo }) {
    const primeiroNome = escapeHtml(String(nome || 'Survivor').split(' ')[0]);
    const codigoEspacado = escapeHtml(String(codigo).split('').join('  '));

    return `
      <div style="margin:0;padding:24px;background:#0b0d0b;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;margin:0 auto;background:#121612;border:1px solid #5ea33a;">
          <tr>
            <td style="padding:28px 28px 8px;" align="center">
              <p style="margin:0;color:#7cc04f;font-size:20px;font-weight:800;letter-spacing:0.12em;">DINO PÉDIA</p>
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
              <p style="margin:22px 0 0;color:#dbe6d4;font-size:14px;line-height:1.5;">
                Obrigado,<br />Equipe DinoPédia
              </p>
            </td>
          </tr>
        </table>
      </div>
    `;
}

const sendConfirmationEmail = async (email, code, nome) => {
    const { user, pass } = lerGmail();

    if (!user || !pass) {
        throw new Error('Falta GMAIL_EMAIL ou GMAIL_APP_PASSWORD no Render.');
    }

    const primeiroNome = String(nome || 'Survivor').split(' ')[0];
    const mailOptions = {
        from: `"DinoPédia" <${user}>`,
        to: email,
        subject: 'Seu código de verificação do DinoPédia',
        text: `Olá, ${primeiroNome}!\n\nSeu código de verificação do DinoPédia é: ${code}\n\nEle vale por 10 minutos.\nSe você não pediu este código, ignore este e-mail.\n\nEquipe DinoPédia`,
        html: montarHtml({ nome, codigo: code })
    };

    let ultimoErro;

    for (const porta of [465, 587]) {
        try {
            const transporter = criarTransporter(user, pass, porta);
            await transporter.sendMail(mailOptions);
            console.log(`Email enviado para ${email} pela porta ${porta}`);
            return;
        } catch (error) {
            ultimoErro = error;
            console.error(`Erro Gmail porta ${porta}:`, error.message);
        }
    }

    throw ultimoErro;
};

module.exports = {
    sendConfirmationEmail
};
