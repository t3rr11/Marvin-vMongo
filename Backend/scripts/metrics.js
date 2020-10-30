const io = require('@pm2/io')

const APISTATUS = io.metric({ name: 'APIDisabled' });
const INDEX = io.metric({ name: 'Index' });
const RT_INDEX = io.metric({ name: 'Index (RT)' });
const CLANS = io.metric({ name: 'Clans' });
const RT_CLANS = io.metric({ name: 'Clans (RT)' });
const PROCESSING = io.metric({ name: 'Processing' });
const RT_PROCESSING = io.metric({ name: 'Processing (RT)' });

function setMetrics(APIStatus, index, rt_index, clans, rt_clans, processing, rt_processing) {
  APISTATUS.set(APIStatus);
  INDEX.set(index);
  RT_INDEX.set(rt_index);
  CLANS.set(clans);
  RT_CLANS.set(rt_clans);
  PROCESSING.set(processing);
  RT_PROCESSING.set(rt_processing);
}

module.exports = { setMetrics };