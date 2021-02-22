const { Command } = require('commander');
const program = new Command();
const Table = require('cli-table');
const FileSync = require("lowdb");
const DbManager = require('../src/Class/DbManager');

let db = new DbManager();

program
    .command('Stats')
    .description("Get 'ur crypto Stats")
    .action(async () => {


        let table = new Table({
            head: ['Type', 'Gain']
        });

        let data =  db.getSimulatorDb().get('Simulation').value();
        let up = [
            "UP",
            0
        ];
        let down = [
            "DOWN",
            0
        ];
        data.forEach(symbol => {
            if(symbol.type === "down"){
                down[1] += ( (( symbol.starting - symbol.final ) / symbol.starting) *100)* -1 ;
            }else{
                up[1] += (( symbol.starting - symbol.final ) / symbol.starting) * 100;
            }
        })

        table.push(up,down);

        console.log(table.toString())


    })
program.parse()
