let DbManager = require('./DbManager')
let Endpoints = require('./AbsctractEndpoints');

let Simulation = class extends Endpoints {

    ms;
    dbManager;
    constructor() {
        super();
        this.ms = require('ms');
        this.dbManager = new DbManager();
        this.request = require('request');
    }

    createTrade(signal){
        this.dbManager.getDb().get('simulation').push(signal).write();
    }

    updateTrades() {
        let data = this.dbManager.getDb().get('simulation').value();
        data.forEach(trade => {
            let check = null;
            if (trade.firstCheck === null) {
                if ((trade.time + this.ms(trade.frequency)) < new Date().getTime()) {
                    check = "firstCheck";
                }
            } else if (trade.secondCheck === null) {
                if ((trade.time + (this.ms(trade.frequency) * 2)) < new Date().getTime()) {
                    check = "secondCheck";
                }
            } else if (trade.lastCheck === null) {
                if ((trade.time + (this.ms(trade.frequency) * 3)) < new Date().getTime()) {
                    check = "lastCheck";
                }
            }

            if(check !== null){
                this.request(this.endpointBinance + "/api/v3/klines?symbol=" + trade.symbol + "&interval=1m&limit=1", { json: true }, (err, res, body) => {
                    let price = body[0][4];
                    let newValue = null;
                    switch (check) {
                        case 'firstCheck':
                            newValue = { 'firstCheck': price };
                            break;
                        case 'secondCheck':
                            newValue = { 'secondCheck': price };
                            break;
                        case 'lastCheck':
                            let benefits = ((price - trade.price) / price) * 100;
                            newValue = { 'lastCheck': price,'benefits':benefits};
                            break;
                    }

                    this.dbManager.getDb().get('simulation').find({
                        'symbol': trade.symbol,
                        'frequency': trade.frequency,
                        'time': trade.time
                    }).assign(newValue).write();
                })
            }
        })
    }

    getActualPrice(symbol) {
        
    }

}

module.exports = Simulation;
