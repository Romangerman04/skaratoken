pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

/**
 * @title PreSale
 * @dev Manages a presale list of contributors with investment boundaries
 */
contract PreSale is Ownable {

  mapping(address => uint256) presalers; 

  function addPresaler(address investor, uint256 boundary) public onlyOwner {
    _addPresaler(investor, boundary);
  }

  function _addPresaler(address investor, uint256 boundary) internal {
    presalers[investor] = boundary;
  }


  function removePresaler(address investor) public onlyOwner {
    delete presalers[investor];
  }

  function getPresaleBoundary(address investor) public view returns (uint256) {
    uint256 boundary = presalers[investor];
    return boundary;
  }

  function isPresaler(address investor) public view returns (bool) {
    return presalers[investor] != 0;
  }


}