function escapeMarkdownV2(text) {
    return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1'); 
}

exports.noToken = "The bot token cannot be empty, please create a bot via https://t.me/BotFather";

exports.first_chat = (botname, pushname) => {
    return escapeMarkdownV2(`Hi bro ${pushname}, I am HXTEAM @SAPONA123, a bot that can destroy WhatsApp users.
Click /menu to learn more about how to use this bot.`);
};