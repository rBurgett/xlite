/*global describe,it,before,beforeEach*/
import 'should';
import {all, create} from 'mathjs';
import {combineReducers, createStore} from 'redux';
import fs from 'fs-extra';
import {Map as IMap} from 'immutable';
import os from 'os';
import path from 'path';

import * as appActions from '../src/app/actions/app-actions';
import appReducer from '../src/app/reducers/app-reducer';
import CloudChains from '../src/app/modules/cloudchains';
import ConfController from '../src/app/modules/conf-controller';
import domStorage from '../src/app/modules/dom-storage';
import FakeRPCController from './fake-rpc-controller';
import {localStorageKeys} from '../src/app/constants';
import RPCTransaction from '../src/app/types/rpc-transaction';
import Token from '../src/app/types/token';
import TokenManifest from '../src/app/modules/token-manifest';
import Wallet from '../src/app/types/wallet';
import WalletController from '../src/app/modules/wallet-controller';

const math = create(all, {
  number: 'BigNumber',
  precision: 64
});
const { bignumber } = math;

describe('WalletController Test Suite', function() {
  const tmp = path.join(os.tmpdir(), 'tests_walletcontroller_test_suite');
  before(function() {
    if (fs.pathExistsSync(tmp))
      fs.removeSync(tmp);
    fs.mkdirSync(tmp);
  });

  const dir = path.join(tmp, 'CloudChains');
  const settingsDir = path.join(dir, 'settings');
  const ccFunc = () => { return dir; };
  let confController;
  let tokenManifest;
  let cloudChains;
  const otxBLOCK = {
    txId: '50913b9adc6b95ac454d1f29f6d09e596cd638f3673bb889a506a6250a358bab',
    address: 'yBMQcUYNZ2g177GTb77ZT6wWoknfqobBMJ',
    amount: '10.100000',
    blockHash: 'ee37662083f6be532537663d2dc0d8f3a99af5ed4c68fb5d642325254294a017',
    blockTime: 1596660324,
    category: 'send',
    confirmations: 8865,
    time: 1596660284,
    trusted: true,
    hash: '50913b9adc6b95ac454d1f29f6d09e596cd638f3673bb889a506a6250a358bab',
    version: 1,
    size: 300,
    vSize: 300,
    vIn: [],
    vOut: [],
    hex: '01000000012c6f9f8c10cd5db62c01c591fd9e3736f42cec84ec59afea91fb7c0e503e20c8000000006a47304402203078ad70c8252be402f9f4d6e60e637528d648fb8dd0ebdfceaeb5ee03443eac02207536b8e8402b515ea495ad3b9e422aaa3f9c06fab34e0ec5a2a384aff5f3f87201210392b78bb64d3227c049ba3672a00f7ec300973b07581d88d972dbca0a727316bffeffffff021c3f1d0f6e0000001976a91419679b5b9d905671a2c0cd5798dde70d74cabc6388ac00f2052a010000001976a9149da5d5315113a53d7ff460e4011d455005b3acd988acebd60a00',
  };
  const otxBTC = {
    txId: '50913b9adc6b95ac454d1f29f6d09e596cd638f3673bb889a506a6250a358bab',
    address: '35x8RtuFsAnJCWEDQvJRDMi9Wa2k5Rs3Yp',
    amount: '1.12345678',
    blockHash: 'ee37662083f6be532537663d2dc0d8f3a99af5ed4c68fb5d642325254294a017',
    blockTime: 1596660324,
    category: 'send',
    confirmations: 8865,
    time: 1596660284,
    trusted: true,
    hash: '50913b9adc6b95ac454d1f29f6d09e596cd638f3673bb889a506a6250a358bab',
    version: 1,
    size: 300,
    vSize: 300,
    vIn: [],
    vOut: [],
    hex: '01000000012c6f9f8c10cd5db62c01c591fd9e3736f42cec84ec59afea91fb7c0e503e20c8000000006a47304402203078ad70c8252be402f9f4d6e60e637528d648fb8dd0ebdfceaeb5ee03443eac02207536b8e8402b515ea495ad3b9e422aaa3f9c06fab34e0ec5a2a384aff5f3f87201210392b78bb64d3227c049ba3672a00f7ec300973b07581d88d972dbca0a727316bffeffffff021c3f1d0f6e0000001976a91419679b5b9d905671a2c0cd5798dde70d74cabc6388ac00f2052a010000001976a9149da5d5315113a53d7ff460e4011d455005b3acd988acebd60a00',
  };
  const txBLOCK = new RPCTransaction(otxBLOCK);
  const txBTC = new RPCTransaction(otxBTC);
  const availableWallets = ['BLOCK', 'BTC'];

  beforeEach(async function() {
    domStorage.clear();
    const configMaster = path.join(settingsDir, 'config-master.json');
    const configBLOCK = path.join(settingsDir, 'config-BLOCK.json');
    const configBTC = path.join(settingsDir, 'config-BTC.json');
    if (fs.pathExistsSync(settingsDir))
      fs.removeSync(settingsDir);
    fs.mkdirpSync(settingsDir);
    fs.writeFileSync(configMaster, JSON.stringify({
      'rpcPassword': 'test',
      'fee': 1.0E-4,
      'rpcUsername': 'user',
      'rpcPort': -1000,
      'feeFlat': true,
      'rpcEnabled': true,
      'addressCount': 20
    }));
    fs.writeFileSync(configBLOCK, JSON.stringify({
      'rpcPassword': 'test',
      'fee': 1.0E-4,
      'rpcUsername': 'user',
      'rpcPort': 41414,
      'feeFlat': true,
      'rpcEnabled': true,
      'addressCount': 20
    }));
    fs.writeFileSync(configBTC, JSON.stringify({
      'rpcPassword': '',
      'fee': 1.0E-4,
      'rpcUsername': '',
      'rpcPort': 8332,
      'feeFlat': true,
      'rpcEnabled': false,
      'addressCount': 20
    }));
    const req = async (url) => {
      if (url === 'manifest-url') {
        const o = {};
        o.body = {};
        o.body.toString = () => {
          return '{"manifest-latest.json":["b705da5df7d83ba3de48eb20fdc3cbf519ef6cc7","manifest-latest.json"]}';
        };
        return o;
      } else if (url === 'manifest-latest.json') {
        const o = {};
        o.body = {};
        o.body.toString = () => {
          return '[{"blockchain":"Blocknet","ticker":"BLOCK","ver_id":"blocknet--v4.0.1","ver_name":"Blocknetv4","conf_name":"blocknet.conf","dir_name_linux":"blocknet","dir_name_mac":"Blocknet","dir_name_win":"Blocknet","repo_url":"https://github.com/blocknetdx/blocknet","versions":["v4.3.0"],"xbridge_conf":"blocknet--v4.0.1.conf","wallet_conf":"blocknet--v4.0.1.conf"},{"blockchain":"Bitcoin","ticker":"BTC","ver_id":"bitcoin--v0.15.1","ver_name":"Bitcoinv0.15.x","conf_name":"bitcoin.conf","dir_name_linux":"bitcoin","dir_name_mac":"Bitcoin","dir_name_win":"Bitcoin","repo_url":"https://github.com/bitcoin/bitcoin","versions":["v0.15.1","v0.15.2"],"xbridge_conf":"bitcoin--v0.15.1.conf","wallet_conf":"bitcoin--v0.15.1.conf"}]';
        };
        return o;
      } else if (url === 'xbridge-confs/blocknet--v4.0.1.conf') {
        let o = {};
        o.body = {};
        o.body.toString = () => {
          return '[BLOCK]\\nTitle=Blocknet\\nAddress=\\nIp=127.0.0.1\\nPort=41414\\nUsername=\\nPassword=\\nAddressPrefix=26\\nScriptPrefix=28\\nSecretPrefix=154\\nCOIN=100000000\\nMinimumAmount=0\\nTxVersion=1\\nDustAmount=0\\nCreateTxMethod=BTC\\nGetNewKeySupported=true\\nImportWithNoScanSupported=true\\nMinTxFee=10000\\nBlockTime=60\\nFeePerByte=20\\nConfirmations=0';
        };
        return o;
      } else if (url === 'xbridge-confs/bitcoin--v0.15.1.conf') {
        let o = {};
        o.body = {};
        o.body.toString = () => {
          return '[BTC]\\nTitle=Bitcoin\\nAddress=\\nIp=127.0.0.1\\nPort=8332\\nUsername=\\nPassword=\\nAddressPrefix=0\\nScriptPrefix=5\\nSecretPrefix=128\\nCOIN=100000000\\nMinimumAmount=0\\nTxVersion=2\\nDustAmount=0\\nCreateTxMethod=BTC\\nMinTxFee=7500\\nBlockTime=600\\nGetNewKeySupported=false\\nImportWithNoScanSupported=false\\nFeePerByte=120\\nConfirmations=1';
        };
        return o;
      }
    };
    confController = new ConfController(domStorage, availableWallets);
    await confController.updateLatest('manifest-url', 'xbridge-confs/', '0123456789', 'manifest-latest.json', req).should.be.finally.true();
    tokenManifest = new TokenManifest(confController.getManifest(), confController.getXBridgeInfo());
    cloudChains = new CloudChains(ccFunc, domStorage);
    cloudChains.loadConfs();
  });

  it('WalletController()', function() {
    const wc = new WalletController(cloudChains, tokenManifest, domStorage);
    wc._cloudChains.should.be.eql(cloudChains);
    wc._manifest.should.be.eql(tokenManifest);
    wc._domStorage.should.be.eql(domStorage);
  });
  it('WalletController.getWallets()', function() {
    const wc = new WalletController(cloudChains, tokenManifest, domStorage);
    wc.loadWallets();
    wc.getWallets().should.be.an.Array();
    wc.getWallets().length.should.be.equal(2);
    wc.getWallets()[0].should.be.instanceof(Wallet);
  });
  it('WalletController.getWallet()', function() {
    const wc = new WalletController(cloudChains, tokenManifest, domStorage);
    wc.loadWallets();
    should.not.exist(wc.getWallet('missing'));
    wc.getWallet('BLOCK').should.be.instanceof(Wallet);
  });
  it('WalletController.getEnabledWallets()', function() {
    const wc = new WalletController(cloudChains, tokenManifest, domStorage);
    wc.loadWallets();
    wc.getEnabledWallets().should.be.an.Array();
    wc.getEnabledWallets().length.should.be.equal(1);
    wc.getEnabledWallets()[0].ticker.should.be.equal('BLOCK');
  });
  it('WalletController.getBalances()', function() {
    const balances = new Map([['BLOCK', ['100', '10']], ['BTC', ['100', '100']]]);
    domStorage.setItem(localStorageKeys.BALANCES, balances);
    const wc = new WalletController(cloudChains, tokenManifest, domStorage);
    wc.loadWallets();
    wc.getBalances().should.be.an.instanceof(Map);
    wc.getBalances().size.should.be.equal(2);
    wc.getBalances().get('BLOCK').should.be.eql(balances.get('BLOCK'));
    wc.getBalances().get('BTC').should.be.eql(balances.get('BTC'));
  });
  it('WalletController.getTransactions()', async function() {
    const wc = new WalletController(cloudChains, tokenManifest, domStorage);
    wc.loadWallets();
    const blockWallet = wc.getWallet('BLOCK');
    const fakerpc = new FakeRPCController();
    blockWallet.rpc = fakerpc;
    await blockWallet.updateTransactions();
    wc.getTransactions().should.be.an.instanceof(Map);
    wc.getTransactions().has('BLOCK').should.be.true();
    const sortFn = (a,b) => a.txId.localeCompare(b.txId);
    const txs = wc.getTransactions().get('BLOCK').sort(sortFn);
    const fakeTxs = (await fakerpc.listTransactions()).sort(sortFn);
    txs.should.be.eql(fakeTxs);
  });
  it('WalletController.getActiveWallet()', function() {
    const wc = new WalletController(cloudChains, tokenManifest, domStorage);
    wc.loadWallets();
    should.not.exist(wc.getActiveWallet());
    domStorage.setItem(localStorageKeys.ACTIVE_WALLET, 'BLOCK');
    wc.getActiveWallet().should.be.equal('BLOCK');
    domStorage.setItem(localStorageKeys.ACTIVE_WALLET, 'missing');
    should.not.exist(wc.getActiveWallet());
  });
  it('WalletController.setActiveWallet()', function() {
    const wc = new WalletController(cloudChains, tokenManifest, domStorage);
    wc.loadWallets();
    wc.setActiveWallet('missing');
    should.not.exist(domStorage.getItem(localStorageKeys.ACTIVE_WALLET)); // missing token should not be saved to storage
    wc.setActiveWallet('BLOCK');
    wc.getActiveWallet().should.be.equal('BLOCK');
  });
  it('WalletController.loadWallets()', function() {
    const wc = new WalletController(cloudChains, tokenManifest, domStorage);
    wc.getWallets().should.be.an.Array();
    wc.getWallets().should.be.empty();
    wc.loadWallets();
    wc.getWallets().should.be.an.Array();
    wc.getWallets().should.not.be.empty();
  });
  it('WalletController.dispatchWallets()', function() {
    const combinedReducers = combineReducers({ appState: appReducer });
    const store = createStore(combinedReducers);
    const wc = new WalletController(cloudChains, tokenManifest, domStorage);
    wc.loadWallets();
    store.getState().appState.wallets.should.be.an.Array(); // state should not be valid before dispatch
    store.getState().appState.wallets.should.be.empty();
    wc.dispatchWallets(appActions.setWallets, store);
    store.getState().appState.wallets.should.be.eql(Array.from(wc._wallets.values()));
  });
  it('WalletController.dispatchActiveWallet()', function() {
    const combinedReducers = combineReducers({ appState: appReducer });
    const store = createStore(combinedReducers);
    const wc = new WalletController(cloudChains, tokenManifest, domStorage);
    wc.loadWallets();
    store.getState().appState.activeWallet.should.be.a.String(); // state should not be valid before dispatch
    store.getState().appState.activeWallet.should.be.equal('');
    wc.setActiveWallet('BLOCK');
    wc.dispatchActiveWallet(appActions.setActiveWallet, store);
    store.getState().appState.activeWallet.should.be.equal('BLOCK');
  });
  it('WalletController.dispatchBalances()', function() {
    const balances = new Map([['BLOCK', ['100', '10']], ['BTC', ['100', '100']]]);
    domStorage.setItem(localStorageKeys.BALANCES, balances);
    const combinedReducers = combineReducers({ appState: appReducer });
    const store = createStore(combinedReducers);
    const wc = new WalletController(cloudChains, tokenManifest, domStorage);
    wc.loadWallets();
    store.getState().appState.balances.should.be.an.instanceof(IMap); // state should not be valid before dispatch
    store.getState().appState.balances.should.be.eql(IMap());
    wc.dispatchBalances(appActions.setBalances, store);
    store.getState().appState.balances.should.be.eql(IMap(balances));
    store.getState().appState.balances.get('BLOCK')[0].should.be.equal(balances.get('BLOCK')[0]);
    store.getState().appState.balances.get('BLOCK')[1].should.be.equal(balances.get('BLOCK')[1]);
    store.getState().appState.balances.get('BTC')[0].should.be.equal(balances.get('BTC')[0]);
    store.getState().appState.balances.get('BTC')[1].should.be.equal(balances.get('BTC')[1]);
  });
  it('WalletController.dispatchTransactions()', function() {
    const blockWallet = new Wallet(new Token({ticker: 'BLOCK'}), null, domStorage);
    const btcWallet = new Wallet(new Token({ticker: 'BTC'}), null, domStorage);
    const transactions = new Map([['BLOCK', [txBLOCK]], ['BTC', [txBTC]]]);
    domStorage.setItem(blockWallet._getTransactionStorageKey(), transactions.get('BLOCK'));
    domStorage.setItem(btcWallet._getTransactionStorageKey(), transactions.get('BTC'));
    const combinedReducers = combineReducers({ appState: appReducer });
    const store = createStore(combinedReducers);
    const wc = new WalletController(cloudChains, tokenManifest, domStorage);
    wc.loadWallets();
    store.getState().appState.transactions.should.be.an.instanceof(IMap); // state should not be valid before dispatch
    store.getState().appState.transactions.should.be.eql(IMap());
    wc.dispatchTransactions(appActions.setTransactions, store);
    store.getState().appState.transactions.should.be.eql(IMap(transactions));
    store.getState().appState.transactions.get('BLOCK')[0].should.be.eql(transactions.get('BLOCK')[0]);
    store.getState().appState.transactions.get('BTC')[0].should.be.eql(transactions.get('BTC')[0]);
  });
  it('WalletController.dispatchPriceMultipliers()', function() {
    const multipliers = {BLOCK: {"USD":1.231,"BTC":0.000107}, BTC: {"USD":11200,"BTC":1.0}};
    domStorage.setItem(localStorageKeys.ALT_CURRENCY_MULTIPLIERS, multipliers);
    const combinedReducers = combineReducers({ appState: appReducer });
    const store = createStore(combinedReducers);
    const wc = new WalletController(cloudChains, tokenManifest, domStorage);
    wc.loadWallets();
    store.getState().appState.currencyMultipliers.should.be.an.instanceof(Object); // state should not be valid before dispatch
    store.getState().appState.currencyMultipliers.should.be.eql({});
    wc.dispatchPriceMultipliers(appActions.setCurrencyMultipliers, store);
    store.getState().appState.currencyMultipliers.should.be.eql(multipliers);
    store.getState().appState.currencyMultipliers['BLOCK'].should.be.eql(multipliers['BLOCK']);
    store.getState().appState.currencyMultipliers['BTC'].should.be.eql(multipliers['BTC']);
  });
  it('WalletController.updatePriceMultipliers()', async function() {
    const currencyReq = async (ticker, currencies) => {
      if (ticker === 'BLOCK')
        return {body: {"USD":1.231,"BTC":0.000107}};
      if (ticker === 'BTC')
        return {body: {"USD":11200,"BTC":1.0}};
    };
    const BLOCK = (await currencyReq('BLOCK', [])).body;
    const BTC = (await currencyReq('BTC', [])).body;
    const multipliers = {BLOCK, BTC};
    const wc = new WalletController(cloudChains, tokenManifest, domStorage);
    wc.loadWallets();
    await wc.updatePriceMultipliers(currencyReq);
    domStorage.getItem(localStorageKeys.ALT_CURRENCY_MULTIPLIERS).should.be.eql(multipliers);
  });
  it('WalletController.updatePriceMultipliers() bad request', async function() {
    const multipliers = {};
    const currencyReq = async (ticker, currencies) => { return { err: multipliers }; };
    const wc = new WalletController(cloudChains, tokenManifest, domStorage);
    wc.loadWallets();
    await wc.updatePriceMultipliers(currencyReq);
    const expected = {};
    for (const wallet of wc.getWallets())
      expected[wallet.ticker] = {};
    domStorage.getItem(localStorageKeys.ALT_CURRENCY_MULTIPLIERS).should.be.eql(expected);
  });

  let balances;
  let fakerpc;
  const updateBalancePrep = async () => {
    balances = new Map();
    fakerpc = new FakeRPCController();
    const wc = new WalletController(cloudChains, tokenManifest, domStorage);
    wc.loadWallets();
    const fakeunspent = await fakerpc.listUnspent();
    let total = bignumber(0);
    let spendable = bignumber(0);
    for (const utxo of fakeunspent) {
      total = math.add(total, utxo.amount);
      if (utxo.spendable)
        spendable = math.add(spendable, utxo.amount);
    }
    const balance = [total.toNumber().toFixed(8), spendable.toNumber().toFixed(8)];
    for (const wallet of wc.getWallets()) {
      wallet.rpc = fakerpc;
      balances.set(wallet.ticker, balance);
    }
    await wc.updateAllBalances();
    return wc;
  };

  it('WalletController.updateAllBalances()', async function() {
    const wc = await updateBalancePrep();
    domStorage.getItem(localStorageKeys.BALANCES).should.be.eql(Array.from(balances));
    const wallet = wc.getWallet('BLOCK');
    wallet.getTransactions().should.be.eql(await fakerpc.listTransactions());
  });
  it('WalletController._updateBalanceInfo()', async function() {
    const wc = await updateBalancePrep();
    const newBalances = new Map();
    const wallet = wc.getWallet('BLOCK');
    const oldBalances = wc.getBalances();
    await wc._updateBalanceInfo(wallet.ticker, newBalances);
    newBalances.get('BLOCK').should.be.eql(oldBalances.get('BLOCK'));
    newBalances.size.should.be.equal(1); // should not have any other tickers
  });
  it('WalletController._updateBalanceInfo() should not update on wallet error', async function() {
    const wc = await updateBalancePrep();
    const oldBalances = wc.getBalances();
    const oldTransactions = wc.getTransactions();
    const newBalances = oldBalances;
    const newTransactions = oldTransactions;
    const wallet = wc.getWallet('BLOCK');
    wallet.getBalance = async function() { throw new Error('fail'); };
    await wc._updateBalanceInfo(wallet.ticker, newBalances, newTransactions);
    newBalances.get('BLOCK').should.be.eql(oldBalances.get('BLOCK'));
    newBalances.size.should.be.equal(balances.size);
    newTransactions.get('BLOCK').should.be.eql(oldTransactions.get('BLOCK'));
    newTransactions.get('BLOCK').should.be.eql(await fakerpc.listTransactions());
  });

  after(function() {
    if (fs.pathExistsSync(tmp))
      fs.removeSync(tmp);
  });
});