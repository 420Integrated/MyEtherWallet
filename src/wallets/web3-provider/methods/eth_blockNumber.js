import { toPayload } from '../jsonrpc';
import FourtwentyCalls from '../web3Calls';
const WAIT_TIME = 10 * 1000; //10 seconds
const memcache = { timestamp: 0, blockNumber: 0 };
export default async ({ payload, requestManager }, res, next) => {
  if (payload.method !== 'fourtwenty_blockNumber') return next();
  const fourtwentyCalls = new FourtwentyCalls(requestManager);
  if (memcache.timestamp < new Date().getTime() - WAIT_TIME) {
    try {
      const blockNumber = await fourtwentyCalls.getBlockNumber();
      memcache.blockNumber = blockNumber;
      memcache.timestamp = new Date().getTime();
      res(null, toPayload(payload.id, blockNumber));
    } catch (e) {
      res(null, toPayload(payload.id, null));
    }
  } else {
    res(null, toPayload(payload.id, memcache.blockNumber || null));
  }
};
