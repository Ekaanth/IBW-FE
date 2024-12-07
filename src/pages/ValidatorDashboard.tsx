import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Activity, Shield, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const ValidatorDashboard = () => {
  const navigate = useNavigate();
  const [pendingActionsCount, setPendingActionsCount] = useState(0);

  useEffect(() => {
    fetchPendingActionsCount();
  }, []);

  const fetchPendingActionsCount = async () => {
    const { count, error } = await supabase
      .from('validator_actions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING');

    if (error) {
      console.error('Error fetching pending actions count:', error);
      return;
    }

    setPendingActionsCount(count || 0);
  };

  return (
    <div className="min-h-screen bg-[#121620] p-6 md:p-8">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-white"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Validator #1 Dashboard</h1>
            <p className="text-gray-400 text-sm">Monitor and validate protocol operations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Validator Status Card */}
          <Card className="bg-[#1A1F2C]/80 backdrop-blur-xl border-[#9b87f5]/20 p-6 shadow-xl">
            <div className="space-y-2">
              <h3 className="text-sm text-gray-400">Validator Status</h3>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                <p className="text-xl font-semibold text-green-500">Active</p>
              </div>
              <p className="text-xs text-gray-500">Last checked 2 minutes ago</p>
            </div>
          </Card>

          {/* Validator Stake Card */}
          <Card className="bg-[#1A1F2C]/80 backdrop-blur-xl border-[#9b87f5]/20 p-6 shadow-xl">
            <div className="space-y-2">
              <h3 className="text-sm text-gray-400">Validator Stake</h3>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#9b87f5]" />
                <p className="text-xl font-semibold text-white">32.5 ETH</p>
              </div>
              <p className="text-xs text-gray-500">Currently staked</p>
            </div>
          </Card>

          {/* Pending Actions Card */}
          <Card className="bg-[#1A1F2C]/80 backdrop-blur-xl border-[#9b87f5]/20 p-6 shadow-xl">
            <div className="space-y-2">
              <h3 className="text-sm text-gray-400">Pending Actions</h3>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <p className="text-xl font-semibold text-white">{pendingActionsCount}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">Actions requiring attention</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#9b87f5] hover:text-[#9b87f5]/80"
                  onClick={() => navigate("/validator/actions")}
                >
                  View Actions
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Protocol Metrics Card */}
          <Card className="bg-[#1A1F2C]/80 backdrop-blur-xl border-[#9b87f5]/20 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-6">Protocol Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Value Locked</span>
                <span className="text-white font-mono">$2.5M</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Average Collateral Ratio</span>
                <span className="text-green-500 font-mono">165%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Positions Near Liquidation</span>
                <span className="text-orange-500 font-mono">3</span>
              </div>
            </div>
          </Card>

          {/* Validator Performance Card */}
          <Card className="bg-[#1A1F2C]/80 backdrop-blur-xl border-[#9b87f5]/20 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-6">Validator Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Actions Validated (24h)</span>
                <span className="text-white font-mono">156</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Rewards Earned (30d)</span>
                <span className="text-[#9b87f5] font-mono">2.85 ETH</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Response Time (avg)</span>
                <span className="text-green-500 font-mono">245ms</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ValidatorDashboard;