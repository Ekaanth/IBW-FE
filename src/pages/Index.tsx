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

const Index = () => {
  const { toast } = useToast();
  const {
    bnbPrice,
    setBnbPrice,
    collateralRatio,
    setCollateralRatio,
    usdcBalance,
    collateralizedBnb,
    handleReset,
    handleCollateralization
  } = usePortfolio();

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

  const manipulatePrice = async (newPrice: number) => {
    setBnbPrice(newPrice);
    const newCollateralRatio = calculateCollateralRatio(collateralizedBnb, newPrice, usdcBalance);
    setCollateralRatio(newCollateralRatio);
    
    if (newCollateralRatio < 200) {
      await createValidatorAction(newCollateralRatio);
    }
    
    console.log('Price change:', {
      newPrice,
      newCollateralRatio,
      collateralizedBnb
    });
  };

  const revertToOriginalPrice = () => {
    setBnbPrice(300);
    setCollateralRatio(200);
  };

  return (
    <div className="min-h-screen bg-[#121620]">
      <div className="max-w-[1800px] mx-auto p-6 md:p-8">
        <Header />

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
              usdcBalance={usdcBalance}
              collateralizedBnb={collateralizedBnb}
              bnbPrice={bnbPrice}
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
      </div>
    </div>
  );
};

export default Index;