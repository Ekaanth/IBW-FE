import { Card } from "@/components/ui/card";

interface CollateralRatioProps {
  ratio: number;
}

const CollateralRatio = ({ ratio }: CollateralRatioProps) => {
  const percentage = Math.min(Math.max(ratio, 0), 200);
  const progressWidth = (percentage / 200) * 100;

  return (
    <Card className="bg-[#1A1F2C]/80 backdrop-blur-xl border-[#9b87f5]/20 p-6 shadow-xl">
      <h3 className="text-lg font-semibold bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] bg-clip-text text-transparent mb-4">
        Collateral Ratio
      </h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Current Ratio</span>
          <span className="text-lg font-mono font-semibold text-[#9b87f5]">
            {ratio.toFixed(2)}%
          </span>
        </div>
        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] rounded-full transition-all duration-300"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>100%</span>
          <span>200%</span>
        </div>
      </div>
    </Card>
  );
};

export default CollateralRatio;