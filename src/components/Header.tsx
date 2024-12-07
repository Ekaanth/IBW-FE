import { Button } from "@/components/ui/button";
import { ChartBar } from "lucide-react";
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Header = () => {
  return (
    <header className="mb-8 bg-[#1A1F2C]/80 backdrop-blur-xl rounded-2xl border border-[#9b87f5]/20 p-6 shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <ChartBar className="h-8 w-8 text-[#9b87f5]" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] bg-clip-text text-transparent">
            Eigen Layer Terminal
          </h1>
        </div>
        <ConnectButton 
          chainStatus="icon"
          showBalance={false}
        />
      </div>
    </header>
  );
};

export default Header;