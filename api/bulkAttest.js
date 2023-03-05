/* 
node bulkAttest.js \
-r ws://localhost:8545 \
-p 0x351cff2a18f81c9ae9f3d1d6f41526e723de270a59c5939f53c1c2f7d159d1bd \
-c /tmp/gt-lens-top100.csv \
-s 1 \
-a owner_address \
-d v
*/
const csvToJson = require('csvtojson');
const yargs = require("yargs");
const util = require('./util');

const options = yargs
  .usage("Usage: -r <rpc-url> " +
    "-p <private-key> -c <csv-file> -s <schema-id> " +
    "-a <attestee-column> -d <data-column>")
  .option("r", { alias: "rpc-url", describe: "RPC Url to connect with blockchain", type: "string", demandOption: true })
  .option("p", { alias: "private-key", describe: "Private key", type: "string", demandOption: true })
  .option("c", { alias: "contract", describe: "Contract address", type: "string", demandOption: true })
  .option("f", { alias: "csv-filepath", describe: "Path to csv file", type: "string", demandOption: true })
  .option("s", { alias: "schema-id", describe: "Schema Id", type: "string", demandOption: true })
  .option("a", {
    alias: "attestee-column",
    describe: "Column header that has attesstee addresses",
    type: "string",
    demandOption: true
  })
  .option("d", {
    alias: "data-column",
    describe: "Column header that has attestation data",
    type: "string",
    demandOption: true
  })
  .argv;

console.log(options);

async function mapColumns(schemaId, record) {
  const ownerAddress = await util.getOwnerAddress();
  return {
    schemaId: schemaId,
    publisher: ownerAddress,
    from: ownerAddress,
    recipient: record[options.attesteeColumn],
    data: record[options.dataColumn]
  }
}

(async () => {
  console.log("Initializing web3 client");
  process.env['CONTRACT_ADDRESS'] = options.contract;
  await util.init(options.rpcUrl, options.privateKey);

  console.log("Reading csv from file");
  const jsonArray = await csvToJson().fromFile(options.csvFilepath);

  console.log("Creating attestation records");
  const attestations = await Promise.all(jsonArray.map(x => mapColumns(options.schemaId, x)));
  const _attestations = attestations.map(util.mapToAttestation);

  console.log("Publishing attestations");
  await util.publishBulkAttestations(options.schemaId, _attestations);
  console.log("Published attestations to blockchain");
  process.exit();
})();