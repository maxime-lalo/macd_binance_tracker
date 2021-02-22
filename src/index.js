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
let getResult = require('./Stats/Up-Down');


launchEverything();
// On vérifie tout toutes les 5mn
setInterval(launchEverything, (5 * 60 * 1000));

let up = io.metric({
    name    : 'Up win %'
})

let down = io.metric({
    name    : 'Down win %'
})


function launchEverything(){
    macdObj.verify('1h', function () {
        macdObj.verify('4h', function () {
            macdObj.verify('1d', function () {
                msg.sendPendingMsg();
                vl.deleteExpired();
                up.set(getResult()[0]);
                down.set(getResult()[1]);
            });
        });
    });
}



