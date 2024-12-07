import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

const ValidatorActions = () => {
  const navigate = useNavigate();
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [pendingActions, setPendingActions] = useState<any[]>([]);

  useEffect(() => {
    fetchPendingActions();
  }, []);

  const fetchPendingActions = async () => {
    const { data, error } = await supabase
      .from('validator_actions')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching actions:', error);
      return;
    }

    setPendingActions(data || []);
  };

  const handleLiquidation = async (action: any) => {
    try {
      // Update the validator action status first
      const { error: actionError } = await supabase
        .from('validator_actions')
        .update({ status: 'COMPLETED' })
        .eq('id', action.id);

      if (actionError) {
        console.error('Error updating action:', actionError);
        toast.error("Failed to update action status");
        return;
      }

      // Get current position
      const { data: positions, error: positionsError } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', 'default_user')
        .order('created_at', { ascending: false })
        .limit(1);

      if (positionsError) {
        console.error('Error fetching positions:', positionsError);
        toast.error("Failed to fetch positions");
        return;
      }

      const burnAmount = Number(action.details.burn_amount);
      
      if (positions && positions.length > 0) {
        const currentPosition = positions[0];
        const newBnbAmount = Math.max(0, Number(currentPosition.bnb_amount) - burnAmount);
        
        // Update position with reduced BNB amount but keep USDC amount the same
        const { error: updateError } = await supabase
          .from('positions')
          .update({ 
            bnb_amount: newBnbAmount,
            // Keep usdc_amount unchanged
            usdc_amount: currentPosition.usdc_amount 
          })
          .eq('id', currentPosition.id);

        if (updateError) {
          console.error('Error updating position:', updateError);
          toast.error("Failed to update position");
          return;
        }

        console.log('Updated position after liquidation:', {
          previousBnbAmount: currentPosition.bnb_amount,
          burnAmount,
          newBnbAmount,
          usdcAmount: currentPosition.usdc_amount
        });
      }

      toast.success(`Liquidation executed successfully. ${burnAmount} BNB has been burned to maintain collateral ratio.`);
      setCompletedActions(prev => [...prev, action.id]);
      await fetchPendingActions();
    } catch (error) {
      console.error('Liquidation error:', error);
      toast.error("Failed to execute liquidation");
    }
  };

  const handleValidatePrice = async (action: any) => {
    try {
      await supabase
        .from('validator_actions')
        .update({ status: 'COMPLETED' })
        .eq('id', action.id);

      toast.success("Price validated successfully");
      setCompletedActions(prev => [...prev, action.id]);
      await fetchPendingActions();
    } catch (error) {
      console.error('Price validation error:', error);
      toast.error("Failed to validate price");
    }
  };

  return (
    <div className="min-h-screen bg-[#121620] p-6 md:p-8">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-white"
            onClick={() => navigate("/validator")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Pending Actions</h1>
            <p className="text-gray-400 text-sm">Review and execute validator actions</p>
          </div>
        </div>

        <div className="grid gap-6">
          {pendingActions.length === 0 ? (
            <div className="text-center text-gray-400">
              <p>No pending actions</p>
            </div>
          ) : (
            pendingActions.map((action) => (
              <Card key={action.id} className="bg-[#1A1F2C]/80 backdrop-blur-xl border-[#9b87f5]/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    {action.action_type === 'LIQUIDATION' ? (
                      <>
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Liquidation Required
                        <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded-full ml-2">HIGH</span>
                      </>
                    ) : (
                      <>
                        Price Oracle Update
                        <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-full ml-2">MEDIUM</span>
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {action.action_type === 'LIQUIDATION' && (
                    <div className="space-y-2 text-gray-400">
                      <p>BNB price decrease has triggered collateral ratio breach</p>
                      <div className="bg-[#12162080] rounded-lg p-4 space-y-2">
                        <p>Current Ratio: {action.details.current_ratio.toFixed(2)}%</p>
                        <p>Required Ratio: {action.details.required_ratio}%</p>
                        <p>BNB Price: ${action.details.bnb_price}</p>
                        <p>USDC Held: {action.details.usdc_held}</p>
                        <p>Required Action: Burn {action.details.burn_amount} BNB to maintain ratio</p>
                      </div>
                    </div>
                  )}
                  {action.action_type === 'LIQUIDATION' ? (
                    <Button 
                      onClick={() => handleLiquidation(action)}
                      className="w-full bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Execute Liquidation
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleValidatePrice(action)}
                      className="w-full bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Validate Price
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidatorActions;
