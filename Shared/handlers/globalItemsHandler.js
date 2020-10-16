const Database = require('../database');
const { ErrorHandler } = require('./errorHandler');

let GlobalItems = [];

function checkGlobalItems() {
  if(GlobalItems.length > 0) { return true; }
  else { return false; }
}

getGlobalItems = () => { return GlobalItems; }

updateGlobalItems = async function UpdateGlobalItems() {
  await Database.getAllGlobalItems(function GetAllGlobalItems(isError, isFound, data) {
    if(!isError && isFound) { GlobalItems = data }
    else { ErrorHandler("Med", `Failed to update global items`) }
  });
}

updateGlobalItems();

module.exports = { getGlobalItems, checkGlobalItems, updateGlobalItems }