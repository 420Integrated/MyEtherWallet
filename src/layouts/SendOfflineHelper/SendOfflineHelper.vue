<template>
  <div class="send-offline-helper">
    <div class="page-container">
      <div class="wrap">
        <div class="page-title">
          <page-title
            :options="{
              title: $t('withoutWallet.offline-helper'),
              boldSubTitle: '',
              textContent: []
            }"
          />
        </div>
        <div class="page-content-container">
          <!-- Select Network-->
          <div class="collapse-container">
            <accordion-menu
              :greytitle="false"
              :isopen="stage1"
              :title="$t('withoutWallet.select-network')"
              :right-text="networkTitle"
              number="1"
              @titleClicked="stage1 = !stage1"
            >
              <ul class="networks">
                <li
                  v-for="(key, index) in Object.keys(reorderNetworkList)"
                  :key="$router.path + key + index"
                >
                  <div class="network-title">
                    <div class="network-icon">
                      <img
                        v-if="
                          key !== 'Custom Networks' &&
                          Networks[key][0].type.icon
                        "
                        :src="Networks[key][0].type.icon"
                        alt
                      />
                      <div
                        v-if="
                          key !== 'Custom Networks' &&
                          !Networks[key][0].type.icon
                        "
                        class="no-icon"
                      >
                        <p>{{ $t('common.no-icon') }}</p>
                      </div>
                    </div>
                    <p>{{ key }}</p>
                  </div>
                  <div class="network-content">
                    <p
                      v-for="net in reorderNetworkList[key]"
                      :key="net.service"
                      :class="
                        net.service === selectedNetwork.service &&
                        net.type &&
                        net.type.name === selectedNetwork.type.name
                          ? 'current-network'
                          : ''
                      "
                      @click="callSwitchNetwork(net)"
                    >
                      {{ net.service }}
                    </p>
                  </div>
                </li>
              </ul>
            </accordion-menu>
          </div>

          <!-- Generate Info -->
          <accordion-menu
            :greytitle="false"
            :editbutton="true"
            :isopen="stage2"
            :title="$t('withoutWallet.generate-info')"
            number="2"
            class="address-selector"
            @titleClicked="stage2 = !stage2"
          >
            <dropdown-address-selector
              :title="$t('sendTx.from-addr')"
              @toAddress="generateInformation($event)"
            />
            <div v-if="informationGenerated">
              <ul>
                <li class="detail-container">
                  <span class="detail-name">{{ $t('sendTx.sender') }}:</span>
                  <span class="detail-text">{{ genInfo.address }}</span>
                </li>
                <li class="detail-container">
                  <span class="detail-name">{{ $t('sendTx.nonce') }}:</span>
                  <span class="detail-text">{{ genInfo.nonce }}</span>
                </li>
                <li class="detail-container">
                  <span class="detail-name">{{ $t('common.chain-id') }}:</span>
                  <span class="detail-text"
                    >{{ genInfo.chainID }} ({{ genInfo.networkName }})</span
                  >
                </li>
                <li class="detail-container with-divider">
                  <span class="detail-name"
                    >{{ $t('common.smoke.current-smoke') }}:</span
                  >
                  <span class="detail-text">
                    {{ toMaher(genInfo.smokePrice) }}
                    {{ $t('common.smoke.maher') }}
                  </span>
                </li>
                <div v-if="showGenInfoSmokeWarning" class="smoke-price-warning">
                  {{ $t('errorsGlobal.high-smoke-limit-warning') }}
                </div>
                <li class="detail-container">
                  <span class="detail-name">{{ $t('sendTx.retrieved') }}:</span>
                  <span class="detail-text">{{
                    dateTimeDisplay(genInfo.timestamp)
                  }}</span>
                </li>
                <li class="detail-container">
                  <span class="detail-name">{{ $t('sendTx.at-block') }}:</span>
                  <span class="detail-text">{{ genInfo.blockNumber }}</span>
                </li>
              </ul>
            </div>
            <div v-show="informationGenerated" class="button-container">
              <a
                ref="generatedDownloadLink"
                :href="generatedJson"
                :download="exportFileName"
                rel="noopener noreferrer"
              >
                <standard-button
                  :options="{
                    title: $t('withoutWallet.export-json'),
                    buttonStyle: 'green-border',
                    noWalletTerms: true,
                    noMinWidth: true
                  }"
                />
              </a>

              <standard-button
                :options="{
                  title: $t('common.continue'),
                  buttonStyle: 'green',
                  noWalletTerms: true,
                  rightArrow: true
                }"
                :click-function="stage2Btn"
              />
            </div>
          </accordion-menu>

          <!-- Paste/Upload Signed Tx-->
          <accordion-menu
            :greytitle="false"
            :isopen="stage3"
            :title="$t('withoutWallet.signed-tx')"
            number="3"
            @titleClicked="stage3 = !stage3"
          >
            <textarea v-model="rawSigned" class="no-margin raw-tx-input" />
            <p v-if="invalidSignature">{{ $t('sendTx.invalid-signature') }}</p>
            <i18n
              v-if="wrongNetwork && correctNetwork === ''"
              tag="p"
              path="sendTx.signed-chain-id"
            ></i18n>
            <i18n
              v-if="wrongNetwork && correctNetwork !== ''"
              tag="p"
              path="sendTx.signed-chain-id"
            >
              <span slot="network">({{ correctNetwork }})</span>
            </i18n>
            <expanding-option :title="$t('sendTx.raw-tx')">
              <textarea
                :value="JSON.stringify(rawTx)"
                class="no-margin raw-tx-input"
                disabled
              />
            </expanding-option>
            <div class="button-container">
              <input
                ref="jsonInput"
                type="file"
                name="file"
                style="display: none"
                @change="uploadFile"
              />
              <standard-button
                :options="{
                  title: $t('withoutWallet.upload-json'),
                  buttonStyle: 'green-border',
                  noWalletTerms: true,
                  noMinWidth: true
                }"
                :click-function="uploadClick"
              />
              <standard-button
                :options="{
                  title: $t('common.continue'),
                  buttonStyle: 'green',
                  noWalletTerms: true
                }"
                :click-function="stage3Btn"
              />
            </div>
          </accordion-menu>

          <!-- Review and Send-->
          <accordion-menu
            :greytitle="false"
            :editbutton="false"
            :isopen="stage4"
            :title="$t('withoutWallet.tx-details')"
            number="4"
            @titleClicked="stage4 = !stage4"
          >
            <ul>
              <li class="detail-container">
                <span class="detail-name">{{ $t('sendTx.sender') }}:</span>
                <span class="detail-text">{{ from }}</span>
              </li>
              <li class="detail-container">
                <span class="detail-name">{{ $t('sendTx.receiver') }}:</span>
                <span class="detail-text">{{ to }}</span>
              </li>
              <li class="detail-container">
                <span class="detail-name">{{ $t('sendTx.nonce') }}:</span>
                <span class="detail-text">{{ nonce }}</span>
              </li>
              <li class="detail-container">
                <span class="detail-name">{{ $t('common.value') }}:</span>
                <span class="detail-text">
                  {{ toFourtwenty(value) }}
                  {{ selectedNetwork.type.currencyName }}
                </span>
              </li>
              <li class="detail-container">
                <span class="detail-name">{{ $t('sendTx.data') }}:</span>
                <span v-if="data !== '0x'" class="detail-text">
                  {{ truncateData(data) }}
                  <span
                    class="show-all-btn"
                    @click="showAllData = !showAllData"
                    >{{ $t('common.show-all') }}</span
                  >
                </span>
                <span v-else class="data-all">{{ data }}</span>
                <span v-if="showAllData" class="data-all">{{ data }}</span>
              </li>

              <li class="detail-container with-divider">
                <span class="detail-name">{{ $t('common.chain-id') }}:</span>
                <span class="detail-text"
                  >{{ chainID }} ({{ selectedNetwork.type.name_long }})</span
                >
              </li>
              <li class="detail-container">
                <span class="detail-name">{{ $t('common.smoke.limit') }}:</span>
                <span class="detail-text">{{ smokeLimit }}</span>
              </li>
              <li class="detail-container">
                <span class="detail-name">{{ $t('common.smoke.price') }}:</span>
                <span class="detail-text"
                  >{{ toMaher(smokePrice) }} {{ $t('common.smoke.maher') }}</span
                >
              </li>
              <div v-if="showSmokeWarning" class="smoke-price-warning">
                {{ $t('errorsGlobal.high-smoke-limit-warning') }}
              </div>
              <li class="detail-container">
                <span class="detail-name">{{ $t('common.smoke.fee') }}:</span>
                <span class="detail-text">
                  {{ toFourtwenty(toWei(fee)) }}
                  {{ selectedNetwork.type.currencyName }}
                  ($ {{ calculateCost(fee) }})
                </span>
              </li>
            </ul>
            <div class="button-container">
              <standard-button
                :options="{
                  title: $t('common.send'),
                  buttonStyle: 'green',
                  noWalletTerms: true,
                  rightArrow: true
                }"
                :click-function="stage4Btn"
              />
            </div>
          </accordion-menu>

          <!-- Sent Tx Details & Hash-->
          <accordion-menu
            :greytitle="false"
            :editbutton="false"
            :isopen="stage5"
            :title="$t('withoutWallet.tx-status')"
            number="5"
            @titleClicked="stage5 = !stage5"
          >
            <ul v-if="error === ''">
              <li class="tx-hash-container">
                <p>{{ $t('sendTx.tx-hash') }}:</p>
                <a
                  :href="replaceUrl('', txHash)"
                  class="detail-text"
                  target="_blank"
                  rel="noopener noreferrer"
                  >{{ txHash }}</a
                >
              </li>
              <li class="tx-receipt-container">
                <p>{{ $t('sendTx.transaction-receipt') }}:</p>
                <div
                  v-if="Object.keys(txReceipt).length > 0"
                  class="tx-receipt-items"
                >
                  <div
                    v-for="(item, idx) in Object.keys(txReceipt)"
                    :key="item + idx"
                  >
                    <span>{{ getTranslatedItem(item) }}</span>
                    <a
                      v-if="item === 'transactionHash'"
                      :href="replaceUrl('', txReceipt[item])"
                      target="_blank"
                      class="right-side"
                      rel="noopener noreferrer"
                      >{{ txReceipt[item] }}</a
                    >
                    <a
                      v-else-if="item === 'contractAddress'"
                      :href="replaceUrl('address', txReceipt[item])"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="right-side"
                      >{{ txReceipt[item] }}</a
                    >
                    <span v-else class="right-side">{{ txReceipt[item] }}</span>
                  </div>
                </div>
                <div v-else class="loading">{{ $t('common.loading') }}....</div>
              </li>
            </ul>
            <div v-else>{{ error }}</div>
          </accordion-menu>
        </div>
      </div>
    </div>

    <confirmation-modal
      ref="offlineConfirm"
      :raw-tx="rawTx"
      :signed-tx="rawSigned"
      :env-details="envDetails"
    />
  </div>
