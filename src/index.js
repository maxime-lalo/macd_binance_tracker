let MACD = require('./Class/MACD');
let Message = require('./Class/Message');
let value = require('./Class/Value');
let vl = new value();
let msg = new Message();
const DbManager = require('../src/Class/DbManager');
let db = new DbManager();
msg.initialize();
let macdObj = new MACD();
let io = require('@pm2/io')


launchEverything();
// On vérifie tout toutes les 5mn
setInterval(launchEverything, (5 * 60 * 1000));

let valvar = io.metric({
    name    : 'Realtime Value'
})


function launchEverything(){
    macdObj.verify('1h', function () {
        macdObj.verify('4h', function () {
            macdObj.verify('1d', function () {
                msg.sendPendingMsg();
                vl.deleteExpired();
                valvar.set(23)
            });
        });
    });
}

valvar.set(getResult());

function getResult(){

    let data =  db.getSimulatorDb().get('Simulation').value();
    let up = [
        "UP",
        0
    ];
    let down = [
        "DOWN",
        0
    ];
    data.forEach(symbol => {
        if(symbol.type === "down"){
            down[1] += ( (( symbol.starting - symbol.final ) / symbol.starting) *100)* -1 ;
        }else{
            up[1] += (( symbol.starting - symbol.final ) / symbol.starting) * 100;
        }
    })
    return up[1];
}

