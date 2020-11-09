module.exports = {
  GetDateString, GetReadableDateTime, GetReadableDate, formatTime, IsJSON, GetClassName, AddCommas,
  cleanString, addOrdinal, GetItemState, capitalize
};

function AddCommas(x) { try { return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") } catch (err) { return x } }
function IsJSON(str) { try { JSON.parse(str); } catch (e) { return false; } return true; }
function GetClassName(classType) {
  if(classType === 0) { return "Titan" }
  else if(classType === 1) { return "Hunter" }
  else if(classType === 2) { return "Warlock" }
}

function GetDateString() {
  var d = new Date();
  var day = d.getDate();
  var month = d.getMonth() + 1;
  var year = d.getFullYear();
  var hour = d.getHours();
  var minute = d.getMinutes();
  var seconds = d.getSeconds();
  if(day.toString().length == 1){ day = '0' + day }
  if(month.toString().length == 1){ month = '0' + month }
  if(hour.toString().length == 1){ hour = '0' + hour }
  if(minute.toString().length == 1){ minute = '0' + minute }
  if(seconds.toString().length == 1){ seconds = '0' + seconds }
  var dateString = year + "-" + month + "-" + day + "_" + hour + "-" + minute + "-" + seconds;
  return dateString;
}
function GetReadableDateTime() {
  var d = new Date();
  var day = d.getDate();
  var month = d.getMonth() + 1;
  var year = d.getFullYear();
  var hour = d.getHours();
  var minute = d.getMinutes();
  var seconds = d.getSeconds();
  if(day.toString().length == 1){ day = '0' + day }
  if(month.toString().length == 1){ month = '0' + month }
  if(hour.toString().length == 1){ hour = '0' + hour }
  if(minute.toString().length == 1){ minute = '0' + minute }
  if(seconds.toString().length == 1){ seconds = '0' + seconds }
  var dateString = day + "-" + month + "-" + year + " " + hour + ":" + minute + ":" + seconds;
  return dateString;
}
function GetReadableDate() {
  var d = new Date();
  var day = d.getDate();
  var month = d.getMonth() + 1;
  var year = d.getFullYear();
  var hour = d.getHours();
  var minute = d.getMinutes();
  var seconds = d.getSeconds();
  if(day.toString().length == 1){ day = '0' + day }
  if(month.toString().length == 1){ month = '0' + month }
  if(hour.toString().length == 1){ hour = '0' + hour }
  if(minute.toString().length == 1){ minute = '0' + minute }
  if(seconds.toString().length == 1){ seconds = '0' + seconds }
  var dateString = day + "-" + month + "-" + year;
  return dateString;
}
function formatTime(type, TimeinSeconds) {
  var seconds  = Math.floor(Number(TimeinSeconds));
  var years    = Math.floor(seconds / (24*60*60*7*4.34*12));
  var seconds  = seconds - Math.floor(years   * (24*60*60*7*4.34*12));
  var months   = Math.floor(seconds / (24*60*60*7*4.34));
  var seconds  = seconds - Math.floor(months  * (24*60*60*7*4.34));
  var weeks    = Math.floor(seconds / (24*60*60*7));
  var seconds  = seconds - Math.floor(weeks   * (24*60*60*7));
  var days     = Math.floor(seconds / (24*60*60));
  var seconds  = seconds - Math.floor(days    * (24*60*60));
  var hours    = Math.floor(seconds / (60*60));
  var seconds  = seconds - Math.floor(hours   * (60*60));
  var minutes  = Math.floor(seconds / (60));
  var seconds  = seconds - Math.floor(minutes * (60));

  var YDisplay = years > 0 ? years + (years == 1 ? (type === "big" ? ' year ' : 'Y ') : (type === "big" ? ' years ' : 'Y ')) : '';
  var MDisplay = months > 0 ? months + (months == 1 ? (type === "big" ? ' month ' : 'M ') : (type === "big" ? ' months ' : 'M ')) : '';
  var wDisplay = weeks > 0 ? weeks + (weeks == 1 ? (type === "big" ? ' week ' : 'w ') : (type === "big" ? ' weeks ' : 'w ')) : '';
  var dDisplay = days > 0 ? days + (days == 1 ? (type === "big" ? ' day ' : 'd ') : (type === "big" ? ' days ' : 'd ')) : '';
  var hDisplay = hours > 0 ? hours + (hours == 1 ? (type === "big" ? ' hour ' : 'h ') : (type === "big" ? ' hours ' : 'h ')) : '';
  var mDisplay = minutes > 0 ? minutes + (minutes == 1 ? (type === "big" ? ' minute ' : 'm ') : (type === "big" ? ' minutes ' : 'm ')) : '';
  var sDisplay = seconds > 0 ? seconds + (seconds == 1 ? (type === "big" ? ' second ' : 's ') : (type === "big" ? ' seconds ' : 's ')) : '';

  if (TimeinSeconds < 60) { return sDisplay; }
  if (TimeinSeconds >= 60 && TimeinSeconds < 3600) { return mDisplay + sDisplay; }
  if (TimeinSeconds >= 3600 && TimeinSeconds < 86400) { return hDisplay + mDisplay; }
  if (TimeinSeconds >= 86400 && TimeinSeconds < 604800) { return dDisplay + hDisplay; }
  if (TimeinSeconds >= 604800 && TimeinSeconds < 2624832) { return wDisplay + dDisplay; }
  if (TimeinSeconds >= 2624832 && TimeinSeconds !== Infinity) { return MDisplay + wDisplay + dDisplay; }
  return YDisplay + MDisplay + wDisplay + dDisplay + hDisplay + mDisplay + sDisplay;
}
function cleanString(input) {
  var output = "";
  for(var i=0; i<input.length; i++) { if (input.charCodeAt(i) <= 127) { output += input.charAt(i); } }
  return output;
}
function addOrdinal(value) {
  var s = ["th", "st", "nd", "rd"], v = value % 100;
  return value + (s[(v - 20) % 10] || s[v] || s[0]);
}
const flagEnum = (state, value) => !!(state & value);
function GetItemState(state) {
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
function capitalize(string) { return string.charAt(0).toUpperCase() + string.slice(1); }

