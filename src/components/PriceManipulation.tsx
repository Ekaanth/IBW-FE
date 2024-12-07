import { useState } from 'react';
import { calculateCollateralRatio } from '@/utils/collateralCalculations';

interface PriceManipulationProps {
  bnbPrice: number;
  collateralizedBnb: string;
  usdcBalance: string;
  onPriceChange: (newPrice: number) => void;
  onRevertPrice: () => void;
}

const PriceManipulation = ({ 
  bnbPrice, 
  collateralizedBnb,
  usdcBalance,
  onPriceChange, 
  onRevertPrice 
}: PriceManipulationProps) => {
  const [selectedDrop, setSelectedDrop] = useState<number>(20);
  const BASE_PRICE = 745;

  const handlePriceChange = () => {
    const priceReduction = (bnbPrice * selectedDrop) / 100;
    const newPrice = bnbPrice - priceReduction;
    onPriceChange(selectedDrop);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Price Controls</h2>
      <div className="flex gap-4">
        <select
          value={selectedDrop}
          onChange={(e) => setSelectedDrop(Number(e.target.value))}
          className="bg-[#1A1F2C] text-white border border-[#9b87f5]/20 rounded-lg p-2"
        >
          <option value={20}>20% Drop</option>
          <option value={30}>30% Drop</option>
          <option value={40}>40% Drop</option>
        </select>
        <button
          onClick={handlePriceChange}
          className="bg-red-500/20 text-red-500 px-4 py-2 rounded-lg hover:bg-red-500/30"
        >
          Simulate Price Drop
        </button>
        <button
          onClick={onRevertPrice}
          className="bg-[#9b87f5]/20 text-[#9b87f5] px-4 py-2 rounded-lg hover:bg-[#9b87f5]/30"
        >
          Reset Price
        </button>
      </div>

      {/* Preview section */}
      <div className="mt-4 text-sm text-gray-400">
        <p>Base Price: ${BASE_PRICE.toFixed(2)}</p>
        <p>Current Price: ${bnbPrice.toFixed(2)}</p>
        <p>Price After {selectedDrop}% Drop: ${(bnbPrice * (1 - selectedDrop/100)).toFixed(2)}</p>
        <p>Current Collateral Ratio: {calculateCollateralRatio(collateralizedBnb, bnbPrice, usdcBalance).toFixed(2)}%</p>
        <p>Ratio After Drop: {calculateCollateralRatio(collateralizedBnb, bnbPrice * (1 - selectedDrop/100), usdcBalance).toFixed(2)}%</p>
      </div>
    </div>
  );
};

export default PriceManipulation;