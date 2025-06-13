
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { StatsCard } from "@/components/dashboard/stats-card";
import { EnvironmentalImpactCard } from "@/components/dashboard/environmental-impact-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChartBig, Zap, Leaf, DollarSign, CheckCircle2, Bell, Info, AlertTriangle, Wrench } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    { title: "Current Generation", value: "3.2 kW", icon: <Zap className="w-6 h-6 text-primary" />, change: "+5%", changeType: "positive" as "positive" | "negative" },
    { title: "Today's Energy", value: "15.7 kWh", icon: <Zap className="w-6 h-6 text-primary" />, change: "+12%", changeType: "positive" as "positive" | "negative" },
    { title: "Monthly Savings", value: "$45.80", icon: <DollarSign className="w-6 h-6 text-primary" />, change: "+8%", changeType: "positive" as "positive" | "negative" },
    { title: "System Health", value: "Optimal", icon: <CheckCircle2 className="w-6 h-6 text-green-500" /> },
  ];


  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline tracking-tight text-primary">Performance Dashboard</h1>
        <p className="mt-2 text-lg text-foreground/70">
          Monitor your solar system&apos;s real-time performance and environmental impact.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <StatsCard 
            key={stat.title} 
            title={stat.title} 
            value={stat.value} 
            icon={stat.icon}
            change={stat.change}
            changeType={stat.changeType}
          />
        ))}
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><BarChartBig className="w-6 h-6 mr-2 text-primary" />Energy Generation Overview</CardTitle>
            <CardDescription>Past 7 days energy production (kWh)</CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceChart />
          </CardContent>
        </Card>

        <EnvironmentalImpactCard />
      </div>

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Bell className="w-6 h-6 mr-2 text-primary" />Notifications & Alerts</CardTitle>
          <CardDescription>Recent system events and recommendations.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
              <Info className="w-5 h-5 text-accent mt-1 shrink-0" />
              <div>
                <p className="font-medium">System check completed successfully.</p>
                <p className="text-xs text-muted-foreground">Yesterday, 3:00 PM</p>
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-1 shrink-0" />
              <div>
                <p className="font-medium">Minor dip in production yesterday afternoon. Likely due to cloud cover.</p>
                <p className="text-xs text-muted-foreground">Yesterday, 4:30 PM</p>
              </div>
            </li>
             <li className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
              <Wrench className="w-5 h-5 text-primary mt-1 shrink-0" />
              <div>
                <p className="font-medium">Scheduled maintenance reminder: Panel cleaning recommended next month.</p>
                <p className="text-xs text-muted-foreground">2 days ago</p>
              </div>
            </li>
          </ul>
           <Button variant="outline" className="mt-4 w-full md:w-auto">View All Notifications</Button>
        </CardContent>
      </Card>
    </div>
  );
}
