let MACD = require('./Class/MACD');
let Message = require('./Class/Message');
let value = require('./Class/Value');
let vl = new value();

let Simulation = require('./Class/Simulation');
let sim = new Simulation();

let msg = new Message();
msg.initialize();
let macdObj = new MACD();

launchEverything();
// On vérifie tout toutes les 5mn
setInterval(launchEverything, (5 * 60 * 1000));

function launchEverything(){
    macdObj.verify('1h', function () {
        macdObj.verify('4h', function () {
            macdObj.verify('1d', function () {
                msg.sendPendingMsg();
                vl.deleteExpired();
                sim.updateTrades();
            });
        });
    });
}

