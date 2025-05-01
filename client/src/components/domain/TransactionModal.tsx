import { useState } from "react";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Info, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainName: string;
  registrationYears: number;
  price: string;
  networkFee: string;
  onConfirm: () => void;
  isProcessing: boolean;
}

const TransactionModal = ({
  open,
  onOpenChange,
  domainName,
  registrationYears,
  price,
  networkFee,
  onConfirm,
  isProcessing
}: TransactionModalProps) => {
  const [showInfo, setShowInfo] = useState(false);
  const total = (parseFloat(price) + parseFloat(networkFee)).toFixed(3);

  // Parse domain parts for display
  const domainParts = domainName.split('.');
  const baseName = domainParts[0];
  const tld = domainParts.length > 1 ? domainParts[1] : 'eth';

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (isProcessing) return; // Prevent closing while processing
      onOpenChange(newOpen);
    }}>
      <DialogContent className="neumorphic p-8 max-w-md w-full rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-center font-montserrat font-bold text-2xl mb-2">Complete Registration</DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Confirm your transaction to register this domain
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-white rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Domain Name</span>
            <div className="flex items-center">
              <span className="font-medium">{baseName}</span>
              <span className="font-medium text-secondary">.{tld}</span>
            </div>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Registration Period</span>
            <span className="font-medium">{registrationYears} {registrationYears === 1 ? 'year' : 'years'}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Price</span>
            <span className="font-medium">{price} ETH</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Network Fee (estimated)</span>
            <span className="font-medium">{networkFee} ETH</span>
          </div>
          
          <div className="h-px bg-gray-200 my-6"></div>
          
          <div className="flex justify-between items-center">
            <span className="font-bold">Total</span>
            <span className="font-bold">{total} ETH</span>
          </div>
        </div>

        {showInfo && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm text-blue-700">
              You'll need to approve this transaction in your wallet. Make sure you have enough ETH to cover the total cost plus gas fees.
            </AlertDescription>
          </Alert>
        )}
        
        {isProcessing && (
          <Alert className="mb-4 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-sm text-yellow-700">
              Transaction in progress. Please wait and do not close this window. This might take a minute.
            </AlertDescription>
          </Alert>
        )}
        
        <DialogFooter className="flex flex-col space-y-3">
          <Button
            onClick={() => {
              setShowInfo(true);
              onConfirm();
            }}
            className="bg-primary text-white font-medium py-3 px-6 rounded-xl transition hover:bg-primary/90 w-full"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Transaction...
              </>
            ) : (
              "Confirm in Wallet"
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-gray-600 font-medium py-2"
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionModal;
