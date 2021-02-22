let Endpoints = require('./AbsctractEndpoints');
let DbManager = require('./DbManager');
const ms = require("ms");

let Simulator = class extends Endpoints {
    request;
    db;
    uuid;
    constructor() {
        super();
        this.request = require('request');
        this.db = new DbManager();
        this.uuid = require('uuid');
    }

    async SimulateData(symbol, frequency, price, type) {
        let uuid = this.uuid.v4();
        this.db.getSimulatorDb().get('Simulation').push({
            'uuid': uuid,
            'symbol': symbol,
            'frequency': frequency,
            'starting': price,
            'final': null,
            'type': type,
            'time': new Date().toLocaleString("fr-FR", {timeZone: "America/New_York"})
        }).write();

        let data = this;

       let interval = setInterval(function(){
           console.log("lol")
           data.request( data.endpointBinance + "/api/v3/klines?symbol=" + symbol + "&interval=1m&limit=100", { json: true }, (err, res, body) => {

               data.db.getSimulatorDb().get('Simulation')
                   .find({ uuid: uuid })
                   .assign({final : body[body.length - 1 ][4]})
                   .write()
           });

            clearInterval(interval);
        }, ms(frequency) * 3)

    }


}


module.exports = Simulator;
