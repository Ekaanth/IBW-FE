// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CollateralManager is Ownable {
    IERC20 public testUSDC;
    IERC20 public testBNB;
    uint256 public priceBNB = 50; // Initial price of BNB in USD
    uint256 public collateralRatio = 200; // 200% collateralization

    event CollateralRatioBreached(uint256 currentRatio);
    event CollateralDeposited(address indexed user, uint256 bnbAmount, uint256 usdcAmount);

    constructor(address _testUSDC, address _testBNB) Ownable(msg.sender) {
        testUSDC = IERC20(_testUSDC);
        testBNB = IERC20(_testBNB);
    }

    // Combined function to deposit BNB and mint USDC
    function depositCollateralAndMintUSD(uint256 amountBNB) external {
        // First calculate how much USDC to mint
        uint256 bnbValueInUSD = (amountBNB * priceBNB) / 1e18;
        uint256 usdcToMint = bnbValueInUSD / 2; // 1:1 ratio with collateral value

        // Transfer BNB from user
        require(testBNB.transferFrom(msg.sender, address(this), amountBNB), "BNB Transfer failed");

        // Transfer equivalent USDC to user
        require(testUSDC.transfer(msg.sender, usdcToMint), "USDC Transfer failed");

        emit CollateralDeposited(msg.sender, amountBNB, usdcToMint);
    }

    function setPrice(uint256 _priceBNB) external onlyOwner {
        priceBNB = _priceBNB;
    }

    function checkCollateralRatio() external view returns (uint256) {
        uint256 totalCollateralValue = testBNB.balanceOf(address(this)) * priceBNB;
        uint256 totalUSD = testUSDC.totalSupply();
        if (totalUSD == 0) return type(uint256).max; // Avoid division by zero
        return (totalCollateralValue * 100) / totalUSD;
    }

    function burnTokens(uint256 amountUSDC) external onlyOwner {
        testUSDC.transfer(address(0), amountUSDC);
    }
}
