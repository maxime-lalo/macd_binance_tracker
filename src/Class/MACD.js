let Endpoints = require('./AbsctractEndpoints')
let Message = require('./Message')

let MACD = class extends Endpoints {


    MACD;
    RSI;
    request;
    messager;

    constructor() {
        super();
        this.MACD = require('technicalindicators').MACD;
        this.RSI = require('technicalindicators').RSI;
        this.request = require('request');
        this.messager = new Message();
    }


    verify(frequency, callback) {
        console.log("Heure de vérification : " + new Date().getHours() + "h" + new Date().getMinutes());
        console.log("Vérification avec la fréquence : " + frequency);

        this.request(this.endpointBinanceExchange, {json: true}, (err, res, body) => {
            if (err) {
                return console.log(err);
            }

            const symbols = this.getSymbols(body)

            console.log("Vérification de " + symbols.length + " symboles");
            let counterVerified = 0;
            
            // Variables qui vont contenir les messages de signaux temporairement
            let downMessages = [];
            let upMessages = [];

            // Pour chaque symbole
            symbols.forEach((symbol) => {
                this.request(this.endpointBinance + "/api/v3/klines?symbol=" + symbol + "&interval=" + frequency + "&limit=100", {json: true}, (err, res, body) => {
                    counterVerified++;
                    let {rsi, lastCandle, preLastCandle} = this.GetMacdValues(body);

                    let result = this.getCrossMacd(preLastCandle, lastCandle, symbol, frequency, rsi)
                    if (result != null) {
                        // Si le signal est bull on le met dans le upMessages sinon dans le down
                        if(result[1] == "up"){
                            upMessages.push(result[0]);
                        }else{
                            downMessages.push(result[0]);
                        }
                    }

                    // Si on a vérifié tous les symbols, on envoie le message
                    if (counterVerified === symbols.length) {
                        if (upMessages.length === 0 && downMessages === 0) {
                            this.messager.addPendingMsg("⚠Pas de croisement répéré en " + frequency + "⚠")
                        } else {
                            // On construit le message final trié avec les bull et les bear
                            let finalMsg = "🏛️ Vérification pour : " + frequency + " 🏛️\n\n";

                            for(var i =0; i < upMessages.length; i++){
                                finalMsg += upMessages[i];
                            }

                            finalMsg += '\n';

                            for (var i = 0; i < downMessages.length; i++) {
                                finalMsg += downMessages[i];
                            }

                            // On l'ajoute aux pendingMessages
                            this.messager.addPendingMsg(finalMsg);
                            callback();
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
                    return ["Signal 📈 [" + symbol + "] [RSI " + rsi[rsi.length - 1] + "]\n", "up"];
                }
            } else {
                if (lastCandle.histogram < 0) {
                    console.log("Signal 📉 [" + symbol + "] [RSI " + rsi[rsi.length - 1] + "]");
                    return ["Signal 📉 [" + symbol + "] [RSI " + rsi[rsi.length - 1] + "]\n", "down"];
                }
            }
        }
        return null;
    }
}


module.exports = MACD;
