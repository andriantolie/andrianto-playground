# Andrianto's Playground

This is a simple project using React that tries to interact with bitshares blockchain using the graphenejs-lib. The operations included in this project are:
1. Connecting to bitshares blockchain
2. Get object given its id
3. Get current blockchain data
4. Get blockchain global parameter
5. Get account info (of a test account)
6. Get list of open orders (of test account)
7. Get recent transaction history (of test account)
7. Make open order (a transaction)
8. Cancel order (a transaction)

To run the project
```
npm install
npm start
```

Business logic of creating and broadcasting transaction:
1. Create new transaction object using TransactionBuilder from graphenejs-lib
2. Add the desired operation to the transaction object (e.g. make open order, cancel order, ...)
3. Ask blockchain for required fees (based on the operation added), and set the required fees to the transaction object
4. Ask blockchain for potential signatures (signature here is public key)
5. Filter the potential signatures, pick only potential signatures which private key is own by us
6. Use the filtered potential signatures to ask blockchain for the required signatures (in other words, further filtering by the blockchain)
7. Add the required signature (and the private key pair which we own) to the transaction object
8. Broadcast the transaction
