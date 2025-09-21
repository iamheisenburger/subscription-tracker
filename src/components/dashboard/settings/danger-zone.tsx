"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

interface DangerZoneProps {
  userId: string;
}

export function DangerZone({ }: DangerZoneProps) {
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const handleExportData = () => {
    toast.success("Data export started. You'll receive an email when ready.");
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error("Please type DELETE to confirm account deletion.");
      return;
    }
    
    // TODO: Implement account deletion
    toast.error("Account deletion is not yet implemented.");
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
            <h4 className="font-medium font-sans">Export Account Data</h4>
            <p className="text-sm text-muted-foreground font-sans">
              Download all your subscription data and account information
            </p>
          </div>
          <Button variant="outline" onClick={handleExportData} className="font-sans">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>

        <Separator />

        {/* Delete Account */}
        <div className="space-y-4">
          <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <h4 className="font-medium text-destructive font-sans mb-2">
              Delete Account
            </h4>
            <p className="text-sm text-muted-foreground font-sans mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="font-sans">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-sans">
                    Are you absolutely sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-sans">
                    This action cannot be undone. This will permanently delete your
                    account and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="delete-confirmation" className="font-sans">
                      Type <strong>DELETE</strong> to confirm:
                    </Label>
                    <Input
                      id="delete-confirmation"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="DELETE"
                      className="font-sans"
                    />
                  </div>
                </div>
                
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-sans">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-sans"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
