const DbManager = require('../Class/DbManager');
let db = new DbManager();

function getResult(){

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
    return [up[1],down[1]]
}

module.exports = getResult
