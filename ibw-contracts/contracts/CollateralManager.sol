// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/ITestUSDC.sol";

contract CollateralManager is Ownable, ReentrancyGuard {
    IERC20 public immutable testBNB;
    ITestUSDC public immutable testUSDC;
    
    uint256 public bnbPrice = 745 * 1e6; // Initial BNB price ($745 with 6 decimals)
    uint256 public constant COLLATERAL_RATIO = 200; // 200% collateral ratio
    
    struct Position {
        uint256 collateralAmount;  // Locked BNB amount
        uint256 usdcBorrowed;      // Minted USDC amount
        uint256 lastUpdateTime;
    }
    
    mapping(address => Position) public positions;
    
    event CollateralLocked(address indexed user, uint256 amount);
    event USDCMinted(address indexed user, uint256 amount);
    event CollateralBurned(address indexed user, uint256 amount);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);

    constructor(address _testBNB, address _testUSDC) Ownable(msg.sender) {
        testBNB = IERC20(_testBNB);
        testUSDC = ITestUSDC(_testUSDC);
    }

    // Lock BNB and mint equal value in USDC
    function lockCollateralAndMint(uint256 bnbAmount) external nonReentrant {
        require(bnbAmount > 0, "Must lock BNB");
        
        // Calculate USDC amount to mint (equal to BNB value)
        uint256 collateralValueInUSD = (bnbAmount * bnbPrice) / 1e18; // Convert from 18 decimals
        
        // Update position
        Position storage position = positions[msg.sender];
        position.collateralAmount += bnbAmount;
        position.usdcBorrowed += collateralValueInUSD;
        position.lastUpdateTime = block.timestamp;
        
        // Lock BNB and mint USDC
        require(testBNB.transferFrom(msg.sender, address(this), bnbAmount), "BNB transfer failed");
        require(testUSDC.mint(msg.sender, collateralValueInUSD), "USDC mint failed");
        
        emit CollateralLocked(msg.sender, bnbAmount);
        emit USDCMinted(msg.sender, collateralValueInUSD);
    }

    function updatePrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = bnbPrice;
        bnbPrice = newPrice;
        emit PriceUpdated(oldPrice, newPrice);
    }

    function checkCollateralRatio(address user) public view returns (uint256) {
        Position memory position = positions[user];
        if (position.usdcBorrowed == 0) return type(uint256).max;
        
        uint256 collateralValueInUSD = (position.collateralAmount * bnbPrice) / 1e18;
        return (collateralValueInUSD * 100) / position.usdcBorrowed;
    }

    // Burn excess USDC when collateral ratio drops below 200%
    function burnExcessCollateral(address user) external onlyOwner {
        Position storage position = positions[user];
        require(position.collateralAmount > 0, "No position");
        
        uint256 collateralValueInUSD = (position.collateralAmount * bnbPrice) / 1e18;
        uint256 maxAllowedUSDC = collateralValueInUSD / 2; // Maximum USDC allowed at 200% ratio
        
        if (position.usdcBorrowed > maxAllowedUSDC) {
            uint256 usdcToBurn = position.usdcBorrowed - maxAllowedUSDC;
            position.usdcBorrowed = maxAllowedUSDC;
            
            // Burn the excess USDC
            require(testUSDC.burn(usdcToBurn), "USDC burn failed");
            
            emit CollateralBurned(user, usdcToBurn);
        }
    }

    function getPosition(address user) external view returns (Position memory) {
        return positions[user];
    }
} 