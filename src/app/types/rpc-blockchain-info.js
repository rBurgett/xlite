// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
class RPCBlockchainInfo {

  /**
   * @type {string}
   */
  chain = '';

  /**
   * @type {number}
   */
  blocks = 0;

  /**
   * @type {number}
   */
  headers = 0;

  /**
   * @type {number}
   */
  verificationProgress = 0;

  /**
   * @type {number}
   */
  difficulty = 0;

  /**
   * @type {boolean}
   */
  initialBlockDownload = false;

  /**
   * @type {boolean}
   */
  pruned = false;

  /**
   * @param data {Object}
   */
  constructor(data) {
    Object.assign(this, data);
  }

}

export default RPCBlockchainInfo;
