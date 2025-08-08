"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, Cloud, Sun, Thermometer, Wind, Eye, Droplets, Gauge } from 'lucide-react';

interface WeatherData {
  current?: any;
  forecast?: any;
  tmy?: any;
  historical?: any;
}

interface WeatherViewerProps {
  onDataLoad?: (data: WeatherData) => void;
}

export function WeatherDataViewer({ onDataLoad }: WeatherViewerProps) {
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData>({});
  const [location, setLocation] = useState({
    latitude: '',
    longitude: ''
  });
  const [dataType, setDataType] = useState<'current' | 'forecast' | 'tmy' | 'historical'>('current');
  const [historicalParams, setHistoricalParams] = useState({
    startYear: new Date().getFullYear() - 1,
    endYear: new Date().getFullYear() - 1
  });
  const [forecastHours, setForecastHours] = useState(168);

  const handleLocationChange = (field: 'latitude' | 'longitude', value: string) => {
    setLocation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const loadWeatherData = async () => {
    if (!location.latitude || !location.longitude) {
      alert('Please enter latitude and longitude');
      return;
    }

    setLoading(true);
    
    try {
      const lat = parseFloat(location.latitude);
      const lon = parseFloat(location.longitude);

      let url = '';
      let params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString()
      });

      switch (dataType) {
        case 'current':
          url = `/api/weather/current?${params}`;
          break;
        case 'forecast':
          params.append('hours', forecastHours.toString());
          url = `/api/weather/forecast?${params}`;
          break;
        case 'tmy':
          url = `/api/weather/tmy?${params}`;
          break;
        case 'historical':
          params.append('startYear', historicalParams.startYear.toString());
          params.append('endYear', historicalParams.endYear.toString());
          url = `/api/weather/historical?${params}`;
          break;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load weather data');
      }

      const newData = { ...weatherData, [dataType]: result.data };
      setWeatherData(newData);
      onDataLoad?.(newData);

    } catch (error) {
      console.error('Weather data error:', error);
      alert(`Failed to load weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const renderCurrentWeather = () => {
    const current = weatherData.current;
    if (!current) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Thermometer className="mx-auto mb-2 text-red-500" size={24} />
            <div className="text-2xl font-bold">{current.ambientTemperature.toFixed(1)}°C</div>
            <div className="text-sm text-gray-600">Temperature</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Sun className="mx-auto mb-2 text-yellow-500" size={24} />
            <div className="text-2xl font-bold">{current.globalHorizontalIrradiance.toFixed(0)}</div>
            <div className="text-sm text-gray-600">GHI (W/m²)</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Wind className="mx-auto mb-2 text-blue-500" size={24} />
            <div className="text-2xl font-bold">{current.windSpeed.toFixed(1)} m/s</div>
            <div className="text-sm text-gray-600">Wind Speed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Droplets className="mx-auto mb-2 text-blue-600" size={24} />
            <div className="text-2xl font-bold">{current.relativeHumidity.toFixed(0)}%</div>
            <div className="text-sm text-gray-600">Humidity</div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTMYData = () => {
    const tmy = weatherData.tmy;
    if (!tmy) return null;

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Annual Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {tmy.annualTotals.globalHorizontalIrradiance.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">GHI (kWh/m²/year)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {tmy.annualTotals.directNormalIrradiance.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">DNI (kWh/m²/year)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {tmy.annualTotals.diffuseHorizontalIrradiance.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">DHI (kWh/m²/year)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Averages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Month</th>
                    <th className="text-center p-2">GHI</th>
                    <th className="text-center p-2">DNI</th>
                    <th className="text-center p-2">DHI</th>
                    <th className="text-center p-2">Temp</th>
                    <th className="text-center p-2">Wind</th>
                  </tr>
                </thead>
                <tbody>
                  {tmy.monthlyAverages.map((month: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-medium">
                        {new Date(2000, month.month - 1).toLocaleString('default', { month: 'short' })}
                      </td>
                      <td className="text-center p-2">{month.globalHorizontalIrradiance.toFixed(1)}</td>
                      <td className="text-center p-2">{month.directNormalIrradiance.toFixed(1)}</td>
                      <td className="text-center p-2">{month.diffuseHorizontalIrradiance.toFixed(1)}</td>
                      <td className="text-center p-2">{month.ambientTemperature.toFixed(1)}°C</td>
                      <td className="text-center p-2">{month.windSpeed.toFixed(1)} m/s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderForecastData = () => {
    const forecast = weatherData.forecast;
    if (!forecast || !forecast.data) return null;

    const first24Hours = forecast.data.slice(0, 24);

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Forecast Quality</span>
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                Score: {(forecast.quality.score * 100).toFixed(0)}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-lg font-semibold">{forecast.data.length}</div>
                <div className="text-sm text-gray-600">Data Points</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{forecast.quality.dataCompleteness.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Completeness</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{forecast.source}</div>
                <div className="text-sm text-gray-600">Data Source</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next 24 Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Time</th>
                    <th className="text-center p-2">GHI (W/m²)</th>
                    <th className="text-center p-2">Temp (°C)</th>
                    <th className="text-center p-2">Wind (m/s)</th>
                    <th className="text-center p-2">Humidity (%)</th>
                    <th className="text-center p-2">Clouds (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {first24Hours.map((point: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-medium">
                        {new Date(point.timestamp).toLocaleDateString()} {new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="text-center p-2">{point.globalHorizontalIrradiance.toFixed(0)}</td>
                      <td className="text-center p-2">{point.ambientTemperature.toFixed(1)}</td>
                      <td className="text-center p-2">{point.windSpeed.toFixed(1)}</td>
                      <td className="text-center p-2">{point.relativeHumidity.toFixed(0)}</td>
                      <td className="text-center p-2">{point.cloudCover.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderHistoricalData = () => {
    const historical = weatherData.historical;
    if (!historical) return null;

    // Calculate monthly averages from historical data
    const monthlyStats = Array.from({ length: 12 }, (_, i) => {
      const monthData = historical.data.filter((point: any) => 
        new Date(point.timestamp).getMonth() === i
      );
      
      if (monthData.length === 0) return null;

      const avgGHI = monthData.reduce((sum: number, point: any) => sum + point.globalHorizontalIrradiance, 0) / monthData.length;
      const avgTemp = monthData.reduce((sum: number, point: any) => sum + point.ambientTemperature, 0) / monthData.length;
      const avgWind = monthData.reduce((sum: number, point: any) => sum + point.windSpeed, 0) / monthData.length;

      return {
        month: i + 1,
        avgGHI,
        avgTemp,
        avgWind,
        dataPoints: monthData.length
      };
    }).filter(Boolean);

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Historical Data Quality</span>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Score: {(historical.quality.score * 100).toFixed(0)}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-lg font-semibold">{historical.data.length.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Data Points</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{historical.quality.dataCompleteness.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Completeness</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{historical.quality.gapAnalysis.totalGaps}</div>
                <div className="text-sm text-gray-600">Data Gaps</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{historical.source}</div>
                <div className="text-sm text-gray-600">Data Source</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {monthlyStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Month</th>
                      <th className="text-center p-2">Avg GHI (W/m²)</th>
                      <th className="text-center p-2">Avg Temp (°C)</th>
                      <th className="text-center p-2">Avg Wind (m/s)</th>
                      <th className="text-center p-2">Data Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyStats.map((month: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">
                          {new Date(2000, month.month - 1).toLocaleString('default', { month: 'short' })}
                        </td>
                        <td className="text-center p-2">{month.avgGHI.toFixed(0)}</td>
                        <td className="text-center p-2">{month.avgTemp.toFixed(1)}</td>
                        <td className="text-center p-2">{month.avgWind.toFixed(1)}</td>
                        <td className="text-center p-2">{month.dataPoints.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="text-blue-500" size={24} />
            Weather Data Viewer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="0.000001"
                value={location.latitude}
                onChange={(e) => handleLocationChange('latitude', e.target.value)}
                placeholder="e.g., 37.7749"
              />
            </div>
            
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
                value={location.longitude}
                onChange={(e) => handleLocationChange('longitude', e.target.value)}
                placeholder="e.g., -122.4194"
              />
            </div>
            
            <div>
              <Label htmlFor="dataType">Data Type</Label>
              <Select value={dataType} onValueChange={(value: any) => setDataType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Weather</SelectItem>
                  <SelectItem value="forecast">Weather Forecast</SelectItem>
                  <SelectItem value="tmy">TMY Data</SelectItem>
                  <SelectItem value="historical">Historical Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={loadWeatherData}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load Data'
                )}
              </Button>
            </div>
          </div>

          {/* Additional parameters for specific data types */}
          {dataType === 'forecast' && (
            <div className="mb-4">
              <Label htmlFor="forecastHours">Forecast Hours</Label>
              <Input
                id="forecastHours"
                type="number"
                min="1"
                max="336"
                value={forecastHours}
                onChange={(e) => setForecastHours(parseInt(e.target.value) || 168)}
                className="w-32"
              />
            </div>
          )}

          {dataType === 'historical' && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="startYear">Start Year</Label>
                <Input
                  id="startYear"
                  type="number"
                  min="1998"
                  max={new Date().getFullYear()}
                  value={historicalParams.startYear}
                  onChange={(e) => setHistoricalParams(prev => ({ 
                    ...prev, 
                    startYear: parseInt(e.target.value) || prev.startYear 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="endYear">End Year</Label>
                <Input
                  id="endYear"
                  type="number"
                  min="1998"
                  max={new Date().getFullYear()}
                  value={historicalParams.endYear}
                  onChange={(e) => setHistoricalParams(prev => ({ 
                    ...prev, 
                    endYear: parseInt(e.target.value) || prev.endYear 
                  }))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Render weather data based on type */}
      {dataType === 'current' && renderCurrentWeather()}
      {dataType === 'tmy' && renderTMYData()}
      {dataType === 'forecast' && renderForecastData()}
      {dataType === 'historical' && renderHistoricalData()}
    </div>
  );
}