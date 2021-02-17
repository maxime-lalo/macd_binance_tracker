let DbManager = require('./DbManager')


let value = class {

    ms;
    dbManager;

    constructor() {
        this.ms = require('ms')
        this.dbManager = new DbManager();
    }

    addValue(value) {
        this.dbManager.getDb().get('value').push(value).write();
    }

    checkValue(value) {
        let data = this.dbManager.getDb().get('value').filter({
            "symbol": value.symbol,
            "frequency": value.frequency
        }).value()

        if (data.length > 0) {
            if (data[0].time < new Date().getTime()) {
                data.remove();
            } else {
                return false;
            }
        }

        this.addValue(value);
        return true;
    }

    deleteExpired(){
        let data = this.dbManager.getDb().get('value').value()
        data.forEach(expired =>{
            if(expired.time < new Date().getTime()){
                this.dbManager.getDb().get('value').remove({ uuid: expired.uuid }).write()
            }
        })
    }

}

module.exports = value;
