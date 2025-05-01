import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { Domain } from "@shared/schema";
import { useState } from "react";
import DnsManagementModal from "./DnsManagementModal";

interface DomainCardProps {
  domain: Domain;
}

const DomainCard = ({ domain }: DomainCardProps) => {
  const { id, name, tld, registered, expires, isActive } = domain;

  // Calculate days until expiration
  const today = new Date();
  const expiryDate = new Date(expires);
  const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const [open, setOpen] = useState(false);

  return (
    <Card className="neumorphic p-6 domain-card">
      <CardContent className="p-0">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-500">
            Registered on {format(new Date(registered), 'MM/dd/yyyy')}
          </span>
          <span className="px-2 py-1 bg-green-100 text-success text-xs rounded-full">
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <h3 className="font-montserrat font-semibold text-xl mb-1">
          <span>{name}</span>
          <span className="text-secondary">.{tld}</span>
        </h3>
        <p className="text-gray-600 text-sm mb-6">
          Expires in {daysRemaining} days
        </p>

        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-sm bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition"
              >
                Manage
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setOpen(true)}>
                Add/Update DNS
              </DropdownMenuItem>
              <Link href={`/domain/${id}/subdomains`}>
                <DropdownMenuItem>
                  Add Subdomains
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            className="text-sm bg-accent/10 text-accent py-2 px-4 rounded-lg hover:bg-accent/20 transition"
          >
            Transfer
          </Button>
        </div>
        <DnsManagementModal open={open} onOpenChange={setOpen} domainId={id} />
      </CardContent>
    </Card>
  );
};

export default DomainCard;