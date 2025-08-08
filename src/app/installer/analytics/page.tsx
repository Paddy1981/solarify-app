"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChartHorizontalBig, TrendingUp, DollarSign, Target, Calendar, Award } from "lucide-react";

export default function InstallerAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/installer/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-headline tracking-tight text-accent">Performance Analytics</h1>
          <p className="text-lg text-foreground/70">Track your business performance and growth metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">$325,000</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects Completed</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">24</div>
            <p className="text-xs text-muted-foreground">+3 from last month</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quote Conversion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">85%</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Project Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">$25,000</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <BarChartHorizontalBig className="w-5 h-5 mr-2 text-accent" />
              Monthly Revenue Trend
            </CardTitle>
            <CardDescription>Revenue performance over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { month: 'Jan 2024', revenue: '$180,000', growth: '+15%' },
                { month: 'Feb 2024', revenue: '$205,000', growth: '+14%' },
                { month: 'Mar 2024', revenue: '$235,000', growth: '+15%' },
                { month: 'Apr 2024', revenue: '$260,000', growth: '+11%' },
                { month: 'May 2024', revenue: '$290,000', growth: '+12%' },
                { month: 'Jun 2024', revenue: '$325,000', growth: '+12%' },
              ].map((data, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                  <span className="font-medium">{data.month}</span>
                  <div className="text-right">
                    <div className="font-bold text-accent">{data.revenue}</div>
                    <div className="text-xs text-green-600">{data.growth}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <Target className="w-5 h-5 mr-2 text-accent" />
              Recent Performance Metrics
            </CardTitle>
            <CardDescription>Key performance indicators for your business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                <span className="text-sm">Active RFQs Responded</span>
                <span className="font-bold text-accent">18/20</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                <span className="text-sm">Average Response Time</span>
                <span className="font-bold text-accent">4.2 hours</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                <span className="text-sm">Customer Satisfaction</span>
                <span className="font-bold text-accent">4.8/5.0</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                <span className="text-sm">Repeat Customers</span>
                <span className="font-bold text-accent">35%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                <span className="text-sm">Project Completion Rate</span>
                <span className="font-bold text-accent">98%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-accent" />
            Project Timeline Analysis
          </CardTitle>
          <CardDescription>Average project completion times by system size</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-md">
              <div className="text-2xl font-bold text-accent">12 days</div>
              <div className="text-sm text-muted-foreground">Small Systems (&lt;10kW)</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-md">
              <div className="text-2xl font-bold text-accent">18 days</div>
              <div className="text-sm text-muted-foreground">Medium Systems (10-25kW)</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-md">
              <div className="text-2xl font-bold text-accent">28 days</div>
              <div className="text-sm text-muted-foreground">Large Systems (&gt;25kW)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Analytics data is updated in real-time based on your projects, quotes, and RFQ responses.
        </p>
      </div>
    </div>
  );
}