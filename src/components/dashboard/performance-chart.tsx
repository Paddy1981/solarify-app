"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

const chartData = [
  { date: "Mon", desktop: 18, mobile: 12 },
  { date: "Tue", desktop: 20, mobile: 15 },
  { date: "Wed", desktop: 22, mobile: 18 },
  { date: "Thu", desktop: 19, mobile: 16 },
  { date: "Fri", desktop: 25, mobile: 20 },
  { date: "Sat", desktop: 28, mobile: 22 },
  { date: "Sun", desktop: 26, mobile: 21 },
]

const chartConfig = {
  desktop: {
    label: "Generated (kWh)",
    color: "hsl(var(--primary))",
  },
  mobile: {
    label: "Consumed (kWh)",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig

export function PerformanceChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
          <YAxis tickLine={false} tickMargin={10} axisLine={false} />
          <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent indicator="dot" />} />
          <Legend content={({ payload }) => (
            <div className="flex justify-center gap-4 mt-4">
              {payload?.map((entry) => (
                <div key={entry.value} className="flex items-center text-sm">
                  <span style={{ backgroundColor: entry.color }} className="w-3 h-3 rounded-full mr-2"></span>
                  {String(entry.value).charAt(0).toUpperCase() + String(entry.value).slice(1)}
                </div>
              ))}
            </div>
          )} />
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="mobile" fill="var(--color-mobile)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
