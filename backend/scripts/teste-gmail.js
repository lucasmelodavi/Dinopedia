require('dotenv').config()
const nodemailer = require('nodemailer')

const user = (process.env.GMAIL_EMAIL || '').trim()
const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, '')

if (!user || !pass) {
    console.log('FALHOU: falta GMAIL_EMAIL ou GMAIL_APP_PASSWORD no .env')
    process.exit(1)
}

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass }
})

transporter
    .verify()
    .then(() => {
        console.log(`OK: o Gmail ${user} pode enviar código para qualquer pessoa.`)
        process.exit(0)
    })
    .catch((erro) => {
        console.log(`FALHOU: o Google recusou o login de ${user}.`)
        console.log('A senha de app tem que ser dessa mesma conta.')
        console.log(erro.response || erro.message)
        process.exit(1)
    })
