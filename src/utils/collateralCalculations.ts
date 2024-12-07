export const calculateBurnAmount = (
  currentRatio: number,
  requiredRatio: number,
  collateralizedBnb: string,
  bnbPrice: number
): number => {
  const shortfall = requiredRatio - currentRatio;
  const bnbValue = parseFloat(collateralizedBnb) * bnbPrice;
  const burnAmount = (shortfall / 100) * (bnbValue / bnbPrice);
  
  // Ensure we don't burn more than what's available
  const maxBurnAmount = parseFloat(collateralizedBnb);
  return Math.min(burnAmount, maxBurnAmount);
};

export const calculateCollateralRatio = (
  collateralizedBnb: string,
  bnbPrice: number,
  usdcBalance: string
): number => {
  const bnbValue = parseFloat(collateralizedBnb) * bnbPrice;
  const usdcValue = parseFloat(usdcBalance);
  return (bnbValue / usdcValue) * 100;
};