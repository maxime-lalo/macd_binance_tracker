const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')


let DbManager = class {
    db;
    adapter;

    constructor(){
        // On initialise la DB
        this.adapter = new FileSync('db.json')
        this.db = low(this.adapter);

        // On crée les tables dont on va avoir besoin
        this.db.defaults({ messages: [], signals: [] }).write()
    }

    getDb(){
        return this.db;
    }
}


module.exports = DbManager;