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
    * 2. consider using enum (uint8) instead of string for schemaType
    * 3. remove key from Schema struct because it is redundant 
    * 4. rearrange struct fields for better packing
  */
  uint256 private _schemaIdCounter;

  //TODO should this be enums
  mapping(string => uint8) public schemaTypes;
  enum SchemaType { CUSTOM, JSON, YAML }

  struct Schema {
    uint256 schemaId; 
    address creator;
    string key; 
    SchemaType schemaType;
    string definition;
  }

  mapping(bytes32 => Schema) public schemas; 
  mapping(uint => bytes32) public schemaIds; 

  event SchemaRegistered(
    uint256 schemaId,
    address indexed creator,
    string key,
    SchemaType schemaType,
    string definition
  );

  function registerSchema(
    string memory _key, 
    SchemaType _schemaType, 
    string memory _definition
  ) external onlyOwner {

    bytes32 hashed = keccak256(abi.encode(msg.sender, _key));
    require(schemas[hashed].schemaId == 0, "Schema already exists");

    _schemaIdCounter++;

    schemas[hashed] = Schema(_schemaIdCounter, msg.sender, _key, _schemaType, _definition);
    schemaIds[_schemaIdCounter] = hashed;

    emit SchemaRegistered(_schemaIdCounter, msg.sender, _key, _schemaType, _definition);
  } 

  function getSchemaById(uint256 _schemaId) external view 
  returns (Schema memory)
  {
    bytes32 hashed = schemaIds[_schemaId];
    require(hashed != 0x00, "Invalid Schema Id");

    Schema storage _schema = schemas[hashed];
    return (_schema);
  }
}