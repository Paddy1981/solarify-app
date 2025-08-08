"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChartHorizontalBig, TrendingUp, DollarSign, Package, ShoppingCart, Star } from "lucide-react";

export default function SupplierAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/supplier/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-headline tracking-tight text-accent">Sales Analytics</h1>
          <p className="text-lg text-foreground/70">Monitor your sales performance and inventory metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">$145,000</div>
            <p className="text-xs text-muted-foreground">+18% from last month</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Fulfilled</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">128</div>
            <p className="text-xs text-muted-foreground">+15 from last month</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Listed</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">45</div>
            <p className="text-xs text-muted-foreground">+3 new this month</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">$1,133</div>
            <p className="text-xs text-muted-foreground">+3% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <BarChartHorizontalBig className="w-5 h-5 mr-2 text-accent" />
              Top Selling Products
            </CardTitle>
            <CardDescription>Your best performing products this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { product: 'SolarMax 400W Panel', sales: '$28,500', units: '95 units' },
                { product: 'PowerInverter Pro 5kW', sales: '$22,100', units: '13 units' },
                { product: 'EcoMount Racking System', sales: '$18,750', units: '75 sets' },
                { product: 'BatteryBank 10kWh', sales: '$15,600', units: '8 units' },
                { product: 'SmartMonitor WiFi', sales: '$12,400', units: '62 units' },
              ].map((data, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                  <div>
                    <div className="font-medium">{data.product}</div>
                    <div className="text-xs text-muted-foreground">{data.units}</div>
                  </div>
                  <div className="font-bold text-accent">{data.sales}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-accent" />
              Monthly Sales Trend
            </CardTitle>
            <CardDescription>Sales performance over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { month: 'Jan 2024', sales: '$95,000', growth: '+22%' },
                { month: 'Feb 2024', sales: '$108,000', growth: '+14%' },
                { month: 'Mar 2024', sales: '$118,000', growth: '+9%' },
                { month: 'Apr 2024', sales: '$125,000', growth: '+6%' },
                { month: 'May 2024', sales: '$130,000', growth: '+4%' },
                { month: 'Jun 2024', sales: '$145,000', growth: '+12%' },
              ].map((data, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                  <span className="font-medium">{data.month}</span>
                  <div className="text-right">
                    <div className="font-bold text-accent">{data.sales}</div>
                    <div className="text-xs text-green-600">{data.growth}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <Star className="w-5 h-5 mr-2 text-accent" />
              Store Performance Metrics
            </CardTitle>
            <CardDescription>Key indicators for your store performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                <span className="text-sm">Store Rating</span>
                <span className="font-bold text-accent">4.7/5.0</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                <span className="text-sm">Customer Reviews</span>
                <span className="font-bold text-accent">234 reviews</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                <span className="text-sm">Repeat Customers</span>
                <span className="font-bold text-accent">42%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                <span className="text-sm">Order Fulfillment Rate</span>
                <span className="font-bold text-accent">99.2%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                <span className="text-sm">Average Delivery Time</span>
                <span className="font-bold text-accent">3.2 days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <Package className="w-5 h-5 mr-2 text-accent" />
              Inventory Status
            </CardTitle>
            <CardDescription>Current stock levels and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-md">
                <span className="text-sm text-green-800">Well Stocked Products</span>
                <span className="font-bold text-green-600">38 items</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <span className="text-sm text-yellow-800">Low Stock Alert</span>
                <span className="font-bold text-yellow-600">5 items</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded-md">
                <span className="text-sm text-red-800">Out of Stock</span>
                <span className="font-bold text-red-600">2 items</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button asChild variant="outline" className="w-full">
                <Link href="/supplier/store">Manage Inventory</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Analytics data is updated in real-time based on your orders, inventory, and customer interactions.
        </p>
      </div>
    </div>
  );
}