import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import SubdomainTable from "@/components/domain/SubdomainTable";
import { useWallet } from "@/hooks/useWallet";
import { Domain } from "@shared/schema";

const SubdomainManagement = () => {
  const { id } = useParams();
  const domainId = parseInt(id || "0");
  const { isConnected } = useWallet();

  const { data: domain, isLoading } = useQuery({
    queryKey: [`/api/domains/${domainId}`],
    enabled: isConnected && !isNaN(domainId),
  });

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          Please connect your wallet to manage subdomains.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold mb-4">Domain Not Found</h1>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          The domain you're looking for doesn't exist or you don't have permission to access it.
        </p>
        <Link href="/my-domains">
          <Button variant="outline" className="flex items-center">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to My Domains
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <section className="mb-20">
      <div className="mb-6">
        <Link href="/my-domains">
          <Button variant="ghost" className="px-0 text-gray-500 hover:text-gray-700 flex items-center">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to My Domains
          </Button>
        </Link>
      </div>

      <Card className="neumorphic p-8">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">
            <span>{(domain as Domain).name}</span>
            <span className="text-secondary">.{(domain as Domain).tld}</span>
          </h2>
          <p className="text-gray-500">Manage subdomains for this domain</p>
        </div>
        <SubdomainTable 
          domainId={domainId} 
          domainName={`${(domain as Domain).name}.${(domain as Domain).tld}`} 
        />
      </Card>
    </section>
  );
};

export default SubdomainManagement;
