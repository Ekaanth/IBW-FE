// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/ITestUSDC.sol";

contract CollateralVault is ReentrancyGuard, Ownable, Pausable {
    IERC20 public immutable tbnb;
    ITestUSDC public immutable tusdc;
    
    uint256 public bnbPrice = 745 * 1e6; // Initial BNB price ($745 with 6 decimals)
    
    struct Position {
        uint256 collateralAmount;
        uint256 usdcBorrowed;
        uint256 lastUpdateTime;
        bool isActive;
    }
    
    mapping(address => Position) public positions;
    
    event CollateralDeposited(address indexed user, uint256 amount);
    event USDCBorrowed(address indexed user, uint256 amount);
    event BNBBurned(address indexed user, uint256 amount);

    constructor(
        address _tbnb, 
        address _tusdc
    ) Ownable(msg.sender) Pausable() {
        tbnb = IERC20(_tbnb);
        tusdc = ITestUSDC(_tusdc);
    }

    function depositCollateralAndBorrow(uint256 bnbAmount) external nonReentrant whenNotPaused {
        require(bnbAmount > 0, "Must deposit BNB");
        
        // Debug logs
        console.log("BNB Amount:", bnbAmount);
        console.log("BNB Price:", bnbPrice);
        
        // Calculate USDC to issue
        uint256 collateralValueInUSD = (bnbAmount * bnbPrice) / 1e18;
        console.log("Collateral Value USD:", collateralValueInUSD);
        
        // Check balances before transfer
        uint256 userBalance = tbnb.balanceOf(msg.sender);
        uint256 contractBalance = tbnb.balanceOf(address(this));
        console.log("User BNB Balance:", userBalance);
        console.log("Contract BNB Balance:", contractBalance);
        
        // Check allowance
        uint256 allowance = tbnb.allowance(msg.sender, address(this));
        console.log("Contract Allowance:", allowance);

        require(userBalance >= bnbAmount, "Insufficient BNB balance");
        require(allowance >= bnbAmount, "Insufficient BNB allowance");
        
        // Update position
        Position storage position = positions[msg.sender];
        position.collateralAmount += bnbAmount;
        position.usdcBorrowed += collateralValueInUSD;
        position.lastUpdateTime = block.timestamp;
        position.isActive = true;
        
        // Lock BNB and issue USDC
        require(tbnb.transferFrom(msg.sender, address(this), bnbAmount), "BNB transfer failed");
        require(tusdc.mint(msg.sender, collateralValueInUSD), "USDC mint failed");
        
        emit CollateralDeposited(msg.sender, bnbAmount);
        emit USDCBorrowed(msg.sender, collateralValueInUSD);
    }

    function updatePrice(uint256 newPrice) external onlyOwner {
        bnbPrice = newPrice;
    }

    function checkCollateralRatio(address user) public view returns (uint256) {
        Position memory position = positions[user];
        if (position.usdcBorrowed == 0) return type(uint256).max;
        
        uint256 collateralValueInUSD = (position.collateralAmount * bnbPrice) / 1e18;
        return (collateralValueInUSD * 100) / position.usdcBorrowed;
    }

    function burnExcessCollateral(address user) external onlyOwner {
        Position storage position = positions[user];
        require(position.isActive, "No active position");
        
        uint256 collateralValueInUSD = (position.collateralAmount * bnbPrice) / 1e18;
        uint256 requiredCollateralValueUSD = position.usdcBorrowed * 2; // 200% ratio
        
        if (collateralValueInUSD < requiredCollateralValueUSD) {
            // Calculate how much BNB to burn to restore ratio
            uint256 valueToRecover = requiredCollateralValueUSD - collateralValueInUSD;
            uint256 bnbToBurn = (valueToRecover * 1e18) / bnbPrice;
            
            // Update position
            position.collateralAmount -= bnbToBurn;
            
            // Burn BNB by sending to dead address
            require(tbnb.transfer(address(0xdead), bnbToBurn), "BNB burn failed");
            
            emit BNBBurned(user, bnbToBurn);
        }
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
} 