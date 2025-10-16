"use client";

/**
 * BankConnectionCard Component
 * Displays a single bank connection with status and actions
 */

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MoreVertical,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BankConnectionCardProps {
  connection: {
    _id: string;
    status: "active" | "disconnected" | "error" | "requires_reauth";
    lastSyncedAt?: number;
    errorMessage?: string;
    institution?: {
      name: string;
      logoUrl?: string;
    };
  };
  onDisconnect?: (connectionId: string) => Promise<void>;
  onDelete?: (connectionId: string) => Promise<void>;
}

export function BankConnectionCard({
  connection,
  onDisconnect,
  onDelete,
}: BankConnectionCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await onDisconnect?.(connection._id);
      toast.success("Bank disconnected successfully");
      setShowDisconnectDialog(false);
    } catch (error) {
      toast.error("Failed to disconnect bank");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await onDelete?.(connection._id);
      toast.success("Bank connection deleted");
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error("Failed to delete connection");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (connection.status) {
      case "active":
        return (
          <div className="flex items-center gap-1.5 text-green-600 dark:text-green-500">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Active</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-500">
            <XCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Error</span>
          </div>
        );
      case "requires_reauth":
        return (
          <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-500">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Needs Reauth</span>
          </div>
        );
      case "disconnected":
        return (
          <div className="flex items-center gap-1.5 text-gray-500">
            <XCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Disconnected</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-4 flex-1">
          {/* Bank Logo/Icon */}
          <div className="flex-shrink-0">
            {connection.institution?.logoUrl ? (
              <img
                src={connection.institution.logoUrl}
                alt={connection.institution.name}
                className="h-10 w-10 rounded-lg object-contain"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            )}
          </div>

          {/* Bank Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium font-sans truncate">
              {connection.institution?.name || "Unknown Bank"}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge()}
              {connection.lastSyncedAt && connection.status === "active" && (
                <span className="text-xs text-muted-foreground font-sans">
                  • Synced{" "}
                  {formatDistanceToNow(connection.lastSyncedAt, {
                    addSuffix: true,
                  })}
                </span>
              )}
            </div>
            {connection.errorMessage && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-sans">
                {connection.errorMessage}
              </p>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 hover:bg-muted rounded-md transition-colors">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {connection.status === "active" && (
              <DropdownMenuItem onClick={() => setShowDisconnectDialog(true)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Disconnect
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Bank?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop syncing transactions from{" "}
              {connection.institution?.name}. Existing subscriptions detected
              from this bank will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? "Disconnecting..." : "Disconnect"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bank Connection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all transactions and data from{" "}
              {connection.institution?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
