import { UserProfile } from "@/components/UserProfile";
import { Header } from "@/components/Header";
import { CollateralManager } from "@/components/CollateralManager";
import { useAccount } from 'wagmi';

const Dashboard = () => {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-[#121620] p-6 md:p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <Header />
        {isConnected ? (
          <>
            <UserProfile />
            <CollateralManager />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-white">Welcome to IBW Terminal</h2>
              <p className="text-gray-400">Connect your wallet to manage your collateral positions</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
