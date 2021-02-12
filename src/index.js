let MACD = require('./Class/MACD');

new MACD().verify('1d');

// Settimeout pour 30mn
setInterval(function () {
    new MACD().verify('30m');
}, (30 * 60 * 1000));

// Settimeout pour 1h
setInterval(function () {
    new MACD().verify('1h');
}, (60 * 60 * 1000));

// Settimeout pour 4h
setInterval(function () {
    new MACD().verify('4h');
}, (4 * 60 * 60 * 1000));

// Settimeout pour 1d
setInterval(function () {
    new MACD().verify('1d');
}, (60 * 60 * 1000));

