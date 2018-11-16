import Web3WSProvider from 'web3-providers-ws';
import { Manager as Web3RequestManager } from 'web3-core-requestmanager';
import MiddleWare from '../middleware';
import {
  ethSendTransaction,
  ethSignTransaction,
  ethSign,
  ethAccounts,
  ethCoinbase,
  ethGetTransactionCount,
  netVersion
} from '../methods';
class WSProvider {
  constructor(host, options, store, eventHub) {
    this.wsProvider = new Web3WSProvider(host, options);
    delete this.wsProvider['send'];
    this.wsProvider.send = (payload, callback) => {
      const _this = this.wsProvider;
      if (_this.connection.readyState === _this.connection.CONNECTING) {
        setTimeout(function() {
          this.wsProvider.send(payload, callback);
        }, 10);
        return;
      }
      if (_this.connection.readyState !== _this.connection.OPEN) {
        if (typeof _this.connection.onerror === 'function') {
          _this.connection.onerror(new Error('connection not open'));
        }
        callback(new Error('connection not open'));
        return;
      }
      const req = {
        payload,
        store,
        requestManager: new Web3RequestManager(
          new Web3WSProvider(host, options)
        ),
        eventHub
      };
      const middleware = new MiddleWare();
      middleware.use(ethSendTransaction);
      middleware.use(ethSignTransaction);
      middleware.use(ethSign);
      middleware.use(ethAccounts);
      middleware.use(ethGetTransactionCount);
      middleware.use(ethCoinbase);
      middleware.use(netVersion);
      middleware.run(req, callback).then(() => {
        _this.connection.send(JSON.stringify(payload));
        _this._addResponseCallback(payload, callback);
      });
    };
    return this.wsProvider;
  }
}
export default WSProvider;
