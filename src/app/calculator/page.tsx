import { SolarCalculator } from '@/components/solar/SolarCalculator';

export default function SolarCalculatorPage() {
  const handleDesignComplete = (design: any) => {
    console.log('Solar design completed:', design);
    // Here you could save the design to database, send to RFQ system, etc.
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Solar System Calculator</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Design your optimal solar system with our industry-standard calculation engine. 
          Get detailed performance analysis, cost estimates, and component recommendations.
        </p>
      </div>
      
      <SolarCalculator onDesignComplete={handleDesignComplete} />
    </div>
  );
}