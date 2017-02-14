import React, { Component } from 'react';
import _ from 'lodash';
import { ChainStore, TransactionBuilder, PrivateKey } from 'graphenejs-lib';
import { Apis } from 'graphenejs-ws';
import utils from '../../utils';

class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {
      objectIdTextInputValue: '',
      orderList: [],
      orderCancelInProgressList: [],
      makeOpenOrderInProgress: false,
      fetchRecentHistoryInProgress: false,
      connectingToBlockchain: false,
      connectedToBlockchain: false,
    };

    this._connectToBlockchain = this._connectToBlockchain.bind(this);
    this._makeOpenOrder = this._makeOpenOrder.bind(this);
    this._onObjectIdTextInputChange = this._onObjectIdTextInputChange.bind(this);
    this._getObject = this._getObject.bind(this);
    this._cancelOrder = this._cancelOrder.bind(this);
    this._renderOrderList = this._renderOrderList.bind(this);
    this._getListOfOpenOrders = this._getListOfOpenOrders.bind(this);
    this._fetchRecentTransactionHistory = this._fetchRecentTransactionHistory.bind(this);
  }

  componentWillMount() {
    // Hacky way to check if it is connected to blockchain
    // Since if we are not connected to blockchain, current blockchain data (object 2.1.0) is undefined
    const object = ChainStore.getObject('2.1.0');
    // Not connected to blockchain, go back to welcome page
    if (!object) this.context.router.push('/');
  }

  _connectToBlockchain() {
    // Mark connecting to blockchain
    this.setState({ connectingToBlockchain: true });
    // Open websocket connection
    Apis.instance('wss://bitshares.openledger.info/ws', true).init_promise.then((res) => {
      console.log('Connected to:', res[0].network);
      // Init chainstore
      ChainStore.init().then(() => {
        // Mark connected to blockchain
        this.setState({ connectingToBlockchain: false, connectedToBlockchain: true });
        console.log('Chainstore init success');
        return null;
      }).catch((error) => {
        console.log('Fail to init ChainStore');
        console.error(error);
        this.setState({ connectingToBlockchain: false });
      });
      return null;
    }).catch((error) => {
      console.log('Fail to connect to blockchain');
      console.error(error);
      this.setState({ connectingToBlockchain: false });
    });
  }

  _getObject() {
    const object = ChainStore.getObject(this.state.objectIdTextInputValue);
    if (object === undefined) {
      console.log('Fetching data in progress... Please try again in a moment...');
      return;
    } else if (object === null) {
      console.log('No such object');
      return;
    }
    console.log('Object ', this.state.objectIdTextInputValue + ':\n', object.toJS());
  }

  _getCurrentBlockchainData() {
    const object = ChainStore.getObject('2.1.0');
    if (!object) {
      console.log('Fetching data in progress... Please try again in a moment...');
      return;
    }
    console.log('Current Blockchain data:\n', object.toJS());
  }

  _getGlobalParameter() {
    const object = ChainStore.getObject('2.0.0');
    if (!object) {
      console.log('Fetching data in progress... Please try again in a moment...');
      return;
    }
    console.log('Blockchain Global Parameter:\n', object.toJS());
  }

  _getAccount() {
    const object = ChainStore.getAccount('1.2.153075'); // this is ii-5 account id
    if (!object) {
      console.log('Fetching data in progress... Please try again in a moment...');
      return;
    }
    console.log('Account:\n', object.toJS());
  }

  _fetchRecentTransactionHistory() {
    // It seems to fetch transaction history, one needs to have account stored in ChainStore cache first
    const account = ChainStore.getAccount('1.2.153075'); // this is ii-5 account id
    if (!account) {
      console.log('Fetching data in progress... Please try again in a moment...');
      return;
    }
    this.setState({ fetchRecentHistoryInProgress: true });
    // Unlike getObject or get Asset, fetchRecentHistory returns a Promise....
    // Honestly, I don't like this inconsistency... ._.
    ChainStore.fetchRecentHistory(account.get('id')).then((updatedAccount) => {
      this.setState({ fetchRecentHistoryInProgress: false });
      console.log('Transaction History:', updatedAccount.get('history').toJS());
    });
  }

  _getListOfOpenOrders() {
    const object = ChainStore.getAccount('1.2.153075'); // this is ii-5 account id
    if (!object) {
      console.log('Fetching data in progress... Please try again in a moment...');
      return;
    }
    const orderList = object.get('orders').toJS();
    console.log('Orders:\n', orderList);
    // Store order inside internal state
    this.setState({ orderList });
  }

  _processTransaction(tr, callback) {
    // In this case, both public key and private key are hardcoded
    const ii5PublicKeys = ['BTS76Ht7MbK6hDqGSdJvXnrmmUU2v9XfNZRJVaf6E4mAHUpCcfc8G'];
    const ii5PrivateKeys = {
      'BTS76Ht7MbK6hDqGSdJvXnrmmUU2v9XfNZRJVaf6E4mAHUpCcfc8G': PrivateKey.fromWif('5JxYc27FySQWqacFWogGqTjuV6mhVoceao5bZFTsJ3v9kTgK8Hj')
    };

    // Set required fees
    tr.set_required_fees().then(() => {
      // Get potential signatures
      // Inside, it's trying to ask the blockchain based on the seller account id attached in the transaction
      tr.get_potential_signatures().then(({ pubkeys }) => {
        // Check if none of the potential public keys is equal to our public keys
        const myPubKeys = _.intersection(pubkeys, ii5PublicKeys);
        if (_.isEmpty(myPubKeys)) {
          throw new Error('No Potential Signatures');
        }
        // Filter potential signatures to get required keys needed to sign the transaction
        tr.get_required_signatures(myPubKeys).then((requiredPubKeys) => {
          _.forEach(requiredPubKeys, (requiredPubKey) => {
            // Get private key pair
            const requiredPrivKey = ii5PrivateKeys[requiredPubKey];
            // Add signature
            tr.add_signer(requiredPrivKey, requiredPubKey);
          });
          // Broadcast transaction
          tr.broadcast().then((res) => {
            console.log('BROADCAST SUCCESS');
            console.log(res);
            callback(true);
          }).catch((error) => {
            console.log('BROADCAST FAIL');
            console.log(error);
            callback(false);
          });
        });
      }).catch((error) => {
        console.log('CAUGHT AN ERROR');
        console.error(error);
        callback(false);
      });
    }).catch((error) => {
      console.log('CAUGHT AN ERROR');
      console.error(error);
      callback(false);
    });
  }

  _makeOpenOrder() {
    const sellAsset = ChainStore.getAsset('1.3.0'); // Core token
    const buyAsset = ChainStore.getAsset('1.3.121'); // BIT USD
    if (!sellAsset || !buyAsset) {
      console.log('Fetching buying asset and sell asset in progress... Please try again in a moment...');
      return;
    }
    const sellAssetAmount = 0.0123;
    const buyAssetAmount = 0.0123;
    const accountId = '1.2.153075'; // this is ii-5 account id
    const sellAssetSatoshiAmount = utils.get_satoshi_amount(sellAssetAmount, sellAsset);
    const buyAssetSatoshiAmount = utils.get_satoshi_amount(buyAssetAmount, buyAsset);
    const expiration = new Date();
    expiration.setYear(expiration.getFullYear() + 5);
    const fillOrKill = false; // Don't know what this one is used for, but from the wallet, "false" value is always used
    const feeId = '1.3.0'; // Just use core token to pay the fee

    // Create transaction and add operation
    const tr = new TransactionBuilder();
    const operationParams = {
      fee: {
        amount: 0,
        asset_id: feeId,
      },
      seller: accountId,
      amount_to_sell: {
        amount: sellAssetSatoshiAmount,
        asset_id: sellAsset.get('id'),
      },
      min_to_receive: {
        amount: buyAssetSatoshiAmount,
        asset_id: buyAsset.get('id'),
      },
      expiration,
      fill_or_kill: fillOrKill,
      feeId,
    };
    tr.add_type_operation('limit_order_create', operationParams);

    // Mark open order in progress
    this.setState({ makeOpenOrderInProgress: true });
    // Process transaction
    this._processTransaction(tr, (success) => {
      // Mark open order in progress finish
      this.setState({ makeOpenOrderInProgress: false });
      if (success) {
        // Refresh order list
        this._getListOfOpenOrders();
      }
    });
  }

  _cancelOrder(orderId) {
    const accountId = '1.2.153075'; // this is ii-5 account id
    const feeId = '1.3.0'; // this is core asset (BTS)

    // Create transaction and add operation
    const tr = new TransactionBuilder();
    const operationParams = {
      fee: {
        amount: 0,
        asset_id: feeId,
      },
      fee_paying_account: accountId,
      order: orderId,
    };
    tr.add_type_operation('limit_order_cancel', operationParams);

    // Add order id to order in progress list, this disable the button
    let orderCancelInProgressList = this.state.orderCancelInProgressList;
    orderCancelInProgressList = _.concat(orderCancelInProgressList, orderId);
    this.setState({ orderCancelInProgressList });
    // Process transaction
    this._processTransaction(tr, () => {
      // Remove order id from order in progress list, this enable back the button
      orderCancelInProgressList = _.remove(orderCancelInProgressList, orderId);
      this.setState({ orderCancelInProgressList });
      // Refresh order list
      this._getListOfOpenOrders();
    });
  }

  _onObjectIdTextInputChange(event) {
    const text = event.target.value;
    this.setState({ objectIdTextInputValue: text });
  }

  _renderOrderList() {
    if (!_.isEmpty(this.state.orderList)) {
      const orderListItems = _.map(this.state.orderList, (orderId) => {
        const disabled = _.includes(this.state.orderCancelInProgressList, orderId);
        return (
          <div key={ orderId }>
            <span key={ orderId + 'label' }>{'Order Id: ' + orderId }</span>
            <button key={ orderId + 'button' } disabled={ disabled } onClick={ () => { this._cancelOrder(orderId); } }>
              {'Cancel Order'}
            </button>
          </div>
        );
      });
      return (
        <div>
          <div>------------------------------------------------</div>
          <div>{'Order List'}</div>
          <div>{ orderListItems }</div>
        </div>
      );
    }
    return null;
  }

  _renderConnectToBlockchainPage() {
    return (
      <div>
        <button onClick={ this._connectToBlockchain } disabled={ this.state.connectingToBlockchain }>
            {'Connect to Blockchain'}
        </button>
        {
          this.state.connectingToBlockchain ?
            <div>{'Connecting to Blockchain..... Please wait....'}</div>
            : null
        }
      </div>
    );
  }

  _renderMainPage() {
    return (
      <div>
        <div>
          {'Welcome To Blockchain! Use your Chrome Developer Tools\' Console to see the output'}
        </div>
        <div>------------------------------------------------</div>
        <div>
          <span>
            {'Object Id: '}
          </span>
          <input type='text' name='objectId' value={ this.state.objectIdTextInputValue } onChange={ this._onObjectIdTextInputChange } />
          <button onClick={ this._getObject } disabled={ !this.state.objectIdTextInputValue }>
            {'Get Object ' + this.state.objectIdTextInputValue }
          </button>
        </div>
        <div>------------------------------------------------</div>
        <div>
          <button onClick={ this._getCurrentBlockchainData }>
            {'Get Object 2.1.0 (Current Blockchain data)'}
          </button>
        </div>
        <div>
          <button onClick={ this._getGlobalParameter }>
            {'Get Object 2.0.0 (Blockchain Global Parameter)'}
          </button>
        </div>
        <div>
          <button onClick={ this._getAccount }>
            {'Get Account Info'}
          </button>
        </div>
        <div>
          <button onClick={ this._getListOfOpenOrders }>
            {'Get List of Open Orders'}
          </button>
        </div>
        <div>
          <button onClick={ this._fetchRecentTransactionHistory } disabled={ this.state.fetchRecentHistoryInProgress }>
            {'Fetch Recent Transaction History'}
          </button>
        </div>
        <div>
          <button onClick={ this._makeOpenOrder } disabled={ this.state.makeOpenOrderInProgress }>
            {'Make Open Order'}
          </button>
        </div>
        { this._renderOrderList()}
      </div>
    );
  }

  render() {
    const isConnectedToBlockchain = this.state.connectedToBlockchain;
    if (isConnectedToBlockchain) {
      return this._renderMainPage();
    } else {
      return this._renderConnectToBlockchainPage();
    }
  }
}

Main.contextTypes = {
  router: React.PropTypes.object,
};

export default Main;
