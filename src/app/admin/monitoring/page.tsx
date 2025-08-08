import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';

export default function MonitoringPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">System Monitoring</h1>
        <p className="text-gray-600">
          Real-time monitoring of application performance, errors, and system health
        </p>
      </div>
      
      <MonitoringDashboard />
    </div>
  );
}