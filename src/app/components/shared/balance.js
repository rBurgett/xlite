import { connect } from 'react-redux';
import electron from 'electron';
import { Map } from 'immutable';
import React, { useEffect, useState } from 'react';
import request from 'superagent';
import PropTypes from 'prop-types';
import Wallet from '../../types/wallet';
import Localize from './localize';
import { handleError } from '../../util';
import { all, create } from 'mathjs';
import { MAX_DECIMAL_PLACE } from '../../constants';

const math = create(all, {
  number: 'BigNumber',
  precision: 64
});
const { bignumber } = math;

let Balance = ({ showCoinDetails = false, activeWallet, altCurrency, wallets, balances, currencyMultipliers }) => {
  const wallet = activeWallet ? wallets.find(w => w.ticker === activeWallet) : null;
  const [ total, spendable ] = wallet && balances.has(wallet.ticker) ? balances.get(wallet.ticker) : ['0', '0'];

  if(!wallet) return <div className={'lw-balance-outer-container'} />;

  const altMultiplier = bignumber(currencyMultipliers[activeWallet] && currencyMultipliers[activeWallet][altCurrency] ? currencyMultipliers[activeWallet][altCurrency] : 0);
  const altAmount = math.multiply(altMultiplier, bignumber(Number(total)));

  // ToDo get website data from somewhere
  const website = '';
  const explorerLink = `https://chainz.cryptoid.info/${wallet.ticker.toLowerCase()}/`;

  // ToDo add change over time data

  const onExplorerClick = e => {
    e.preventDefault();
    electron.shell.openExternal(explorerLink);
  };

  if(showCoinDetails) {
    return (
      <div className={'lw-balance-outer-container d-flex flex-column justify-content-center'}>
        <div className={'d-flex flex-row justify-content-start'}>
          <img alt={Localize.text('{{coin}} image', 'balance', {coin: wallet.ticker})} srcSet={wallet.imagePath} style={{width: 32, height: 32}} />
          <h3 style={{fontSize: 24, lineHeight: '32px', marginLeft: 10}}>{wallet.name}</h3>
        </div>
        <div className={'d-flex flex-row justify-content-between'}>
          <div className={'d-flex flex-column justify-content-start'}>
            <div style={{fontSize: 14}} className={'lw-color-secondary-2'}>{Localize.text('Total {{coin}} balance', 'balance', {coin: wallet.ticker})}:</div>
            <div><span style={{fontSize: 18, fontWeight: 'bold'}} className={'lw-text-primary text-monospace'}>{spendable}</span><span style={{marginLeft: 10, fontSize: 14}} className={'lw-color-secondary-2 text-monospace'}>{altCurrency} {altAmount.toFixed(2)}</span></div>
          </div>
          <div className={'d-flex flex-column justify-content-start lw-color-secondary-3'} style={{fontSize: 14, textAlign: 'right'}}>
            <div><Localize context={'balance'}>Website</Localize>: {website ? <a className={'lw-text-primary'} href={'#'}>blocknet.co</a> : <span className={'lw-text-primary'}>{Localize.text('Unknown', 'balance')}</span>}</div>
            <div><Localize context={'balance'}>Explorer</Localize>: <a onClick={onExplorerClick} className={'lw-text-primary'} href={'#'}>{explorerLink}</a></div>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className={'lw-balance-outer-container'}>
        <div className={'lw-balance-note'}><Localize context={'balance'}>Total wallet balance</Localize></div>
        <div className={'lw-balance-container'}><h2 title={Localize.text('Total spendable:', 'balance') + ' ' + spendable}>{wallet.ticker} <span className={'text-monospace'}>{Number(total)}</span></h2> <h4>{altCurrency} <span className={'text-monospace'}>{altAmount.toFixed(2)}</span></h4></div>
      </div>
    );
  }
};
Balance.propTypes = {
  showCoinDetails: PropTypes.bool,
  activeWallet: PropTypes.string,
  altCurrency: PropTypes.string,
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  balances: PropTypes.instanceOf(Map),
  currencyMultipliers: PropTypes.object
};

Balance = connect(
  ({ appState }) => ({
    activeWallet: appState.activeWallet,
    altCurrency: appState.altCurrency,
    wallets: appState.wallets,
    balances: appState.balances,
    currencyMultipliers: appState.currencyMultipliers
  })
)(Balance);

export default Balance;
