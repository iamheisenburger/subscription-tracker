"use client";

import { useMemo } from "react";
import { Calendar } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface BillingCycleChartProps {
  data: Array<{
    cycle: string;
    count: number;
    amount: number;
    fill: string;
  }>;
  currency?: string;
}

const chartConfig = {
  count: {
    label: "Subscriptions",
    color: "var(--chart-1)",
  },
  amount: {
    label: "Monthly Amount",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function BillingCycleChart({ data, currency = "USD" }: BillingCycleChartProps) {
  const totalSubscriptions = useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.count, 0);
  }, [data]);

  const mostCommonCycle = useMemo(() => {
    return data.reduce((prev, current) => 
      prev.count > current.count ? prev : current
    , data[0]);
  }, [data]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Billing Cycles</CardTitle>
          <CardDescription className="font-sans">
            No billing data to display
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground font-sans">
            Add subscriptions to see billing cycle breakdown
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-sans">
          <Calendar className="h-5 w-5" />
          Billing Cycles
        </CardTitle>
        <CardDescription className="font-sans">
          Distribution of subscription billing frequencies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              top: 20,
              right: 20,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="cycle"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent 
                formatter={(value, name) => {
                  if (name === "count") {
                    return [`${value} subscriptions`, "Count"];
                  }
                  return [`${currency} ${Number(value).toFixed(2)}`, "Monthly Amount"];
                }}
              />}
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground font-sans">
          <div className="flex items-center gap-2">
            Most common: <span className="font-medium text-foreground">{mostCommonCycle?.cycle}</span>
            ({mostCommonCycle?.count} of {totalSubscriptions} subscriptions)
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


