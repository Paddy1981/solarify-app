import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  change?: string;
  changeType?: "positive" | "negative";
}

export const StatsCard = memo(function StatsCard({ title, value, icon, change, changeType }: StatsCardProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-headline">{value}</div>
        {change && (
          <p className={`text-xs mt-1 flex items-center ${changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
            {changeType === "positive" ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {change} vs last period
          </p>
        )}
      </CardContent>
    </Card>
  );
});
