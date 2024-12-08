import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Card } from "@/components/ui/card";
import { VAULT_ADDRESS, TBNB_ADDRESS, TUSDC_ADDRESS } from '@/config/contracts';
import { erc20ABI } from '@/abis/erc20ABI';
import { CollateralVaultABI } from '@/abis/CollateralVaultABI';
import { formatUnits, parseUnits, formatEther, parseEther } from 'viem';
import { Button } from "@/components/ui/button";
import { Plus, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { bscTestnet } from 'wagmi/chains';
import { useEffect, useState } from 'react';

interface PortfolioTableProps {
  onPriceChange: (price: number) => void;
  bnbPrice: number;
}

// Add interface for validator position
interface ValidatorPosition {
  collateralAmount: bigint;
  usdcBorrowed: bigint;
  lastUpdateTime: bigint;
  isActive: boolean;
}

const PortfolioTable = ({ bnbPrice, onPriceChange }: PortfolioTableProps) => {
  const { address, isConnected } = useAccount();
  const [isMinting, setIsMinting] = useState(false);
  const [isMintingBNB, setIsMintingBNB] = useState(false);
  const [trend, setTrend] = useState<'up' | 'down' | null>(null);
  const [lastPrice, setLastPrice] = useState(bnbPrice);

  // Fetch user's position from vault
  const { data: position } = useReadContract({
    address: VAULT_ADDRESS,
    abi: CollateralVaultABI,
    functionName: 'positions',
    args: [address as `0x${string}`],
  }) as { data: ValidatorPosition };

  // Fetch BNB balance
  const { data: bnbBalanceRaw, refetch: refetchBNBBalance } = useReadContract({
    address: TBNB_ADDRESS,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  });

  // Fetch USDC balance
  const { data: usdcBalanceRaw, refetch: refetchUSDCBalance } = useReadContract({
    address: TUSDC_ADDRESS,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  });

  // Mint USDC
  const { data: mintTx, writeContract: mintUsdc } = useWriteContract();
  const { isSuccess: isMintConfirmed } = useWaitForTransactionReceipt({ hash: mintTx });

  // Mint BNB
  const { data: mintBNBTx, writeContract: mintBNB } = useWriteContract();
  const { isSuccess: isBNBMintConfirmed } = useWaitForTransactionReceipt({ hash: mintBNBTx });

  // Watch for mint confirmation
  useEffect(() => {
    if (isMintConfirmed) {
      toast.success('Successfully minted 1000 USDC');
      refetchUSDCBalance();
      setIsMinting(false);
    }
  }, [isMintConfirmed, refetchUSDCBalance]);

  // Watch for BNB mint confirmation
  useEffect(() => {
    if (isBNBMintConfirmed) {
      toast.success('Successfully minted 10 BNB');
      refetchBNBBalance();
      setIsMintingBNB(false);
    }
  }, [isBNBMintConfirmed, refetchBNBBalance]);

  // Update trend when price changes
  useEffect(() => {
    setTrend(bnbPrice > lastPrice ? 'up' : 'down');
    setLastPrice(bnbPrice);
  }, [bnbPrice]);

  const handleMint = async () => {
    try {
      setIsMinting(true);
      await mintUsdc({
        address: TUSDC_ADDRESS as `0x${string}`,
        abi: erc20ABI,
        functionName: 'mint',
        args: [address, parseUnits('1000', 6)],
        account: address as `0x${string}`,
        chain: bscTestnet,
      });
    } catch (error) {
      console.error('Error minting USDC:', error);
      toast.error('Failed to mint USDC');
      setIsMinting(false);
    }
  };

  const handleMintBNB = async () => {
    try {
      setIsMintingBNB(true);
      await mintBNB({
        address: TBNB_ADDRESS as `0x${string}`,
        abi: erc20ABI,
        functionName: 'mint',
        args: [address, parseEther('10')], // Mint 10 BNB
        account: address as `0x${string}`,
        chain: bscTestnet,
      });
    } catch (error) {
      console.error('Error minting BNB:', error);
      toast.error('Failed to mint BNB');
      setIsMintingBNB(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  // Format balances
  const usdcBalance = usdcBalanceRaw ? formatUnits(usdcBalanceRaw, 6) : '0';
  const bnbBalance = bnbBalanceRaw ? formatEther(bnbBalanceRaw) : '0';
  
  // Format collateral position
  const collateralizedBnb = position?.collateralAmount ? 
    formatEther(position.collateralAmount) : 
    '0';
  const collateralValueInUSD = parseFloat(collateralizedBnb) * bnbPrice;
  const totalValue = parseFloat(usdcBalance) + collateralValueInUSD;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] bg-clip-text text-transparent">
        Portfolio Overview
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1A1F2C]/80 backdrop-blur-xl border-[#9b87f5]/20 p-6 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-gray-400">BNB Balance</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Current Price:</span>
                <div className="flex items-center">
                  <span className="font-mono text-[#9b87f5]">
                    ${bnbPrice.toFixed(2)}
                  </span>
                  {trend && (
                    <span className={trend === 'up' ? 'text-green-500 ml-1' : 'text-red-500 ml-1'}>
                      {trend === 'up' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                className="bg-[#1A1F2C]/50 hover:bg-[#1A1F2C] text-[#9b87f5] border-[#9b87f5]/20"
                onClick={handleMintBNB}
                disabled={isMintingBNB}
              >
                {isMintingBNB ? (
                  <>
                    <span className="animate-spin mr-2">⚪</span>
                    Minting...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Mint BNB
                  </>
                )}
              </Button>
            </div>
            <p className="text-2xl font-mono text-[#9b87f5]">
              ${(parseFloat(formatUnits(bnbBalanceRaw as bigint || BigInt(0), 18)) * bnbPrice).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 font-mono">
              {parseFloat(formatUnits(bnbBalanceRaw as bigint || BigInt(0), 18)).toFixed(4)} BNB
            </p>
          </div>
        </Card>

        <Card className="bg-[#1A1F2C]/80 backdrop-blur-xl border-[#9b87f5]/20 p-6 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-gray-400">USDC Balance</h3>
              <Button
                size="sm"
                variant="outline"
                className="bg-[#1A1F2C]/50 hover:bg-[#1A1F2C] text-[#9b87f5] border-[#9b87f5]/20"
                onClick={handleMint}
                disabled={isMinting}
              >
                {isMinting ? (
                  <>
                    <span className="animate-spin mr-2">⚪</span>
                    Minting...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Mint USDC
                  </>
                )}
              </Button>
            </div>
            <p className="text-2xl font-mono text-[#9b87f5]">
              ${parseFloat(usdcBalance).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 font-mono">
              {parseFloat(usdcBalance).toFixed(2)} USDC
            </p>
          </div>
        </Card>

        <Card className="bg-[#1A1F2C]/80 backdrop-blur-xl border-[#9b87f5]/20 p-6 shadow-xl">
          <div className="space-y-2">
            <h3 className="text-sm text-gray-400">Collateralized BNB</h3>
            <p className="text-2xl font-mono text-[#9b87f5]">
              ${collateralValueInUSD.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 font-mono">
              {parseFloat(collateralizedBnb).toFixed(4)} BNB
            </p>
            <p className="text-xs text-gray-500 font-mono">
              Borrowed: {formatUnits(position?.usdcBorrowed || BigInt(0), 6)} USDC
            </p>
          </div>
        </Card>

        <Card className="bg-[#1A1F2C]/80 backdrop-blur-xl border-[#9b87f5]/20 p-6 shadow-xl">
          <div className="space-y-2">
            <h3 className="text-sm text-gray-400">Total Portfolio Value</h3>
            <p className="text-2xl font-mono text-[#9b87f5]">
              ${totalValue.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 font-mono">
              Combined Assets
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PortfolioTable;