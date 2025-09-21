"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface ConvexErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface ConvexErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ConvexErrorBoundary extends React.Component<ConvexErrorBoundaryProps, ConvexErrorBoundaryState> {
  constructor(props: ConvexErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ConvexErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Convex Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ConvexErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

function ConvexErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-destructive">Convex Connection Error</CardTitle>
        <CardDescription>
          Unable to connect to the database. This might be a temporary issue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 border border-border rounded-lg p-4 text-left">
          <p className="text-sm text-muted-foreground font-mono">
            {error.message}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => resetError()} className="flex-1">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="flex-1"
          >
            Reload Page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
