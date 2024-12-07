// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ITestUSDC.sol";

contract TestUSDC is ERC20, Ownable, ITestUSDC {
    constructor() ERC20("Test USDC", "tUSDC") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) external override onlyOwner returns (bool) {
        _mint(to, amount);
        return true;
    }

    function burn(uint256 amount) external override returns (bool) {
        _burn(msg.sender, amount);
        return true;
    }

    function decimals() public pure override(ERC20, ITestUSDC) returns (uint8) {
        return 6;
    }
} 