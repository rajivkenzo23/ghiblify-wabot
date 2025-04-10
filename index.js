require('dotenv').config()
const {
  default: makeWASocket,
  useMultiFileAuthState,
  makeInMemoryStore,
  DisconnectReason,
} = require('@whiskeysockets/baileys')
const { ghiblifyImage } = require('./utils/ghiblify')
const fs = require('fs')
const path = require('path')

const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState(`auth/${process.env.SESSION_ID}`)
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    const sender = msg.key.remoteJid
    const imageMessage = msg.message.imageMessage

    if (imageMessage) {
      const buffer = await sock.downloadMediaMessage(msg)
      const ghibliUrl = await ghiblifyImage(buffer)
      await sock.sendMessage(sender, { image: { url: ghibliUrl }, caption: '✨ Ghibli-fied!' })
    } else {
      await sock.sendMessage(sender, { text: '📸 Send me an image to Ghibli-fy!' })
    }
  })

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      if (
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      ) {
        startBot()
      } else {
        console.log('Logged out.')
      }
    }
  })
}

startBot()
