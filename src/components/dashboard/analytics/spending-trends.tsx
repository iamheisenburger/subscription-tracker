"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";

interface SpendingTrendsProps {
  userId: string;
}

export function SpendingTrends({ userId }: SpendingTrendsProps) {
  // TODO: Implement actual analytics data fetching
  const mockData = [
    { month: "Jan", amount: 79.99 },
    { month: "Feb", amount: 85.50 },
    { month: "Mar", amount: 82.75 },
    { month: "Apr", amount: 90.25 },
    { month: "May", amount: 87.80 },
    { month: "Jun", amount: 92.15 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-sans">
          <TrendingUp className="h-5 w-5" />
          Spending Trends
        </CardTitle>
        <CardDescription className="font-sans">
          Your subscription spending over the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium font-sans">{item.month}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-bold font-sans">${item.amount.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground font-sans">
            <strong>Coming Soon:</strong> Interactive charts, trend analysis, and spending predictions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
