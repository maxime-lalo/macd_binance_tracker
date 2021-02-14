let MACD = require('./Class/MACD');
let Message = require('./Class/Message');
let msg = new Message();
msg.initialize();
var macdObj = new MACD();

// macdObj.verify('1d');
macdObj.verify('4h', function () {
    macdObj.verify('1d', function () {
        msg.sendPendingMsg();
    });
});

// Boucle pour checker les 4h et les 1d toutes les 15mn
setInterval(function () {
    macdObj.verify('4h', function() {
        macdObj.verify('1d', function() {
            msg.sendPendingMsg();
        });
    });
}, (15 * 60 * 1000));

// // Settimeout pour 1d, pour les 1d on vérifie toutes les demies heures
// setInterval(function () {
//     new MACD().verify('1d');
// }, (30 * 60 * 1000));

