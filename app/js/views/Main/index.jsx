import React, { Component } from 'react';
import _ from 'lodash';
import { ChainStore, TransactionBuilder, PrivateKey } from 'graphenejs-lib';
import utils from '../../utils';

class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {
      objectIdTextInputValue: '',
      orderList: [],
      orderCancelInProgressList: [],
    };
    this._makeOpenOrder = this._makeOpenOrder.bind(this);
    this._onObjectIdTextInputChange = this._onObjectIdTextInputChange.bind(this);
    this._getObject = this._getObject.bind(this);
    this._cancelOrder = this._cancelOrder.bind(this);
    this._renderOrderList = this._renderOrderList.bind(this);
    this._getAccount = this._getAccount.bind(this);
  }

  componentWillMount() {
    // Hacky way to check if it is connected to blockchain, temporary fix
    const object = ChainStore.getObject('2.1.0');
    if (!object) this.context.router.push('/');
  }

  _getObject() {
    const object = ChainStore.getObject(this.state.objectIdTextInputValue);
    console.log('Object ' + this.state.objectIdTextInputValue + ':\n', object ? object.toJS() : object);
  }

  _getCurrentBlockchainData() {
    const object = ChainStore.getObject('2.1.0');
    console.log('Current Blockchain data:\n', object ? object.toJS() : object);
  }

  _getGlobalParameter() {
    const object = ChainStore.getObject('2.0.0');
    console.log('Blockchain Global Parameter:\n', object ? object.toJS() : object);
  }

  _getAccount() {
    const object = ChainStore.getAccount('1.2.153075');
    console.log('Account:\n', object ? object.toJS() : object);
    if (object) {
      console.log(object.get('orders').toJS());
      this.setState({ orderList: object.get('orders').toJS() });
    }
  }

  _getBuyAndSellAsset() {
    const sellAsset = ChainStore.getAsset('1.3.0'); // Core token
    const buyAsset = ChainStore.getAsset('1.3.121'); // BitUSD
    console.log('Buy Asset:\n', buyAsset ? buyAsset.toJS() : buyAsset);
    console.log('Sell Asset:\n', sellAsset ? sellAsset.toJS() : sellAsset);
  }


  _processTransaction(tr, callback) {
    console.log('BROADCAST TRANSACTION');
    // In this case, both public key and private key is hardcoded
    const ii5PublicKeys = ['BTS76Ht7MbK6hDqGSdJvXnrmmUU2v9XfNZRJVaf6E4mAHUpCcfc8G'];
    const ii5PrivateKey = PrivateKey.fromWif('5JxYc27FySQWqacFWogGqTjuV6mhVoceao5bZFTsJ3v9kTgK8Hj');

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
        tr.get_required_signatures(myPubKeys).then((requiredPubKeys) => {
          console.log(requiredPubKeys);
          _.forEach(requiredPubKeys, (requiredPubKey) => {
            // Hardcode private key
            tr.add_signer(ii5PrivateKey, requiredPubKey);
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
        console.log(error);
        callback(false);
      });
    }).catch((error) => {
      console.log('CAUGHT AN ERROR');
      console.log(error);
      callback(false);
    });
  }

  _makeOpenOrder() {
    console.log('MAKE OPEN ORDER');
    const sellAssetAmount = 0.12;
    const sellAsset = ChainStore.getAsset('1.3.0'); // Core token
    const buyAssetAmount = 0.12;
    const buyAsset = ChainStore.getAsset('1.3.121'); // BIT USD
    const accountId = '1.2.153075'; // this is ii-5 account id
    const sellAssetSatoshiAmount = utils.get_satoshi_amount(sellAssetAmount, sellAsset);
    const buyAssetSatoshiAmount = utils.get_satoshi_amount(buyAssetAmount, buyAsset);
    const expiration = new Date();
    expiration.setYear(expiration.getFullYear() + 5);
    const fillOrKill = false; // Don't know what this one is used for, but from the wallet, "false" value is always used
    const feeId = '1.3.0'; // Just use core token to pay the fee

    // Make transaction
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
    this._processTransaction(tr, (success) => {
      if (success) {
        // Refresh order list by getting account info
        this._getAccount();
      }
    });
  }

  _onObjectIdTextInputChange(event) {
    const text = event.target.value;
    this.setState({ objectIdTextInputValue: text });
  }
  render() {
    return (
      <div className='Main'>
        <div>
          Welcome To Blockchain
        </div>
        <div>
          <label>
            {'Object Id:'}
            <input type='text' name='objectId' value={ this.state.objectIdTextInputValue } onChange={ this._onObjectIdTextInputChange } />
          </label>
          <button onClick={ this._getObject } disabled={ !this.state.objectIdTextInputValue }>
            {'Get Object ' + this.state.objectIdTextInputValue }
          </button>
        </div>
        <input type='submit' value='Get Object Info' />
        <button onClick={ this._getCurrentBlockchainData }>
          {'Get Object 2.1.0 (Current Blockchain data)'}
        </button>
        <button onClick={ this._getGlobalParameter }>
          {'Get Object 2.0.0 (Blockchain Global Parameter)'}
        </button>
        <button onClick={ this._getAccount }>
          {'Get Account'}
        </button>
        <button onClick={ this._getBuyAndSellAsset }>
          {'Get Buy and Sell Asset'}
        </button>
        <button onClick={ this._makeOpenOrder }>
          {'Make Open Order'}
        </button>
        { this._renderOrderList()}
      </div>
    );
  }

  _cancelOrder(orderId) {
    const accountId = '1.2.153075'; // this is ii-5 account id
    const feeId = '1.3.0';
    const tr = new TransactionBuilder();
    tr.add_type_operation('limit_order_cancel', {
      fee: {
        amount: 0,
        asset_id: feeId,
      },
      fee_paying_account: accountId,
      order: orderId,
    });

    let orderCancelInProgressList = this.state.orderCancelInProgressList;
    orderCancelInProgressList = _.concat(orderCancelInProgressList, orderId);
    this.setState({ orderCancelInProgressList });
    this._processTransaction(tr, () => {
      // Remove order id from order in progress list
      orderCancelInProgressList = _.remove(orderCancelInProgressList, orderId);
      this.setState({ orderCancelInProgressList });
      // Refresh order list by fetching account information
      this._getAccount();
    });
  }

  _renderOrderList() {
    if (!_.isEmpty(this.state.orderList)) {
      const orderListItems = _.map(this.state.orderList, (orderId) => {
        const disabled = _.includes(this.state.orderCancelInProgressList, orderId);
        return (
          <div key={ orderId }>
            <span key={ orderId + 'label' }>{'Order Id : ' + orderId }</span>
            <button key={ orderId + 'button' } disabled={ disabled } onClick={ () => { this._cancelOrder(orderId); } }>
              {'Cancel Order'}
            </button>
          </div>
        );
      });
      return (
        <div>
          <div>------------------------</div>
          <div>{'Order List'}</div>
          <div>{ orderListItems }</div>
        </div>
      );
    }
  }

}

Main.contextTypes = {
  router: React.PropTypes.object,
};

export default Main;
