import { WeatherDataViewer } from '@/components/weather/WeatherDataViewer';

export default function WeatherDataPage() {
  const handleDataLoad = (data: any) => {
    console.log('Weather data loaded:', data);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Weather Data Integration</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Access comprehensive weather data from NREL, NOAA, and OpenWeatherMap APIs. 
          Get TMY (Typical Meteorological Year) data, historical weather records, 
          current conditions, and weather forecasts for accurate solar calculations.
        </p>
      </div>
      
      <WeatherDataViewer onDataLoad={handleDataLoad} />
      
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-blue-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-2 text-blue-800">NREL TMY Data</h3>
          <p className="text-gray-600">
            Industry-standard Typical Meteorological Year data with high-quality 
            solar irradiance measurements for solar system design.
          </p>
        </div>
        
        <div className="text-center p-6 bg-green-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-2 text-green-800">NOAA Forecasts</h3>
          <p className="text-gray-600">
            Real-time weather forecasts from the National Weather Service 
            for accurate short-term solar production predictions.
          </p>
        </div>
        
        <div className="text-center p-6 bg-orange-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-2 text-orange-800">Historical Data</h3>
          <p className="text-gray-600">
            Multi-year historical weather records for long-term analysis 
            and solar system performance validation.
          </p>
        </div>
      </div>
    </div>
  );
}