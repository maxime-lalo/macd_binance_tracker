let Message = class {

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
    }

    sendMessage(array){
        this.send(this.sortMessage(array))
    }

    sortMessage(array){
        let intro= array[0][0] ;
        let up = [];
        let down = [];
        Array.prototype.forEach.call(array, data =>{
            switch (data[1]) {
                case 'up':
                    up.push(data[0])
                    break;
                case 'down':
                    down.push(data[0])
                    break;
            }
        })
        up = up.concat(down)
        return [intro].concat(up)
    }

    send(array){
        let result = ""
        array.forEach(message =>{
            result += message
        })
        this.bot.sendMessage(this.channelId, result);
    }


}

module.exports = Message;
