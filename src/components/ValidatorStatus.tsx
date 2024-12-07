import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ValidatorStatusProps {
  isActive: boolean;
}

const ValidatorStatus = ({ isActive }: ValidatorStatusProps) => {
  const navigate = useNavigate();

  return (
    <Card className="bg-[#1A1F2C]/80 backdrop-blur-xl border-[#9b87f5]/20 p-6 shadow-xl">
      <h3 className="text-lg font-semibold bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] bg-clip-text text-transparent mb-4">
        AVS Validator Status
      </h3>
      <div className="flex items-center space-x-2">
        {isActive ? (
          <>
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <span className="text-emerald-400 font-medium">Active</span>
          </>
        ) : (
          <>
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-400 font-medium">Inactive</span>
          </>
        )}
      </div>
      <p className="mt-2 text-sm text-gray-400">
        Monitoring collateral ratio and ready to take action
      </p>
      <Button
        className="mt-4 w-full bg-[#9b87f5] hover:bg-[#7E69AB]"
        onClick={() => navigate("/validator")}
      >
        Go to Validator Dashboard
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Card>
  );
};

export default ValidatorStatus;