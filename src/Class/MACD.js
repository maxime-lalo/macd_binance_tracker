const { ifError } = require('assert');
const { isBuffer } = require('util');
let Endpoints = require('./AbsctractEndpoints')
let Message = require('./Message')

let MACD = class extends Endpoints {

    MACD;
    RSI;
    request;
    messager;
    fs;
    path;
    constructor() {
        super();
        this.MACD = require('technicalindicators').MACD;
        this.RSI = require('technicalindicators').RSI;
        this.request = require('request');
        this.messager = new Message();
        this.fs = require('fs');
        this.path = require('path');
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
                        if (upMessages.length == 0 && downMessages == 0) {
                            // Pas besoin d'envoyer un message s'il n'y a pas de croisement
                            //this.messager.addPendingMsg("⚠Pas de croisement répéré en " + frequency + "⚠")
                            console.log("⚠Pas de croisement répéré en " + frequency + "⚠");
                        } else {
                            // On construit le message final trié avec les bull et les bear
                            let finalMsg = "🏛️ Vérification pour : " + frequency + " 🏛️\n";

                            for(var i =0; i < upMessages.length; i++){
                                finalMsg += upMessages[i];
                            }

                            finalMsg += '\n';

                            for (var i = 0; i < downMessages.length; i++) {
                                finalMsg += downMessages[i];
                            }

                            // On l'ajoute aux pendingMessages
                            this.messager.addPendingMsg(finalMsg);
                        }
                        callback();
                    }
                });
            });
        });
    }

    getSymbols(request) {
        const symbols = [];

        const stableCoins = [
            "SUSD",
            "BUSD",
            "EUR",
            "GBP",
            "PAX",
            "TUSD",
            "USDC"
        ]

        for (let i = 0; i < request.symbols.length; i++) {
            let found = 0;
            for(let j = 0; j < stableCoins.length; j++){
               if(request.symbols[i].baseAsset === stableCoins[j]){
                   found = 1;
               }
            }

            if (request.symbols[i].quoteAsset === 'USDT' && request.symbols[i].status === 'TRADING' && !request.symbols[i].baseAsset.includes('DOWN') && !request.symbols[i].baseAsset.includes('UP') && found == 0) {
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
                    if (this.writeSignal("down", symbol, frequency)){
                        console.log("Signal 📈 [" + symbol + "] [RSI " + rsi[rsi.length - 1] + "]");
                        return ["Signal 📈 [" + symbol + "] [RSI " + rsi[rsi.length - 1] + "]\n", "up"];
                    }else{
                        console.log("Déjà envoyé 📈 [" + symbol + "] [RSI " + rsi[rsi.length - 1] + "]");
                    }
                }
            } else {
                if (lastCandle.histogram < 0) {
                    if (this.writeSignal("down", symbol, frequency)) {
                        console.log("Signal 📉 [" + symbol + "] [RSI " + rsi[rsi.length - 1] + "]");
                        return ["Signal 📉 [" + symbol + "] [RSI " + rsi[rsi.length - 1] + "]\n", "down"];
                    }else{
                        console.log("Déjà envoyé 📉 [" + symbol + "] [RSI " + rsi[rsi.length - 1] + "]");
                    }
                }
            }
        }
        return null;
    }

    writeSignal(type,symbol,frequency){
        let deleteTime;
        let path = this.path.resolve(__dirname, '../files/last_signals.json');

        if (this.fs.existsSync(path)){
            let fileContent = this.fs.readFileSync(path);
            fileContent = JSON.parse(fileContent);
            for(let i = 0; i < fileContent.signals.length; i++){
                if (fileContent.signals[i].type === type && fileContent.signals[i].symbol === symbol){
                    return false;
                }
            }
        }else{
            let fileContent = {"signals":[]}
        }

        let now = parseInt((new Date().getTime())/1000);

        let nbr = frequency.substr(0,frequency.length-1);
        let unity = frequency.slice(frequency.length - 1);
        switch (unity){
            case "d":
                deleteTime = now + (nbr * 86400);
                break;
            case "h":
                deleteTime = now + (nbr * 3600);
                break;
            case "m":
                deleteTime = now + (nbr * 60);
                break
        }

        fileContent.signals.push({
            "type": type,
            "symbol": symbol,
            "timestamp": parseInt(new Date().getTime()/1000),
            "frequency": frequency,
            "deleteTime": deleteTime
        });

        this.fs.writeFileSync(path, JSON.stringify(fileContent));

        return true;
    }

    clearSignals(){
        let path = this.path.resolve(__dirname, '../files/last_signals.json');

        if (this.fs.existsSync(path)) {
            // On récupère le contenu du fichier
            let fileContent = JSON.parse(this.fs.readFileSync(path));

            // On récupère l'heure
            let actualTime = parseInt(new Date().getTime()/1000);

            // Tant qu'il y a quelque chose à supprimer
            let removed = 1;
            let toKeep = [];
            for (let i = 0; i < fileContent.signals.length; i++) {
                if (fileContent.signals[i].deleteTime < actualTime) {
                    console.log("Signal " + fileContent.signals[i].symbol + " en " + fileContent.signals[i].frequency + " expiré ");
                }else{
                    toKeep.push(fileContent.signals[i]);
                }
            }

            let finalSymbols = {"signals":[]};
            for (let i = 0; i < toKeep.length; i++) {
                for(let j = 0; j < fileContent.signals.length; j++){
                    if(toKeep[i].symbol === fileContent.signals[j].symbol && toKeep[i].frequency === fileContent.signals[j].frequency){
                        finalSymbols.signals.push(fileContent.signals[j]);
                    }
                }
            }

            this.fs.writeFileSync(path, JSON.stringify(finalSymbols));
        }
    }
}


module.exports = MACD;
