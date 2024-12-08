import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from 'react';
import { parseEther } from 'viem';
import { VAULT_ADDRESS, TBNB_ADDRESS } from '@/config/contracts';
import { toast } from "sonner";
import { CollateralVaultABI } from '../abis/CollateralVaultABI';
import { erc20ABI } from '@/abis/erc20ABI';
import { bscTestnet } from 'wagmi/chains';

export const CollateralManager = () => {
  const { address } = useAccount();
  const [bnbAmount, setBnbAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  // Contract interactions
  const { writeContract: approveToken, data: approvalTxHash } = useWriteContract();
  const { writeContract: lockCollateral, data: depositTxHash } = useWriteContract();

  // Transaction monitoring
  const { isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({
    hash: approvalTxHash,
  });

  const { isSuccess: isDepositConfirmed } = useWaitForTransactionReceipt({
    hash: depositTxHash,
  });

  // Handle approval confirmation
  useEffect(() => {
    if (isApprovalConfirmed && bnbAmount) {
      setIsApproving(false);
      setIsDepositing(true);
      
      // Convert BNB amount to number for contract
      const bnbValue = Math.floor(parseFloat(bnbAmount));
      
      lockCollateral({
        address: VAULT_ADDRESS,
        abi: CollateralVaultABI,
        functionName: 'depositCollateralAndMintUSD',
        args: [BigInt(bnbValue)],
        account: address,
        chain: bscTestnet,
      });
    }
  }, [isApprovalConfirmed, bnbAmount]);

  // Handle deposit confirmation
  useEffect(() => {
    if (isDepositConfirmed) {
      setIsDepositing(false);
      toast.success('Successfully locked collateral and minted USDC');
      setBnbAmount('');
    }
  }, [isDepositConfirmed]);

  const handleCollateralize = async () => {
    if (!bnbAmount) return;
    
    try {
      setIsApproving(true);
      // Convert to wei for approval since BNB transfers still use wei
      const amountInWei = parseEther(bnbAmount);

      await approveToken({
        address: TBNB_ADDRESS,
        abi: erc20ABI,
        functionName: 'approve',
        args: [VAULT_ADDRESS, amountInWei],
        account: address,
        chain: bscTestnet,
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to approve BNB');
      setIsApproving(false);
      setIsDepositing(false);
    }
  };

  return (
    <Card className="p-6 bg-[#1A1F2C]/80 backdrop-blur-xl border-[#9b87f5]/20">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Lock BNB Collateral</h3>
        <div className="flex gap-2">
          <Input
            type="number"
            value={bnbAmount}
            onChange={(e) => setBnbAmount(e.target.value)}
            placeholder="Enter BNB amount (whole numbers)"
            className="bg-[#1A1F2C] border-[#9b87f5]/20 text-white"
          />
          <Button
            onClick={handleCollateralize}
            disabled={isApproving || isDepositing || !bnbAmount}
            className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
          >
            {isApproving ? (
              <>
                <span className="animate-spin mr-2">⚪</span>
                Approving...
              </>
            ) : isDepositing ? (
              <>
                <span className="animate-spin mr-2">⚪</span>
                Locking...
              </>
            ) : (
              'Lock Collateral'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}; 