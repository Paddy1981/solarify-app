
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, TreePine, Car } from "lucide-react";

export function EnvironmentalImpactCard() {
  const impacts = [
    { label: "CO₂ Saved", value: "1,250 kg", icon: <Leaf className="w-8 h-8 text-green-500" /> },
    { label: "Equivalent Trees Planted", value: "55", icon: <TreePine className="w-8 h-8 text-green-600" /> },
    { label: "Car Miles Avoided", value: "3,100 miles", icon: <Car className="w-8 h-8 text-green-700" /> },
  ];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center"><Leaf className="w-6 h-6 mr-2 text-primary" />Environmental Impact</CardTitle>
        <CardDescription>Your contribution to a greener planet.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {impacts.map((impact) => (
          <div key={impact.label} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-primary/20 rounded-full mr-4">
                {impact.icon}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{impact.label}</p>
                <p className="text-2xl font-bold font-headline text-accent">{impact.value}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
