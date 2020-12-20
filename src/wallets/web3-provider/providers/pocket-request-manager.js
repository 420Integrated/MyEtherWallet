import PocketProvider from 'pocket-js-web3-provider';
import { Manager as Web3RequestManager } from 'web3-core-requestmanager';
const devid = 'DEVO7QQqPHCK2h3cGXhh2rY';
const networks = [
  {
    mainnet: {
      ticker: 'FOURTWENTY',
      netid: '1'
    }
  },
  {
    rinkeby: {
      ticker: 'FOURTWENTY',
      netid: '4'
    }
  },
  {
    ruderalis: {
      ticker: 'FOURTWENTY',
      netid: '3'
    }
  },
  {
    kovan: {
      ticker: 'FOURTWENTY',
      netid: '42'
    }
  },
  {
    poa: {
      ticker: 'POA',
      netid: '99'
    }
  },
  {
    goerli: {
      ticker: 'FOURTWENTY',
      netid: '5'
    }
  }
];

class PocketRequestManager {
  constructor(host) {
    if (host.includes('mainnet')) {
      this.query = 'mainnet';
    } else if (host.includes('rinkeby')) {
      this.query = 'rinkeby';
    } else if (host.includes('ruderalis')) {
      this.query = 'ruderalis';
    } else if (host.includes('kovan')) {
      this.query = 'kovan';
    } else if (host.includes('poa')) {
      this.query = 'poa';
    } else if (host.includes('goerli')) {
      this.query = 'goerli';
    }
    this.network = networks.find(o => o[this.query])[this.query];
    this.provider = new PocketProvider(
      this.network.ticker,
      this.network.netid,
      devid
    );
    return new Web3RequestManager(this);
  }
  send(payload, callback) {
    this.provider.send(payload, callback);
    // TODO handle callback?
  }
  disconnect() {}
}
export default PocketRequestManager;
