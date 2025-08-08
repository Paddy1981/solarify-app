"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  Database, 
  RefreshCw, 
  TrendingUp,
  Zap
} from 'lucide-react';
import { QueryPerformanceMonitor, DocumentHelper } from '@/lib/firestore/query-helpers';

interface QueryStat {
  queryName: string;
  count: number;
  averageTime: number;
  totalTime: number;
  errors: number;
}

export function QueryPerformanceDashboard() {
  const [stats, setStats] = useState<QueryStat[]>([]);
  const [cacheStats, setCacheStats] = useState({ size: 0, keys: [] });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStats = () => {
    setIsRefreshing(true);
    const performanceStats = QueryPerformanceMonitor.getPerformanceStats();
    const documentCacheStats = DocumentHelper.getCacheStats();
    
    setStats(performanceStats);
    setCacheStats(documentCacheStats);
    
    setTimeout(() => setIsRefreshing(false), 500); // Visual feedback
  };

  useEffect(() => {
    refreshStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const clearAllStats = () => {
    QueryPerformanceMonitor.clearStats();
    DocumentHelper.clearCache();
    refreshStats();
  };

  const getPerformanceBadge = (avgTime: number) => {
    if (avgTime < 500) return <Badge variant="default" className="bg-green-500">Fast</Badge>;
    if (avgTime < 1000) return <Badge variant="secondary">Good</Badge>;
    if (avgTime < 2000) return <Badge variant="outline">Slow</Badge>;
    return <Badge variant="destructive">Very Slow</Badge>;
  };

  const totalQueries = stats.reduce((sum, stat) => sum + stat.count, 0);
  const totalErrors = stats.reduce((sum, stat) => sum + stat.errors, 0);
  const avgResponseTime = stats.length > 0 
    ? stats.reduce((sum, stat) => sum + stat.averageTime, 0) / stats.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Query Performance Monitor</h2>
          <p className="text-muted-foreground">Real-time Firestore query performance metrics</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStats}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={clearAllStats}
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQueries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across {stats.length} unique queries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              {getPerformanceBadge(avgResponseTime)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hits</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats.size}</div>
            <p className="text-xs text-muted-foreground">
              Cached documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Query Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalErrors}</div>
            <p className="text-xs text-muted-foreground">
              {totalErrors === 0 ? 'All systems normal' : 'Needs attention'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Query Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Query Performance Details
          </CardTitle>
          <CardDescription>
            Breakdown of individual query performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No query data available. Execute some queries to see performance metrics.
            </div>
          ) : (
            <div className="space-y-4">
              {stats
                .sort((a, b) => b.averageTime - a.averageTime) // Sort by slowest first
                .map((stat) => (
                  <div
                    key={stat.queryName}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{stat.queryName}</h4>
                        {getPerformanceBadge(stat.averageTime)}
                        {stat.errors > 0 && (
                          <Badge variant="destructive">
                            {stat.errors} errors
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                        <span>{stat.count} executions</span>
                        <span>Avg: {stat.averageTime.toFixed(0)}ms</span>
                        <span>Total: {stat.totalTime.toFixed(0)}ms</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp 
                        className={`w-4 h-4 ${
                          stat.averageTime < 1000 ? 'text-green-500' : 
                          stat.averageTime < 2000 ? 'text-yellow-500' : 'text-red-500'
                        }`} 
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cache Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Document Cache Status
          </CardTitle>
          <CardDescription>
            Currently cached documents for faster subsequent access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cacheStats.size === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No documents currently cached
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {cacheStats.keys.map((key) => (
                <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="font-mono text-sm">{key}</span>
                  <Badge variant="outline" className="text-xs">cached</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Recommendations</CardTitle>
          <CardDescription>
            Suggested optimizations based on current metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.some(s => s.averageTime > 2000) && (
              <div className="flex items-start space-x-2 p-3 bg-red-50 border-l-4 border-red-400 rounded">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Slow Queries Detected</p>
                  <p className="text-sm text-red-600">
                    Some queries are taking over 2 seconds. Consider adding composite indexes.
                  </p>
                </div>
              </div>
            )}

            {totalErrors > 0 && (
              <div className="flex items-start space-x-2 p-3 bg-red-50 border-l-4 border-red-400 rounded">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Query Errors</p>
                  <p className="text-sm text-red-600">
                    {totalErrors} queries have failed. Check Firestore security rules and indexes.
                  </p>
                </div>
              </div>
            )}

            {stats.length > 10 && (
              <div className="flex items-start space-x-2 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">High Query Volume</p>
                  <p className="text-sm text-blue-600">
                    Consider implementing query result caching for frequently accessed data.
                  </p>
                </div>
              </div>
            )}

            {cacheStats.size > 50 && (
              <div className="flex items-start space-x-2 p-3 bg-amber-50 border-l-4 border-amber-400 rounded">
                <Database className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Large Cache Size</p>
                  <p className="text-sm text-amber-600">
                    Document cache is growing large. Consider implementing cache TTL.
                  </p>
                </div>
              </div>
            )}

            {totalErrors === 0 && avgResponseTime < 1000 && (
              <div className="flex items-start space-x-2 p-3 bg-green-50 border-l-4 border-green-400 rounded">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Performance Looking Good!</p>
                  <p className="text-sm text-green-600">
                    All queries are performing well with no errors detected.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}