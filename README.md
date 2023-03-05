# Trustmaze

Enabling an Open Ranking and Reputation system using on-chain attestations

### Setup local environment

```
npm install
cd api && npm install
```

### Deploy contract locally

```
npx hardhat node # Start localnet
npx hardhat run scripts/deploy.js --network localhost # deploy the contract
```

### Deploy contracts to Polygon Mumbai testnet

```
cp .env.template .env
vi .env # add your private key
npx hardhat run scripts/deploy.js --network matic
```

### Interact with the contract using the CLI tool

```
cd api
npm install
cp .env.example .env
vi .env # edit the file with the deployed contract
node attestationCLI.js
```

- Register a schema

```

? Enter the provider url ws://127.0.0.1:8545
? Choose an operation: registerSchema
Operation: registerSchema
registerSchema
? Specify a namespace key of length 31 chars or less (e.g., io.k3l.atstn.eigen): s5
? Select a Schema Type: JSON
? Specify a definition ({"rationale":{"type":"string"}}): a5
```

- Verify schema exists

```
? Enter the provider url ws://127.0.0.1:8545
? Choose an operation: getSchemaById
Operation: getSchemaById
getSchemaById
? Id of the schema: 1
{
	schemaId: '1',
	creator: '0x98D300abE3843e7c7aA3Eb471FCBEA8Ed06A20a1',
	key: 's1',
	schemaType: 'CUSTOM',
	definition: 'a1'
}
```

- Publish an attestation

```

? Enter the provider url ws://127.0.0.1:8545
? Choose an operation: publishAttestation
Operation: publishAttestation
publishAttestation
? Address of attestor: 0xb559Eb65B74fBCDE44dc754f92C47Ec73628b056
? Address of attestee: 0xc7aA28c34AC556921e2A1ff0eAE3f87F652873b5
? Id of the schema: 1
? Attestation data ({"rationale":"Strong EigenTrust Relationship"}): hi
Transaction sent, hash is 0x2e79e0baa95e0eb861b4f537bdc8293cb3497a59b240741fc7b0ab2da6a71edc

```

- Publish bulk sample attestations

```

? Enter the provider url ws://127.0.0.1:8545
? Choose an operation: publishBulkAttestations
Operation: publishBulkAttestations
publishBulkAttestations
? Id of the schema: 1
[
{
from: '0xb559Eb65B74fBCDE44dc754f92C47Ec73628b056',
recipient: '0xc7aA28c34AC556921e2A1ff0eAE3f87F652873b5',
data: 'Hello'
},
{
from: '0x27c508ffC38d9926C2C3877DeAf66B7eBd94e13a',
recipient: '0xcB9A5019b1ACd05A3d8814c542cAb6D0133cd0A9',
data: 'Allo'
}
]
Transaction sent, hash is 0xe4d1c89cd5b20c2e376a021f8cd456051b21f243a476bceec794949192688161

```

- Get attestation data

```

? Enter the provider url ws://127.0.0.1:8545
? Choose an operation: getAttestationData
Operation: getAttestationData
getAttestation
? Address of publisher: 0x98D300abE3843e7c7aA3Eb471FCBEA8Ed06A20a1
? Address of attestor: 0xb559Eb65B74fBCDE44dc754f92C47Ec73628b056
? Address of recipient: 0xc7aA28c34AC556921e2A1ff0eAE3f87F652873b5
? Id of the schema: 1
hi

```

## Bulk CSV Upload tool

GENERATE CSV using SQL from LensDB:

- Generate the attestations CSV (with a header).

```
node bulkAttest.js -r ws://localhost:8545 \
	-p {PRIVATE_KEY} -c ${CONTRACT_ADDRESS} \
	-f {CSV} -s 1 -a owner_address -d v
```
