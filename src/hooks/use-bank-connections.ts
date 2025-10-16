/**
 * Hook: useBankConnections
 * Manages bank connection state and operations
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export function useBankConnections() {
  const { user } = useUser();
  const clerkUserId = user?.id;

  // Get user's bank connections
  const connections = useQuery(
    api.bankConnections.getUserConnections,
    clerkUserId ? { clerkUserId } : "skip"
  );

  // Get active connections count
  const activeConnectionsCount = useQuery(
    api.bankConnections.getActiveConnectionsCount,
    clerkUserId ? { clerkUserId } : "skip"
  );

  // Disconnect mutation
  const disconnectMutation = useMutation(api.bankConnections.disconnect);

  // Delete mutation
  const deleteMutation = useMutation(api.bankConnections.deleteConnection);

  const disconnect = async (connectionId: string) => {
    if (!clerkUserId) throw new Error("Not authenticated");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return disconnectMutation({ connectionId: connectionId as any, clerkUserId });
  };

  const deleteConnection = async (connectionId: string) => {
    if (!clerkUserId) throw new Error("Not authenticated");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return deleteMutation({ connectionId: connectionId as any, clerkUserId });
  };

  // Transform connections to match expected type (null -> undefined for institution)
  const transformedConnections = (connections || []).map((conn) => ({
    ...conn,
    institution: conn.institution ?? undefined,
  }));

  return {
    connections: transformedConnections,
    activeConnectionsCount: activeConnectionsCount || 0,
    isLoading: connections === undefined || activeConnectionsCount === undefined,
    disconnect,
    deleteConnection,
  };
}
