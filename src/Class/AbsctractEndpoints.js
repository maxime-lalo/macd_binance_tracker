let Endpoints = class {
    endpointBinance;
    endpointBinanceExchange;

    constructor() {
        this.endpointBinance = "https://api.binance.com";
        this.endpointBinanceExchange = "https://api.binance.com/api/v3/exchangeInfo";
    }
}

module.exports = Endpoints;
