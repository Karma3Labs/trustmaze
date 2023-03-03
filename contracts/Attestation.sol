// SPDX-License-Identifier: MIT
pragma solidity >=0.8.12 <0.9.0;

import "./SchemaRegistry.sol";


/** 
 * @title Attestations
 * @notice Contract used to publish attestations.
 * @custom:beta
 */
 contract Attestation is SchemaRegistry {
  /*
    * TODO gas optimizations
    * 1. 
  */

  string public constant SEMVER = "0.1.0";

  //Not used for storage. Used just for function calls.
  struct AttestationRecord {
    address from; // 20 bytes
    address recipient; // 20 bytes
    bytes data;
  }

// TODO revisit this mapping path after implementing read/publish functions
/**
  * @notice Maps Publisher => From => Recipient => Schema ID => Data
 */
  mapping(address => mapping(address => mapping(address => mapping(uint256 => bytes)))) public attestations;

  // TODO do we need attestation data in the Event ? 
  // Gas costs when emitting events. 
  // We can emit without data and let clients read from blockchain if needed.
  // Read from blockchain is gas free but may incur API costs from provider (e.g., Alchemy API costs)
  event AttestationPublished(
    address indexed publisher,
    address indexed from,
    address indexed recipient,
    uint256 schemaId,
    bytes data
  );

  /**
    * Emits a {AttestationPublished} event.
    * @dev Currently msg.sender, _from, and _recipient can all be the same address, even another contract address.
    * @notice Publish an attestation or update if an attestaion is already published. 
    * @param _from Address that is providing the attestation.
    * @param _recipient Address that the attestation is about.
    * @param _schemaId Valid schema defined in the Schema registry.
    * @param _data Attestation data that conforms to the schema.
    */
  function attest(
    address _from,
    address _recipient,
    uint256 _schemaId,
    bytes memory _data
  ) public {
    require(
      _from != address(0) && _from != address(0),
      "Zero addresses not allowed" //26 bytes < 1 slot
    ); 
    require(schemaIds[_schemaId] != 0x00, "Invalid _schemaId");
    
    attestations[msg.sender][_from][_recipient][_schemaId] = _data;

    emit AttestationPublished(msg.sender, _from, _recipient, _schemaId, _data);
  }

  function attestBatch(uint256 _schemaId, AttestationRecord[] calldata _attestations) external {
    uint256 length = _attestations.length;
    for (uint256 i = 0; i < length;) {
      AttestationRecord memory attestation = _attestations[i];
      attest(attestation.from, attestation.recipient, _schemaId, attestation.data);
      unchecked {
        ++i;
      }
    }
  }

  function getAttestationData(    
    address _publisher,
    address _from,
    address _recipient,
    uint256 _schemaId) 
  external view 
  returns (
    bytes memory data
  )
  {
    bytes storage _data = attestations[_publisher][_from][_recipient][_schemaId];
    require(_data.length > 0, "Invalid input params");
    return _data;
  }
}