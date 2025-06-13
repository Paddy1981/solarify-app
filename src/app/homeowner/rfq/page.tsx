import { RFQForm } from "@/components/homeowner/rfq-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function RFQPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <FileText className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Generate Request for Quotation (RFQ)</CardTitle>
          <CardDescription>
            Create an RFQ based on your solar needs. We&apos;ll help auto-populate details.
            This RFQ can then be shared with local installers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RFQForm />
        </CardContent>
      </Card>
    </div>
  );
}
