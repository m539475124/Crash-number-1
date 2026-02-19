global.ownernomer = "967780128139"
global.dev = ["967780128139"]
global.ownername = "꧁𓊈 𝐓𝐡𝐞 𝐥𝐞𝐠𝐞𝐧𝐝 𓊉꧂"
global.ytname = "THE LEGEND OFFICIAL"
global.socialm = "Telegram: @m539475124"
global.location = "Yemen - The Origin of Arabs"

global.ownernumber = '967784987197'  //creator number
global.ownername = 'THE LEGEND OFFICIAL' //owner name
global.botname = 'The legend' //name of the bot

//sticker details
global.packname = '\n\n\n\n\n\n\nSticker By'
global.author = 'LEGEND ⚉\n\nContact: 967780128139'

//console view/theme
global.themeemoji = '🪀'
global.wm = "LEGEND."

//theme link
global.link = 'https://whatsapp.com/channel/0029VbCGUETChq6T0JWvTW1y'
global.idch = ''

global.baileysDB = 'baileysDB.json'
global.botDb = 'database.json'

//prefix
global.prefa = ['','!','.',',','🐤','🗿'] 

global.limitawal = {
    premium: "Infinity",
    free: 20
}

//menu type 
//v1 is image menu, 
//v2 is link + image menu,
//v3 is video menu,
//v4 is call end menu
global.typemenu = 'v1'

// Global Respon
global.mess = {
    success: 'Done✓',
    admin: `\`[ # ]\` This Command Can Only Be Used By Group Admins !`,
    botAdmin: `\`[ # ]\` This Command Can Only Be Used When Bot Becomes Group Admin !`,
    OnlyOwner: `\`[ # ]\` This Command Can Only Be Used By Premium User ! \n\nWant Premium? Chat Developer.\nTelegram: @Master_CmdBot\nWhatsApp: +967780128139`,
    OnlyGrup: `\`[ # ]\` This Command Can Only Be Used In Group Chat !`,
    private: `\`[ # ]\` This Command Can Only Be Used In Private Chat !`,
    wait: `\`[ # ]\` Wait Wait a minute`,
    notregist: `\`[ # ]\` You are not registered in the Bot Database. Please register first.`,
    premium: `\`[ # ]\` This Command Can Only Be Used By Premium User ! \n\nWant Premium? Chat Developer.\nYouTube: @Master_CmdBot\nTelegram: @Master_CmdBot\nWhatsApp: +967780128139`,
}

module.exports = {

    banner: [

        "967780128139@s.whatsapp.net"

    ]

};

let fs = require('fs')
let file = require.resolve(__filename)
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(`Update ${__filename}`)
delete require.cache[file]
require(file)
})