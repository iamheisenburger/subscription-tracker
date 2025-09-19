"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, Clock } from "lucide-react";

interface UpcomingRenewalsProps {
  userId: string;
}

interface Renewal {
  id: string;
  name: string;
  cost: number;
  currency: string;
  renewalDate: number;
  daysUntil: number;
}

export function UpcomingRenewals({ userId }: UpcomingRenewalsProps) {
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch actual renewals from Convex
    // For now, using mock data
    setTimeout(() => {
      const now = Date.now();
      setRenewals([
        {
          id: "1",
          name: "Netflix",
          cost: 15.99,
          currency: "USD",
          renewalDate: now + (3 * 24 * 60 * 60 * 1000),
          daysUntil: 3,
        },
        {
          id: "2",
          name: "Spotify Premium", 
          cost: 9.99,
          currency: "USD",
          renewalDate: now + (7 * 24 * 60 * 60 * 1000),
          daysUntil: 7,
        },
      ]);
      setLoading(false);
    }, 1000);
  }, [userId]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil <= 3) return "bg-red-100 text-red-800";
    if (daysUntil <= 7) return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Upcoming Renewals
          </CardTitle>
          <CardDescription>Next 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse p-3 border rounded">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (renewals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Upcoming Renewals
          </CardTitle>
          <CardDescription>Next 30 days</CardDescription>
        </CardHeader>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">
              No renewals in the next 30 days
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Upcoming Renewals
        </CardTitle>
        <CardDescription>Next 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {renewals.map((renewal) => (
            <div
              key={renewal.id}
              className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900">{renewal.name}</h4>
                <Badge
                  className={getUrgencyColor(renewal.daysUntil)}
                  variant="secondary"
                >
                  {renewal.daysUntil} days
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(renewal.renewalDate)}
                </div>
                <div className="font-semibold text-gray-900">
                  {renewal.currency} {renewal.cost}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
