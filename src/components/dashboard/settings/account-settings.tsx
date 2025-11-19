"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail } from "lucide-react";
import { FeaturesSection } from "./features-section";
import { format } from "date-fns";

interface AccountSettingsProps {
  user: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string;
    emailAddresses?: Array<{ emailAddress: string }>;
    createdAt?: string | number;
  } | null;
}

export function AccountSettings({ user }: AccountSettingsProps) {
  const initials = user?.firstName && user?.lastName 
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : user?.emailAddresses?.[0]?.emailAddress?.charAt(0).toUpperCase() || "U";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-sans">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription className="font-sans">
            Your account details and profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.imageUrl} alt={user?.firstName || "User"} />
              <AvatarFallback className="text-lg font-semibold font-sans">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="font-medium font-sans">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : "User"
                }
              </h3>
              <p className="text-sm text-muted-foreground font-sans">
                {user?.emailAddresses?.[0]?.emailAddress}
              </p>
            </div>
          </div>

          <Separator />

          {/* Account Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="font-sans">First Name</Label>
              <Input
                id="firstName"
                value={user?.firstName || ""}
                readOnly
                className="font-sans bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="font-sans">Last Name</Label>
              <Input
                id="lastName"
                value={user?.lastName || ""}
                readOnly
                className="font-sans bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-sans">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={user?.emailAddresses?.[0]?.emailAddress || ""}
                readOnly
                className="font-sans bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="joinDate" className="font-sans">Member Since</Label>
              <Input
                id="joinDate"
                value={user?.createdAt ? format(new Date(user.createdAt), "MMMM dd, yyyy") : ""}
                readOnly
                className="font-sans bg-muted"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-sans">
              To update your account information, please use the Clerk user profile.
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" className="font-sans">
              Manage Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <FeaturesSection />
    </div>
  );
}
