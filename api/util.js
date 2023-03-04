const _ = require('underscore');
const Web3 = require('web3');

const SCHEMA_TYPES = {
  GENERIC: 0,
  JSON: 1,
  YAML: 2,
}

const AttestationJSON = require('./Attestation.json');

let web3;
let contract;
let owner;

async function init(provider_url, owner_private_key) {
  web3 = new Web3(provider_url);
  web3.eth.handleRevert = true;
  contract = new web3.eth.Contract(AttestationJSON.abi, process.env.CONTRACT_ADDRESS);
  owner = web3.eth.accounts.privateKeyToAccount(owner_private_key);
  web3.eth.accounts.wallet.add(owner_private_key); //add key to wallet so txn automatically signed
  // TODO set an upper threshold for how much gas is acceptable 
  return true;
}

async function getOwnerAddress() {
  return owner.address;
}

async function getTestAccounts() {
  const testAccounts = await web3.eth.getAccounts().then(value => { return value });
  return testAccounts;
}

async function registerSchema(schemaKey, schemaType, schemaDefinition) {
  // schemaType = ethers.encodeBytes32String(schemaType);
  // schemaDefinition = ethers.toUtf8Bytes(schemaDefinition);
  const _schemaDefinition = Web3.utils.asciiToHex(schemaDefinition);
  const estimatedGas = await contract.methods
    .registerSchema(schemaKey, schemaType, _schemaDefinition)
    .estimateGas({ from: owner.address })
    .catch(handleWeb3Error);
  const nonce = await web3.eth.getTransactionCount(owner.address, 'latest');
  const tx = {
    from: owner.address,
    to: contract.options.address,
    gas: estimatedGas,
    data: contract.methods.registerSchema(schemaKey, schemaType, _schemaDefinition).encodeABI(),
    nonce: nonce,
  };
  // private key added to wallet in init. No explicit signing required.
  // const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY);
  const receipt = await web3.eth.sendTransaction(tx).catch(handleWeb3Error);
  console.log(`Transaction sent, hash is ${receipt.transactionHash}`);
  return; //TODO return schemaId from tx receipt
}

async function getSchemaById(schemaId) {
  const result = await contract.methods.getSchemaById(schemaId).call();
  result.schemaType = SCHEMA_TYPES[result.schemaType];
  const schema = _.omit(result, '0', '1', '2', '3', '4');
  schema.definition = Web3.utils.hexToAscii(schema.definition);
  return schema;
}

async function publishAttestation(from, recipient, schemaId, data) {
  // const _data = ethers.toUtf8Bytes(data);
  const _data = Web3.utils.asciiToHex(data);
  const estimatedGas = await contract.methods
    .attest(from, recipient, schemaId, _data)
    .estimateGas({ from: owner.address })
    .catch(handleWeb3Error);
  const nonce = await web3.eth.getTransactionCount(owner.address, 'latest');
  const tx = {
    from: owner.address,
    to: contract.options.address,
    gas: estimatedGas,
    data: contract.methods.attest(from, recipient, schemaId, _data).encodeABI(),
    nonce: nonce,
  };
  // private key added to wallet in init. No explicit signing required.
  // const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY);
  const receipt = await web3.eth.sendTransaction(tx).catch(handleWeb3Error);
  console.log(`Transaction sent, hash is ${receipt.transactionHash}`);
}

async function publishBulkAttestations(schemaId, attestations) {
  const estimatedGas = await contract.methods
    .attestBatch(schemaId, attestations)
    .estimateGas({ from: owner.address })
    .catch(handleWeb3Error);
  const nonce = await web3.eth.getTransactionCount(owner.address, 'latest');
  const tx = {
    from: owner.address,
    to: contract.options.address,
    gas: estimatedGas,
    data: contract.methods.attestBatch(schemaId, attestations).encodeABI(),
    nonce: nonce,
  };
  // private key added to wallet in init. No explicit signing required.
  // const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY);
  const receipt = await web3.eth.sendTransaction(tx).catch(handleWeb3Error);
  console.log(`Transaction sent, hash is ${receipt.transactionHash}`);
}

function mapToAttestation(record) {
  return {
    ...record,
    data: Web3.utils.asciiToHex(record.data) // byte -> string
  }
}

async function getAttestationData(publisher, from, recipient, schemaId) {
  const result = await contract.methods.getAttestationData(
    publisher, from, recipient, schemaId).call();
  return Web3.utils.hexToAscii(result);
}

function handleWeb3Error(err) {
  if (err.__proto__.name === "Error") {
    const startJSON = err.message.indexOf("{");
    if (startJSON > -1) {
      const errmsg = err.message.slice(0, startJSON).trim();
      const endJSON = err.message.lastIndexOf("}");
      if (endJSON > -1) {
        const errJSON = JSON.parse(err.message.substring(startJSON, endJSON + 1))
        console.error(`Web3 Error: ${JSON.stringify(errJSON)}`);
      }
      throw new Error(errmsg);
    }
    throw new Error(err.message);
  }
  throw new Error({ cause: err });
}

module.exports = {
  SCHEMA_TYPES,
  init,
  getOwnerAddress,
  getTestAccounts,
  registerSchema,
  getSchemaById,
  publishAttestation,
  mapToAttestation,
  publishBulkAttestations,
  getAttestationData
}