import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "./components/layout/header";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import MyDomains from "./pages/MyDomains";
import SubdomainManagement from "./pages/SubdomainManagement";
import NotFound from "@/pages/not-found";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { WagmiProviderWrapper } from "@/components/wallet/WagmiProvider";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-6 py-8 flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/my-domains" component={MyDomains} />
      <Route path="/domain/:id/subdomains" component={SubdomainManagement} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WagmiProviderWrapper>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WalletProvider>
            <Layout>
              <Router />
            </Layout>
            <Toaster />
            {/* Add modal placeholder for Web3Modal */}
            <div id="modal-root"></div>
          </WalletProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </WagmiProviderWrapper>
  );
}

export default App;
