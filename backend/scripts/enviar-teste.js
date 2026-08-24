require('dotenv').config()
const nodemailer = require('nodemailer')

const user = (process.env.GMAIL_EMAIL || '').trim()
const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, '')
const destino = process.argv[2] || user

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass }
})

transporter
    .sendMail({
        from: `"Dinopédia" <${user}>`,
        to: destino,
        subject: 'Teste Dinopédia - envio de código',
        text: 'Se você recebeu este e-mail, o envio da Dinopédia está funcionando. Código de teste: 123456'
    })
    .then((info) => {
        console.log('ENVIADO')
        console.log('de:', user)
        console.log('para:', destino)
        console.log('id:', info.messageId)
        console.log('accepted:', info.accepted)
        console.log('rejected:', info.rejected)
        console.log('response:', info.response)
        process.exit(0)
    })
    .catch((erro) => {
        console.log('FALHOU')
        console.log(erro.response || erro.message)
        process.exit(1)
    })
