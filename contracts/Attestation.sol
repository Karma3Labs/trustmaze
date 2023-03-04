// SPDX-License-Identifier: MIT
pragma solidity >=0.8.12 <0.9.0;

import "./SchemaRegistry.sol";


/** 
 * @title Attestations
 * @notice Contract used to publish attestations.
 * @custom:beta
 */
 contract Attestation is SchemaRegistry {
  string public constant SEMVER = "0.1.0";

  struct AttestationRecord {
    uint256 schemaId;
    address publisher;
    address from;
    address recipient;
    string data;
  }

  event AttestationPublished(
    address indexed publisher,
    address indexed from,
    address indexed recipient,
    uint256 schemaId,
    string data
  );

  AttestationRecord[] public attestations;
  uint256 attestationCount = 0; 
  mapping(uint256 => uint256[]) public attestationIdxBySchemaId;
  mapping(address => uint256[]) public attestationIdxByPublisher;

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
    string memory _data
  ) public {
    require(
      _from != address(0) && _from != address(0),
      "Zero addresses not allowed" //26 bytes < 1 slot
    ); 
    require(schemaIds[_schemaId] != 0x00, "Invalid _schemaId");
    
    attestations.push(AttestationRecord({
      schemaId: _schemaId,
      publisher: msg.sender,
      from: _from,
      recipient: _recipient,
      data: _data
    }));

    attestationIdxByPublisher[msg.sender].push(attestationCount);
    attestationIdxBySchemaId[_schemaId].push(attestationCount);
    attestationCount++;

    emit AttestationPublished(msg.sender, _from, _recipient, _schemaId, _data);
  }

  // TODO: Remove schemaId
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

  /**
    * @notice Get all attestations published by a publisher.
    * @param _schemaId Valid schema defined in the Schema registry. 
    * @return AttestationRecord[] Array of attestation records.
    */
  function getAttestationsBySchemaId(uint256 _schemaId) external view returns (AttestationRecord[] memory) {
    uint256[] memory attestationIdxs = attestationIdxBySchemaId[_schemaId];
    uint256 length = attestationIdxs.length;
    AttestationRecord[] memory _attestations = new AttestationRecord[](length);

    for (uint256 i = 0; i < length;) {
      _attestations[i] = attestations[attestationIdxs[i]];
      unchecked {
        ++i;
      }
    }
    return _attestations;
  }

  /**
   * @notice Get all attestations published by a publisher.
   * @param _publisher Address of the publisher.
   * @return AttestationRecord[] Array of attestation records.
   */
  function getAttestationsByPublisher(address _publisher) external view returns (AttestationRecord[] memory) {
    uint256[] memory attestationIdxs = attestationIdxByPublisher[_publisher];
    uint256 length = attestationIdxs.length;
    AttestationRecord[] memory _attestations = new AttestationRecord[](length);

    for (uint256 i = 0; i < length;) {
      _attestations[i] = attestations[attestationIdxs[i]];
      unchecked {
        ++i;
      }
    }
    return _attestations;
  }
}
