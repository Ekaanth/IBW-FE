import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { VAULT_ADDRESS, TBNB_ADDRESS } from '@/config/contracts';
import { CollateralVaultABI } from '@/abis/CollateralVaultABI';
import { parseEther, parseUnits } from 'viem';
import { toast } from "sonner";
import { erc20ABI } from '@/abis/erc20ABI';
import { bscTestnet } from 'wagmi/chains';

interface CollateralizeFormProps {
  bnbPrice: number;
  onCollateralize: (bnbAmount: string) => Promise<void>;
}

const CollateralizeForm = ({ bnbPrice, onCollateralize }: CollateralizeFormProps) => {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [amountWei, setAmountWei] = useState<bigint>(BigInt(0));
  const [isApproving, setIsApproving] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  // Contract interactions
  const { writeContract: approveToken, data: approvalTxHash } = useWriteContract();
  const { writeContract: lockCollateral, data: lockTxHash } = useWriteContract();

  // Transaction monitoring
  const { isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({
    hash: approvalTxHash,
  });

  const { isSuccess: isLockConfirmed } = useWaitForTransactionReceipt({
    hash: lockTxHash,
  });

  // Handle approval confirmation
  useEffect(() => {
    if (isApprovalConfirmed && amountWei > 0) {
      try {
        setIsApproving(false);
        setIsLocking(true);
        
        // Calculate USDC amount with proper decimal handling
        const bnbValueInUSD = (amountWei * BigInt(bnbPrice)) / BigInt(1e6); // bnbPrice has 6 decimals
        const usdcToMint = bnbValueInUSD / BigInt(2); // 200% ratio

        console.log('Values:', {
          bnbAmount: amountWei.toString(),
          bnbValueInUSD: bnbValueInUSD.toString(),
          usdcToMint: usdcToMint.toString()
        });
        
        lockCollateral({
          address: VAULT_ADDRESS,
          abi: CollateralVaultABI,
          functionName: 'lockCollateralAndMint',
          args: [amountWei, usdcToMint],
          account: address,
          chain: bscTestnet,
        });
      } catch (error) {
        console.error('Lock error:', error);
        setIsLocking(false);
        toast.error('Failed to lock collateral');
      }
    }
  }, [isApprovalConfirmed, amountWei, amount, bnbPrice]);

  // Handle lock confirmation
  useEffect(() => {
    if (isLockConfirmed) {
      setIsLocking(false);
      toast.success('Successfully locked collateral');
      onCollateralize(amount);
      setAmount('');
      setAmountWei(BigInt(0));
    }
  }, [isLockConfirmed]);

  const handleLock = async () => {
    if (!amount) return;
    
    try {
      setIsApproving(true);
      const wei = parseEther(amount);

      // Check current allowance first
      const allowance = await tbnb.allowance(address, VAULT_ADDRESS);
      console.log('Current allowance:', allowance.toString());
      
      // Only approve if needed
      if (allowance < wei) {
        console.log('Approving BNB transfer...');
        await approveToken({
          address: TBNB_ADDRESS,
          abi: erc20ABI,
          functionName: 'approve',
          args: [VAULT_ADDRESS, wei],
          account: address,
          chain: bscTestnet,
        });
      }

      // Wait for approval confirmation before proceeding
      if (isApprovalConfirmed) {
        console.log('Depositing BNB...');
        await lockCollateral({
          address: VAULT_ADDRESS,
          abi: CollateralVaultABI,
          functionName: 'depositCollateralAndBorrow',
          args: [wei],
          account: address,
          chain: bscTestnet,
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Transaction failed');
      setIsApproving(false);
    }
  };

  return (
    <Card className="p-6 bg-[#1A1F2C]/80 backdrop-blur-xl border-[#9b87f5]/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Lock BNB Collateral</h3>
          <span className="text-sm text-gray-400">Required Ratio: 200%</span>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400 block">Amount to Lock</label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter BNB amount"
                className="bg-[#1A1F2C] border-[#9b87f5]/20 text-white"
              />
              <Button
                onClick={handleLock}
                disabled={isApproving || isLocking || !amount}
                className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
              >
                {isApproving ? (
                  <>
                    <span className="animate-spin mr-2">⚪</span>
                    Approving...
                  </>
                ) : isLocking ? (
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

          {amount && (
            <div className="bg-[#1A1F2C]/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">You will receive:</span>
                <span className="text-[#9b87f5] font-mono">
                  {(parseFloat(amount) * bnbPrice / 2).toFixed(2)} USDC
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Collateral Value:</span>
                <span className="text-[#9b87f5] font-mono">
                  ${(parseFloat(amount) * bnbPrice).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CollateralizeForm;