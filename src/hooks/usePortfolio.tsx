import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const usePortfolio = () => {
  const [bnbPrice, setBnbPrice] = useState<number>(300);
  const [collateralRatio, setCollateralRatio] = useState<number>(200);
  const [bnbBalance, setBnbBalance] = useState<string>('10.0');
  const [usdcBalance, setUsdcBalance] = useState<string>('2000.0');
  const [collateralizedBnb, setCollateralizedBnb] = useState<string>('13.33');
  const { toast } = useToast();

  const fetchLatestPosition = async () => {
    try {
      const { data: positions, error } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', 'default_user')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching position:', error);
        return;
      }

      if (positions && positions.length > 0) {
        const position = positions[0];
        const bnbAmount = Math.max(0, position.bnb_amount);
        setCollateralizedBnb(bnbAmount.toString());
        setUsdcBalance(position.usdc_amount.toString());
        console.log('Fetched position:', position);
      } else {
        // If no position exists, create initial position
        const { error: insertError } = await supabase
          .from('positions')
          .insert([
            {
              user_id: 'default_user',
              bnb_amount: 13.33,
              usdc_amount: 2000.0
            }
          ]);

        if (insertError) {
          console.error('Error creating initial position:', insertError);
        }
      }
    } catch (error) {
      console.error('Error in fetchLatestPosition:', error);
    }
  };

  useEffect(() => {
    fetchLatestPosition();
    
    const subscription = supabase
      .channel('positions_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'positions' }, 
        (payload) => {
          console.log('Received position change:', payload);
          fetchLatestPosition();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleReset = async () => {
    try {
      setBnbPrice(300);
      setCollateralRatio(200);
      
      // Reset positions table
      const { error: positionsError } = await supabase
        .from('positions')
        .upsert({
          user_id: 'default_user',
          bnb_amount: 13.33,
          usdc_amount: 2000.0
        });

      if (positionsError) throw positionsError;

      // Reset validator actions table
      const { error: validatorError } = await supabase
        .from('validator_actions')
        .delete()
        .gte('created_at', '2000-01-01'); // This will match all records

      if (validatorError) throw validatorError;

      // Reset price history table
      const { error: priceError } = await supabase
        .from('price_history')
        .delete()
        .gte('timestamp', '2000-01-01'); // This will match all records

      if (priceError) throw priceError;

      setBnbBalance('10.0');
      setUsdcBalance('2000.0');
      setCollateralizedBnb('13.33');

      toast({
        title: "Values Reset",
        description: "All values have been reset to their initial state",
      });
    } catch (error) {
      console.error('Error resetting values:', error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset values",
        variant: "destructive",
      });
    }
  };

  const handleCollateralization = async (bnbAmount: string, usdcAmount: string) => {
    try {
      const requiredBnbValue = parseFloat(usdcAmount) * 2; 
      const requiredBnbAmount = requiredBnbValue / bnbPrice;
      
      const newBnbBalance = (parseFloat(bnbBalance) - requiredBnbAmount).toFixed(2);
      const newUsdcBalance = (parseFloat(usdcBalance) + parseFloat(usdcAmount)).toFixed(2);
      const newCollateralizedBnb = (parseFloat(collateralizedBnb) + requiredBnbAmount).toFixed(2);
      
      // Update local state
      setBnbBalance(newBnbBalance);
      setUsdcBalance(newUsdcBalance);
      setCollateralizedBnb(newCollateralizedBnb);

      // Persist to database
      const { error: updateError } = await supabase
        .from('positions')
        .upsert({
          user_id: 'default_user',
          bnb_amount: parseFloat(newCollateralizedBnb),
          usdc_amount: parseFloat(newUsdcBalance)
        });

      if (updateError) {
        throw updateError;
      }

      console.log('Collateralization updated:', {
        requiredBnbAmount,
        newBnbBalance,
        newUsdcBalance,
        newCollateralizedBnb
      });
    } catch (error) {
      console.error('Error in handleCollateralization:', error);
      toast({
        title: "Collateralization Failed",
        description: "Failed to update collateral position",
        variant: "destructive",
      });
    }
  };

  return {
    bnbPrice,
    setBnbPrice,
    collateralRatio,
    setCollateralRatio,
    bnbBalance,
    setBnbBalance,
    usdcBalance,
    setUsdcBalance,
    collateralizedBnb,
    setCollateralizedBnb,
    handleReset,
    handleCollateralization,
    fetchLatestPosition
  };
};