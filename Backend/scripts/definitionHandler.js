const Database = require('./database');
const { ErrorHandler } = require('./errorHandler');

let Definitions = [];

function checkDefinitions() {
  if(Definitions.length > 0) { return true; }
  else { return false; }
}

getDefinitions = () => { return Definitions; }

updateDefinitions = async function UpdateDefinitions() {
  await Database.getAllDefinitions((isError, isFound, data) => {
    if(!isError && isFound) { Definitions = data }
    else { ErrorHandler("Med", `Failed to update definitions`) }
  });
}

updateDefinitions();

module.exports = { getDefinitions, checkDefinitions, updateDefinitions }