</template>

<script>
import { Transaction } from 'fourtwentyjs-tx';
import { mapState, mapActions } from 'vuex';
import Misc from '@/helpers/misc';
import BigNumber from 'bignumber.js';
import web3Utils from 'web3-utils';
import * as networkTypes from '@/networks/types';
import store from 'store';
import PageTitleComponent from '@/components/PageTitleComponent';
import AccordionMenu from '@/components/AccordionMenu';
import DropDownAddressSelector from '@/components/DropDownAddressSelector';
import StandardButton from '@/components/Buttons/StandardButton';
import ExpandingOption from '@/components/ExpandingOption';
import ConfirmationModal from './components/ConfirmationModal';
import ENS from 'fourtwenty-ens';
export default {
  components: {
    'page-title': PageTitleComponent,
    'accordion-menu': AccordionMenu,
    'dropdown-address-selector': DropDownAddressSelector,
    'standard-button': StandardButton,
    'expanding-option': ExpandingOption,
    'confirmation-modal': ConfirmationModal
  },
  data() {
    return {
      networkTypes: Object.values(networkTypes),
      selectedNetwork: this.$store.state.main.network,
      stage1: false, // Select Network
      stage2: true, // Generate Information
      stage3: false, // Enter/Upload Signed Transaction
      stage4: false, // Review and Send
      stage5: false, // Show Transaction Hash and Transaction Receipt
      showAllData: false,
      informationGenerated: false,
      downloadable: false,
      from: '0x',
      rawSigned: '',
      minAccountBalance: 0,
      fee: 0,
      nonce: 0,
      smokePrice: 0,
      smokeLimit: 0,
      to: '0x',
      value: 0,
      data: '0x',
      chainID: 0,
      fourtwentyPrice: 0,
      genInfo: {
        address: '0x',
        smokePrice: 0,
        nonce: 0,
        chainID: this.$store.state.main.network.type.chainID,
        networkName: this.$store.state.main.network.type.name_long
      },
      generatedJson: {},
      file: '',
      exportFileName: 'Generated Information',
      //Error Flags
      invalidSignature: false,
      wrongNetwork: false,
      correctNetwork: '',
      txHash: '',
      txReceipt: {},
      error: ''
    };
  },
  computed: {
    ...mapState('main', [
      'network',
      'Networks',
      'customPaths',
      'path',
      'web3',
      'wallet',
      'online',
      'smokeLimitWarning'
    ]),
    showSmokeWarning() {
      return this.smokePrice >= this.smokeLimitWarning;
    },
    showGenInfoSmokeWarning() {
      const num = new BigNumber(this.toMaher(this.genInfo.smokePrice)).gte(
        this.smokeLimitWarning
      );
      return num;
    },
    reorderNetworkList() {
      const customNetworks =
        store.get('customNetworks') !== undefined
          ? store.get('customNetworks')
          : [];
      const currentNetworks = Misc.reorderNetworks();
      const newObj = Object.assign({}, currentNetworks, {
        'Custom Networks': customNetworks
      });
      if (customNetworks.length === 0) delete newObj['Custom Networks'];
      return newObj;
    },
    networkTitle() {
      return `${this.selectedNetwork.type.name} - ${this.selectedNetwork.service} `;
    },
    rawTx() {
      return {
        from: this.from,
        nonce: this.nonce,
        smokePrice: this.toMaher(this.smokePrice),
        smokeLimit: this.smokeLimit,
        to: this.to,
        value: this.toFourtwenty(this.value),
        data: this.data,
        chainID: this.chainID
      };
    },
    envDetails() {
      return {
        network: this.selectedNetwork,
        fourtwentyPrice: this.fourtwentyPrice
      };
    }
  },
  watch: {
    rawSigned(newVal) {
      this.getTransactionDetails(newVal);
    }
  },
  mounted() {
    this.callSwitchNetwork(this.$store.state.main.network);
    if (this.online) {
      this.fetchBalanceData();
    }
  },
  methods: {
    ...mapActions('main', ['switchNetwork', 'setWeb3Instance', 'setENS']),
    callSetENS() {
      if (this.network.type.ens) {
        this.setENS(
          new ENS(this.web3.currentProvider, this.network.type.ens.registry)
        );
      } else {
        this.setENS(null);
      }
    },
    getTranslatedItem(item) {
      const kebabItem = item.replace(/([A-Z])/g, '-$1').toLowerCase();
      return this.$t('withoutWallet.' + kebabItem);
    },
    replaceUrl(type, hash) {
      if (type === 'address') {
        return this.network.type.blockExplorerAddr.replace('[[address]]', hash);
      }
      return this.network.type.blockExplorerTX.replace('[[txHash]]', hash);
    },
    stage1Btn() {
      this.stage1 = false;
      this.stage2 = true;
    },
    stage2Btn() {
      this.stage2 = false;
      this.stage3 = true;
    },
    stage3Btn() {
      this.stage3 = false;
      this.stage4 = true;
    },
    stage4Btn() {
      this.stage4 = false;
      this.stage5 = true;
      if (this.rawSigned !== '') {
        this.error = this.txHash = '';
        this.txReceipt = {};
        this.web3.fourtwenty
          .sendSignedTransaction(this.rawSigned)
          .once('transactionHash', hash => {
            this.txHash = hash;
          })
          .then(receipt => {
            this.txReceipt = receipt;
          })
          .catch(e => {
            this.error = e;
          });
      }
    },
    callSwitchNetwork(network) {
      this.switchNetwork(network).then(() => {
        this.selectedNetwork = network;
        this.setWeb3Instance();
        this.stage1Btn();
        this.getTransactionDetails();
        this.callSetENS();
      });
    },
    truncateData(data) {
      if (!data) return '';
      return `${data.slice(0, 20)}...${data.slice(-10)}`;
    },
    getTransactionDetails(rawSigned) {
      const positions = {
        nonce: 0,
        smokePrice: 1,
        smokeLimit: 2,
        to: 3,
        value: 4,
        data: 5,
        v: 6,
        r: 7,
        s: 8
      };
      if (rawSigned) this.rawSigned = rawSigned;
      if (this.rawSigned !== '') {
        const sanitizedRawSigned = Misc.sanitizeHex(this.rawSigned);
        const tx = new Transaction(sanitizedRawSigned, {
          chain: this.genInfo['chainID']
        });
        this.invalidSignature = !tx.verifySignature();
        this.chainID = tx.getChainId();
        this.wrongNetwork = !new BigNumber(
          this.selectedNetwork.type.chainID
        ).eq(new BigNumber(this.chainID));
        this.chainID = tx.getChainId();

        if (this.wrongNetwork) {
          const correctNetwork = this.networkTypes.filter(
            entry => entry.chainID === this.chainID
          );
          if (correctNetwork) this.correctNetwork = correctNetwork[0].name_long;
        }
        this.from = Misc.sanitizeHex(tx.getSenderAddress().toString('hex'));
        const asJson = tx.toJSON();
        this.to = asJson[positions.to];
        this.smokeLimit = new BigNumber(asJson[positions.smokeLimit]).toFixed();
        this.nonce = new BigNumber(asJson[positions.nonce]).toFixed();
        this.value = new BigNumber(asJson[positions.value]).toFixed();

        this.data = asJson[positions.data];
        this.minAccountBalance = tx.getUpfrontCost().toString();
        this.smokePrice = new BigNumber(
          Misc.sanitizeHex(tx.smokePrice.toString('hex'))
        ).toFixed();
        this.fee = new BigNumber(this.toMaher(this.smokePrice))
          .times(this.smokeLimit)
          .toString();
      }
    },
    async fetchBalanceData() {
      const url = 'https://cryptorates.mewapi.io/ticker';
      const fetchValues = await fetch(url);
      const result = await fetchValues.json();
      const values = result.data;
      if (!values['FOURTWENTY']) return 0;
      this.fourtwentyPrice = new BigNumber(values['FOURTWENTY'].quotes.USD.price);
    },
    toFourtwenty(val) {
      if (!val || isNaN(val)) return 0;
      return web3Utils.fromWei(new BigNumber(val).toString(), '420coin');
    },
    toWei(val) {
      if (!val) return 0;
      return web3Utils.toWei(new BigNumber(val).toFixed(), 'maher');
    },
    toMaher(val) {
      if (!val) return 0;
      return web3Utils.fromWei(new BigNumber(val).toFixed(), 'maher');
    },
    dateTimeDisplay(unixTimeStamp) {
      return new Date(unixTimeStamp).toString();
    },
    calculateCost(inMaher) {
      const fromMaherToWei = this.toWei(inMaher);
      const cost = new BigNumber(this.fourtwentyPrice)
        .times(this.toFourtwenty(fromMaherToWei))
        .precision(2, BigNumber.ROUND_UP)
        .toNumber();
      return cost < 0.01 ? 0.01 : cost;
    },
    async generateInformation(data) {
      if (data.address === '') return;
      this.genInfo['address'] = data.address;
      this.genInfo['smokePrice'] = await this.web3.fourtwenty.getSmokePrice();
      this.genInfo['nonce'] = await this.web3.fourtwenty.getTransactionCount(
        data.address
      );
      this.genInfo['blockNumber'] = await this.web3.fourtwenty.getBlockNumber();
      this.genInfo['chainID'] = this.selectedNetwork.type.chainID;
      this.genInfo['timestamp'] = Date.now(); //;
      this.exportGeneratedInfo();
      this.informationGenerated = true;
    },
    exportGeneratedInfo() {
      const createBlob = (str, type) => {
        const string = typeof str === 'object' ? JSON.stringify(str) : str;
        if (string === null) return '';
        const blob = new Blob([string], {
          type: type
        });
        this.downloadable = true;
        return window.URL.createObjectURL(blob);
      };
      this.generatedJson = createBlob(this.genInfo, 'mime');
      this.exportFileName = `generated-offline-tx-${Date.now()}.json`;
    },
    uploadClick() {
      const jsonInput = this.$refs.jsonInput;
      jsonInput.value = '';
      jsonInput.click();
    },
    uploadFile(e) {
      const self = this;
      const reader = new FileReader();
      reader.onloadend = function (evt) {
        self.file = JSON.parse(evt.target.result);
        self.getTransactionDetails(self.file.rawTransaction);
      };
      reader.readAsBinaryString(e.target.files[0]);
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'SendOfflineHelper.scss';
</style>
