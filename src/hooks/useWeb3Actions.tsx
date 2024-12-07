import { useWriteContract, useReadContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { toast } from "sonner";
import { CollateralVaultABI } from '@/abis/CollateralVaultABI';
import { VAULT_ADDRESS, TBNB_ADDRESS, TUSDC_ADDRESS } from '@/config/contracts';
import { bscTestnet } from 'wagmi/chains';

export const useWeb3Actions = () => {
  const { address } = useAccount();

  // Register as validator
  const { data: registerTx, writeContract: registerValidator } = useWriteContract();
  const { isSuccess: isRegisterConfirmed } = useWaitForTransactionReceipt({ hash: registerTx });

  // Get validator position
  const { data: position } = useReadContract({
    address: VAULT_ADDRESS,
    abi: CollateralVaultABI,
    functionName: 'getPosition',
    args: [address],
  });

  const handleCollateralization = async (bnbAmount: string, usdcAmount: string) => {
    try {
      await registerValidator({
        address: VAULT_ADDRESS,
        abi: CollateralVaultABI,
        functionName: 'depositCollateralAndBorrow',
        args: [parseEther(bnbAmount), parseUnits(usdcAmount, 6)],
        account: address as `0x${string}`,
        chain: bscTestnet,
      });

      if (isRegisterConfirmed) {
        toast.success("Successfully collateralized position");
      }
    } catch (error) {
      console.error('Error in handleCollateralization:', error);
      toast.error("Failed to collateralize position");
    }
  };

  return {
    handleCollateralization,
    position,
  };
};