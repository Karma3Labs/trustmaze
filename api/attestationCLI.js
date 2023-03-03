require('dotenv').config();
const csvToJson = require('csvtojson');
const inquirer = require('inquirer');

const util = require('./util');

let testAccounts;


async function init(provider_url) {
  await util.init(provider_url, process.env.PRIVATE_KEY);
  testAccounts = await util.getTestAccounts();
  return true;
}

async function registerSchema() {
  console.log('registerSchema');
  await inquirer.prompt([
    {
      type: 'input',
      name: 'schemaKey',
      message: 'Specify a namespace key of length 31 chars or less (e.g., io.k3l.atstn.eigen):',
      validate: (input) => {return input.length <= 31 ? true: false}, 
    },
    {
      type: 'rawlist',
      name: 'schemaType',
      message: 'Select a Schema Type:',
      choices: ['GENERIC', 'JSON', 'YAML'], 
    },
    {
      type: 'input',
      name: 'schemaDefinition',
      message: 'Specify a definition ({"rationale":{"type":"string"}}):',
      // required field and work around bug in web3js ABICoder.encodeParameters 
      // that assumes bytes parameter is of length >= 2
      validate: (input) => {return input.length > 1 ? true: false},  
    },
  ])
  .then(async (answers) => {
    return await util.registerSchema(answers.schemaKey, answers.schemaType, answers.schemaDefinition);
  })
  .catch();
}

async function getSchemaById() {
  console.log('getSchemaById');
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'schemaId',
      message: 'Id of the schema:',
      default: '1',
      validate: (input) => {return parseInt(input) > 0},
    },
  ]);
  console.log(await util.getSchemaById(answers.schemaId));
}

async function publishAttestation() {
  console.log('publishAttestation');
  await inquirer.prompt([
    {
      type: 'rawlist',
      name: 'from',
      message: 'Address of attestor:',
      choices: testAccounts,
    },
    {
      type: 'rawlist',
      name: 'recipient',
      message: 'Address of attestee:',
      choices: testAccounts,
    },
    {
      type: 'input',
      name: 'schemaId',
      message: 'Id of the schema:',
      default: '1',
      validate: (input) => {return parseInt(input) > 0},
    },
    {
      type: 'input',
      name: 'data',
      message: 'Attestation data ({"rationale":"Strong EigenTrust Relationship"}):',
      validate: (input) => {return input ? true: false}, // required field
    },
  ])
  .then(async (answers) => {
    return await util.publishAttestation(
      answers.from, answers.recipient, answers.schemaId, answers.data);
  })
  .catch();  
}

async function publishBulkAttestations() {
  console.log('publishBulkAttestations');
  const answers =  await inquirer.prompt([
    {
      type: 'input',
      name: 'schemaId',
      message: 'Id of the schema:',
      default: '1',
      validate: (input) => {return parseInt(input) > 0},
    },
  ]);
  const sampleAttestations = [
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
  ];
  console.log(sampleAttestations);
  const _attestations = sampleAttestations.map(util.mapToAttestation)
  return await util.publishBulkAttestations(answers.schemaId, _attestations);
}

async function publishBulkAttestationsFromCSV() {
  console.log('publishBulkAttestationsFromCSV');
  await inquirer.prompt([
    {
      type: 'input',
      name: 'schemaId',
      message: 'Id of the schema:',
      default: '1',
      validate: (input) => {return parseInt(input) > 0},
    },
    {
      type: 'rawlist',
      name: 'attestor',
      message: 'Address of attestor:',
      choices: testAccounts,
    },    
    {
      type: 'input',
      name: 'csvFilepath',
      message: 'Filepath of CSV:',
      validate: (input) => {return input ? true : false},
    },
    {
      type: 'input',
      name: 'attestee',
      message: 'Attestee column name:',
      validate: (input) => {return input ? true : false},
    },   
    {
      type: 'input',
      name: 'value',
      message: 'Value column name:',
      validate: (input) => {return input ? true : false},
    },    
  ])
  .then(async (answers) => {
    const jsonArray = await csvToJson().fromFile(answers.csvFilepath);
    const attestations = jsonArray.map((record) => {
      return {
        from: answers.attestor,
        recipient: record[answers.attestee],
        data: record[answers.value]
      }
    })
    const _attestations = attestations.map(util.mapToAttestation);
    return await util.publishBulkAttestations(answers.schemaId, _attestations);  
  })
  .catch();  
}

async function getAttestationData() {
  console.log('getAttestation');
  await inquirer.prompt([
    {
      type: 'rawlist',
      name: 'publisher',
      message: 'Address of publisher:',
      choices: testAccounts,
    },
    {
      type: 'rawlist',
      name: 'from',
      message: 'Address of attestor:',
      choices: testAccounts,
    },
    {
      type: 'rawlist',
      name: 'recipient',
      message: 'Address of recipient:',
      choices: testAccounts,
    },
    {
      type: 'input',
      name: 'schemaId',
      message: 'Id of the schema:',
      default: '1',
      validate: (input) => {return parseInt(input) > 0},
    },
  ])
  .then(async (answers) => {
    console.log(await util.getAttestationData(
      answers.publisher, answers.from, answers.recipient, answers.schemaId));
  })
  .catch();  
}

(async () => {
  await inquirer
    .prompt([
      {
        type: 'input',
        name: 'provider_url',
        message: 'Enter the provider url',
        validate: (input) => init(input),
        default: 'ws://127.0.0.1:8545',
      },
    ]);

  const answers = await inquirer
    .prompt([
      {
        type: 'list',
        name: 'operation',
        message: 'Choose an operation:',
        choices: [
          'registerSchema', 
          'getSchemaById', 
          'publishAttestation', 
          'publishBulkAttestations',
          'publishBulkAttestationsFromCSV', 
          'getAttestationData',
        ],
      },
    ]);
    console.info('Operation:', answers.operation);
    switch (answers.operation) {
      case registerSchema.name:
        await registerSchema();
        break;
      case publishAttestation.name:
        await publishAttestation();
        break;
      case getSchemaById.name:
        await getSchemaById();
        break;
      case publishBulkAttestations.name:
        await publishBulkAttestations();
        break;
      case publishBulkAttestationsFromCSV.name:
        await publishBulkAttestationsFromCSV();
        break;
        case getAttestationData.name:
        await getAttestationData();
        break;
      default:
        ;
    }

  process.exit();
})();
