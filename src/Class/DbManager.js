const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')


let DbManager = class {



    constructor(){
        // On initialise la DB
        let adapter = new FileSync('./data/db.json')
        let db = low(adapter);

        // On crée les tables dont on va avoir besoin
        db.defaults({ messages: [], value: [] }).write()

        let adaptaterSimu = new FileSync('./data/Simulator.json')
        let dbSimu = low(adaptaterSimu);

        dbSimu.defaults({ Simulation: [] }).write()

    }

    getDb(){
        let adapter = new FileSync('./data/db.json')
        return low(adapter);
    }


    getSimulatorDb(){
        let adaptaterSimu = new FileSync('./data/Simulator.json')
        return low(adaptaterSimu);
    }
}


module.exports = DbManager;
