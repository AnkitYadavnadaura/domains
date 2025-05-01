import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ExternalLink } from "lucide-react";
import { Subdomain } from "@shared/schema";
import { createSubdomain } from "@/lib/web3";
import { useWallet } from "@/hooks/useWallet";

interface SubdomainTableProps {
  domainId: number;
  domainName: string;
}

const createSubdomainSchema = z.object({
  name: z.string().min(1, "Subdomain name is required"),
});

type CreateSubdomainValues = z.infer<typeof createSubdomainSchema>;

const SubdomainTable = ({ domainId, domainName }: SubdomainTableProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [subdomainToDelete, setSubdomainToDelete] = useState<Subdomain | null>(null);
  const [blockchainTxHash, setBlockchainTxHash] = useState<string | null>(null);
  const [isBlockchainProcessing, setIsBlockchainProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { address } = useWallet();

  const form = useForm<CreateSubdomainValues>({
    resolver: zodResolver(createSubdomainSchema),
    defaultValues: {
      name: "",
    },
  });

  const { data, isLoading } = useQuery<Subdomain[]>({
    queryKey: [`/api/domains/${domainId}/subdomains`],
  });
  
  // Ensure we always have an array of subdomains
  const subdomains = Array.isArray(data) ? data : [];

  // Blockchain subdomain creation mutation
  const blockchainCreateMutation = useMutation({
    mutationFn: async (values: CreateSubdomainValues) => {
      // Indicate blockchain processing has started
      setIsBlockchainProcessing(true);
      
      try {
        // Create subdomain on the blockchain (parent domain token ID, subdomain name, owner address)
        const txHash = await createSubdomain(
          domainId,
          values.name,
          address || ""
        );
        
        // Store transaction hash for reference
        setBlockchainTxHash(txHash);
        return txHash;
      } finally {
        setIsBlockchainProcessing(false);
      }
    }
  });

  // Database subdomain creation mutation
  const createMutation = useMutation({
    mutationFn: async (values: CreateSubdomainValues) => {
      // First try to create subdomain on blockchain
      if (address) {
        await blockchainCreateMutation.mutateAsync(values);
      }
      
      // Then record in our database
      const fullName = `${values.name}.${domainName}`;
      return await apiRequest("POST", `/api/domains/${domainId}/subdomains`, {
        name: fullName,
        records: 0,
        isActive: true,
        txHash: blockchainTxHash || undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/domains/${domainId}/subdomains`] });
      setIsCreating(false);
      form.reset();
      setBlockchainTxHash(null);
      
      toast({
        title: "Subdomain created",
        description: "Your subdomain has been created successfully" + 
          (blockchainTxHash ? " and registered on the blockchain." : "."),
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create subdomain",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      // For subdomains, we just deactivate them on the blockchain rather than fully deleting
      // But in the local database we can fully remove them
      return await apiRequest("DELETE", `/api/subdomains/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/domains/${domainId}/subdomains`] });
      setSubdomainToDelete(null);
      toast({
        title: "Subdomain deleted",
        description: "The subdomain has been deleted from our records",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete subdomain",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CreateSubdomainValues) => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a subdomain",
        variant: "destructive",
      });
      return;
    }
    
    createMutation.mutate(values);
  };

  const handleDeleteClick = (subdomain: Subdomain) => {
    setSubdomainToDelete(subdomain);
  };

  const confirmDelete = () => {
    if (subdomainToDelete) {
      deleteMutation.mutate(subdomainToDelete.id);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="font-montserrat font-bold text-2xl mb-2">Manage Subdomains</h2>
          <h3 className="text-xl text-primary font-medium">{domainName}</h3>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-secondary text-white font-medium py-2 px-6 rounded-lg transition hover:bg-secondary/90"
        >
          Create Subdomain
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : subdomains && subdomains.length > 0 ? (
        <div className="overflow-x-auto">
          <Table className="min-w-full bg-white rounded-lg overflow-hidden">
            <TableHeader className="bg-gray-50 text-left">
              <TableRow>
                <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Subdomain</TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Records</TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-200">
              {subdomains.map((subdomain: Subdomain) => (
                <TableRow key={subdomain.id}>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{subdomain.name}</div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(subdomain.created), 'MMMM d, yyyy')}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 bg-gray-100 rounded-full">{subdomain.records} records</span>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 ${subdomain.isActive ? 'bg-green-100 text-success' : 'bg-red-100 text-destructive'} text-xs rounded-full`}>
                      {subdomain.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <Button variant="ghost" className="text-secondary hover:text-secondary/80">Edit</Button>
                      <Button 
                        variant="ghost" 
                        className="text-destructive hover:text-destructive/80"
                        onClick={() => handleDeleteClick(subdomain)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No subdomains found. Create your first subdomain to get started.</p>
        </div>
      )}

      {/* Create Subdomain Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create Subdomain</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subdomain Name</FormLabel>
                    <div className="flex items-center">
                      <FormControl>
                        <Input {...field} placeholder="subdomain" className="rounded-r-none" />
                      </FormControl>
                      <div className="bg-gray-100 px-3 py-2 border border-l-0 border-input rounded-r-md text-muted-foreground">
                        .{domainName}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Subdomain"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!subdomainToDelete} onOpenChange={(open) => !open && setSubdomainToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subdomain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the subdomain "{subdomainToDelete?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SubdomainTable;
