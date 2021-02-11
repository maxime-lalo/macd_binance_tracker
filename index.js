const TelegramBot = require('node-telegram-bot-api');
const options = require('./token.json');
const token = options.token;
const bot = new TelegramBot(token, { polling: true });
const channelId = options.channelId;

const endpointBinance = "https://api.binance.com";
// bot.sendMessage(channelId,"Hello");
var MACD = require('technicalindicators').MACD;
var RSI = require('technicalindicators').RSI;
const request = require('request');

function verifyMacd(frequency){
    console.log("Heure de vérification : " +  new Date().getHours() + "h" + new Date().getMinutes());
    console.log("Vérification avec la fréquence : " + frequency);
    request(endpointBinance + "/api/v3/exchangeInfo", { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }

        var symbols = [];
        for (var i = 0; i < body.symbols.length; i++) {
            if (body.symbols[i].quoteAsset == 'USDT' && body.symbols[i].status == 'TRADING' && !body.symbols[i].baseAsset.includes('DOWN') && !body.symbols[i].baseAsset.includes('UP')) {
                symbols.push(body.symbols[i].symbol);
            }
        }
        symbols.sort();
        console.log("Vérification de " + symbols.length + " symboles");
        var counterVerified = 0;
        var messagesToSend = "";
        symbols.forEach((symbol) => {
            request(endpointBinance + "/api/v3/klines?symbol=" + symbol + "&interval=" + frequency + "&limit=100", { json: true }, (err, res, body) => {
                var macdValues = [];
                body.forEach((candle) => {
                    macdValues.push(parseFloat(candle[4]));
                });

                var macdInput = {
                    values: macdValues,
                    fastPeriod: 12,
                    slowPeriod: 26,
                    signalPeriod: 9,
                    SimpleMAOscillator: false,
                    SimpleMASignal: false
                }
                var macd = MACD.calculate(macdInput);

                var inputRSI = {
                    values: macdValues,
                    period: 14
                };
                var rsi = RSI.calculate(inputRSI);

                var lastCandle = macd[macd.length - 1];
                var preLastCandle = macd[macd.length - 2];

                counterVerified++;
                // Si le MACD est au dessus du signal sur l'avant dernière bougie
                if(preLastCandle == undefined){
                    console.log("Ignore " + symbol + " pas assez d'histo");
                }else{
                    if (preLastCandle.histogram < 0) {
                        if (lastCandle.histogram > 0) {
                            console.log("Signal bull [" + symbol + "] [" + frequency + "] [RSI " + rsi[rsi.length - 1] +"]");
                            messagesToSend += "Signal bull [" + symbol + "] [" + frequency + "] [RSI " + rsi[rsi.length - 1] + "]\n\n";
                            hasCroisement = true;
                        }
                    } else {
                        if (lastCandle.histogram < 0) {
                            console.log("Signal bull [" + symbol + "] [" + frequency + "] [RSI " + rsi[rsi.length - 1] + "]");
                            messagesToSend += "Signal bear [" + symbol + "] [" + frequency + "] [RSI " + rsi[rsi.length - 1] + "]\n\n";
                            hasCroisement = true;
                        }
                    }
                }

                if(counterVerified == symbols.length){
                    bot.sendMessage(channelId, messagesToSend);
                }
            });
        });
    });
}

verifyMacd("1d");

// Settimeout pour 30mn
setInterval(function () {
    verifyMacd("30m");
}, (30 * 60 * 1000));

// Settimeout pour 1h
setInterval(function () {
    verifyMacd("1h");
}, (60 * 60 * 1000));

// Settimeout pour 4h
setInterval(function () {
    verifyMacd("4h");
}, (4 * 60 * 60 * 1000));

// Settimeout pour 1d
setInterval(function () {
    verifyMacd("1d");
}, (60 * 60 * 1000));
