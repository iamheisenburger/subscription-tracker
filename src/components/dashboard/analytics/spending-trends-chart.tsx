"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface SpendingTrendsChartProps {
  data: Array<{
    month: string;
    spending: number;
  }>;
  currency?: string;
}

const chartConfig = {
  spending: {
    label: "Monthly Spending",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function SpendingTrendsChart({ data, currency = "USD" }: SpendingTrendsChartProps) {
  // Calculate trend
  const currentMonth = data[data.length - 1]?.spending || 0;
  const previousMonth = data[data.length - 2]?.spending || 0;
  const trend = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0;
  const isPositiveTrend = trend > 0;

  // Calculate total spending over the period
  const totalSpending = data.reduce((sum, item) => sum + item.spending, 0);
  const averageSpending = totalSpending / data.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans">Spending Trends</CardTitle>
        <CardDescription className="font-sans">
          Monthly subscription spending over the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent 
                hideLabel 
                formatter={(value) => [`${currency} ${Number(value).toFixed(2)}`, "Spending"]}
              />}
            />
            <Area
              dataKey="spending"
              type="monotone"
              fill="var(--color-spending)"
              fillOpacity={0.4}
              stroke="var(--color-spending)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none font-sans">
              {isPositiveTrend ? (
                <>
                  Trending up by {Math.abs(trend).toFixed(1)}% this month{" "}
                  <TrendingUp className="h-4 w-4" />
                </>
              ) : trend < 0 ? (
                <>
                  Trending down by {Math.abs(trend).toFixed(1)}% this month{" "}
                  <TrendingDown className="h-4 w-4" />
                </>
              ) : (
                "No change from last month"
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground leading-none font-sans">
              Average: {currency} {averageSpending.toFixed(2)} per month
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

