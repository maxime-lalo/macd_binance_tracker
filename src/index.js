let MACD = require('./Class/MACD');
let Message = require('./Class/Message');
let msg = new Message();
msg.initialize();
var macdObj = new MACD();

launchEverything();
setInterval(launchEverything, (15 * 60 * 1000));


function launchEverything(){
    macdObj.verify('4h', function () {
        macdObj.verify('1d', function () {
            console.log("Fin des vérifs MACD \n------------\n");
            msg.sendPendingMsg();
            console.log("Fin des envois des messages \n------------\n");
            macdObj.clearSignals();
            console.log("Fin des vérifs signaux déjà existants \n------------\n");
        });
    });
}
// // Settimeout pour 1d, pour les 1d on vérifie toutes les demies heures
// setInterval(function () {
//     new MACD().verify('1d');
// }, (30 * 60 * 1000));

