const TelegramBot = require('node-telegram-bot-api');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// --- إخفاء واجهة الترمكس وتنظيفها عند التشغيل ---
process.stdout.write('\x1Bc'); 
console.log('🛡️ The Bot is running in background mode...');

const token = '8292884473:AAF5DsDgN8VqkqQ33cPDTFFxh6y8ZMzPmbg';
const ADMIN_ID = 7047473765; // الأسطـ⃤🏴‍☠️ـوره
const bot = new TelegramBot(token, { polling: true });

const CHANNEL_ID = '@m780128139'; 
const CHANNEL_URL = 'https://t.me/m780128139'; 

// --- إعداد القوائم الذكية للمربع (Menu) ---
bot.setMyCommands([
    { command: 'list', description: '📱 الأرقام النشطة (للمالك)' },
    { command: 'clearall', description: '⚠️ حذف الكل (للمالك)' }
], { scope: { type: 'chat', chat_id: ADMIN_ID } });

bot.setMyCommands([
    { command: 'start', description: '🛡️ القائمة الرئيسية' }
], { scope: { type: 'all_private_chats' } });

let activeSessions = {};
let connectionQueue = []; 
let currentConnectingCount = 0;
const MAX_CONCURRENT_CONNECTS = 5;

// إنشاء المجلدات الأساسية إذا لم توجد
if (!fs.existsSync(path.join(__dirname, 'sessions'))) fs.mkdirSync(path.join(__dirname, 'sessions'));
if (!fs.existsSync(path.join(__dirname, 'database'))) {
    fs.mkdirSync(path.join(__dirname, 'database'));
    fs.writeFileSync(path.join(__dirname, 'database', 'database.json'), '{}');
}
if (!fs.existsSync(path.join(__dirname, '69'))) fs.mkdirSync(path.join(__dirname, '69'));

// دالة التحقق من الاشتراك الإجباري
async function checkSubscription(msg) {
    const userId = msg.from.id;
    if (userId === ADMIN_ID) return true; 

    try {
        const member = await bot.getChatMember(CHANNEL_ID, userId);
        const isSubscribed = ['member', 'administrator', 'creator'].includes(member.status);
        
        if (!isSubscribed) {
            const opts = {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "انضم للقناة من هنا 💙", url: CHANNEL_URL }],
                        [{ text: "تحقق من الاشتراك ♻️", callback_data: "verify_sub" }]
                    ]
                }
            };
            await bot.sendMessage(msg.chat.id, `❌ *عذراً، الوصول مرفوض!*\n\nيجب عليك الاشتراك في قناتنا أولاً لتتمكن من استخدام البوت.`, opts);
            return false;
        }
        return true;
    } catch (e) { return false; }
}

