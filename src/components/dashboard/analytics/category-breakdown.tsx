"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Tag, DollarSign } from "lucide-react";

interface CategoryBreakdownProps {
  userId: string;
}

export function CategoryBreakdown({ userId }: CategoryBreakdownProps) {
  // TODO: Implement actual category data fetching
  const mockCategories = [
    { name: "Entertainment", amount: 45.99, percentage: 52 },
    { name: "Productivity", amount: 25.00, percentage: 28 },
    { name: "Cloud Storage", amount: 12.99, percentage: 15 },
    { name: "Other", amount: 4.50, percentage: 5 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-sans">
          <PieChart className="h-5 w-5" />
          Category Breakdown
        </CardTitle>
        <CardDescription className="font-sans">
          How your subscription spending is distributed across categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockCategories.map((category, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium font-sans">{category.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-sans">
                    {category.percentage}%
                  </span>
                  <span className="font-bold font-sans">${category.amount.toFixed(2)}</span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground font-sans">
            <strong>Coming Soon:</strong> Interactive pie charts, category insights, and spending recommendations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
