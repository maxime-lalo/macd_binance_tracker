let Message = class {
    fs;
    TelegramBot;
    options;
    token;
    bot;
    channelId;

    constructor() {
        this.TelegramBot = require('node-telegram-bot-api');
        this.options = require('../../token.json');
        this.token = this.options.token;
        this.bot = new this.TelegramBot(this.token, {polling: true});
        this.channelId = this.options.channelId;
        this.fs = require('fs');
    }

    /**
     * @param {*[]} array
     */
    send(array) {
        let result = ""
        array.forEach(message => {
            result += message
        })
        this.bot.sendMessage(this.channelId, result);
    }

    /**
     * @param {string} message
     */
    sendMessage(message) {
        this.bot.sendMessage(this.channelId, message);
    }

    /**
     * @param {string} message 
     */
    addPendingMsg(msg){
        const path = require('path');

        // On récupère le fichier de messages
        var file = this.fs.readFileSync(path.resolve(__dirname,'../files/messages.json'));
        var parsedFile = JSON.parse(file);
        
        // On l'ajoute au fichier initial
        parsedFile.messages.push(msg);

        // On l'écrit dans le fichier
        this.fs.writeFileSync(path.resolve(__dirname, '../files/messages.json'), JSON.stringify(parsedFile));
    }

    sendPendingMsg(){
        const path = require('path');

        // On récupère le fichier de messages
        var file = this.fs.readFileSync(path.resolve(__dirname, '../files/messages.json'));
        var parsedFile = JSON.parse(file);

        if(parsedFile.messages.length > 0){
            var finalMessage = "";
            // Pour chaque message on l'ajoute à finalMessage
            for (var i = 0; i < parsedFile.messages.length; i++) {
                finalMessage += parsedFile.messages[i]
                if (i != (parsedFile.messages.length - 1)) {
                    finalMessage += "\n------------------\n\n"
                }
            }

            // On envoie le message final
            this.sendMessage(finalMessage);

            // On réécrit le fichier de messages en vidant les messages
            parsedFile.messages = [];
            this.fs.writeFileSync(path.resolve(__dirname, '../files/messages.json'), JSON.stringify(parsedFile));
        }else{
            console.log("Pas de messages à envoyer");
        }
    }
}

module.exports = Message;
