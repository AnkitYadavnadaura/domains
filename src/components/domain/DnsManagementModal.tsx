
import { useState } from "react";
import { getDomainRegistryContract } from "@/lib/web3";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DnsManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainId: number;
}

const DnsManagementModal = ({ open, onOpenChange, domainId }: DnsManagementModalProps) => {
  const [dnsType, setDnsType] = useState<"ip" | "domain" | "ipfs">("ip");
  const [value, setValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async () => {
    setIsUpdating(true);
    try {
      const contract = await getDomainRegistryContract();
      const domain = await contract.getDomain(domainId);
      
      // Create metadata object
      const metadata = {
        type: dnsType,
        value: value
      };
      
      // Convert metadata to JSON string
      const metadataString = JSON.stringify(metadata);
      
      // Call updateURI function
      const tx = await contract.updateURI(domain.name, domain.tld, metadataString);
      await tx.wait();
      
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating DNS:", error);
      alert(`Failed to update DNS: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neumorphic p-6 max-w-md w-full rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-center font-montserrat font-bold text-2xl mb-4">
            Manage DNS Records
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup value={dnsType} onValueChange={(v) => setDnsType(v as any)}>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="ip" id="ip" />
              <Label htmlFor="ip">IP Redirect</Label>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="domain" id="domain" />
              <Label htmlFor="domain">Domain Redirect</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ipfs" id="ipfs" />
              <Label htmlFor="ipfs">IPFS Storage</Label>
            </div>
          </RadioGroup>

          <div>
            <Label>
              {dnsType === "ip" ? "IP Address" : 
               dnsType === "domain" ? "Domain Name" : 
               "IPFS Hash"}
            </Label>
            <Input
              placeholder={
                dnsType === "ip" ? "Enter IP address" :
                dnsType === "domain" ? "Enter domain name" :
                "Enter IPFS hash"
              }
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-2"
            />
          </div>

          <Button 
            onClick={handleSubmit}
            className="w-full bg-primary text-white"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Updating DNS...
              </div>
            ) : (
              "Update DNS Record"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DnsManagementModal;
