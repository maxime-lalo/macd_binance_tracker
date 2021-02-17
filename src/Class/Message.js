let DbManager = require('./DbManager')

let Message = class {
    TelegramBot;
    options;
    token;
    bot;
    channelId;
    dbManager;

    constructor() {
        this.dbManager = new DbManager();
    }

    initialize(){
        this.TelegramBot = require('node-telegram-bot-api');
        this.options = require('../../token.json');
        this.token = this.options.token;
        this.channelId = this.options.channelId;
        this.bot = new this.TelegramBot(this.token, { polling: true });
    }

    /**
     * @param {string} message
     */
    sendMessage(message) {
        this.bot.sendMessage(this.channelId, message);
    }

    /**
     * @param {string} msg
     */
    addPendingMsg(msg){
        this.dbManager.getDb().get('messages').push(msg).write();
    }

    sendPendingMsg(){
        // On récupère les messages en attente

        let messages = this.dbManager.getDb().get('messages').value();

        console.log(messages);

        if (messages.length == 0){
            console.log("Aucun message à envoyer");
        }else{
            // On créé le message final avec une ligne entre chaque message
            let finalMsg = "";
            for (let i = 0; i < messages.length; i++) {
                finalMsg += messages[i];
                // Si c'est le dernier message on ne met pas de ligne en dessous
                if (i !== (messages.length - 1)) {
                    finalMsg += "\n------------------\n\n"
                }
            }

            this.sendMessage(finalMsg);

            // On clear la table et on l'écrit
            this.dbManager.getDb().get('messages').remove().write();
        }
    }
}

module.exports = Message;
