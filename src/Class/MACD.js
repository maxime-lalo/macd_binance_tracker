let Endpoints = require('./AbsctractEnpoints')
let Message = require('./Message')

let MACD = class extends Endpoints {


    MACD;
    RSI;
    request;

    constructor() {
        super();
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
            let messagesToSend = [[`🏛️ Vérification pour : ${frequency} 🏛️ \n\n `, null]];
            symbols.forEach((symbol) => {
                this.request(this.endpointBinance + "/api/v3/klines?symbol=" + symbol + "&interval=" + frequency + "&limit=100", {json: true}, (err, res, body) => {
                    counterVerified++;
                    let {rsi, lastCandle, preLastCandle} = this.GetMacdValues(body);

                    let result = this.getCrossMacd(preLastCandle, lastCandle, symbol, frequency, rsi)
                    if (result != null) {
                        messagesToSend.push(result);
                    }

                    if (counterVerified === symbols.length) {
                        if (messagesToSend.length === 1) {
                            new Message().forceSend("⚠Pas de croisement répéré en " + frequency + "⚠")
                        } else {
                            new Message().sendMessage(messagesToSend)
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
            return null;
        } else {
            if (preLastCandle.histogram < 0) {
                if (lastCandle.histogram > 0) {
                    console.log("Signal 📈 [" + symbol + "] [RSI " + rsi[rsi.length - 1] + "]");
                    return ["Signal 📈 [" + symbol + "] [RSI " + rsi[rsi.length - 1] + "]\n\n", "up"];
                }
            } else {
                if (lastCandle.histogram < 0) {
                    console.log("Signal 📉 [" + symbol + "] [RSI " + rsi[rsi.length - 1] + "]");
                    return ["Signal 📉 [" + symbol + "] [RSI " + rsi[rsi.length - 1] + "]\n\n", "down"];
                }
            }
        }
        return null;
    }
}


module.exports = MACD;
