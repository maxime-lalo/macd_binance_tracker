let Endpoints = require('./AbsctractEnpoints')

let MACD = class extends Endpoints {

    TelegramBot;
    options;
    token;
    bot;
    channelId;
    MACD;
    RSI;
    request;

    constructor() {
        super();
        this.TelegramBot = require('node-telegram-bot-api');
        this.options = require('../../token.json');
        this.token = this.options.token;
        this.bot = new this.TelegramBot(this.token, {polling: true});
        this.channelId = this.options.channelId;

        this.MACD = require('technicalindicators').MACD;
        this.RSI = require('technicalindicators').RSI;
        this.request = require('request');
    }


    verify(frequency) {
        console.log("Heure de vérification : " + new Date().getHours() + "h" + new Date().getMinutes());
        console.log("Vérification avec la fréquence : " + frequency);

        this.request(this.endpointBinanceExchange, {json: true}, (err, res, body) => {
            if (err) {
                return console.log(err);
            }

            const symbols = this.getSymbols(body)

            console.log("Vérification de " + symbols.length + " symboles");
            let counterVerified = 0;
            let messagesToSend = "";
            symbols.forEach((symbol) => {
                this.request(this.endpointBinance + "/api/v3/klines?symbol=" + symbol + "&interval=" + frequency + "&limit=100", {json: true}, (err, res, body) => {
                    counterVerified++;
                    let {rsi, lastCandle, preLastCandle} = this.GetMacdValues(body);

                    messagesToSend += this.getCrossMacd(preLastCandle, lastCandle, symbol, frequency, rsi)

                    if (counterVerified === symbols.length) {
                        if (messagesToSend == ""){
                            this.bot.sendMessage(this.channelId, "Pas de croisement répéré en " + frequency);
                        }else{
                            this.bot.sendMessage(this.channelId, messagesToSend);
                        }
                    }
                });
            });
        });
    }

    getSymbols(request) {
        const symbols = [];
        for (let i = 0; i < request.symbols.length; i++) {
            if (request.symbols[i].quoteAsset === 'USDT' && request.symbols[i].status === 'TRADING' && !request.symbols[i].baseAsset.includes('DOWN') && !request.symbols[i].baseAsset.includes('UP')) {
                symbols.push(request.symbols[i].symbol);
            }
        }
        symbols.sort();
        return symbols
    }

    GetMacdValues(request) {
        const macdValues = [];
        request.forEach((candle) => {
            macdValues.push(parseFloat(candle[4]));
        });

        const macd = this.MACD.calculate({
            values: macdValues,
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            SimpleMAOscillator: false,
            SimpleMASignal: false
        });

        const rsi = this.RSI.calculate({
            values: macdValues,
            period: 14
        });

        const lastCandle = macd[macd.length - 1];
        const preLastCandle = macd[macd.length - 2];
        return {rsi, lastCandle, preLastCandle}
    }

    getCrossMacd(preLastCandle, lastCandle, symbol, frequency, rsi) {
        if (preLastCandle === undefined) {
            console.log("Ignore " + symbol + " pas assez d'histo");
            return "";
        } else {
            if (preLastCandle.histogram < 0) {
                if (lastCandle.histogram > 0) {
                    console.log("Signal 📈 [" + symbol + "] [" + frequency + "] [RSI " + rsi[rsi.length - 1] + "]");
                    return "Signal 📈 [" + symbol + "] [" + frequency + "] [RSI " + rsi[rsi.length - 1] + "]\n\n";
                }
            } else {
                if (lastCandle.histogram < 0) {
                    console.log("Signal 📉 [" + symbol + "] [" + frequency + "] [RSI " + rsi[rsi.length - 1] + "]");
                    return "Signal 📉 [" + symbol + "] [" + frequency + "] [RSI " + rsi[rsi.length - 1] + "]\n\n";
                }
            }
        }
        return "";
    }


}


module.exports = MACD;
