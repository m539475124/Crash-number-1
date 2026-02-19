const fs = require("fs");

const chalk = require("chalk")

//global.BOT_TOKEN = "" // create bot here https://t.me/Botfather and get bot token

global.BOT_NAME = "꧁𓊈 𝐓𝐡𝐞 𝐥𝐞𝐠𝐞𝐧𝐝 𓊉꧂" //your bot name

global.OWNER_NAME = "https://t.me/m780128139" //your name with sign @

global.OWNER = ["https://t.me/m780128139", "https://t.me/m780128139"] // Make sure the username is correct so that the special owner features can be used.

global.DEVELOPER = ["7047473765"] //developer telegram id to operate addprem delprem and listprem

global.ppp = 'https://files.catbox.moe/o2n84k.mp4' //your bot pp

global.pp = 'https://files.catbox.moe/sniw9v.jpg'

//approval

global.GROUP_ID = -1002380550550; // Replace with your group ID

global.CHANNEL_ID =  -1002380550550; // Replace with your channel ID

global.GROUP_LINK = "https://t.me/m780128139"; // Replace with your group link

global.CHANNEL_INVITE_LINK = "https://t.me/m780128139"; // Replace with your private channel invite link

global.WHATSAPP_LINK = "https://whatsapp.com/channel/0029VbCGUETChq6T0JWvTW1y"; // Replace with your group link

global.YOUTUBE_LINK = "https://www.youtube.com/@TERMINATOR_LGD"; // Replace with your youtube link

global.INSTAGRAM_LINK = "https://www.tiktok.com/@a___x___x?_r=1&_t=ZS-942aNO7K1xt"; // Replace with your ig link

global.owner = global.owner = ['967784987197'] //owner whatsapp

const {

   english

} = require("./lib");

global.language = english

global.lang = language

let file = require.resolve(__filename)

fs.watchFile(file, () => {

fs.unwatchFile(file)

console.log(chalk.redBright(`Update ${__filename}`))

delete require.cache[file]

require(file)

})