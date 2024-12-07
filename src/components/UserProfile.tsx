import { useAccount } from 'wagmi';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";
import { truncateAddress } from "@/lib/utils";

const UserProfile = () => {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return null;
  }

  return (
    <Card className="bg-[#1A1F2C]/80 backdrop-blur-xl border-[#9b87f5]/20 p-6 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[#9b87f5]/20 flex items-center justify-center">
            <Wallet className="h-6 w-6 text-[#9b87f5]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Connected Wallet</h3>
            <p className="text-sm text-gray-400">{truncateAddress(address)}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-gray-400 hover:text-white hover:bg-[#1A1F2C]"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </Card>
  );
};

export default UserProfile;