const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')


let DbManager = class {

    db;
    adapter;

    constructor(){
        // On initialise la DB
        this.adapter = new FileSync('./data/db.json')
        this.db = low(this.adapter);

        // On crée les tables dont on va avoir besoin
        this.db.defaults({ messages: [], value: [] }).write()
    }

    getDb(){
        this.adapter = new FileSync('./data/db.json')
        this.db = low(this.adapter);

        return this.db;
    }
}


module.exports = DbManager;
