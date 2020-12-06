const fetch = require('node-fetch');
const Config = require('../configs/Config.json');
const Misc = require('../misc');
const expressHost = Config.isLocal ? Config.localIP : Config.liveIP;
const http = require('http');
const https = require('https');

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });
const agent = (_parsedURL) => _parsedURL.protocol == 'http:' ? httpAgent : httpsAgent;

//Bungie requests
async function BungieReq(path) {
  return await fetch(`https://www.bungie.net${ path }`, { headers: { "X-API-Key": Config.apiKey, "Content-Type": "application/json" }, agent }).then(async (request) => {
    try {
      const response = await request.text();
      if(Misc.IsJSON(response)) {
        const res = JSON.parse(response);
        if(request.ok && res.ErrorCode && res.ErrorCode !== 1) { return { "isError": true, "Data": res } }
        else if(request.ok) { return { "isError": false, "Data": res } }
        else { return { "isError": true, "Data": res } }
      }
      else { return { "isError": true, "Data": "Did not recieve json" } }
    }
    catch (err) { return { "isError": true, "Data": err } }
  }).catch((err) => { return { "isError": true, "Data": err } });
}
async function NormalReq(path) {
  return await fetch(`${ path }`, { agent }).then(async (request) => {
    try {
      const response = await request.text();
      if(Misc.IsJSON(response)) {
        const res = JSON.parse(response);
        if(request.ok && res.ErrorCode && res.ErrorCode !== 1) { return { "isError": true, "Data": res } }
        else if(request.ok) { return { "isError": false, "Data": res } }
        else { return { "isError": true, "Data": res } }
      }
      else { return { "isError": true, "Data": "Did not recieve json" } }
    }
    catch (err) { return { "isError": true, "Data": err } }
  }).catch((err) => { return { "isError": true, "Data": err } });
}

