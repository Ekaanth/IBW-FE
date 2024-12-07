import { UserProfile } from "@/components/UserProfile";
import { Header } from "@/components/Header";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-[#121620] p-6 md:p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <Header />
        <UserProfile />
        {/* Other dashboard content */}
      </div>
    </div>
  );
};

export default Dashboard;
