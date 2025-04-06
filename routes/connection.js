const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    delay,
    S_WHATSAPP_NET,
} = require("baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const express = require("express");
const Router = express.Router();
const fs = require('fs');
const path = require('path');
const generateProfilePicture = require('../utils/functions');

Router.get("/", (req, res) => {
    if (!req.query.filename) {
        res.status(400).json({ error: "Filename is required" });
    }
    const filePath = path.join(__dirname, '../uploads', decodeURIComponent(req.query.filename));
    console.log(filePath)
    const connect = async () => {
        const { state, saveCreds } = await useMultiFileAuthState("session")
        const client = makeWASocket({
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
            auth: state,
            browser: ['Mac OS', 'Safari', '10.15.7'],
            syncFullHistory: false,
        });

        if (!client.authState.creds.registered) {
            if (!req.query.phoneNumber) {
                return res.status(400).json({ error: "Phone number is required" });
            }
            const phoneNumber = req.query.phoneNumber.replace(/[^0-9]/g, '');
            await delay(1000);
            let code = await client.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(`𝑻𝑯𝑰𝑺 𝑼𝑹 𝑪𝑶𝑫𝑬 :`, code);
            if (!res.headersSent) res.status(200).json({ code: code });
        }

        // client.ev.on('messages.upsert', async (chatUpdate) => {
        //     const message = chatUpdate.messages[0];
        //     if (!message || message.key && message.key.remoteJid === 'status@broadcast') return;
        //     if (message.key.fromMe) console.log('self', message.key.id);
        //     console.log(message.key.remoteJid, message.key.participant, [message.key.id]);
        // });

        client.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                console.log(lastDisconnect);
                let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
                if (reason === DisconnectReason.connectionLost || reason === DisconnectReason.connectionReplaced || reason === DisconnectReason.restartRequired || reason === DisconnectReason.timedOut) {
                    await connect();
                } else if (reason === DisconnectReason.loggedOut) {
                    return await clearDir();
                } else {
                    client.end(`Unknown DisconnectReason: ${reason}|${connection}`);
                }
            } else if (connection === 'open') {
                console.log('[Connected] ' + JSON.stringify(client.user.id, null, 2));
                await delay(100);
                await client.sendMessage(client.user.id, { text: `_*Connected to wafullscreendp*_` });
                const image = fs.readFileSync(filePath);
                if (image) {
                    const { img } = await generateProfilePicture(image);
                    await client.query({
                        tag: 'iq',
                        attrs: {
                            to: S_WHATSAPP_NET,
                            type: 'set',
                            xmlns: 'w:profile:picture'
                        },
                        content: [
                            {
                                tag: 'picture',
                                attrs: {
                                    type: 'image'
                                },
                                content: img
                            }
                        ]
                    });
                    await delay(500);
                    await client.sendMessage(client.user.id, { text:'*_Profile picture updated, Now your profile looks sharp. Spread our website with your friends and family._*\n\n_*Thanks for trusting our service. ❤️*_' });
                    await delay(1000);
                    await client.sendMessage(client.user.id, { sticker: fs.readFileSync(path.join(__dirname, '../media/sticker.webp')) });
                    await delay(1000);
                    await client.sendMessage(client.user.id, { text: '*"Logging out. The world will hear from me again."*' });
                } else {
                    await client.sendMessage(client.user.id, { text:'Profile picture not changed, logging out.' });
                }
                await delay(1000);
                await client.logout();
                return await clearDir();
            }
        });

        client.ev.on("creds.update", saveCreds);
    }

    try {
        connect();
    } catch(e) {
        console.error(e);
        return clearDir();
    }

});

async function clearDir() {
    try {
        const uploads = path.join(__dirname, '../uploads');
        const session = path.join(__dirname, '../session');

        if (fs.existsSync(uploads)) {
            fs.rmSync(uploads, { recursive: true, force: true });
            console.log('Uploads directory deleted.');
        }

        if (fs.existsSync(session)) {
            fs.rmSync(session, { recursive: true, force: true });
            console.log('Session directory deleted.');
        }

        if (!fs.existsSync(uploads)) {
            fs.mkdirSync(uploads, { recursive: true });
            console.log("Created 'uploads' folder ✅");
        }
        if (!fs.existsSync(session)) {
            fs.mkdirSync(session, { recursive: true });
            console.log("Created 'uploads' folder ✅");
        }
    } catch (e) {
        console.error('Error while clearing directories:', e);
    }
}

module.exports = Router;