// التعامل مع زر التحقق
bot.on('callback_query', async (query) => {
    if (query.data === "verify_sub") {
        const userId = query.from.id;
        try {
            const member = await bot.getChatMember(CHANNEL_ID, userId);
            if (['member', 'administrator', 'creator'].includes(member.status)) {
                await bot.answerCallbackQuery(query.id, { text: "✅ تم التحقق، يمكنك استخدام البوت الآن!", show_alert: true });
                await bot.deleteMessage(query.message.chat.id, query.message.message_id);
                sendWelcomeMessage(query.message.chat.id, query.from.first_name, userId);
            } else {
                await bot.answerCallbackQuery(query.id, { text: "❌ مازلت غير مشترك في القناة!", show_alert: true });
            }
        } catch (e) {}
    }
});

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
        `/connect 967734304880`;
    
    bot.sendMessage(chatId, welcome, { parse_mode: "Markdown" });
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text ? msg.text.trim() : "";

    if (text === '/start') {
        if (await checkSubscription(msg)) {
            sendWelcomeMessage(chatId, msg.from.first_name, userId);
        }
        return;
    }

    if (!(await checkSubscription(msg))) return;

    if (text.startsWith('/connect')) {
        let phoneNumber = text.replace('/connect', '').trim().replace(/\D/g, '');
        if (!phoneNumber || phoneNumber.length < 10) {
            return bot.sendMessage(chatId, "*⚠️ يرجى إرسال الرقم بشكل صحيح مثال:*\n`/connect 967xxxxxxxxx`", { parse_mode: "Markdown" });
        }

        connectionQueue.push({ chatId, phoneNumber });
        bot.sendMessage(chatId, `⏳ *جاري معالجة الرقم:* \`${phoneNumber}\`.. \nانتظر استخراج الكود.`, { parse_mode: "Markdown" });
        processQueue();
    }

    // أوامر المالك (قائمة وحذف الكل)
    if (userId === ADMIN_ID) {
        if (text === '/list') {
            const sessionsDir = path.join(__dirname, 'sessions');
            const folders = fs.existsSync(sessionsDir) ? fs.readdirSync(sessionsDir).filter(f => fs.lstatSync(path.join(sessionsDir, f)).isDirectory()) : [];
            let res = folders.length > 0 ? `📱 *الأرقام النشطة (${folders.length}):*\n` + folders.map((n, i) => `${i+1}- \`${n}\``).join('\n') : "📭 لا توجد أرقام حالياً.";
            bot.sendMessage(chatId, res, { parse_mode: "Markdown" });
        }
        if (text === '/clearall') {
            Object.values(activeSessions).forEach(c => { try { c.kill('SIGKILL'); } catch(e){} });
            activeSessions = {};
            if (fs.existsSync(path.join(__dirname, 'sessions'))) fs.rmSync(path.join(__dirname, 'sessions'), { recursive: true, force: true });
            fs.mkdirSync(path.join(__dirname, 'sessions'));
            bot.sendMessage(chatId, "✅ تم تصفية كافة الجلسات.");
        }
    }
});

// --- محرك المعالجة المحدث لسكربت FLIX ---
async function processQueue() {
    if (currentConnectingCount >= MAX_CONCURRENT_CONNECTS || connectionQueue.length === 0) return;
    currentConnectingCount++;
    const { chatId, phoneNumber } = connectionQueue.shift();
    const userSessionPath = path.join(__dirname, 'sessions', phoneNumber);
    
    if (!fs.existsSync(userSessionPath)) fs.mkdirSync(userSessionPath, { recursive: true });

    // ربط كافة الملفات والمجلدات الضرورية للكراش الجديد
    const itemsToLink = ['node_modules', 'package.json', 'index.js', 'lib', 'src', 'database', '69', 'Access', 'System', 'sound'];

    itemsToLink.forEach(item => {
        const source = path.join(__dirname, item);
        const destination = path.join(userSessionPath, item);
        if (fs.existsSync(source)) {
            try { execSync(`ln -sf "${source}" "${destination}"`); } catch (e) {}
        }
    });

    // تشغيل السكريبت (index.js)
    const child = spawn('node', ['index.js'], { cwd: userSessionPath });
    activeSessions[phoneNumber] = child;
    let codeSent = false;
    let numberEntered = false;

    child.stdout.on('data', (data) => {
        const output = data.toString();
        // تم إخفاء console.log لكي لا تظهر النصوص في شاشة المستخدم

        // 1. إدخال الرقم تلقائياً فور ظهور رسالة "Enter your phone number"
        if (output.includes("Enter your phone number") && !numberEntered) {
            numberEntered = true;
            setTimeout(() => {
                child.stdin.write(phoneNumber + '\n');
            }, 3000); 
        }

        // 2. استخراج الكود وإرساله للتليجرام
        const codeMatch = output.match(/Code\s*:\s*([A-Z0-9]{4}-[A-Z0-9]{4})/i) || output.match(/([A-Z0-9]{4}-[A-Z0-9]{4})/);
        if (codeMatch && !codeSent) {
            codeSent = true;
            const finalCode = codeMatch[1] || codeMatch[0];
            bot.sendMessage(chatId, `✅ *كود الربط الخاص بك:* \n\n\`${finalCode}\``, { parse_mode: "Markdown" });
            
            setTimeout(() => { 
                currentConnectingCount--; 
                processQueue(); 
            }, 10000); 
        }
    });

    child.on('close', () => {
        if (!codeSent) {
            currentConnectingCount--;
            processQueue();
        }
    });
}
