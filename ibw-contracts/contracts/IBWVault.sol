// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract IBWVault is ReentrancyGuard, Ownable, Pausable {
    IERC20 public immutable usdc;
    
    uint256 public constant MINIMUM_COLLATERAL_RATIO = 200; // 200%
    uint256 public constant LIQUIDATION_THRESHOLD = 150; // 150%
    uint256 public constant LIQUIDATION_BONUS = 5; // 5% bonus for liquidators
    
    struct ValidatorPosition {
        uint256 collateralAmount;  // BNB amount
        uint256 usdcBorrowed;      // USDC amount
        uint256 lastUpdateTime;
        bool isActive;
    }
    
    mapping(address => ValidatorPosition) public validatorPositions;
    uint256 public totalCollateral;
    uint256 public totalBorrowed;
    
    event ValidatorRegistered(address indexed validator);
    event CollateralDeposited(address indexed validator, uint256 amount);
    event USDCBorrowed(address indexed validator, uint256 amount);
    event PositionLiquidated(address indexed validator, address liquidator, uint256 collateralAmount, uint256 debtAmount);
    event CollateralWithdrawn(address indexed validator, uint256 amount);
    event USDCRepaid(address indexed validator, uint256 amount);

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }

    function registerValidator() external {
        require(!validatorPositions[msg.sender].isActive, "Already registered");
        validatorPositions[msg.sender].isActive = true;
        emit ValidatorRegistered(msg.sender);
    }

    function depositCollateral() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Must deposit BNB");
        require(validatorPositions[msg.sender].isActive, "Not registered");
        
        ValidatorPosition storage position = validatorPositions[msg.sender];
        position.collateralAmount += msg.value;
        position.lastUpdateTime = block.timestamp;
        totalCollateral += msg.value;
        
        emit CollateralDeposited(msg.sender, msg.value);
    }

    function borrowUSDC(uint256 usdcAmount) external nonReentrant whenNotPaused {
        ValidatorPosition storage position = validatorPositions[msg.sender];
        require(position.isActive, "Not registered");
        require(position.collateralAmount > 0, "No collateral");
        
        uint256 newTotalBorrowed = position.usdcBorrowed + usdcAmount;
        require(_isCollateralRatioSafe(position.collateralAmount, newTotalBorrowed), 
                "Insufficient collateral");
        
        position.usdcBorrowed = newTotalBorrowed;
        position.lastUpdateTime = block.timestamp;
        totalBorrowed += usdcAmount;
        
        require(usdc.transfer(msg.sender, usdcAmount), "USDC transfer failed");
        emit USDCBorrowed(msg.sender, usdcAmount);
    }

    function liquidatePosition(address validator) external nonReentrant whenNotPaused {
        ValidatorPosition storage position = validatorPositions[validator];
        require(position.isActive, "Not registered");
        require(position.collateralAmount > 0, "No position");
        
        require(!_isCollateralRatioSafe(position.collateralAmount, position.usdcBorrowed),
                "Position is safe");
        
        uint256 collateralToLiquidate = position.collateralAmount;
        uint256 debtToRepay = position.usdcBorrowed;
        uint256 bonus = (collateralToLiquidate * LIQUIDATION_BONUS) / 100;
        
        totalCollateral -= collateralToLiquidate;
        totalBorrowed -= debtToRepay;
        delete validatorPositions[validator];
        
        (bool sent, ) = payable(msg.sender).call{value: collateralToLiquidate + bonus}("");
        require(sent, "Failed to send BNB");
        
        require(usdc.transferFrom(msg.sender, address(this), debtToRepay),
                "USDC transfer failed");
                
        emit PositionLiquidated(validator, msg.sender, collateralToLiquidate, debtToRepay);
    }

    function repayUSDC(uint256 amount) external nonReentrant whenNotPaused {
        ValidatorPosition storage position = validatorPositions[msg.sender];
        require(position.isActive, "Not registered");
        require(position.usdcBorrowed >= amount, "Amount exceeds debt");
        
        position.usdcBorrowed -= amount;
        position.lastUpdateTime = block.timestamp;
        totalBorrowed -= amount;
        
        require(usdc.transferFrom(msg.sender, address(this), amount),
                "USDC transfer failed");
        emit USDCRepaid(msg.sender, amount);
    }

    function withdrawCollateral(uint256 amount) external nonReentrant whenNotPaused {
        ValidatorPosition storage position = validatorPositions[msg.sender];
        require(position.isActive, "Not registered");
        require(position.collateralAmount >= amount, "Insufficient collateral");
        
        uint256 remainingCollateral = position.collateralAmount - amount;
        require(position.usdcBorrowed == 0 || 
                _isCollateralRatioSafe(remainingCollateral, position.usdcBorrowed),
                "Would breach collateral ratio");
        
        position.collateralAmount = remainingCollateral;
        position.lastUpdateTime = block.timestamp;
        totalCollateral -= amount;
        
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Failed to send BNB");
        
        emit CollateralWithdrawn(msg.sender, amount);
    }

    function _isCollateralRatioSafe(uint256 collateralAmount, uint256 usdcDebt) 
        internal 
        view 
        returns (bool) 
    {
        if (usdcDebt == 0) return true;
        
        uint256 collateralValue = _getCollateralValue(collateralAmount);
        uint256 ratio = (collateralValue * 100) / usdcDebt;
        return ratio >= MINIMUM_COLLATERAL_RATIO;
    }

    function _getCollateralValue(uint256 amount) internal pure returns (uint256) {
        // For testnet, using fixed price of $300 per BNB
        return amount * 300;
    }

    // Emergency functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool sent, ) = payable(owner()).call{value: balance}("");
        require(sent, "Failed to send BNB");
    }

    function emergencyTokenWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(IERC20(token).transfer(owner(), balance), "Token transfer failed");
    }
}