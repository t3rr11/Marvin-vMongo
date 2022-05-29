//Required Libraraies
const fetch = require("node-fetch");
const Database = require('../../Shared/database.js');
const Log = require("../../Shared/log.js");
const Misc = require("../../Shared/misc.js");
const APIRequest = require('../../Shared/handlers/requestHandler');
const { ErrorHandler } = require('../../Shared/handlers/errorHandler');
const GlobalItemsHandler = require('../../Shared/handlers/globalItemsHandler');
const ManifestHandler = require("../../Shared/handlers/manifestHandler.js");
const BroadcastHandler = require('./handlers/broadcastHandler');
const Config = require('../../Shared/configs/Config.json');

const flagEnum = (state, value) => !!(state & value);

const GetItemState = (state) => {
  return {
    none: flagEnum(state, 0),
    notAcquired: flagEnum(state, 1),
    obscured: flagEnum(state, 2),
    invisible: flagEnum(state, 4),
    cannotAffordMaterialRequirements: flagEnum(state, 8),
    inventorySpaceUnavailable: flagEnum(state, 16),
    uniquenessViolation: flagEnum(state, 32),
    purchaseDisabled: flagEnum(state, 64)
  };
}

async function UpdateClan(clan, season, callback) {
  //Get clan details
  const ifSucessful = await new Promise(resolve => 
    APIRequest.GetClan(clan, async (clan, isError, clanData) => {
      if(!isError) {
        //Get clan members
        await APIRequest.GetClanMembers(clan, async (clan, isError, memberData) => {
          if(!isError) {
            //Get online players, then filter by online + 15mins of offline players.
            let members = memberData.Response.results;
            let onlineMembers = clan.forcedScan || clan.firstScan ? members : members.filter(e => e.isOnline || (new Date() - new Date(e.lastOnlineStatusChange * 1000)) < (1000 * 60 * 15));

            //Check for players that are no longer in the clan and remove them from the clan.
            await new Promise(resolve3 => Database.getClanUsers(clan.clanID, async function GetClanUsers(isError, isFound, players) {
              if(!isError) {
                if(isFound) {
                  for(let i in players) {
                    if(!members.find(e => e.destinyUserInfo.membershipId === players[i].membershipID)) {
                      Database.removeClanFromPlayer(players[i].membershipID);
                      Log.SaveLog("Backend", "Clan", `${ players[i].displayName } (${ players[i].membershipID }) has left the clan ${ clan.clanID }`);
                    }
                  }
                }
                else {
                  //ErrorHandler("Low", `No players were found from clan: ${ clan.clanID }`);
                }
              }
              else { ErrorHandler("Low", `Error getting players from clan: ${ clan.clanID }`); }
              resolve3(true);
            }));

            //Get guilds associated with that clan
            await new Promise(resolve2 => Database.getTrackedClanGuilds(clan.clanID, async function GetTrackedClanGuilds(isError, isFound, guilds) {
              if(!isError) {
                if(isFound) {
                  //Get each players data
                  for(var i in onlineMembers) {
                    await APIRequest.GetProfile(onlineMembers[i], "100,200,202,204,800,900,1100", async function GetProfile(member, isError, playerData) {
                      if(!isError) {
                        //Check if user is private by checking for if the data object exists.
                        if(playerData.Response.profileRecords.data) {
                          //Check to see if records exists or did the data not obtain the user records.
                          if(playerData.Response.profileRecords.data.records) {
                            //Check to see if scan was forced or first scan.
                            if(clan.forcedScan || clan.firstScan) { UpdatePlayer(clan, onlineMembers[i], playerData.Response, null); }
                            else { ProcessPlayer(clan, season, onlineMembers[i], playerData.Response, guilds); }
                          }
                          else { ErrorHandler("High", `Failed to find records: ${ playerData.Response.profileRecords.data }`) }
                        }
                        else {
                          //Update privacy settings if user is private.
                          Database.updatePrivacyByID(onlineMembers[i].destinyUserInfo.membershipId, { isPrivate: true }, function UpdatePrivacy(isError, severity, reason) {
                            if(isError && reason === "NoUser") {
                              Database.updateUserByID(onlineMembers[i].destinyUserInfo.membershipId, {
                                user: {
                                  clanID: clan.clanID,
                                  displayName: `${onlineMembers[i].destinyUserInfo.bungieGlobalDisplayName}#${onlineMembers[i].destinyUserInfo.bungieGlobalDisplayNameCode}`,
                                  membershipID: onlineMembers[i].destinyUserInfo.membershipId,
                                  joinDate: onlineMembers[i].joinDate,
                                  lastUpdated: new Date(),
                                  isPrivate: true,
                                  firstLoad: true
                                },
                                items: {
                                  clanID: clan.clanID,
                                  membershipID: onlineMembers[i].destinyUserInfo.membershipId,
                                  recentItems: [],
                                  items: []
                                },
                                titles: {
                                  clanID: clan.clanID,
                                  membershipID: onlineMembers[i].destinyUserInfo.membershipId,
                                  titles: []
                                }
                              }, function UpdateUserByID(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
                            }
                            else { if(isError) { ErrorHandler("Med", `User: ${ onlineMembers[i].destinyUserInfo.membershipId }, Reason: ${ reason }`); } }
                          });
                        }
                      }
                      else {
                        if(playerData.ErrorCode === 1601) {
                          //ErrorHandler("Low", `Player ${ onlineMembers[i].destinyUserInfo.membershipId } not found.`);
                        }
                        else { if(playerData.ErrorStatus) { ErrorHandler("Low", `Error: ${ playerData.ErrorStatus }`); } else { ErrorHandler("Low", playerData); } }
                      }
                    });
                  }
                  //Now that all users in the clan have been scanned, process clan data and look for changes then save the data.
                  await ProcessClanData(clan, guilds, season, clanData, onlineMembers);
                }
                else {
                  Database.updateClanByID(clan.clanID, { firstScan: true, isTracking: false, clanLevel: 1, memberCount: 0, onlineMembers: 0, lastScan: new Date() },
                  function UpdateClanByID(isError, severity, err) {
                    if(isError) { ErrorHandler(severity, err) }
                    else { Log.SaveLog("Backend", "Clan", `Failed to find any guilds for clan ${ clan.clanID } so it has had it's tracking disabled.`); }
                  });
                }
              }
              else { ErrorHandler("Med", `Failed to get guilds for clan ${ clan.clanID }`); }

              //Finally all users in clan have been scanned and processed, resolve promise.
              resolve2(true);
            }));

            //End of clan scan, resolve promise and remove from processing queue.
            resolve(true);
          }
          else { callback(clan, true, "Low", memberData); resolve(false); }
        });
      }
      else {
        if(clanData.ErrorCode === 686) {
          //Update clan details as clan no longer exists.
          Log.SaveLog("Backend", "Info", `${ clan.clanName } no longer exists. Rip clan.`);
          Database.updateClanByID(clan.clanID, {
            clanName: `${ clan.clanName } (Deleted)`,
            firstScan: true,
            isTracking: false,
            clanLevel: 1,
            memberCount: 0,
            onlineMembers: 0,
            lastScan: new Date()
          }, function UpdateClanByID(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
        }
        callback(clan, true, "Low", clanData);
        resolve(false);
      }
  }));

  //Finally callback and let backend know it went sucessfully.
  if(ifSucessful) { callback(clan, false); }
}

async function ProcessClanData(clan, guilds, season, clanData, onlineMembers) {
  let clanDetails = clanData.Response.detail;
  let currentClanLevel = clanDetails.clanInfo.d2ClanProgressions["584850370"].level;
  
  //Process clan data, look for changes
  for(let i in guilds) {
    if(clan.clanName !== clanDetails.name) { BroadcastHandler.sendClanBroadcast(clan, guilds[i], clanDetails, "name_change", season); }
    if(clan.clanCallsign !== clanDetails.clanInfo.clanCallsign) { BroadcastHandler.sendClanBroadcast(clan, guilds[i], clanDetails, "tag_change", season); }
    if(clan.clanLevel !== currentClanLevel && clan.clanLevel < currentClanLevel) {
      if(currentClanLevel === parseInt(clan.clanLevel)+1) { BroadcastHandler.sendClanBroadcast(clan, guilds[i], clanDetails, "level_up", season); }
    }
  }

  //Finally save clan details.
  Database.updateClanByID(clan.clanID, {
    clanName: clanDetails.name,
    clanCallsign: clanDetails.clanInfo.clanCallsign,
    clanBanner: {
      decalId: clanDetails.clanInfo.clanBannerData.decalId,
      decalColorId: clanDetails.clanInfo.clanBannerData.decalColorId,
      decalBackgroundColorId: clanDetails.clanInfo.clanBannerData.decalBackgroundColorId,
      gonfalonId: clanDetails.clanInfo.clanBannerData.gonfalonId,
      gonfalonColorId: clanDetails.clanInfo.clanBannerData.gonfalonColorId,
      gonfalonDetailId: clanDetails.clanInfo.clanBannerData.gonfalonDetailId,
      gonfalonDetailColorId: clanDetails.clanInfo.clanBannerData.gonfalonDetailColorId
    },
    clanLevel: currentClanLevel,
    memberCount: clanDetails.memberCount,
    onlineMembers: onlineMembers.length,
    firstScan: false,
    forcedScan: false,
    lastScan: new Date()
  }, function UpdateClanByID(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
}

async function ProcessPlayer(clan, season, memberData, playerData, guilds) {
  Database.findUserByID(memberData.destinyUserInfo.membershipId, async function FindUserByID(isError, isFound, oldPlayerData) {
    if(!isError) {
      if(isFound) {
        //Look for broadcasts provided this user is not on their first load.
        if(!oldPlayerData.User.firstLoad && !oldPlayerData.User.isPrivate && oldPlayerData.Titles?.titles && oldPlayerData.Items?.items) {
          await CheckItems(clan, season, memberData, playerData, oldPlayerData, guilds);
          await CheckTitles(clan, season, memberData, playerData, oldPlayerData, guilds);
          await CheckTriumphs(clan, season, memberData, playerData, oldPlayerData, guilds);
        }

        //Finally update player and save new data.
        UpdatePlayer(clan, memberData, playerData, oldPlayerData);
      }
      else {
        //User did not exist before most likely just joined a tracked clan.
        UpdatePlayer(clan, memberData, playerData, null);
      }
    }
    else { ErrorHandler("Low", `User: ${ memberData.destinyUserInfo.membershipId }, Reason: ${ oldPlayerData }`); }
  });
}

async function CheckItems(clan, season, memberData, playerData, oldPlayerData, guilds) {
  var recentItems = playerData.profileCollectibles.data.recentCollectibleHashes;
  var previousRecentItems = oldPlayerData.Items.recentItems;
  if(previousRecentItems && recentItems) {
    var differences = recentItems.filter(itemHash => !previousRecentItems.includes(itemHash));

    if(differences.length > 0) {
      for(let i in guilds) {
        //Get mode, global items and extra items.
        let broadcastMode = guilds[i].broadcasts.mode;
        let globalItems = (GlobalItemsHandler.getGlobalItems()).map(e => { return e.hash });
        let extraItems = guilds[i].broadcasts.extraItems.map(e => { if(e.enabled) return e.hash });
        let ignoredItems = guilds[i].broadcasts.extraItems.map(e => { if(!e.enabled) return e.hash });
        let itemsToLookFor = [];
  
        if(broadcastMode === "Auto") {
          //If broadcast mode is automatic, then it will broadcast those found in the database under the "global_items" collection and in the extra items node in the seclected guild.
          itemsToLookFor = [...globalItems.filter(e => !ignoredItems.includes(e)), ...extraItems.filter(e => !globalItems.includes(e))];
        }
        else if(broadcastMode === "Manual") {
          //If broadcast mode is manual, then it will only broadcast those found in the guilds extra item node that resides inside the broadcasts node.
          itemsToLookFor = extraItems;
        }
  
        //Find items that match in differences and send broadcast
        for(let j in differences) {
          if(itemsToLookFor.find(e => e == differences[j])) {
            BroadcastHandler.sendItemBroadcast(clan, guilds[i], differences[j], oldPlayerData, season);
          }
        }
      }
    }
  
    //Log found items
    //differences.length > 0 ? console.log(`User: ${ memberData.destinyUserInfo.displayName }: Found: ${ differences }`) : null
  }
}

async function CheckTitles(clan, season, memberData, playerData, oldPlayerData, guilds) {
  const legacySealsNode = ManifestHandler.getManifest().DestinyPresentationNodeDefinition[1881970629];
  const legacysealsParents = legacySealsNode.children.presentationNodes.map(e => { return e.presentationNodeHash });
  const sealsNode = ManifestHandler.getManifest().DestinyPresentationNodeDefinition[616318467];
  const sealsParents = sealsNode.children.presentationNodes.map(e => { return e.presentationNodeHash });
  let seals = sealsParents.map(e => { return ManifestHandler.getManifest().DestinyPresentationNodeDefinition[e].completionRecordHash });
  let legacySeals = legacysealsParents.map(e => { return ManifestHandler.getManifest().DestinyPresentationNodeDefinition[e].completionRecordHash });
  let gildedSeals = seals.map(e => { return ManifestHandler.getManifest().DestinyRecordDefinition[e]?.titleInfo?.gildingTrackingRecordHash });
  let legacyGildedSeals = legacySeals.map(e => { return ManifestHandler.getManifest().DestinyRecordDefinition[e]?.titleInfo?.gildingTrackingRecordHash });
  let allSeals = seals.concat(legacySeals);
  let allGildedSeals = gildedSeals.concat(legacyGildedSeals.filter(e => e !== undefined));
  let allSealsCombined = allSeals.concat(allGildedSeals.filter(e => e !== undefined));

  if(oldPlayerData.Titles.titles) {
    let previousTitles = oldPlayerData.Titles.titles;
    let newTitles = allSealsCombined.filter(e => playerData.profileRecords.data.records[e]?.objectives[0]?.complete);
    var differences = newTitles.filter(titleHash => !previousTitles.includes(titleHash));
  
    //Check for title completions
    if(differences.length > 0) {
      for(let i in guilds) {
        //Get mode, global items and extra items.
        let broadcastMode = guilds[i].broadcasts.mode;
        let globalItems = (GlobalItemsHandler.getGlobalItems()).map(e => { return e.hash });
        let extraItems = guilds[i].broadcasts.extraItems.map(e => { if(e.enabled) return e.hash });
        let ignoredItems = guilds[i].broadcasts.extraItems.map(e => { if(!e.enabled) return e.hash });
        let itemsToLookFor = [];
  
        if(broadcastMode === "Auto") { itemsToLookFor = [...globalItems.filter(e => !ignoredItems.includes(e)), ...extraItems.filter(e => !globalItems.includes(e))]; }
        else if(broadcastMode === "Manual") {
          itemsToLookFor = extraItems;

          // Override for a clan
          if(guilds[i]?.guildID === "268999519247663104") {
            itemsToLookFor = [...globalItems.filter(e => !ignoredItems.includes(e)), ...extraItems.filter(e => !globalItems.includes(e))];
          }
        }
  
        //Find items that match in differences and send broadcast
        for(let j in differences) {
          if(itemsToLookFor.find(e => e == differences[j])) {
            BroadcastHandler.sendTitleBroadcast(clan, guilds[i], differences[j], oldPlayerData, season);
          }
        }
      }
    }
  }
  else { Log.SaveLog("Backend", "Error", `Could not find titles for ${ oldPlayerData.displayName } (${ oldPlayerData.membershipID })`); }
}

async function CheckTriumphs(clan, season, memberData, playerData, oldPlayerData, guilds) {
  if(playerData.characterRecords?.data) {
    if(oldPlayerData.User.challenges) {
      var characterIds = playerData.profile.data.characterIds;
      const newTriumphData = FormatTriumphs(clan, memberData, playerData, oldPlayerData);

      let challenges = {
        s13: { hash: 1417828034, old: oldPlayerData.User.challenges.s13, new: newTriumphData.challenges.s13 },
        s14: { hash: 3289944359, old: oldPlayerData.User.challenges.s14, new: newTriumphData.challenges.s14 },
        s15: { hash: 3571655900, old: oldPlayerData.User.challenges.s15, new: newTriumphData.challenges.s15 }
      }
      let triumphs = {
        cabal: { hash: 1607758397, old: oldPlayerData.User.triumphs.cabals, new: newTriumphData.triumphs.cabals }
      }
    
      //Check for triumph completion
      // if(!challenges.s13.old && challenges.s13.new) {
      //   for(let i in guilds) {
      //     BroadcastHandler.sendTriumphBroadcast(clan, guilds[i], challenges.s13.hash, oldPlayerData, season);
      //   }
      // }
      // if(!challenges.s14.old && challenges.s14.new) {
      //   for(let i in guilds) {
      //     BroadcastHandler.sendTriumphBroadcast(clan, guilds[i], challenges.s14.hash, oldPlayerData, season);
      //   }
      // }
      if(!challenges.s15.old && challenges.s15.new) {
        for(let i in guilds) {
          BroadcastHandler.sendTriumphBroadcast(clan, guilds[i], challenges.s15.hash, oldPlayerData, season);
        }
      }
      
      if(clan.clanID === 2603670) {
        //if(!triumphs.cabals.old && triumphs.cabals.new) { for(let i in guilds) { BroadcastHandler.sendTriumphBroadcast(clan, guilds[i], triumphs.cabals.hash, oldPlayerData, season); } }
      }
    }
    else { Log.SaveLog("Backend", "Error", `Could not find triumphs for ${ oldPlayerData.displayName } (${ oldPlayerData.membershipID })`); }
  }
}

async function UpdatePlayer(clan, memberData, playerData, oldPlayerData) {
  const AccountInfo = FormatAccountInfo(clan, memberData, playerData, oldPlayerData);
  const Rankings = FormatRankings(clan, memberData, playerData, oldPlayerData);
  const Raids = FormatRaids(clan, memberData, playerData, oldPlayerData);
  const Titles = FormatTitles(clan, memberData, playerData, oldPlayerData);
  const Seasonal = FormatSeasonal(clan, memberData, playerData, oldPlayerData);
  const Triumphs = FormatTriumphs(clan, memberData, playerData, oldPlayerData);
  const Others = FormatOthers(clan, memberData, playerData, oldPlayerData);

  Database.updateUserByID(memberData.destinyUserInfo.membershipId, {
    user: {
      clanID: clan.clanID,
      displayName: `${ memberData.destinyUserInfo.bungieGlobalDisplayName }#${ memberData.destinyUserInfo.bungieGlobalDisplayNameCode }`,
      membershipID: memberData.destinyUserInfo.membershipId,
      currentClass: AccountInfo.currentClass,
      highestPower: AccountInfo.highestPower,
      timePlayed: AccountInfo.timePlayed,
      infamy: {
        current: Rankings.infamy.currentProgress,
        resets: Rankings.infamy.currentResetCount,
        seasonal: Rankings.infamy.currentProgress + (Rankings.infamy.currentResetCount * 10000)
      },
      valor: {
        current: Rankings.valor.currentProgress,
        resets: Rankings.valor.currentResetCount,
        seasonal: Rankings.valor.currentProgress + (Rankings.valor.currentResetCount * 10000)
      },
      trialsRank: {
        current: Rankings.trialsRank,
        resets: Math.floor(Rankings.trialsRank / 10000),
        seasonal: Rankings.trialsRank
      },
      glory: Rankings.glory,
      triumphScore: Others.triumphScore,
      seasonRank: Seasonal.seasonRank,
      powerBonus: Seasonal.powerBonus,
      dawning2020: Triumphs.dawning2020,
      challenges: Triumphs.challenges,
      grandmasters: Triumphs.grandmasters,
      triumphs: Triumphs.triumphs,
      lightLevels: AccountInfo.lightLevels,
      ironBanner: Rankings.ironBanner,
      raids: Raids.raids,
      totalRaids: Raids.totalRaids,
      empireHunts: Triumphs.empireHunts,
      xp: Seasonal.xp,
      dungeons: Others.dungeons,
      containments: Others.containments,
      presage: Others.presage,
      trials: Rankings.trials,
      lastActivity: AccountInfo.lastActivity,
      joinDate: memberData.joinDate,
      lastPlayed: AccountInfo.lastPlayed,
      lastUpdated: new Date(),
      isPrivate: false,
      firstLoad: false
    },
    items: {
      clanID: clan.clanID,
      membershipID: memberData.destinyUserInfo.membershipId,
      recentItems: playerData.profileCollectibles.data.recentCollectibleHashes,
      items: Object.keys(playerData.profileCollectibles.data.collectibles).map((e, index) => { return { "hash": e, "state": playerData.profileCollectibles.data.collectibles[e].state } })
    },
    titles: {
      clanID: clan.clanID,
      membershipID: memberData.destinyUserInfo.membershipId,
      titles: Titles
    }
  }, function UpdateUserByID(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
}

function FormatAccountInfo(clan, memberData, playerData, oldPlayerData) {
  let characterIds = playerData.profile.data.characterIds;
  let characters = playerData.characters.data;
  let lastPlayedCharacter = characters[characterIds[0]];
  let isOnline = memberData.isOnline;
  let joinDate = memberData.joinDate;
  let lastPlayed = new Date(playerData.profile.data.dateLastPlayed).getTime();
  let dlcOwned = playerData.profile.data.versionsOwned;
  let highestPower = 0;
  let timePlayed = 0;
  let lightLevels = [];
  let lastActivity = { currentActivityHash: null, dateActivityStarted: null };

  for(let i in characterIds) {
    //Get users last played character
    if(new Date(characters[characterIds[i]].dateLastPlayed).getTime() > new Date(lastPlayedCharacter.dateLastPlayed).getTime()) { lastPlayedCharacter = characters[characterIds[i]]; }

    //Get users accurate light levels per character
    lightLevels.push({
      "id": characterIds[i],
      "class": Misc.GetClassName(characterIds[i].classType),
      "light": characters[characterIds[i]].light
    });

    //Get users overall playtime
    timePlayed = parseInt(timePlayed) + parseInt(characters[characterIds[i]].minutesPlayedTotal);
  }

  //Get last played activity.
  try { 
    lastActivity = {
      currentActivityHash: playerData.characterActivities.data[lastPlayedCharacter.characterId]?.currentActivityHash,
      dateActivityStarted: new Date(playerData.characterActivities.data[lastPlayedCharacter.characterId]?.dateActivityStarted).getTime()
    }
  } catch (err) { }
    
  //Get users highest light from record, this however changed based on character last played. Hence the next check.
  try { highestPower = playerData.profileRecords.data.records["3241995275"].intervalObjectives[3].progress; } catch (err) {  }

  //Check if max power is higher than previously recorded max power. If the record exists that is.
  if(oldPlayerData?.User) { highestPower = highestPower > oldPlayerData.User.highestPower ? highestPower : oldPlayerData.User.highestPower; }

  return {
    "clanId": clan.clanID,
    "isOnline": isOnline,
    "joinDate": joinDate,
    "lightLevels": lightLevels,
    "highestPower": highestPower,
    "timePlayed": timePlayed,
    "lastPlayed": lastPlayed,
    "currentClass": lastPlayedCharacter ? Misc.GetClassName(lastPlayedCharacter.classType) : "Unknown",
    "dlcOwned": dlcOwned,
    "lastActivity": lastActivity
  }
}

function FormatRankings(clan, memberData, playerData, oldPlayerData) {
  var characterIds = playerData.profile.data.characterIds;
  var infamy = { currentProgress: 0, currentResetCount: 0 };
  var valor = { currentProgress: 0, currentResetCount: 0 };
  try { valor = playerData.characterProgressions.data[characterIds[0]].progressions["2083746873"]; } catch (err) { console.log(err); }
  try { infamy = playerData.characterProgressions.data[characterIds[0]].progressions["3008065600"]; } catch (err) { }
  var glory = 0; try { glory = playerData.metrics.data.metrics["268448617"].objectiveProgress.progress; } catch (err) { }
  var ibKills = 0; try { ibKills = playerData.profileRecords.data.records["999240767"].intervalObjectives[2].progress; } catch (err) { }
  var ibWins = 0; try { ibWins = playerData.profileRecords.data.records["2096302465"].intervalObjectives[2].progress; } catch (err) { }
  var trialsRank = "0"; try { trialsRank = playerData.characterProgressions.data[characterIds[0]].progressions["2755675426"].currentProgress; } catch (err) { }


  //Trials
  var overall_trialsWins = 0; try { overall_trialsWins = playerData.metrics.data.metrics["1365664208"].objectiveProgress.progress; } catch (err) { }
  var overall_flawlessTickets = 0; try { overall_flawlessTickets = playerData.metrics.data.metrics["1765255052"].objectiveProgress.progress; } catch (err) { }
  var overall_finalblows = 0; try { overall_finalblows = playerData.metrics.data.metrics["2082314848"].objectiveProgress.progress; } catch (err) { }
  var overall_postFlawlessWins = 0; try { overall_postFlawlessWins = playerData.metrics.data.metrics["1082901574"].objectiveProgress.progress; } catch (err) { }
  var overall_lighthouseCarries = 0; try { overall_lighthouseCarries = playerData.metrics.data.metrics["301249970"].objectiveProgress.progress; } catch (err) { }

  var weekly_trialsWins = 0; try { weekly_trialsWins = playerData.metrics.data.metrics["3046315288"].objectiveProgress.progress; } catch (err) { }
  var weekly_trialsWinStreak = 0; try { weekly_trialsWinStreak = playerData.metrics.data.metrics["3787323274"].objectiveProgress.progress; } catch (err) { }
  var weekly_flawlessTickets = 0; try { weekly_flawlessTickets = playerData.metrics.data.metrics["122451876"].objectiveProgress.progress; } catch (err) { }
  var weekly_finalblows = 0; try { weekly_finalblows = playerData.metrics.data.metrics["2091173752"].objectiveProgress.progress; } catch (err) { }
  var weekly_postFlawlessWins = 0; try { weekly_postFlawlessWins = playerData.metrics.data.metrics["2771330814"].objectiveProgress.progress; } catch (err) { }
  var weekly_lighthouseCarries = 0; try { weekly_lighthouseCarries = playerData.metrics.data.metrics["1155098170"].objectiveProgress.progress; } catch (err) { }

  var seasonal_trialsWins = 0; try { seasonal_trialsWins = playerData.metrics.data.metrics["2367472811"].objectiveProgress.progress; } catch (err) { }
  var seasonal_trialsWinStreak = 0; try { seasonal_trialsWinStreak = playerData.metrics.data.metrics["957196641"].objectiveProgress.progress; } catch (err) { }
  var seasonal_flawlessTickets = 0; try { seasonal_flawlessTickets = playerData.metrics.data.metrics["1114483243"].objectiveProgress.progress; } catch (err) { }
  var seasonal_finalblows = 0; try { seasonal_finalblows = playerData.metrics.data.metrics["3481560625"].objectiveProgress.progress; } catch (err) { }
  var seasonal_postFlawlessWins = 0; try { seasonal_postFlawlessWins = playerData.metrics.data.metrics["128083325"].objectiveProgress.progress; } catch (err) { }
  var seasonal_lighthouseCarries = 0; try { seasonal_lighthouseCarries = playerData.metrics.data.metrics["610393611"].objectiveProgress.progress; } catch (err) { }

  return {
    "infamy": infamy,
    "valor": valor,
    "glory": glory,
    "trialsRank": trialsRank,
    "ironBanner": {
      "kills": ibKills,
      "wins": ibWins,
    },
    "trials": {
      "overall": {
        "wins": overall_trialsWins,
        "flawlessTickets": overall_flawlessTickets,
        "finalBlows": overall_finalblows,
        "postFlawlessWins": overall_postFlawlessWins,
        "carries": overall_lighthouseCarries
      },
      "seasonal": {
        "wins": seasonal_trialsWins,
        "winStreak": seasonal_trialsWinStreak,
        "flawlessTickets": seasonal_flawlessTickets,
        "finalBlows": seasonal_finalblows,
        "postFlawlessWins": seasonal_postFlawlessWins,
        "carries": seasonal_lighthouseCarries
      },
      "weekly": {
        "wins": weekly_trialsWins,
        "winStreak": weekly_trialsWinStreak,
        "flawlessTickets": weekly_flawlessTickets,
        "finalBlows": weekly_finalblows,
        "postFlawlessWins": weekly_postFlawlessWins,
        "carries": weekly_lighthouseCarries
      }
    }
  }
}

function FormatRaids(clan, memberData, playerData, oldPlayerData) {
  var leviCompletions = 0; try { leviCompletions = playerData.metrics.data.metrics["2486745106"].objectiveProgress.progress; } catch (err) { }
  var eowCompletions = 0; try { eowCompletions = playerData.metrics.data.metrics["2659534585"].objectiveProgress.progress; } catch (err) { }
  var sosCompletions = 0; try { sosCompletions = playerData.metrics.data.metrics["700051716"].objectiveProgress.progress; } catch (err) { }

  var leviPresCompletions = 0; try { leviPresCompletions = playerData.metrics.data.metrics["1130423918"].objectiveProgress.progress; } catch (err) { }
  var eowPresCompletions = 0; try { eowPresCompletions = playerData.metrics.data.metrics["3284024615"].objectiveProgress.progress; } catch (err) { }
  var sosPresCompletions = 0; try { sosPresCompletions = playerData.metrics.data.metrics["3070318724"].objectiveProgress.progress; } catch (err) { }

  var lastWishCompletions = 0; try { lastWishCompletions = playerData.metrics.data.metrics["905240985"].objectiveProgress.progress; } catch (err) { }
  var scourgeCompletions = 0; try { scourgeCompletions = playerData.metrics.data.metrics["1201631538"].objectiveProgress.progress; } catch (err) { }
  var sorrowsCompletions = 0; try { sorrowsCompletions = playerData.metrics.data.metrics["1815425870"].objectiveProgress.progress; } catch (err) { }
  var gardenCompletions = 0; try { gardenCompletions = playerData.metrics.data.metrics["1168279855"].objectiveProgress.progress; } catch (err) { }
  var dscCompletions = 0; try { dscCompletions = playerData.metrics.data.metrics["954805812"].objectiveProgress.progress; } catch (err) { }
  var vogCompletions = 0; try { vogCompletions = playerData.metrics.data.metrics["2506886274"].objectiveProgress.progress; } catch (err) { }
  var vowCompletions = 0; try { vowCompletions = playerData.metrics.data.metrics["3585185883"].objectiveProgress.progress; } catch (err) { }

  //For some reason leviCompetions also count prestige completions, they need to be removed;
  leviCompletions = leviCompletions - leviPresCompletions;

  //Calulate total raids
  var totalRaids = leviCompletions + leviPresCompletions + eowCompletions + eowPresCompletions + sosCompletions + sosPresCompletions + lastWishCompletions + scourgeCompletions + sorrowsCompletions + gardenCompletions + dscCompletions + vogCompletions + vowCompletions;

  return {
    "raids": {
      "levi": leviCompletions,
      "eow": eowCompletions,
      "sos": sosCompletions,
      "prestige_levi": leviPresCompletions,
      "prestige_eow": eowPresCompletions,
      "prestige_sos": sosPresCompletions,
      "lastWish": lastWishCompletions,
      "scourge": scourgeCompletions,
      "sorrows": sorrowsCompletions,
      "garden": gardenCompletions,
      "dsc": dscCompletions,
      "vog": vogCompletions,
      "vow": vowCompletions
    },
    "totalRaids": totalRaids
  }
}

function FormatTitles(clan, memberData, playerData, oldPlayerData) {
  const legacySealsNode = ManifestHandler.getManifest().DestinyPresentationNodeDefinition[1881970629];
  const legacysealsParents = legacySealsNode.children.presentationNodes.map(e => { return e.presentationNodeHash });
  const sealsNode = ManifestHandler.getManifest().DestinyPresentationNodeDefinition[616318467];
  const sealsParents = sealsNode.children.presentationNodes.map(e => { return e.presentationNodeHash });
  let seals = sealsParents.map(e => { return ManifestHandler.getManifest().DestinyPresentationNodeDefinition[e].completionRecordHash });
  let legacySeals = legacysealsParents.map(e => { return ManifestHandler.getManifest().DestinyPresentationNodeDefinition[e].completionRecordHash });
  let gildedSeals = seals.map(e => { return ManifestHandler.getManifest().DestinyRecordDefinition[e]?.titleInfo?.gildingTrackingRecordHash });
  let legacyGildedSeals = legacySeals.map(e => { return ManifestHandler.getManifest().DestinyRecordDefinition[e]?.titleInfo?.gildingTrackingRecordHash });
  let allSeals = seals.concat(legacySeals);
  let allGildedSeals = gildedSeals.concat(legacyGildedSeals.filter(e => e !== undefined));
  let allSealsCombined = allSeals.concat(allGildedSeals.filter(e => e !== undefined));

  var titles = [];
  for(var i in allSealsCombined) {
    if(playerData.profileRecords.data.records[allSealsCombined[i]]) {
      if(playerData.profileRecords.data.records[allSealsCombined[i]].objectives[0].complete) {
        titles.push(allSealsCombined[i]);
      }
    }
  }

  if(oldPlayerData) {
    if(oldPlayerData.Titles) {
      if(titles.length >= oldPlayerData.Titles.titles.length) { return titles; }
      else {
        console.log(`Tried to insert less titles than previous entered`);
        console.log(`Old Titles: ${ oldPlayerData.Titles.titles.length }`);
        console.log(`New Titles: ${ titles.length }`);
        return oldPlayerData.Titles.titles;
      }
    } else { return titles; }
  } else { return titles; }
  
}

function FormatSeasonal(clan, memberData, playerData, oldPlayerData) {
  //Season Ranks
  var characterIds = playerData.profile.data.characterIds;
  var season8Rank = "0"; try { var seasonRankBefore = playerData.characterProgressions.data[characterIds[0]].progressions["1628407317"].level; var seasonRankAfter = playerData.characterProgressions.data[characterIds[0]].progressions["3184735011"].level; season8Rank = seasonRankBefore + seasonRankAfter; } catch (err) { }
  var season9Rank = "0"; try { var seasonRankBefore = playerData.characterProgressions.data[characterIds[0]].progressions["3256821400"].level; var seasonRankAfter = playerData.characterProgressions.data[characterIds[0]].progressions["2140885848"].level; season9Rank = seasonRankBefore + seasonRankAfter; } catch (err) { }
  var season10Rank = "0"; try { var seasonRankBefore = playerData.characterProgressions.data[characterIds[0]].progressions["2926321498"].level; var seasonRankAfter = playerData.characterProgressions.data[characterIds[0]].progressions["1470619782"].level; season10Rank = seasonRankBefore + seasonRankAfter; } catch (err) { }
  var season11Rank = "0"; try { var seasonRankBefore = playerData.characterProgressions.data[characterIds[0]].progressions["1627914615"].level; var seasonRankAfter = playerData.characterProgressions.data[characterIds[0]].progressions["4021269753"].level; season11Rank = seasonRankBefore + seasonRankAfter; } catch (err) { }
  var season12Rank = "0"; try { var seasonRankBefore = playerData.characterProgressions.data[characterIds[0]].progressions["477676543"].level; var seasonRankAfter = playerData.characterProgressions.data[characterIds[0]].progressions["2304468497"].level; season12Rank = seasonRankBefore + seasonRankAfter; } catch (err) { }
  var season13Rank = "0"; try { var seasonRankBefore = playerData.characterProgressions.data[characterIds[0]].progressions["4030656982"].level; var seasonRankAfter = playerData.characterProgressions.data[characterIds[0]].progressions["2068785426"].level; season13Rank = seasonRankBefore + seasonRankAfter; } catch (err) { }
  var season14Rank = "0"; try { var seasonRankBefore = playerData.characterProgressions.data[characterIds[0]].progressions["2726092061"].level; var seasonRankAfter = playerData.characterProgressions.data[characterIds[0]].progressions["3977762715"].level; season14Rank = seasonRankBefore + seasonRankAfter; } catch (err) { }
  var season15Rank = "0"; try { var seasonRankBefore = playerData.characterProgressions.data[characterIds[0]].progressions["4095505052"].level; var seasonRankAfter = playerData.characterProgressions.data[characterIds[0]].progressions["1531004716"].level; season15Rank = seasonRankBefore + seasonRankAfter; } catch (err) { }
  var season16Rank = "0"; try { var seasonRankBefore = playerData.characterProgressions.data[characterIds[0]].progressions["2069932355"].level; var seasonRankAfter = playerData.characterProgressions.data[characterIds[0]].progressions["1787069365"].level; season16Rank = seasonRankBefore + seasonRankAfter; } catch (err) { }
  var season17Rank = "0"; try { var seasonRankBefore = playerData.characterProgressions.data[characterIds[0]].progressions["26079066"].level; var seasonRankAfter = playerData.characterProgressions.data[characterIds[0]].progressions["482365574"].level; season17Rank = seasonRankBefore + seasonRankAfter; } catch (err) { }
  var dailyXP = "0"; try { dailyXP = playerData.characterProgressions.data[characterIds[0]].progressions["1183600353"].dailyProgress; } catch (err) { }
  var weeklyXP = "0"; try { weeklyXP = playerData.characterProgressions.data[characterIds[0]].progressions["1183600353"].weeklyProgress; } catch (err) { }
  var overallXP = "0"; try { overallXP = playerData.characterProgressions.data[characterIds[0]].progressions["1183600353"].currentProgress; } catch (err) { }
  var powerBonus = "0"; try { powerBonus = playerData.profileRecords.data.records["3639193500"].intervalObjectives[2].progress; } catch (err) { }

  return {
    "seasonRank": season17Rank,
    "xp": { "dailyXP": dailyXP, "weeklyXP": weeklyXP, "overallXP": overallXP },
    "powerBonus": powerBonus,
  }
}

function FormatTriumphs(clan, memberData, playerData, oldPlayerData) {
  var characterIds = playerData.profile.data.characterIds;
  var grandmasters = {
    // theHollowedLair: playerData.profileRecords.data.records[1839177494]?.objectives[0]?.progress,
    // lakeOfShadows: playerData.profileRecords.data.records[2542468646]?.objectives[0]?.progress,
    // exodusCrash: playerData.profileRecords.data.records[2916711327]?.objectives[0]?.progress,
    // theCorruped: playerData.profileRecords.data.records[406948259]?.objectives[0]?.progress,
    // theDevilsLair: playerData.profileRecords.data.records[3663146391]?.objectives[0]?.progress,
    // provingGrounds: playerData.profileRecords.data.records[2483704578]?.objectives[0]?.progress,
    theArmsDealer: playerData.profileRecords.data.records[3176422761]?.objectives[0]?.progress,
    scarletKeep: playerData.profileRecords.data.records[1081080653]?.objectives[0]?.progress,
    theGlassway: playerData.profileRecords.data.records[2520907454]?.objectives[0]?.progress,
    fallenSABER: playerData.profileRecords.data.records[371577627]?.objectives[0]?.progress,
    theLightblade: playerData.profileRecords.data.records[2742680542]?.objectives[0]?.progress,
    birthplaceOfTheVile: playerData.profileRecords.data.records[3604959241]?.objectives[0]?.progress,
  }

  //Update Check triumphs and the user model as well.
  var challenges = {
    s13: false,
    s14: false,
    s15: false,
  };
  var triumphs = {
    cabals: false,
  }

  //Set challenge completion values
  try { challenges.s13 = playerData.characterRecords.data[characterIds[0]].records[1417828034].objectives[0].complete; } catch (err) { }
  try { challenges.s14 = playerData.characterRecords.data[characterIds[0]].records[3289944359].objectives[0].complete; } catch (err) { }
  try { challenges.s15 = playerData.characterRecords.data[characterIds[0]].records[3571655900].objectives[0].complete; } catch (err) { }

  //Set triumph completion values

  return {
    challenges,
    triumphs,
    grandmasters
  }
}

function FormatOthers(clan, memberData, playerData, oldPlayerData) {
  var characterIds = playerData.profile.data.characterIds;
  var menageire = 0; try { menageire = playerData.profileRecords.data.records["1363982253"].objectives[0].progress; } catch (err) { }
  var runes = 0; try { runes = playerData.profileRecords.data.records["2422246600"].objectives[0].progress; } catch (err) { }
  var score = 0; try { score = playerData.profileRecords.data.score; } catch (err) { }
  var activeScore = 0; try { activeScore = playerData.profileRecords.data.activeScore; } catch (err) { }
  var legacyScore = 0; try { legacyScore = playerData.profileRecords.data.legacyScore; } catch (err) { }
  var lifetimeScore = 0; try { lifetimeScore = playerData.profileRecords.data.lifetimeScore; } catch (err) { }
  var wellsCompleted = 0; try { wellsCompleted = playerData.profileRecords.data.records["819775261"].objectives[0].progress; } catch (err) { }
  var epsCompleted = 0; try { epsCompleted = playerData.profileRecords.data.records["3350489579"].objectives[0].progress; } catch (err) { }
  var presageNormal = 0; try { presageNormal = playerData.profileRecords.data.records["1622888137"].objectives[0].progress; } catch (err) { }
  var presageMaster = 0; try { presageMaster = playerData.profileRecords.data.records["2396534184"].objectives[0].progress; } catch (err) { }
  var theDarkPriestess = 0; try { theDarkPriestess = playerData.profileRecords.data.records["575251332"].objectives[0].progress; } catch (err) { }
  var theWarrior = 0; try { theWarrior = playerData.profileRecords.data.records["869599000"].objectives[0].progress; } catch (err) { }
  var theTechnocrat = 0; try { theTechnocrat = playerData.profileRecords.data.records["1345853611"].objectives[0].progress; } catch (err) { }
  var masterHunts = 0; try { masterHunts = playerData.profileRecords.data.records["1363459558"].objectives[0].progress; } catch (err) { }
  var dawning2020 = 0; try { dawning2020 = playerData.characterRecords.data[characterIds[0]].records["3692735918"].intervalObjectives[3].progress; } catch (err) { }

  //Shattered Throne
  var st_completions = 0; try { st_completions = playerData.metrics.data.metrics["1339818929"].objectiveProgress.progress; } catch (err) { }
  var st_flawless_completions = 0; try { st_flawless_completions = playerData.metrics.data.metrics["761318885"].objectiveProgress.progress; } catch (err) { }

  //Pit Of Heresy
  var pit_completions = 0; try { pit_completions = playerData.metrics.data.metrics["1451729471"].objectiveProgress.progress; } catch (err) { }
  var pit_flawless_completions = 0; try { pit_flawless_completions = playerData.metrics.data.metrics["310888283"].objectiveProgress.progress; } catch (err) { }

  //Prophecy
  var prophecy_completions = 0; try { prophecy_completions = playerData.metrics.data.metrics["352659556"].objectiveProgress.progress; } catch (err) { }
  var prophecy_flawless_completions = 0; try { prophecy_flawless_completions = playerData.metrics.data.metrics["1099614108"].objectiveProgress.progress; } catch (err) { }
  
  //Grasp of Avarice
  var grasp_completions = 0; try { grasp_completions = playerData.metrics.data.metrics["451157118"].objectiveProgress.progress; } catch (err) { }
  var grasp_flawless_completions = 0; try { grasp_flawless_completions = playerData.metrics.data.metrics["2269915270"].objectiveProgress.progress; } catch (err) { }

  //Duality
  var duality_completions = 0; try { duality_completions = playerData.metrics.data.metrics["3862075762"].objectiveProgress.progress; } catch (err) { }
  var duality_flawless_completions = 0; try { duality_flawless_completions = playerData.metrics.data.metrics["1034442994"].objectiveProgress.progress; } catch (err) { }

  //Containments
  var containment_tiers_completed = 0; try { containment_tiers_completed = playerData.metrics.data.metrics["1864866268"].objectiveProgress.progress; } catch (err) { }
  var containment_bosses_killed = 0; try { containment_bosses_killed = playerData.metrics.data.metrics["3151143989"].objectiveProgress.progress; } catch (err) { }

  return {
    "menageire": menageire,
    "runes": runes,
    "triumphScore": {
      "score": score,
      "activeScore": activeScore,
      "legacyScore": legacyScore,
      "lifetimeScore": lifetimeScore
    },
    "wellsRankings": wellsCompleted,
    "epRankings": epsCompleted,
    "dungeons": {
      "shatteredThrone": { "completions": st_completions, "flawless": st_flawless_completions },
      "pitOfHeresy": { "completions": pit_completions, "flawless": pit_flawless_completions },
      "prophecy": { "completions": prophecy_completions, "flawless": prophecy_flawless_completions },
      "grasp": { "completions": grasp_completions, "flawless": grasp_flawless_completions },
      "duality": { "completions": duality_completions, "flawless": duality_flawless_completions }
    },
    "containments": {
      "tiers": containment_tiers_completed,
      "bosses": containment_bosses_killed
    },
    "presage": {
      "normal": presageNormal,
      "master": presageMaster
    },
    "empireHunts": {
      theDarkPriestess,
      theWarrior,
      theTechnocrat,
      masterHunts,
      "total": (theDarkPriestess+theWarrior+theTechnocrat)
    },
    dawning2020
  }
}

//Exports
module.exports = { UpdateClan };