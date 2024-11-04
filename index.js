const { default: makeWASocket, useMultiFileAuthState } = require('@adiwajshing/baileys');
const axios = require('axios');
const cheerio = require('cheerio');

async function fetchHiruNews() {
    try {
        // Hiru News වෙත request යොමු කිරීම
        const { data } = await axios.get('https://www.hirunews.lk/');
        const $ = cheerio.load(data);
        let newsMessage = '📰 Hiru News:\n\n';

        // HTML එකෙන් news articles scrape කිරීම
        $('.news-title-selector').each((index, element) => {
            const title = $(element).text();
            const link = $(element).attr('href'); // Assuming there's an href attribute for the link
            newsMessage += \`\${index + 1}. \${title}\n\${link}\n\n\`;
        });

        return newsMessage || 'No news found.';
    } catch (error) {
        console.error('Error fetching Hiru News:', error);
        return 'Error fetching news.';
    }
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    const sock = makeWASocket({
        auth: state
    });

    sock.ev.on('creds.update', saveCreds);
    console.log('✅ Bot started!');

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        if (msg.key && msg.key.remoteJid === 'status@broadcast') return;

        const from = msg.key.remoteJid;
        const textMessage = (msg.message.conversation || '').toLowerCase();

        // Command for fetching news
        if (textMessage === '!news') {
            await sock.sendMessage(from, { text: 'Fetching the latest news for you...' });

            const news = await fetchHiruNews();
            await sock.sendMessage(from, { text: news });
        }

        // Additional commands
        if (textMessage === '!hello') {
            await sock.sendMessage(from, { text: 'Hello! How can I assist you today?' });
        }

        if (textMessage === '!time') {
            const currentTime = new Date().toLocaleString();
            await sock.sendMessage(from, { text: \`Current time is: \${currentTime}\` });
        }

        if (textMessage.startsWith('!echo')) {
            const messageToEcho = textMessage.slice(6); // Get the message after '!echo '
            await sock.sendMessage(from, { text: messageToEcho });
        }
    });
}

startBot();