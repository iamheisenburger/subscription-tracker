"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Download, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface DangerZoneProps {
  userId: string;
}

export function DangerZone({ }: DangerZoneProps) {
  const handleExportData = () => {
    toast.success("Data export started. You'll receive an email when ready.");
  };

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive font-sans">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription className="font-sans">
          Irreversible actions that will permanently affect your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Data */}
        <div className="flex items-center justify-between p-4 border border-muted rounded-lg">
          <div>
            <h4 className="font-medium font-sans">Export account data</h4>
            <p className="text-sm text-muted-foreground font-sans">
              Download all your subscription data and account information.
            </p>
          </div>
          <Button variant="outline" onClick={handleExportData} className="font-sans">
            <Download className="mr-2 h-4 w-4" />
            Export data
          </Button>
        </div>

        <Separator />

        {/* Delete Account via Clerk */}
        <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5 space-y-3">
          <h4 className="font-medium text-destructive font-sans">
            Delete account
          </h4>
          <p className="text-sm text-muted-foreground font-sans">
            Permanently delete your SubWise account and all associated data. This action
            is managed through your Clerk security settings and cannot be undone.
          </p>
          <Link href="/user-profile/security">
            <Button variant="destructive" className="font-sans">
              <Trash2 className="mr-2 h-4 w-4" />
              Open security &amp; deletion settings
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
