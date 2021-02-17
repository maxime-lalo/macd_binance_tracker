let MACD = require('./Class/MACD');
let Message = require('./Class/Message');
let msg = new Message();
msg.initialize();
let macdObj = new MACD();

launchEverything();
// On vérifie tout toutes les 5mn
setInterval(launchEverything, (30000));

function launchEverything(){
    macdObj.verify('1h', function () {
        macdObj.verify('4h', function () {
            macdObj.verify('1d', function () {
                console.log("Fin des vérifs MACD \n------------\n");
                msg.sendPendingMsg();
                console.log("Fin des envois des messages \n------------\n");
                console.log("Fin des vérifs signaux déjà existants \n------------\n");
            });
        });
    });
}

