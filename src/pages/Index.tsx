import { useToast } from "@/hooks/use-toast";
import TokenDisplay from '@/components/TokenDisplay';
import CollateralRatio from '@/components/CollateralRatio';
import ValidatorStatus from '@/components/ValidatorStatus';
import CollateralizeForm from '@/components/CollateralizeForm';
import PortfolioTable from '@/components/PortfolioTable';
import Header from '@/components/Header';
import PriceManipulation from '@/components/PriceManipulation';
import { supabase } from "@/integrations/supabase/client";
import { calculateBurnAmount, calculateCollateralRatio } from '@/utils/collateralCalculations';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';

const Index = () => {
  const { isConnected } = useAccount();
  const { toast } = useToast();
  const {
    collateralRatio,
    setCollateralRatio,
    usdcBalance,
    collateralizedBnb,
    handleReset,
    handleCollateralization
  } = usePortfolio();

  const [bnbPrice, setBnbPrice] = useState(745); // Starting at $745

  useEffect(() => {
    // Price boundaries - only keep upper bound
    const MAX_PRICE = 800;
    const TARGET_PRICE = 745;
    
    const interval = setInterval(() => {
      setBnbPrice(prevPrice => {
        // Random walk with mean reversion
        const volatility = 0.5;
        const meanReversionSpeed = 0.05;
        
        // Calculate price movement
        const randomChange = (Math.random() - 0.5) * volatility;
        const meanReversion = (TARGET_PRICE - prevPrice) * meanReversionSpeed;
        const newPrice = prevPrice + randomChange + meanReversion;

        // Only enforce upper bound
        if (newPrice > MAX_PRICE) return MAX_PRICE;
        return newPrice;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const createValidatorAction = async (newRatio: number) => {
    const burnAmount = calculateBurnAmount(newRatio, 200, collateralizedBnb, bnbPrice);
    
    try {
      await supabase
        .from('validator_actions')
        .insert({
          action_type: 'LIQUIDATION',
          status: 'PENDING',
          details: {
            current_ratio: newRatio,
            required_ratio: 200,
            bnb_price: bnbPrice,
            burn_amount: burnAmount.toFixed(4),
            usdc_held: usdcBalance,
          }
        });

      console.log('Created validator action:', {
        newRatio,
        burnAmount,
        bnbPrice,
        usdcBalance
      });

      toast({
        title: "Validator Action Created",
        description: `New liquidation task created for ${burnAmount.toFixed(4)} BNB`,
      });
    } catch (error) {
      console.error('Error creating validator action:', error);
      toast({
        title: "Error",
        description: "Failed to create validator action",
        variant: "destructive",
      });
    }
  };

  const manipulatePrice = async (dropPercentage: number) => {
    const currentPrice = bnbPrice;
    
    // Calculate the new price based on percentage drop
    const newPrice = currentPrice * (1 - (dropPercentage / 100));
    
    // Update the price (allow it to go below 650 for simulation)
    setBnbPrice(newPrice);

    // Calculate new collateral ratio
    const newCollateralRatio = calculateCollateralRatio(collateralizedBnb, newPrice, usdcBalance);
    setCollateralRatio(newCollateralRatio);
    
    // Check if liquidation is needed
    if (newCollateralRatio < 200) {
      await createValidatorAction(newCollateralRatio);
    }

    toast({
      title: "Price Updated",
      description: `BNB price dropped by ${dropPercentage}% to $${newPrice.toFixed(2)}`,
    });

    console.log('Price change:', {
      originalPrice: currentPrice,
      dropPercentage,
      newPrice,
      newCollateralRatio,
      collateralizedBnb
    });
  };

  const revertToOriginalPrice = () => {
    setBnbPrice(745);
    setCollateralRatio(200);

    toast({
      title: "Price Reset",
      description: "BNB price has been reset to $745",
    });
  };

  return (
    <div className="min-h-screen bg-[#121620]">
      <div className="max-w-[1800px] mx-auto p-6 md:p-8">
        <Header />

        {isConnected ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] bg-clip-text text-transparent">
                Portfolio Overview
              </h2>
              <Button
                onClick={handleReset}
                variant="outline"
                className="bg-[#1A1F2C]/50 hover:bg-[#1A1F2C] text-white border-[#9b87f5]/20"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Values
              </Button>
            </div>

            <section className="bg-[#1A1F2C]/80 backdrop-blur-xl rounded-2xl border border-[#9b87f5]/20 p-6 shadow-xl">
              <PortfolioTable 
                bnbPrice={bnbPrice}
                onPriceChange={setBnbPrice}
              />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <TokenDisplay symbol="BNB" price={bnbPrice} />
              <TokenDisplay symbol="USDC" price={1} />
              <ValidatorStatus isActive={true} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CollateralizeForm 
                collateralRatio={collateralRatio}
                bnbPrice={bnbPrice}
                onCollateralize={handleCollateralization}
              />
              <CollateralRatio ratio={collateralRatio} />
            </div>

            <PriceManipulation 
              bnbPrice={bnbPrice}
              collateralizedBnb={collateralizedBnb}
              usdcBalance={usdcBalance}
              onPriceChange={manipulatePrice}
              onRevertPrice={revertToOriginalPrice}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-white">Welcome to Eigen Layer Terminal</h2>
              <p className="text-gray-400">Connect your wallet to view your portfolio and start managing your positions</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;