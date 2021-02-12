let MACD = class {

    TelegramBot;
    options;
    token;
    bot;
    channelId;
    endpointBinance;
    MACD;
    RSI;
    request;

    constructor() {
        this.TelegramBot = require('node-telegram-bot-api');
        this.options = require('../../token.json');
        this.token = this.options.token;
        this.bot = new this.TelegramBot(this.token, {polling: true});
        this.channelId = this.options.channelId;

        this.endpointBinance = "https://api.binance.com";
        this.MACD = require('technicalindicators').MACD;
        this.RSI = require('technicalindicators').RSI;
        this.request = require('request');
    }


    verify(frequency) {
        console.log("Heure de vérification : " + new Date().getHours() + "h" + new Date().getMinutes());
        console.log("Vérification avec la fréquence : " + frequency);
        this.request(this.endpointBinance + "/api/v3/exchangeInfo", {json: true}, (err, res, body) => {
            if (err) {
                return console.log(err);
            }

            const symbols = [];
            for (let i = 0; i < body.symbols.length; i++) {
                if (body.symbols[i].quoteAsset == 'USDT' && body.symbols[i].status == 'TRADING' && !body.symbols[i].baseAsset.includes('DOWN') && !body.symbols[i].baseAsset.includes('UP')) {
                    symbols.push(body.symbols[i].symbol);
                }
            }
            symbols.sort();
            console.log("Vérification de " + symbols.length + " symboles");
            let counterVerified = 0;
            let messagesToSend = "";
            symbols.forEach((symbol) => {
                this.request(this.endpointBinance + "/api/v3/klines?symbol=" + symbol + "&interval=" + frequency + "&limit=100", {json: true}, (err, res, body) => {
                    const macdValues = [];
                    body.forEach((candle) => {
                        macdValues.push(parseFloat(candle[4]));
                    });

                    const macdInput = {
                        values: macdValues,
                        fastPeriod: 12,
                        slowPeriod: 26,
                        signalPeriod: 9,
                        SimpleMAOscillator: false,
                        SimpleMASignal: false
                    };
                    const macd = this.MACD.calculate(macdInput);

                    const inputRSI = {
                        values: macdValues,
                        period: 14
                    };
                    const rsi = this.RSI.calculate(inputRSI);

                    const lastCandle = macd[macd.length - 1];
                    const preLastCandle = macd[macd.length - 2];

                    counterVerified++;
                    // Si le MACD est au dessus du signal sur l'avant dernière bougie
                    let hasCroisement;
                    if (preLastCandle == undefined) {
                        console.log("Ignore " + symbol + " pas assez d'histo");
                    } else {
                        if (preLastCandle.histogram < 0) {
                            if (lastCandle.histogram > 0) {
                                console.log("Signal 📈 [" + symbol + "] [" + frequency + "] [RSI " + rsi[rsi.length - 1] + "]");
                                messagesToSend += "Signal 📈 [" + symbol + "] [" + frequency + "] [RSI " + rsi[rsi.length - 1] + "]\n\n";
                                hasCroisement = true;
                            }
                        } else {
                            if (lastCandle.histogram < 0) {
                                console.log("Signal 📉 [" + symbol + "] [" + frequency + "] [RSI " + rsi[rsi.length - 1] + "]");
                                messagesToSend += "Signal 📉 [" + symbol + "] [" + frequency + "] [RSI " + rsi[rsi.length - 1] + "]\n\n";
                                hasCroisement = true;
                            }
                        }
                    }

                    if (counterVerified == symbols.length) {
                        this.bot.sendMessage(this.channelId, messagesToSend);
                    }
                });
            });
        });
    }


}


module.exports =  MACD;
