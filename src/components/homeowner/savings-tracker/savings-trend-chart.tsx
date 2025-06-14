
"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { MonthlySavingEntry } from '@/app/homeowner/savings-tracker/page';
import { format } from 'date-fns';

interface SavingsTrendChartProps {
  data: MonthlySavingEntry[];
  currencySymbol?: string;
}

export function SavingsTrendChart({ data, currencySymbol = "$" }: SavingsTrendChartProps) {
  const chartConfig = {
    projectedSavings: {
      label: `Projected Savings (${currencySymbol})`,
      color: "hsl(var(--chart-2))", // Accent color
    },
    actualSavings: {
      label: `Actual Savings (${currencySymbol})`,
      color: "hsl(var(--chart-1))", // Primary color
    },
  } satisfies ChartConfig;

  const chartData = data.map(entry => ({
    month: format(new Date(entry.month), "MMM yy"), // Format as "Jan 24"
    projectedSavings: entry.projectedSavings,
    actualSavings: entry.actualSavings,
  }));

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 20,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            // angle={-30}
            // textAnchor="end"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value) => `${currencySymbol}${value}`}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            content={<ChartTooltipContent indicator="dot" hideLabel />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            dataKey="projectedSavings"
            type="monotone"
            stroke="var(--color-projectedSavings)"
            strokeWidth={2}
            dot={{
              fill: "var(--color-projectedSavings)",
            }}
            activeDot={{
              r: 6,
            }}
          />
          <Line
            dataKey="actualSavings"
            type="monotone"
            stroke="var(--color-actualSavings)"
            strokeWidth={2}
            dot={{
              fill: "var(--color-actualSavings)",
            }}
            activeDot={{
              r: 6,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
