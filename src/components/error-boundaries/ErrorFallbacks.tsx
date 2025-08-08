import React from 'react';
import { AlertTriangle, RefreshCcw, Home, Zap, Calculator, Cloud } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

// Generic fallback components for different types of errors

export function SolarCalculatorErrorFallback({ error, retry }: { error?: Error; retry?: () => void }) {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-800">
          <Calculator className="mr-2 h-5 w-5" />
          Calculator Error
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-orange-700">
            The solar calculator encountered an error and couldn't complete the calculation.
          </p>
          <p className="text-xs text-orange-600">
            This might be due to invalid input values or a temporary calculation issue.
          </p>
          {retry && (
            <Button size="sm" onClick={retry} variant="outline">
              <RefreshCcw className="mr-1 h-3 w-3" />
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function WeatherDataErrorFallback({ error, retry }: { error?: Error; retry?: () => void }) {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-800">
          <Cloud className="mr-2 h-5 w-5" />
          Weather Data Error
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-blue-700">
            Unable to load weather data for this location.
          </p>
          <p className="text-xs text-blue-600">
            This might be due to network issues or the weather service being temporarily unavailable.
          </p>
          {retry && (
            <Button size="sm" onClick={retry} variant="outline">
              <RefreshCcw className="mr-1 h-3 w-3" />
              Retry Weather Data
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function EnergySystemErrorFallback({ error, retry }: { error?: Error; retry?: () => void }) {
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center text-yellow-800">
          <Zap className="mr-2 h-5 w-5" />
          Energy System Error
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-yellow-700">
            There was an error loading the energy system information.
          </p>
          <p className="text-xs text-yellow-600">
            This might be due to invalid system configuration or data loading issues.
          </p>
          {retry && (
            <Button size="sm" onClick={retry} variant="outline">
              <RefreshCcw className="mr-1 h-3 w-3" />
              Reload System
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function FormErrorFallback({ error, retry }: { error?: Error; retry?: () => void }) {
  return (
    <div className="border border-red-200 bg-red-50 rounded-md p-4">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Form Error
          </h3>
          <p className="mt-1 text-sm text-red-700">
            This form encountered an error and couldn't be displayed properly.
          </p>
          {retry && (
            <div className="mt-2">
              <Button
                size="sm"
                onClick={retry}
                variant="outline"
                className="text-xs"
              >
                <RefreshCcw className="mr-1 h-3 w-3" />
                Reset Form
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardErrorFallback({ error, retry }: { error?: Error; retry?: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Dashboard Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Unable to load the dashboard. This might be due to:
            </p>
            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
              <li>Network connectivity issues</li>
              <li>Authentication problems</li>
              <li>Server-side errors</li>
            </ul>
            <div className="flex space-x-2">
              {retry && (
                <Button size="sm" onClick={retry}>
                  <RefreshCcw className="mr-1 h-3 w-3" />
                  Retry
                </Button>
              )}
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                <Home className="mr-1 h-3 w-3" />
                Home
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ListErrorFallback({ error, retry, itemType = 'items' }: { 
  error?: Error; 
  retry?: () => void; 
  itemType?: string;
}) {
  return (
    <div className="text-center py-8">
      <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Failed to load {itemType}
      </h3>
      <p className="text-gray-600 mb-4">
        There was an error loading the {itemType}. Please try again.
      </p>
      {retry && (
        <Button onClick={retry} variant="outline">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}

export function ChartErrorFallback({ error, retry }: { error?: Error; retry?: () => void }) {
  return (
    <div className="flex items-center justify-center h-64 border border-dashed border-gray-300 rounded-lg">
      <div className="text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-2">
          Chart failed to load
        </p>
        {retry && (
          <Button size="sm" variant="outline" onClick={retry}>
            <RefreshCcw className="mr-1 h-3 w-3" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

export function APIErrorFallback({ 
  error, 
  retry, 
  service = 'service',
  showDetails = false 
}: { 
  error?: Error; 
  retry?: () => void; 
  service?: string;
  showDetails?: boolean;
}) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              API Error
            </h3>
            <p className="mt-1 text-sm text-red-700">
              Failed to connect to {service}. Please check your internet connection and try again.
            </p>
            
            {showDetails && error && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-red-600">
                  Technical Details
                </summary>
                <div className="mt-1 text-xs text-red-600 font-mono">
                  {error.message}
                </div>
              </details>
            )}

            {retry && (
              <div className="mt-3">
                <Button
                  size="sm"
                  onClick={retry}
                  variant="outline"
                >
                  <RefreshCcw className="mr-1 h-3 w-3" />
                  Retry Connection
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Minimal fallback for inline components
export function InlineErrorFallback({ error, retry }: { error?: Error; retry?: () => void }) {
  return (
    <div className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
      <AlertTriangle className="mr-1 h-3 w-3" />
      Error
      {retry && (
        <button 
          onClick={retry}
          className="ml-1 text-red-800 hover:text-red-900"
          title="Retry"
        >
          <RefreshCcw className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}