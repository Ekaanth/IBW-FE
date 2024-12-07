import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TokenDisplayProps {
  symbol: string;
  price: number;
}

const TokenDisplay = ({ symbol, price }: TokenDisplayProps) => {
  return (
    <Card className="p-3 bg-gray-800 border-gray-700">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-mono font-semibold text-purple-100">{symbol}</h3>
        <div className="flex items-center gap-2">
          <p className="text-base font-mono font-semibold text-purple-100">
            ${price.toFixed(2)}
          </p>
          {symbol === "BNB" && (
            price >= 250 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )
          )}
        </div>
      </div>
      <p className="text-xs font-mono text-gray-400 mt-1">Current Price</p>
    </Card>
  );
};

export default TokenDisplay;