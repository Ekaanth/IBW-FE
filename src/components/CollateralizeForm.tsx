import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface CollateralizeFormProps {
  collateralRatio: number;
  bnbPrice: number;
  onCollateralize: (bnbAmount: string, usdcAmount: string) => void;
}

const CollateralizeForm = ({ collateralRatio: displayRatio, bnbPrice, onCollateralize }: CollateralizeFormProps) => {
  const [usdcAmount, setUsdcAmount] = useState<string>("");
  const { toast } = useToast();
  const FIXED_COLLATERAL_RATIO = 200; // Fixed 200% ratio for new collateralization

  const calculateRequiredBNB = () => {
    const usdcValue = parseFloat(usdcAmount);
    if (isNaN(usdcValue)) return "0";
    const requiredCollateralValue = (usdcValue * FIXED_COLLATERAL_RATIO) / 100;
    const requiredBNB = requiredCollateralValue / bnbPrice;
    return requiredBNB.toFixed(4);
  };

  const handleCollateralize = async () => {
    try {
      const requiredBNB = calculateRequiredBNB();
      onCollateralize(requiredBNB, usdcAmount);
      toast({
        title: "Collateralization Initiated",
        description: `Swapping ${requiredBNB} BNB for ${usdcAmount} USDC`,
      });
      setUsdcAmount("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to collateralize",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-[#1A1F2C]/80 backdrop-blur-xl border-[#9b87f5]/20 p-8 lg:p-10">
      <h2 className="text-2xl lg:text-3xl font-semibold mb-6 bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] bg-clip-text text-transparent">
        Collateralize BNB
      </h2>
      <div className="space-y-6">
        <div>
          <label className="block text-base lg:text-lg font-medium text-gray-300 mb-2">
            USDC Amount
          </label>
          <Input
            type="number"
            placeholder="Enter USDC amount"
            value={usdcAmount}
            onChange={(e) => setUsdcAmount(e.target.value)}
            className="bg-[#121620] border-[#9b87f5]/20 text-gray-200 placeholder:text-gray-500 text-lg lg:text-xl h-14"
          />
        </div>
        <div>
          <label className="block text-base lg:text-lg font-medium text-gray-300 mb-2">
            Required BNB
          </label>
          <div className="text-2xl lg:text-3xl font-mono font-semibold text-[#9b87f5]">
            {calculateRequiredBNB()} BNB
          </div>
          <p className="text-base text-gray-400 mt-2">
            Based on 200% collateral ratio
          </p>
          {displayRatio !== 200 && (
            <p className="text-sm text-yellow-500 mt-1">
              Current system ratio: {displayRatio.toFixed(2)}%
            </p>
          )}
        </div>
        <Button 
          onClick={handleCollateralize}
          className="w-full bg-[#9b87f5] hover:bg-[#7E69AB] text-white transition-all duration-200 text-lg h-14 mt-4"
          disabled={!usdcAmount || parseFloat(usdcAmount) <= 0}
        >
          Collateralize
        </Button>
      </div>
    </Card>
  );
};

export default CollateralizeForm;