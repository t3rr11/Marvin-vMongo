const fetch = require('node-fetch');
const Config = require('../../Configs/Config.json');

//Bungie requests
async function BungieReq(path) {
  const request = await fetch(`https://www.bungie.net${ path }`,{ headers: { "X-API-Key": Config.apiKey, "Content-Type": "application/json" } });
  const response = await request.json();
  if(request.ok && response.ErrorCode && response.ErrorCode !== 1) { return { "isError": true, "Data": response } }
  else if(request.ok) { return { "isError": false, "Data": response } }
  else { return { "isError": true, "Data": response } }
}

const GetProfile = async (membershipType, membershipId, components) => BungieReq(`/Platform/Destiny2/${membershipType}/Profile/${membershipId}/?components=${components}`);
const GetActivityHistory = async (membershipType, membershipId, characterId, count, mode, page = 0) => BungieReq(`/Platform/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/Activities/?count=${count}&mode=${mode}&page=${page}`);
const GetHistoricStatsForAccount = async (membershipType, membershipId) => BungieReq(`/Platform/Destiny2/${membershipType}/Account/${membershipId}/Stats/?groups=101`);
const GetPGCR = async (instanceId) => BungieReq(`/Platform/Destiny2/Stats/PostGameCarnageReport/${instanceId}/`);
const GetManifestVersion = async () => BungieReq(`/Platform/Destiny2/Manifest/`);
const GetManifest = async (url) => BungieReq(url);
const SearchUsers = async (username) => BungieReq(`/Platform/User/SearchUsers/?q=${username}`);
const SearchDestinyPlayer = async (username) => BungieReq(`/Platform/Destiny2/SearchDestinyPlayer/-1/${username}/`);
const GetMembershipId = async (platformName) => BungieReq(`/Platform/Destiny2/SearchDestinyPlayer/-1/${platformName}/`);
const GetMembershipsForCurrentUser = async () => BungieReq(`/Platform/User/GetMembershipsForCurrentUser/`);
const GetMembershipsById = async (membershipId) => BungieReq(`/Platform/User/GetMembershipsById/${membershipId}/1/`);
const GetTWABs = async () => BungieReq(`/Platform/Trending/Categories/`);
const GetClanFromMbmID = async (membershipType, membershipId) => BungieReq(`/Platform/GroupV2/User/${membershipType}/${membershipId}/0/1/`);
const GetClan = async (clan, callback) => {
  const { isError, Data } = await BungieReq(`/Platform/GroupV2/${clan.clanID}`);
  callback(clan, isError, Data);
};
const GetClanMembers = async (clan, callback) => {
  const { isError, Data } = await BungieReq(`/Platform/GroupV2/${clan.clanID}/Members`);
  callback(clan, isError, Data);
};

module.exports = {
  GetProfile, GetActivityHistory, GetHistoricStatsForAccount, GetPGCR, GetManifestVersion, GetManifest, SearchUsers, SearchDestinyPlayer, GetMembershipId,
  GetMembershipsById, GetMembershipsForCurrentUser, GetTWABs, GetClanFromMbmID, GetClan, GetClanMembers
}