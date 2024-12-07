import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { config } from './config/wagmi';
import Index from "./pages/Index";
import ValidatorDashboard from "./pages/ValidatorDashboard";
import ValidatorActions from "./pages/ValidatorActions";

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider 
        theme={darkTheme({
          accentColor: '#9b87f5',
          borderRadius: 'medium',
        })}
      >
        <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/validator" element={<ValidatorDashboard />} />
                <Route path="/validator/actions" element={<ValidatorActions />} />
              </Routes>
            </BrowserRouter>
        </AuthProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;