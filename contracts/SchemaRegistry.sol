// SPDX-License-Identifier: MIT
pragma solidity >=0.8.12 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SchemaRegistry is Ownable {
  /* 
    * TODO open access to everyone or to a trusted few ?
    * everyone -> remove `is Ownable` and `onlyOwner`
    * trusted few -> 
    * * 1. inherit AccessControl 
    * * 2. implement registrarApprovals and REGISTRAR_ROLE
    * * // bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    * * // mapping(address => bool)) private _registrarApprovals;
  */
  /*
    * TODO gas optimizations if we decide to open up Schema Registry to everyone
    * 1. consider using SmallCounters (uint32) for schemaId
    * 2. consider using enum (uint8) instead of string for schemaType
    * 3. remove key from Schema struct because it is redundant 
    * 4. rearrange struct fields for better packing
  */
  using Counters for Counters.Counter;
  Counters.Counter private _schemaIdCounter;

  //TODO should this be enums
  mapping(string => uint8) public schemaTypes;

  struct Schema {
    uint256 schemaId; 
    address creator;
    string key; 
    string schemaType;
    bytes definition;
  }

  mapping(bytes32 => Schema) public schemas; 
  mapping(uint => bytes32) public schemaIds; 

  event SchemaRegistered(
    uint256 schemaId,
    address indexed creator,
    string indexed keyIndexed, //hashed
    string key, // raw
    string indexed schemaTypeIndexed,
    string schemaType,
    bytes definition
  );
  
  constructor() {
    schemaTypes['CUSTOM']= 0;
    schemaTypes['JSON'] = 1;
    schemaTypes['YAML'] = 2;
    schemaTypes['PROTO'] = 3;
  }

  //TODO return schemaId
  function registerSchema(
    string memory _key, 
    string memory _schemaType, 
    bytes memory _definition
  ) external onlyOwner {

    bytes32 hashed = keccak256(abi.encode(msg.sender, _key));
    require(schemas[hashed].schemaId == 0, "Schema already exists");

    string memory sType = schemaTypes[_schemaType] == 0 ? 'CUSTOM' : _schemaType;

    _schemaIdCounter.increment(); // IDs start from 1
    uint256 schemaId = _schemaIdCounter.current();

    Schema memory _schema = Schema(schemaId, msg.sender, _key, sType, _definition);

    schemas[hashed] = _schema;
    schemaIds[schemaId] = hashed;

    emit SchemaRegistered(schemaId, msg.sender, _key, _key, sType, sType, _definition);
  } 

  function getSchemaById(uint256 _schemaId) external view 
  returns (
    uint256 schemaId,
    address creator,
    string memory key,
    string memory schemaType,
    bytes memory definition

)
  {
    bytes32 hashed = schemaIds[_schemaId];
    require(hashed != 0x00, "Invalid Schema Id");

    Schema storage _schema = schemas[hashed];
    return (_schema.schemaId, _schema.creator, _schema.key, _schema.schemaType, _schema.definition);
  }
}