import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { VAULT_ADDRESS, TBNB_ADDRESS } from '@/config/contracts';
import { CollateralVaultABI } from '@/abis/CollateralVaultABI';
import { toast } from "sonner";
import { erc20ABI } from '@/abis/erc20ABI';
import { bscTestnet } from 'wagmi/chains';
import { supabase } from '@/integrations/supabase/client';

interface CollateralizeFormProps {
  bnbPrice: number;
  onCollateralize: (bnbAmount: string) => Promise<void>;
}

const CollateralizeForm = ({ bnbPrice, onCollateralize }: CollateralizeFormProps) => {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
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

  // Add hook to fetch current position
  const { data: position } = useReadContract({
    address: VAULT_ADDRESS,
    abi: CollateralVaultABI,
    functionName: 'positions',
    args: [address as `0x${string}`],
  });

  // Handle approval confirmation
  useEffect(() => {
    if (isApprovalConfirmed && amount) {
      setIsApproving(false);
      setIsLocking(true);
      
      // Pass BNB amount directly
      const bnbAmount = parseFloat(amount);
      
      lockCollateral({
        address: VAULT_ADDRESS,
        abi: CollateralVaultABI,
        functionName: 'depositCollateralAndMintUSD',
        args: [BigInt(bnbAmount)],
        account: address,
        chain: bscTestnet,
      });
    }
  }, [isApprovalConfirmed, amount]);

  // Handle lock confirmation and database update
  useEffect(() => {
    if (isLockConfirmed && amount) {
      setIsLocking(false);
      
      const updateDatabase = async () => {
        try {
          // Fetch current position after update
          const { data: currentPosition } = await useReadContract({
            address: VAULT_ADDRESS,
            abi: CollateralVaultABI,
            functionName: 'positions',
            args: [address as `0x${string}`],
          });

          // Update database with new collateral amount
          const { error } = await supabase
            .from('positions')
            .upsert({
              user_address: address,
              collateral_amount: currentPosition.collateralAmount.toString(),
              usdc_borrowed: currentPosition.usdcBorrowed.toString(),
              last_update_time: new Date().toISOString(),
            });

          if (error) {
            throw error;
          }

          toast.success('Successfully locked collateral and updated records');
          onCollateralize(amount);
          setAmount('');
        } catch (error) {
          console.error('Error updating database:', error);
          toast.error('Failed to update position records');
        }
      };

      updateDatabase();
    }
  }, [isLockConfirmed, amount, address]);

  const handleLock = async () => {
    if (!amount) return;
    
    try {
      setIsApproving(true);
      // Convert to whole number BNB
      const bnbAmount = Math.floor(parseFloat(amount));

      await approveToken({
        address: TBNB_ADDRESS,
        abi: erc20ABI,
        functionName: 'approve',
        args: [VAULT_ADDRESS, BigInt(bnbAmount * 1e18)], // Convert to wei for BNB transfer
        account: address,
        chain: bscTestnet,
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to approve BNB');
      setIsApproving(false);
      setIsLocking(false);
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
                  {(parseFloat(amount) * bnbPrice).toFixed(2)} USDC
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