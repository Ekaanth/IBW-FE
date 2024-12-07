import { useWriteContract, useReadContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { toast } from "sonner";
import IBWVaultABI from '@/contracts/IBWVault.json';
import { IBWVAULT_ADDRESS, USDC_ADDRESS } from '@/config/contracts';
import { erc20ABI } from '@/abis/erc20ABI';

export const useWeb3Actions = () => {
  const { address } = useAccount();

  // Register as validator
  const { data: registerTx, writeContract: registerValidator } = useWriteContract({
    address: IBWVAULT_ADDRESS,
    abi: IBWVaultABI,
    functionName: 'registerValidator',
  });

  const { isSuccess: isRegisterConfirmed } = useWaitForTransactionReceipt({ hash: registerTx });

  // Deposit BNB collateral
  const { data: depositTx, writeContract: depositCollateral } = useWriteContract({
    address: IBWVAULT_ADDRESS,
    abi: IBWVaultABI,
    functionName: 'depositCollateral',
  });

  const { isSuccess: isDepositConfirmed } = useWaitForTransactionReceipt({ hash: depositTx });

  // Approve USDC
  const { data: approveTx, writeContract: approveUSDC } = useWriteContract({
    address: USDC_ADDRESS,
    abi: erc20ABI,
    functionName: 'approve',
  });

  const { isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({ hash: approveTx });

  // Borrow USDC
  const { data: borrowTx, writeContract: borrowUSDC } = useWriteContract({
    address: IBWVAULT_ADDRESS,
    abi: IBWVaultABI,
    functionName: 'borrowUSDC',
  });

  const { isSuccess: isBorrowConfirmed } = useWaitForTransactionReceipt({ hash: borrowTx });

  // Get validator position
  const { data: position } = useReadContract({
    address: IBWVAULT_ADDRESS,
    abi: IBWVaultABI,
    functionName: 'validatorPositions',
    args: [address],
    watch: true,
  });

  const handleCollateralization = async (bnbAmount: string, usdcAmount: string) => {
    try {
      // 1. Register as validator if not already
      if (!position?.isActive) {
        await registerValidator();
        if (!isRegisterConfirmed) throw new Error("Registration not confirmed");
      }

      // 2. Deposit BNB collateral
      await depositCollateral({ value: parseEther(bnbAmount) });
      if (!isDepositConfirmed) throw new Error("Deposit not confirmed");

      // 3. Approve USDC spending
      await approveUSDC({ args: [IBWVAULT_ADDRESS, parseUnits(usdcAmount, 6)] });
      if (!isApprovalConfirmed) throw new Error("Approval not confirmed");

      // 4. Borrow USDC
      await borrowUSDC({ args: [parseUnits(usdcAmount, 6)] });
      if (!isBorrowConfirmed) throw new Error("Borrow not confirmed");

      toast.success("Successfully collateralized position");
    } catch (error) {
      console.error('Error in handleCollateralization:', error);
      toast.error("Failed to collateralize position");
    }
  };

  const handleRepayment = async (amount: string) => {
    try {
      // 1. Approve USDC repayment
      await approveUSDC({ args: [IBWVAULT_ADDRESS, parseUnits(amount, 6)] });
      if (!isApprovalConfirmed) throw new Error("Approval not confirmed");

      // 2. Repay USDC
      const { data: repayTx, writeContract: repayUSDC } = useWriteContract({
        address: IBWVAULT_ADDRESS,
        abi: IBWVaultABI,
        functionName: 'repayUSDC',
      });

      await repayUSDC({ args: [parseUnits(amount, 6)] });
      const { isSuccess: isRepayConfirmed } = useWaitForTransactionReceipt({ hash: repayTx });
      if (!isRepayConfirmed) throw new Error("Repayment not confirmed");

      toast.success("Successfully repaid USDC");
    } catch (error) {
      console.error('Error in handleRepayment:', error);
      toast.error("Failed to repay USDC");
    }
  };

  const handleWithdraw = async (amount: string) => {
    try {
      const { data: withdrawTx, writeContract: withdrawCollateral } = useWriteContract({
        address: IBWVAULT_ADDRESS,
        abi: IBWVaultABI,
        functionName: 'withdrawCollateral',
      });

      await withdrawCollateral({ args: [parseEther(amount)] });
      const { isSuccess: isWithdrawConfirmed } = useWaitForTransactionReceipt({ hash: withdrawTx });
      if (!isWithdrawConfirmed) throw new Error("Withdrawal not confirmed");

      toast.success("Successfully withdrawn collateral");
    } catch (error) {
      console.error('Error in handleWithdraw:', error);
      toast.error("Failed to withdraw collateral");
    }
  };

  return {
    handleCollateralization,
    handleRepayment,
    handleWithdraw,
    position,
  };
};