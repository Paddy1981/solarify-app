"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Activity, 
  Zap, 
  Sun, 
  Thermometer, 
  Wind, 
  Eye,
  Play,
  Pause,
  Settings,
  Download,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from "lucide-react";

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface RealTimeMonitoringProps {
  systemId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

interface RealTimeData {
  timestamp: Date;
  power: {
    dc: number;
    ac: number;
    efficiency: number;
  };
  voltage: {
    dc: number;
    ac: number;
  };
  current: {
    dc: number;
    ac: number;
  };
  frequency: number;
  temperature: {
    ambient: number;
    module: number;
  };
  irradiance: number;
  performance: {
    ratio: number;
    capacity_factor: number;
  };
  status: {
    operational: 'normal' | 'warning' | 'error' | 'offline';
    inverter: 'online' | 'offline' | 'fault';
    communication: 'connected' | 'disconnected' | 'poor';
  };
  alerts: Alert[];
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  component: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface DataStream {
  id: string;
  label: string;
  value: number;
  unit: string;
  color: string;
  history: { timestamp: Date; value: number }[];
  min: number;
  max: number;
  enabled: boolean;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function RealTimeMonitoring({ 
  systemId, 
  autoRefresh = true, 
  refreshInterval = 5000 
}: RealTimeMonitoringProps) {
  const [currentData, setCurrentData] = useState<RealTimeData | null>(null);
  const [dataStreams, setDataStreams] = useState<DataStream[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(autoRefresh);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const dataHistoryRef = useRef<Map<string, { timestamp: Date; value: number }[]>>(new Map());
  const maxHistoryPoints = 100;

  // Initialize data streams
  useEffect(() => {
    const initialStreams: DataStream[] = [
      {
        id: 'ac_power',
        label: 'AC Power',
        value: 0,
        unit: 'kW',
        color: '#3b82f6',
        history: [],
        min: 0,
        max: 12,
        enabled: true
      },
      {
        id: 'dc_power',
        label: 'DC Power',
        value: 0,
        unit: 'kW',
        color: '#10b981',
        history: [],
        min: 0,
        max: 12,
        enabled: true
      },
      {
        id: 'efficiency',
        label: 'Efficiency',
        value: 0,
        unit: '%',
        color: '#f59e0b',
        history: [],
        min: 0,
        max: 25,
        enabled: true
      },
      {
        id: 'dc_voltage',
        label: 'DC Voltage',
        value: 0,
        unit: 'V',
        color: '#ef4444',
        history: [],
        min: 0,
        max: 800,
        enabled: false
      },
      {
        id: 'frequency',
        label: 'Frequency',
        value: 0,
        unit: 'Hz',
        color: '#8b5cf6',
        history: [],
        min: 49,
        max: 61,
        enabled: false
      },
      {
        id: 'irradiance',
        label: 'Irradiance',
        value: 0,
        unit: 'W/m²',
        color: '#f97316',
        history: [],
        min: 0,
        max: 1200,
        enabled: true
      },
      {
        id: 'temperature',
        label: 'Module Temp',
        value: 0,
        unit: '°C',
        color: '#dc2626',
        history: [],
        min: -10,
        max: 80,
        enabled: false
      }
    ];

    setDataStreams(initialStreams);
  }, []);

  // Mock data generation for demonstration
  const generateMockData = (): RealTimeData => {
    const hour = new Date().getHours();
    const baseProduction = hour >= 6 && hour <= 18 ? 
      Math.max(0, 10 - Math.pow((hour - 12) / 6, 2) * 10) : 0;
    
    const variation = 0.8 + Math.random() * 0.4;
    const dcPower = baseProduction * variation;
    const acPower = dcPower * (0.92 + Math.random() * 0.06);
    const efficiency = dcPower > 0 ? (acPower / dcPower) * 100 : 0;

    return {
      timestamp: new Date(),
      power: {
        dc: Math.round(dcPower * 100) / 100,
        ac: Math.round(acPower * 100) / 100,
        efficiency: Math.round(efficiency * 100) / 100
      },
      voltage: {
        dc: 400 + Math.random() * 200,
        ac: 240 + Math.random() * 20
      },
      current: {
        dc: dcPower > 0 ? dcPower / 400 * 1000 : 0, // A
        ac: acPower > 0 ? acPower / 240 * 1000 : 0   // A
      },
      frequency: 50 + Math.random() * 1,
      temperature: {
        ambient: 20 + Math.random() * 20,
        module: 25 + Math.random() * 30
      },
      irradiance: baseProduction > 0 ? 200 + Math.random() * 800 : 0,
      performance: {
        ratio: 0.8 + Math.random() * 0.2,
        capacity_factor: Math.min(acPower / 10, 1.0)
      },
      status: {
        operational: dcPower > 0 ? 'normal' : 'offline',
        inverter: 'online',
        communication: 'connected'
      },
      alerts: Math.random() > 0.9 ? [{
        id: Date.now().toString(),
        severity: 'warning',
        message: 'Slight performance deviation detected',
        component: 'system',
        timestamp: new Date(),
        acknowledged: false
      }] : []
    };
  };

  // Data fetching and updating
  useEffect(() => {
    const fetchData = async () => {
      try {
        setConnectionStatus('connecting');
        
        // In real implementation, this would be a WebSocket connection or API call
        const newData = generateMockData();
        setCurrentData(newData);
        setLastUpdate(new Date());
        setConnectionStatus('connected');

        // Update data streams
        const updatedStreams = dataStreams.map(stream => {
          let newValue = 0;
          
          switch (stream.id) {
            case 'ac_power':
              newValue = newData.power.ac;
              break;
            case 'dc_power':
              newValue = newData.power.dc;
              break;
            case 'efficiency':
              newValue = newData.power.efficiency;
              break;
            case 'dc_voltage':
              newValue = newData.voltage.dc;
              break;
            case 'frequency':
              newValue = newData.frequency;
              break;
            case 'irradiance':
              newValue = newData.irradiance;
              break;
            case 'temperature':
              newValue = newData.temperature.module;
              break;
            default:
              newValue = stream.value;
          }

          // Update history
          const newHistory = [
            ...stream.history,
            { timestamp: newData.timestamp, value: newValue }
          ].slice(-maxHistoryPoints);

          return {
            ...stream,
            value: Math.round(newValue * 100) / 100,
            history: newHistory
          };
        });

        setDataStreams(updatedStreams);

      } catch (error) {
        console.error('Failed to fetch real-time data:', error);
        setConnectionStatus('disconnected');
      }
    };

    if (isMonitoring) {
      fetchData(); // Initial fetch
      intervalRef.current = setInterval(fetchData, refreshInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring, refreshInterval, dataStreams.length]);

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  const toggleStreamEnabled = (streamId: string) => {
    setDataStreams(streams => 
      streams.map(stream => 
        stream.id === streamId 
          ? { ...stream, enabled: !stream.enabled }
          : stream
      )
    );
  };

  const acknowledgeAlert = (alertId: string) => {
    setCurrentData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        alerts: prev.alerts.map(alert =>
          alert.id === alertId
            ? { ...alert, acknowledged: true }
            : alert
        )
      };
    });
  };

  const exportData = () => {
    // Export current data streams as CSV
    const csvData = dataStreams
      .filter(stream => stream.enabled)
      .map(stream => ({
        parameter: stream.label,
        current_value: stream.value,
        unit: stream.unit,
        min_24h: Math.min(...stream.history.map(h => h.value)),
        max_24h: Math.max(...stream.history.map(h => h.value)),
        avg_24h: stream.history.reduce((sum, h) => sum + h.value, 0) / stream.history.length
      }));

    const csv = [
      ['Parameter', 'Current Value', 'Unit', 'Min (24h)', 'Max (24h)', 'Avg (24h)'],
      ...csvData.map(row => [
        row.parameter,
        row.current_value,
        row.unit,
        row.min_24h.toFixed(2),
        row.max_24h.toFixed(2),
        row.avg_24h.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solar-monitoring-${systemId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        <span className="ml-2">Connecting to monitoring system...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-headline tracking-tight text-accent">Real-Time Monitoring</h2>
          <p className="text-muted-foreground">
            System {systemId} • Live data stream
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <ConnectionStatusBadge status={connectionStatus} />
            {lastUpdate && (
              <span className="text-sm text-muted-foreground">
                Updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button
              variant={isMonitoring ? "default" : "outline"}
              size="sm"
              onClick={toggleMonitoring}
            >
              {isMonitoring ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Alerts Bar */}
      {currentData.alerts.length > 0 && (
        <div className="space-y-2">
          {currentData.alerts.map(alert => (
            <AlertBar
              key={alert.id}
              alert={alert}
              onAcknowledge={() => acknowledgeAlert(alert.id)}
            />
          ))}
        </div>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusCard
          title="System Status"
          value={currentData.status.operational}
          icon={<Activity className="h-4 w-4" />}
          status={currentData.status.operational}
        />
        <StatusCard
          title="Inverter Status"
          value={currentData.status.inverter}
          icon={<Zap className="h-4 w-4" />}
          status={currentData.status.inverter === 'online' ? 'normal' : 'error'}
        />
        <StatusCard
          title="Communication"
          value={currentData.status.communication}
          icon={<Activity className="h-4 w-4" />}
          status={currentData.status.communication === 'connected' ? 'normal' : 'warning'}
        />
        <StatusCard
          title="Data Quality"
          value="Good"
          icon={<Eye className="h-4 w-4" />}
          status="normal"
        />
      </div>

      {/* Real-Time Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {dataStreams.filter(stream => stream.enabled).map(stream => (
          <RealTimeChart
            key={stream.id}
            stream={stream}
            isLive={isMonitoring}
          />
        ))}
      </div>

      {/* Data Streams Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Data Streams Configuration
          </CardTitle>
          <CardDescription>
            Select which parameters to monitor in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dataStreams.map(stream => (
              <StreamToggle
                key={stream.id}
                stream={stream}
                onToggle={() => toggleStreamEnabled(stream.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Raw Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Parameters</CardTitle>
          <CardDescription>Live parameter values from monitoring system</CardDescription>
        </CardHeader>
        <CardContent>
          <RawDataTable data={currentData} />
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================
// SUB-COMPONENTS
// =====================================================

function ConnectionStatusBadge({ 
  status 
}: { 
  status: 'connected' | 'connecting' | 'disconnected' 
}) {
  const statusConfig = {
    connected: { color: 'bg-green-500', text: 'Connected', pulse: false },
    connecting: { color: 'bg-yellow-500', text: 'Connecting', pulse: true },
    disconnected: { color: 'bg-red-500', text: 'Disconnected', pulse: false }
  };

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className="flex items-center">
      <div className={`w-2 h-2 rounded-full mr-2 ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
      {config.text}
    </Badge>
  );
}

function StatusCard({ 
  title, 
  value, 
  icon, 
  status 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  status: string;
}) {
  const statusColors = {
    normal: 'text-green-600 bg-green-50',
    warning: 'text-yellow-600 bg-yellow-50',
    error: 'text-red-600 bg-red-50',
    offline: 'text-gray-600 bg-gray-50'
  };

  const colorClass = statusColors[status as keyof typeof statusColors] || statusColors.normal;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-lg font-semibold capitalize">{value}</p>
          </div>
          <div className={`p-2 rounded-full ${colorClass}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertBar({ 
  alert, 
  onAcknowledge 
}: { 
  alert: Alert; 
  onAcknowledge: () => void;
}) {
  const severityStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    critical: 'bg-red-100 border-red-300 text-red-900'
  };

  return (
    <div className={`p-4 rounded-lg border ${severityStyles[alert.severity]} ${alert.acknowledged ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-medium">{alert.message}</p>
            <p className="text-sm opacity-75">
              {alert.component} • {alert.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
        {!alert.acknowledged && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAcknowledge}
            className="ml-4"
          >
            Acknowledge
          </Button>
        )}
      </div>
    </div>
  );
}

function RealTimeChart({ 
  stream, 
  isLive 
}: { 
  stream: DataStream; 
  isLive: boolean;
}) {
  const chartRef = useRef<HTMLDivElement>(null);

  // Simple SVG line chart
  const width = 300;
  const height = 150;
  const padding = 30;

  const data = stream.history.slice(-50); // Last 50 points
  const maxValue = Math.max(...data.map(d => d.value), stream.max);
  const minValue = Math.min(...data.map(d => d.value), stream.min);
  const range = maxValue - minValue || 1;

  const xScale = (width - 2 * padding) / Math.max(data.length - 1, 1);
  const yScale = (height - 2 * padding) / range;

  const pathData = data.length > 1 ? data
    .map((point, index) => {
      const x = padding + index * xScale;
      const y = height - padding - ((point.value - minValue) / range) * (height - 2 * padding);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ') : '';

  const currentTrend = data.length >= 2 ? 
    (data[data.length - 1].value - data[data.length - 2].value > 0 ? 'up' : 'down') : 'stable';

  return (
    <Card className={isLive ? 'ring-2 ring-blue-200' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{stream.label}</CardTitle>
          <div className="flex items-center space-x-2">
            {currentTrend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
            {currentTrend === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
            {isLive && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold" style={{ color: stream.color }}>
            {stream.value}
          </span>
          <span className="text-sm text-muted-foreground">{stream.unit}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div ref={chartRef}>
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
              <line
                key={ratio}
                x1={padding}
                y1={padding + ratio * (height - 2 * padding)}
                x2={width - padding}
                y2={padding + ratio * (height - 2 * padding)}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            ))}
            
            {/* Data line */}
            {pathData && (
              <path
                d={pathData}
                fill="none"
                stroke={stream.color}
                strokeWidth="2"
              />
            )}
            
            {/* Current value point */}
            {data.length > 0 && (
              <circle
                cx={padding + (data.length - 1) * xScale}
                cy={height - padding - ((data[data.length - 1].value - minValue) / range) * (height - 2 * padding)}
                r="3"
                fill={stream.color}
              />
            )}
            
            {/* Y-axis labels */}
            <text
              x={padding - 5}
              y={padding + 4}
              textAnchor="end"
              fontSize="10"
              fill="#9ca3af"
            >
              {maxValue.toFixed(1)}
            </text>
            <text
              x={padding - 5}
              y={height - padding + 4}
              textAnchor="end"
              fontSize="10"
              fill="#9ca3af"
            >
              {minValue.toFixed(1)}
            </text>
          </svg>
        </div>
        
        {data.length > 1 && (
          <div className="mt-2 text-xs text-muted-foreground">
            Min: {Math.min(...data.map(d => d.value)).toFixed(2)} | 
            Max: {Math.max(...data.map(d => d.value)).toFixed(2)} | 
            Avg: {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(2)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StreamToggle({ 
  stream, 
  onToggle 
}: { 
  stream: DataStream; 
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: stream.color }}
        />
        <div>
          <p className="text-sm font-medium">{stream.label}</p>
          <p className="text-xs text-muted-foreground">
            {stream.value} {stream.unit}
          </p>
        </div>
      </div>
      <Switch
        checked={stream.enabled}
        onCheckedChange={onToggle}
      />
    </div>
  );
}

function RawDataTable({ data }: { data: RealTimeData }) {
  const parameters = [
    { label: 'DC Power', value: data.power.dc, unit: 'kW' },
    { label: 'AC Power', value: data.power.ac, unit: 'kW' },
    { label: 'Efficiency', value: data.power.efficiency, unit: '%' },
    { label: 'DC Voltage', value: data.voltage.dc, unit: 'V' },
    { label: 'AC Voltage', value: data.voltage.ac, unit: 'V' },
    { label: 'DC Current', value: data.current.dc, unit: 'A' },
    { label: 'AC Current', value: data.current.ac, unit: 'A' },
    { label: 'Frequency', value: data.frequency, unit: 'Hz' },
    { label: 'Ambient Temperature', value: data.temperature.ambient, unit: '°C' },
    { label: 'Module Temperature', value: data.temperature.module, unit: '°C' },
    { label: 'Solar Irradiance', value: data.irradiance, unit: 'W/m²' },
    { label: 'Performance Ratio', value: data.performance.ratio * 100, unit: '%' },
    { label: 'Capacity Factor', value: data.performance.capacity_factor * 100, unit: '%' }
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Parameter</th>
            <th className="text-right py-2">Value</th>
            <th className="text-right py-2">Unit</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((param, index) => (
            <tr key={index} className="border-b">
              <td className="py-2">{param.label}</td>
              <td className="text-right py-2 font-mono">
                {param.value.toFixed(2)}
              </td>
              <td className="text-right py-2 text-muted-foreground">
                {param.unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}