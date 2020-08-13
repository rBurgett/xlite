import electron from 'electron';
import path from 'path';

const app = electron.app ? electron.app : electron.remote ? electron.remote.app : null;

export const activeViews = {
  LOGIN: 'LOGIN',
  DASHBOARD: 'DASHBOARD',
  PORTFOLIO: 'PORTFOLIO',
  TRANSACTIONS: 'TRANSACTIONS',
  COIN_TRANSACTIONS: 'COIN_TRANSACTIONS'
};

export const actions = {
  SET_WINDOW_SIZE: 'SET_WINDOW_SIZE',
  SET_MANIFEST: 'SET_MANIFEST',
  SET_ACTIVE_VIEW: 'SET_ACTIVE_VIEW',
  SET_WALLETS: 'SET_WALLETS',
  SET_ACTIVE_WALLET: 'SET_ACTIVE_WALLET',
  SET_BALANCES: 'SET_BALANCES',
  SET_TRANSACTIONS: 'SET_TRANSACTIONS',
  SET_SHOW_RECEIVE_MODAL: 'SET_SHOW_RECEIVE_MODAL',
  SET_SHOW_SEND_MODAL: 'SET_SHOW_SEND_MODAL',
  SET_CURRENCY_MULTIPLIERS: 'SET_CURRENCY_MULTIPLIERS'
};

export const localStorageKeys = {
  MANIFEST: 'MANIFEST',
  MANIFEST_SHA: 'MANIFEST_SHA',
  BALANCES: 'BALANCES',
  TRANSACTIONS: 'TRANSACTIONS',
  ACTIVE_WALLET: 'ACTIVE_WALLET',
  ALT_CURRENCY_MULTIPLIERS: 'ALT_CURRENCY_MULTIPLIERS'
};

export const storageKeys = {
  LOCALE: 'LOCALE',
  ZOOM_FACTOR: 'ZOOM_FACTOR'
};

export const ipcMainListeners = {
  GET_USER_LOCALE: 'GET_USER_LOCALE',
  ZOOM_IN: 'ZOOM_IN',
  ZOOM_OUT: 'ZOOM_OUT',
  ZOOM_RESET: 'ZOOM_RESET',
  GET_ZOOM_FACTOR: 'GET_ZOOM_FACTOR',
  SET_ZOOM_FACTOR: 'SET_ZOOM_FACTOR'
};

export const ipcRendererListeners = {
  ZOOM_IN: 'ZOOM_IN',
  ZOOM_OUT: 'ZOOM_OUT',
  ZOOM_RESET: 'ZOOM_RESET'
};

export const DEFAULT_LOCALE = 'en';
export const DEFAULT_ZOOM_FACTOR = 1;

export const ZOOM_MAX = 1.5;
export const ZOOM_MIN = .6;
export const ZOOM_INCREMENT = .1;

export const DATA_DIR = app ? app.getPath('userData') : '';
export const ICON_DIR = app ? path.join(app.getPath('userData'), 'icons') : '';
export const IMAGE_DIR = path.resolve(__dirname, '../../images');

export const HTTP_REQUEST_TIMEOUT = 10000;

export const altCurrencies = {
  USD: 'USD',
  BTC: 'USD',
};

export const MAX_DECIMAL_PLACE = 8;
