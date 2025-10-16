"use client";

/**
 * ConnectedBanksList Component
 * Displays list of user's connected bank accounts
 */

import { BankConnectionCard } from "./bank-connection-card";
import { useBankConnections } from "@/hooks/use-bank-connections";
import { Loader2, Building2 } from "lucide-react";

export function ConnectedBanksList() {
  const { connections, isLoading, disconnect, deleteConnection } =
    useBankConnections();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg bg-muted/20">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium font-sans mb-1">No Banks Connected</h3>
        <p className="text-sm text-muted-foreground font-sans text-center max-w-sm">
          Connect your bank account to automatically detect subscriptions from
          your transactions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {connections.map((connection: any) => (
        <BankConnectionCard
          key={connection._id}
          connection={connection}
          onDisconnect={disconnect}
          onDelete={deleteConnection}
        />
      ))}
    </div>
  );
}
