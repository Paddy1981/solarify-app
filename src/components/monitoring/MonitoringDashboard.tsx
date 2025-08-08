"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface ErrorMetric {
  id: string;
  type: string;
  severity: string;
  message: string;
  count: number;
  lastSeen: string;
  environment: string;
}

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  environment: string;
}

interface AlertData {
  id: string;
  type: string;
  title: string;
  severity: string;
  timestamp: string;
  resolved: boolean;
}

export function MonitoringDashboard() {
  const [errors, setErrors] = useState<ErrorMetric[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, these would fetch from APIs
    loadMonitoringData();
  }, []);

  const loadMonitoringData = async () => {
    try {
      // Mock data for demonstration
      // In production, these would be API calls to fetch real monitoring data
      
      setErrors([
        {
          id: '1',
          type: 'javascript',
          severity: 'high',
          message: 'TypeError: Cannot read property of undefined',
          count: 15,
          lastSeen: '2024-01-15T10:30:00Z',
          environment: 'production'
        },
        {
          id: '2',
          type: 'api',
          severity: 'medium',
          message: 'API timeout: /api/solar-data',
          count: 8,
          lastSeen: '2024-01-15T09:45:00Z',
          environment: 'production'
        }
      ]);

      setPerformance([
        {
          id: '1',
          name: 'page_load_time',
          value: 2.5,
          unit: 's',
          timestamp: '2024-01-15T10:30:00Z',
          environment: 'production'
        },
        {
          id: '2',
          name: 'api_response_time',
          value: 850,
          unit: 'ms',
          timestamp: '2024-01-15T10:29:00Z',
          environment: 'production'
        }
      ]);

      setAlerts([
        {
          id: '1',
          type: 'performance_threshold_exceeded',
          title: 'High API Response Times',
          severity: 'warning',
          timestamp: '2024-01-15T10:25:00Z',
          resolved: false
        },
        {
          id: '2',
          type: 'high_error_rate',
          title: 'Error Rate Spike Detected',
          severity: 'critical',
          timestamp: '2024-01-15T09:30:00Z',
          resolved: true
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading monitoring data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Error Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Active Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{errors.length}</div>
            <div className="text-sm text-gray-600 mt-1">
              {errors.filter(e => e.severity === 'critical' || e.severity === 'high').length} high priority
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {performance.find(p => p.name === 'api_response_time')?.value || 0}ms
            </div>
            <div className="text-sm text-gray-600 mt-1">Last hour</div>
          </CardContent>
        </Card>

        {/* Alert Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {alerts.filter(a => !a.resolved).length}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {alerts.filter(a => !a.resolved && a.severity === 'critical').length} critical
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Errors */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {errors.map((error) => (
                <div key={error.id} className="border-l-4 border-red-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{error.message}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {error.type} • {error.environment} • {error.count} occurrences
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      error.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      error.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {error.severity}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Last seen: {new Date(error.lastSeen).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performance.map((metric) => (
                <div key={metric.id} className="flex justify-between items-center py-2">
                  <div>
                    <div className="font-medium text-sm">
                      {metric.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-xs text-gray-600">
                      {metric.environment} • {new Date(metric.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{metric.value}{metric.unit}</div>
                    <div className={`text-xs ${
                      (metric.name.includes('response_time') && metric.value > 1000) ||
                      (metric.name.includes('load_time') && metric.value > 3) 
                        ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {(metric.name.includes('response_time') && metric.value > 1000) ||
                       (metric.name.includes('load_time') && metric.value > 3) 
                        ? 'Slow' : 'Good'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className={`border-l-4 pl-4 py-2 ${
                alert.severity === 'critical' ? 'border-red-500' : 
                alert.severity === 'warning' ? 'border-orange-500' : 'border-blue-500'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{alert.title}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {alert.type} • {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'warning' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.severity}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      alert.resolved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {alert.resolved ? 'Resolved' : 'Active'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}