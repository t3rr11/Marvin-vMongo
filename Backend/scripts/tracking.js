//Required Libraraies
const fetch = require("node-fetch");
const Log = require("./log.js");
const Misc = require("./misc.js");
const Database = require('./database');
const APIRequest = require('./requestHandler');
const { ErrorHandler } = require('./errorHandler');
const Config = require('../../Configs/Config.json');

const flagEnum = (state, value) => !!(state & value);
function GetItemState(state) { return { none: flagEnum(state, 0), notAcquired: flagEnum(state, 1), obscured: flagEnum(state, 2), invisible: flagEnum(state, 4), cannotAffordMaterialRequirements: flagEnum(state, 8), inventorySpaceUnavailable: flagEnum(state, 16), uniquenessViolation: flagEnum(state, 32), purchaseDisabled: flagEnum(state, 64) }; }
async function UpdateClan(clan, callback) {
  //Get clan details
  await APIRequest.GetClan(clan, async (clan, isError, clanData) => {
    if(!isError) {
      //Get clan members
      await APIRequest.GetClanMembers(clan, async (clan, isError, memberData) => {
        if(!isError) {
          let clanDetails = clanData.Response.detail;
          let members = memberData.Response.results;
    
          if(clan.clanName === "Marvins Minions") {
            console.log(`${ new Date().toLocaleString() } - Clan: ${ clanDetails.name }(${ clanDetails.groupId }), Total Members: ${ members.length }`);
          }
        }
        else { callback(clan, true, "Low", memberData); }
      });
    }
    else { callback(clan, true, "Low", clanData); }
  });

  callback(clan, false);
}

function CheckClanMembers(params) {
  
}

function GetClanMembers(params) {
  
}

function GetClanDetails(params) {
  
}


//Exports
module.exports = { UpdateClan, CheckClanMembers, GetClanMembers, GetClanDetails };