const GetProfile = async (member, components, callback) => {
  const { isError, Data } = await BungieReq(`/Platform/Destiny2/${member.destinyUserInfo.membershipType}/Profile/${member.destinyUserInfo.membershipId}/?components=${components}`);
  callback(member, isError, Data);
}
const GetActivityHistory = async (membershipType, membershipId, characterId, count, mode, page = 0) => BungieReq(`/Platform/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/Activities/?count=${count}&mode=${mode}&page=${page}`);
const GetHistoricStatsForAccount = async (membershipType, membershipId) => BungieReq(`/Platform/Destiny2/${membershipType}/Account/${membershipId}/Stats/?groups=101`);
const GetPGCR = async (instanceId) => BungieReq(`/Platform/Destiny2/Stats/PostGameCarnageReport/${instanceId}/`);
const GetManifest = async (url) => BungieReq(url);
const SearchUsers = async (username) => BungieReq(`/Platform/User/SearchUsers/?q=${username}`);
const GetMembershipsForCurrentUser = async () => BungieReq(`/Platform/User/GetMembershipsForCurrentUser/`);
const GetTWABs = async () => BungieReq(`/Platform/Trending/Categories/`);
const GetClanFromMbmID = async (membershipType, membershipId, callback) => { const { isError, Data } = await BungieReq(`/Platform/GroupV2/User/${membershipType}/${membershipId}/0/1/`); callback(isError, Data); };
const GetClan = async (clan, callback) => { const { isError, Data } = await BungieReq(`/Platform/GroupV2/${clan.clanID}`); callback(clan, isError, Data); };
const GetClanMembers = async (clan, callback) => { const { isError, Data } = await BungieReq(`/Platform/GroupV2/${clan.clanID}/Members`); callback(clan, isError, Data); };
const GetSettings = async (callback) => { const { isError, Data } = await BungieReq(`/Platform/Settings`); callback(isError, Data); }
const GetManifestVersion = async (callback) => { const { isError, Data } = await BungieReq(`/Platform/Destiny2/Manifest/`); callback(isError, Data); }
const GetClanWars = async (callback) => { const { isError, Data } = await NormalReq(`http://${ expressHost }:3000/GetClanLeaderboards`); callback(isError, Data); }
const GetGlobalTimePlayedLeaderboard = async (callback) => { const { isError, Data } = await NormalReq(`http://${ expressHost }:3000/GetGlobalTimePlayedLeaderboard`); callback(isError, Data); }
const GetGlobalSeasonRankLeaderboard = async (callback) => { const { isError, Data } = await NormalReq(`http://${ expressHost }:3000/GetGlobalSeasonRankLeaderboard`); callback(isError, Data); }
const GetGlobalTriumphScoreLeaderboard = async (callback) => { const { isError, Data } = await NormalReq(`http://${ expressHost }:3000/GetGlobalTriumphScoreLeaderboard`); callback(isError, Data); }
const GetGlobalValorLeaderboard = async (callback) => { const { isError, Data } = await NormalReq(`http://${ expressHost }:3000/GetGlobalValorLeaderboard`); callback(isError, Data); }
const GetGlobalInfamyLeaderboard = async (callback) => { const { isError, Data } = await NormalReq(`http://${ expressHost }:3000/GetGlobalInfamyLeaderboard`); callback(isError, Data); }
const GetGlobalLeviLeaderboard = async (callback) => { const { isError, Data } = await NormalReq(`http://${ expressHost }:3000/GetGlobalLeviLeaderboard`); callback(isError, Data); }
const GetGlobalEoWLeaderboard = async (callback) => { const { isError, Data } = await NormalReq(`http://${ expressHost }:3000/GetGlobalEoWLeaderboard`); callback(isError, Data); }
const GetGlobalSoSLeaderboard = async (callback) => { const { isError, Data } = await NormalReq(`http://${ expressHost }:3000/GetGlobalSoSLeaderboard`); callback(isError, Data); }
const GetGlobalLeviPrestigeLeaderboard = async (callback) => { const { isError, Data } = await NormalReq(`http://${ expressHost }:3000/GetGlobalLeviPrestigeLeaderboard`); callback(isError, Data); }
const GetGlobalEoWPrestigeLeaderboard = async (callback) => { const { isError, Data } = await NormalReq(`http://${ expressHost }:3000/GetGlobalEoWPrestigeLeaderboard`); callback(isError, Data); }
const GetGlobalSoSPrestigeLeaderboard = async (callback) => { const { isError, Data } = await NormalReq(`http://${ expressHost }:3000/GetGlobalSoSPrestigeLeaderboard`); callback(isError, Data); }
const GetGlobalLastWishLeaderboard = async (callback) => { const { isError, Data } = await NormalReq(`http://${ expressHost }:3000/GetGlobalLastWishLeaderboard`); callback(isError, Data); }
const GetGlobalScourgeLeaderboard = async (callback) => { const { isError, Data } = await NormalReq(`http://${ expressHost }:3000/GetGlobalScourgeLeaderboard`); callback(isError, Data); }
const GetGlobalSorrowsLeaderboard = async (callback) => { const { isError, Data } = await NormalReq(`http://${ expressHost }:3000/GetGlobalSorrowsLeaderboard`); callback(isError, Data); }
const GetGlobalGardenLeaderboard = async (callback) => { const { isError, Data } = await NormalReq(`http://${ expressHost }:3000/GetGlobalGardenLeaderboard`); callback(isError, Data); }
const GetGlobalDSCLeaderboard = async (callback) => { const { isError, Data } = await NormalReq(`http://${ expressHost }:3000/GetGlobalDSCLeaderboard`); callback(isError, Data); }
const GetGlobalTotalRaidsLeaderboard = async (callback) => { const { isError, Data } = await NormalReq(`http://${ expressHost }:3000/GetGlobalTotalRaidsLeaderboard`); callback(isError, Data); }
const GetGlobalHighestPowerLeaderboard = async (callback) => { const { isError, Data } = await NormalReq(`http://${ expressHost }:3000/GetGlobalHighestPowerLeaderboard`); callback(isError, Data); }
const GetGlobalHighestPowerMinusArtifactLeaderboard = async (callback) => { const { isError, Data } = await NormalReq(`http://${ expressHost }:3000/GetGlobalHighestPowerMinusArtifactLeaderboard`); callback(isError, Data); }
const GetMembershipsById = async (membershipId, callback) => { const { isError, Data } = await BungieReq(`/Platform/User/GetMembershipsById/${membershipId}/1/`); callback(isError, Data); }
const SearchDestinyPlayer = async (username, callback) => { const { isError, Data } = await BungieReq(`/Platform/Destiny2/SearchDestinyPlayer/-1/${username}/`); callback(isError, Data); }
const GetGunsmithMods = async (callback) => { const { isError, Data } = await NormalReq(`https://b.vlsp.network/vendor/?hash=672118013`); callback(isError, Data); }

module.exports = {
  GetProfile, GetActivityHistory, GetHistoricStatsForAccount, GetPGCR, GetManifestVersion, GetManifest, SearchUsers, GetMembershipsForCurrentUser,
  GetTWABs, GetClanFromMbmID, GetClan, GetClanMembers, GetSettings, GetClanWars, GetMembershipsById, SearchDestinyPlayer,
  GetGlobalTimePlayedLeaderboard, GetGlobalSeasonRankLeaderboard, GetGlobalTriumphScoreLeaderboard, GetGlobalValorLeaderboard, GetGlobalInfamyLeaderboard, GetGlobalLeviLeaderboard,
  GetGlobalEoWLeaderboard, GetGlobalSoSLeaderboard, GetGlobalLeviPrestigeLeaderboard, GetGlobalEoWPrestigeLeaderboard, GetGlobalSoSPrestigeLeaderboard,
  GetGlobalLastWishLeaderboard, GetGlobalScourgeLeaderboard, GetGlobalSorrowsLeaderboard, GetGlobalGardenLeaderboard, GetGlobalDSCLeaderboard, GetGlobalTotalRaidsLeaderboard, GetGlobalHighestPowerLeaderboard,
  GetGlobalHighestPowerMinusArtifactLeaderboard, GetGunsmithMods
}