let MACD = require('./Class/MACD');
new MACD().verify('1h');
// Settimeout pour 1h
setInterval(function () {
    new MACD().verify('1h');
}, (60 * 60 * 1000));

// Settimeout pour 4h
setInterval(function () {
    new MACD().verify('4h');
}, (4 * 60 * 60 * 1000));

// Settimeout pour 1d, pour les 1d on vérifie toutes les demies heures
setInterval(function () {
    new MACD().verify('1d');
}, (30 * 60 * 1000));

