import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface PriceControlsProps {
  onPriceChange: (price: number) => void;
  onRevertPrice: () => void;
}

const PriceControls = ({ onPriceChange, onRevertPrice }: PriceControlsProps) => {
  const { toast } = useToast();
  const originalPrice = 300; // Base BNB price

  const handlePriceChange = (dropPercentage: number) => {
    const newPrice = originalPrice * (1 - dropPercentage / 100);
    onPriceChange(newPrice);
  };

  const handleRevertPrice = () => {
    onRevertPrice();
    toast({
      title: "Price Reverted",
      description: "BNB price has been reset to original value of $300",
    });
  };

  return (
    <Card className="bg-[#1A1F2C]/80 backdrop-blur-xl border-[#9b87f5]/20 p-6 shadow-xl">
      <h2 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-[#9b87f5]" />
        Price Simulation Controls
      </h2>
      <div className="flex flex-wrap gap-4">
        <Button 
          onClick={() => handlePriceChange(20)}
          variant="outline"
          className="bg-[#1A1F2C]/50 hover:bg-[#1A1F2C] text-white border-[#9b87f5]/20"
        >
          20% Drop
          <TrendingDown className="ml-2 h-4 w-4 text-yellow-500" />
        </Button>
        <Button 
          onClick={() => handlePriceChange(30)}
          variant="outline"
          className="bg-[#1A1F2C]/50 hover:bg-[#1A1F2C] text-white border-[#9b87f5]/20"
        >
          30% Drop
          <TrendingDown className="ml-2 h-4 w-4 text-orange-500" />
        </Button>
        <Button 
          onClick={() => handlePriceChange(40)}
          className="bg-red-500/20 hover:bg-red-500/30 text-white border-red-500/20"
        >
          40% Drop
          <TrendingDown className="ml-2 h-4 w-4" />
        </Button>
        <Button 
          onClick={handleRevertPrice}
          className="ml-auto bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
        >
          Reset Price
          <TrendingUp className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default PriceControls;