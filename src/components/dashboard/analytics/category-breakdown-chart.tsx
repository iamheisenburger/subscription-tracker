"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";
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

interface CategoryBreakdownChartProps {
  data: Array<{
    category: string;
    amount: number;
    count: number;
    subscriptions: string[];
    fill: string;
  }>;
  currency?: string;
}

export function CategoryBreakdownChart({ data, currency = "USD" }: CategoryBreakdownChartProps) {
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      amount: {
        label: "Amount",
      },
    };
    
    data.forEach((item, index) => {
      config[item.category.toLowerCase().replace(/\s+/g, '_')] = {
        label: item.category,
        color: `var(--chart-${index + 1})`,
      };
    });
    
    return config;
  }, [data]);

  const totalAmount = useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.amount, 0);
  }, [data]);

  const topCategory = useMemo(() => {
    return data.reduce((prev, current) => 
      prev.amount > current.amount ? prev : current
    , data[0]);
  }, [data]);

  if (data.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle className="font-sans">Category Breakdown</CardTitle>
          <CardDescription className="font-sans">
            No subscription categories to display
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex h-[250px] items-center justify-center text-muted-foreground font-sans">
            Add subscriptions to see category breakdown
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="font-sans">Category Breakdown</CardTitle>
        <CardDescription className="font-sans">
          Monthly spending by category
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent 
                hideLabel
                formatter={(value, name) => [
                  `${currency} ${Number(value).toFixed(2)}`,
                  name
                ]}
              />}
            />
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {currency} {totalAmount.toFixed(0)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-sm"
                        >
                          Total Monthly
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none font-sans">
          {topCategory.category} is your largest category{" "}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none font-sans">
          {currency} {topCategory.amount.toFixed(2)} across {topCategory.count} subscriptions
        </div>
      </CardFooter>
    </Card>
  );
}
