import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from 'react';
import { parseEther, parseUnits, formatUnits } from 'viem';
import { VAULT_ADDRESS, TBNB_ADDRESS, TUSDC_ADDRESS } from '@/config/contracts';
import { toast } from "sonner";
import { CollateralVaultABI } from '../abis/CollateralVaultABI';
import { erc20ABI } from '@/abis/erc20ABI';
import { bscTestnet } from 'wagmi/chains';
import { waitForTransactionReceipt } from 'viem/actions';

export const CollateralManager = () => {
  const { address } = useAccount();
  const [bnbAmount, setBnbAmount] = useState('');
  const [bnbAmountWei, setBnbAmountWei] = useState<bigint>(BigInt(0));
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
    if (isApprovalConfirmed && bnbAmountWei > 0) {
      setIsApproving(false);
      setIsDepositing(true);
      
      lockCollateral({
        address: VAULT_ADDRESS,
        abi: CollateralVaultABI,
        functionName: 'lockCollateralAndMint',
        args: [bnbAmountWei],
        account: address,
        chain: bscTestnet,
      });
    }
  }, [isApprovalConfirmed, bnbAmountWei]);

  // Handle deposit confirmation
  useEffect(() => {
    if (isDepositConfirmed) {
      setIsDepositing(false);
      toast.success('Successfully locked collateral and minted USDC');
      setBnbAmount('');
      setBnbAmountWei(BigInt(0));
    }
  }, [isDepositConfirmed]);

  const handleCollateralize = async () => {
    if (!bnbAmount) return;
    
    try {
      setIsApproving(true);
      const amountWei = parseEther(bnbAmount);
      setBnbAmountWei(amountWei);

      await approveToken({
        address: TBNB_ADDRESS,
        abi: erc20ABI,
        functionName: 'approve',
        args: [VAULT_ADDRESS, amountWei],
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
            placeholder="Enter BNB amount"
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