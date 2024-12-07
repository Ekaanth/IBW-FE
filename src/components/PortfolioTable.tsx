import { Card } from "@/components/ui/card";

interface PortfolioTableProps {
  usdcBalance: string;
  collateralizedBnb: string;
  bnbPrice: number;
}

const PortfolioTable = ({ usdcBalance, collateralizedBnb, bnbPrice }: PortfolioTableProps) => {
  const collateralValueInUSD = parseFloat(collateralizedBnb) * bnbPrice;
  const totalValue = parseFloat(usdcBalance) + collateralValueInUSD;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] bg-clip-text text-transparent">
        Portfolio Overview
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1A1F2C]/80 backdrop-blur-xl border-[#9b87f5]/20 p-6 shadow-xl">
          <div className="space-y-2">
            <h3 className="text-sm text-gray-400">USDC Balance</h3>
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
              {parseFloat(collateralizedBnb).toFixed(2)} BNB
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