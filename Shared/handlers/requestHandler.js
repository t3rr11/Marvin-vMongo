const fetch = require('node-fetch');
const Config = require('../configs/Config.json');

//Bungie requests
async function BungieReq(path) {
  const request = await fetch(`https://www.bungie.net${ path }`,{ headers: { "X-API-Key": Config.apiKey, "Content-Type": "application/json" } });
  const response = await request.text();
  try {
    const res = JSON.parse(response);
    if(request.ok && res.ErrorCode && res.ErrorCode !== 1) { return { "isError": true, "Data": res } }
    else if(request.ok) { return { "isError": false, "Data": res } }
    else { return { "isError": true, "Data": res } }
  }
  catch (err) { return { "isError": true, "Data": err } }
}
async function NormalReq(path) {
  return await fetch(`${ path }`).then(async (request) => {
    try {
      const response = await request.text();
      const res = JSON.parse(response);
      if(request.ok && res.ErrorCode && res.ErrorCode !== 1) { return { "isError": true, "Data": res } }
      else if(request.ok) { return { "isError": false, "Data": res } }
      else { return { "isError": true, "Data": res } }
    }
    catch (err) { return { "isError": true, "Data": err } }
  }).catch((err) => { return { "isError": true, "Data": err } });
}

const GetActivityHistory = async (membershipType, membershipId, characterId, count, mode, page = 0) => BungieReq(`/Platform/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/Activities/?count=${count}&mode=${mode}&page=${page}`);
const GetHistoricStatsForAccount = async (membershipType, membershipId) => BungieReq(`/Platform/Destiny2/${membershipType}/Account/${membershipId}/Stats/?groups=101`);
const GetPGCR = async (instanceId) => BungieReq(`/Platform/Destiny2/Stats/PostGameCarnageReport/${instanceId}/`);
const GetManifest = async (url) => BungieReq(url);
const SearchUsers = async (username) => BungieReq(`/Platform/User/SearchUsers/?q=${username}`);
const SearchDestinyPlayer = async (username) => BungieReq(`/Platform/Destiny2/SearchDestinyPlayer/-1/${username}/`);
const GetMembershipId = async (platformName) => BungieReq(`/Platform/Destiny2/SearchDestinyPlayer/-1/${platformName}/`);
const GetMembershipsForCurrentUser = async () => BungieReq(`/Platform/User/GetMembershipsForCurrentUser/`);
const GetMembershipsById = async (membershipId) => BungieReq(`/Platform/User/GetMembershipsById/${membershipId}/1/`);
const GetTWABs = async () => BungieReq(`/Platform/Trending/Categories/`);
const GetClanFromMbmID = async (membershipType, membershipId) => BungieReq(`/Platform/GroupV2/User/${membershipType}/${membershipId}/0/1/`);
const GetProfile = async (member, components, callback) => {
  const { isError, Data } = await BungieReq(`/Platform/Destiny2/${member.destinyUserInfo.membershipType}/Profile/${member.destinyUserInfo.membershipId}/?components=${components}`);
  callback(member, isError, Data);
}
const GetClan = async (clan, callback) => { const { isError, Data } = await BungieReq(`/Platform/GroupV2/${clan.clanID}`); callback(clan, isError, Data); };
const GetClanMembers = async (clan, callback) => { const { isError, Data } = await BungieReq(`/Platform/GroupV2/${clan.clanID}/Members`); callback(clan, isError, Data); };
const GetSettings = async (callback) => { const { isError, Data } = await BungieReq(`/Platform/Settings`); callback(isError, Data); }
const GetManifestVersion = async (callback) => { const { isError, Data } = await BungieReq(`/Platform/Destiny2/Manifest/`); callback(isError, Data); }
const GetClanWars = async (callback) => { const { isError, Data } = await NormalReq(`http://localhost:3000/GetClanLeaderboards`); callback(isError, Data); }
const GetGlobalTimePlayedLeadboard = async (callback) => { const { isError, Data } = await NormalReq(`http://localhost:3000/GetGlobalTimePlayedLeadboard`); callback(isError, Data); }
const GetGlobalSeasonRankLeadboard = async (callback) => { const { isError, Data } = await NormalReq(`http://localhost:3000/GetGlobalSeasonRankLeadboard`); callback(isError, Data); }
const GetGlobalTriumphScoreLeadboard = async (callback) => { const { isError, Data } = await NormalReq(`http://localhost:3000/GetGlobalTriumphScoreLeadboard`); callback(isError, Data); }
const GetGlobalValorLeadboard = async (callback) => { const { isError, Data } = await NormalReq(`http://localhost:3000/GetGlobalValorLeadboard`); callback(isError, Data); }
const GetGlobalInfamyLeadboard = async (callback) => { const { isError, Data } = await NormalReq(`http://localhost:3000/GetGlobalInfamyLeadboard`); callback(isError, Data); }
const GetGlobalLeviLeadboard = async (callback) => { const { isError, Data } = await NormalReq(`http://localhost:3000/GetGlobalLeviLeadboard`); callback(isError, Data); }
const GetGlobalEoWLeadboard = async (callback) => { const { isError, Data } = await NormalReq(`http://localhost:3000/GetGlobalEoWLeadboard`); callback(isError, Data); }
const GetGlobalSoSLeadboard = async (callback) => { const { isError, Data } = await NormalReq(`http://localhost:3000/GetGlobalSoSLeadboard`); callback(isError, Data); }
const GetGlobalLeviPrestigeLeadboard = async (callback) => { const { isError, Data } = await NormalReq(`http://localhost:3000/GetGlobalLeviPrestigeLeadboard`); callback(isError, Data); }
const GetGlobalEoWPrestigeLeadboard = async (callback) => { const { isError, Data } = await NormalReq(`http://localhost:3000/GetGlobalEoWPrestigeLeadboard`); callback(isError, Data); }
const GetGlobalSoSPrestigeLeadboard = async (callback) => { const { isError, Data } = await NormalReq(`http://localhost:3000/GetGlobalSoSPrestigeLeadboard`); callback(isError, Data); }
const GetGlobalLastWishLeadboard = async (callback) => { const { isError, Data } = await NormalReq(`http://localhost:3000/GetGlobalLastWishLeadboard`); callback(isError, Data); }
const GetGlobalScourgeLeadboard = async (callback) => { const { isError, Data } = await NormalReq(`http://localhost:3000/GetGlobalScourgeLeadboard`); callback(isError, Data); }
const GetGlobalSorrowsLeadboard = async (callback) => { const { isError, Data } = await NormalReq(`http://localhost:3000/GetGlobalSorrowsLeadboard`); callback(isError, Data); }
const GetGlobalGardenLeadboard = async (callback) => { const { isError, Data } = await NormalReq(`http://localhost:3000/GetGlobalGardenLeadboard`); callback(isError, Data); }
const GetGlobalTotalRaidsLeadboard = async (callback) => { const { isError, Data } = await NormalReq(`http://localhost:3000/GetGlobalTotalRaidsLeadboard`); callback(isError, Data); }
const GetGlobalHighestPowerLeadboard = async (callback) => { const { isError, Data } = await NormalReq(`http://localhost:3000/GetGlobalHighestPowerLeadboard`); callback(isError, Data); }

module.exports = {
  GetProfile, GetActivityHistory, GetHistoricStatsForAccount, GetPGCR, GetManifestVersion, GetManifest, SearchUsers, SearchDestinyPlayer, GetMembershipId,
  GetMembershipsById, GetMembershipsForCurrentUser, GetTWABs, GetClanFromMbmID, GetClan, GetClanMembers, GetSettings, GetClanWars,
  GetGlobalTimePlayedLeadboard, GetGlobalSeasonRankLeadboard, GetGlobalTriumphScoreLeadboard, GetGlobalValorLeadboard, GetGlobalInfamyLeadboard, GetGlobalLeviLeadboard,
  GetGlobalEoWLeadboard, GetGlobalSoSLeadboard, GetGlobalLeviPrestigeLeadboard, GetGlobalEoWPrestigeLeadboard, GetGlobalSoSPrestigeLeadboard,
  GetGlobalLastWishLeadboard, GetGlobalScourgeLeadboard, GetGlobalSorrowsLeadboard, GetGlobalGardenLeadboard, GetGlobalTotalRaidsLeadboard, GetGlobalHighestPowerLeadboard

}