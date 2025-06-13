
import { sampleRFQs, type RFQ } from "@/lib/mock-data/rfqs";
import { RfqCard } from "@/components/installer/rfq-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, Inbox } from "lucide-react";
import { getMockUserById, type MockUser } from "@/lib/mock-data/users";

// In a real app, currentInstallerId would come from authentication context
const MOCK_CURRENT_INSTALLER_ID = "installer-user-001"; 

export default function InstallerRFQsPage() {
  const currentInstaller = getMockUserById(MOCK_CURRENT_INSTALLER_ID);

  const relevantRFQs = sampleRFQs.filter(rfq => 
    rfq.selectedInstallerIds.includes(MOCK_CURRENT_INSTALLER_ID)
  );

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline tracking-tight text-primary flex items-center justify-center">
          <ListChecks className="w-10 h-10 mr-3" /> Incoming Requests for Quotation
        </h1>
        <p className="mt-2 text-lg text-foreground/70">
          Review RFQs from homeowners and generate your quotes.
        </p>
        {currentInstaller && (
          <p className="text-sm text-muted-foreground mt-1">
            Viewing RFQs for: <strong>{currentInstaller.companyName || currentInstaller.fullName}</strong>
          </p>
        )}
      </div>

      {relevantRFQs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {relevantRFQs.map((rfq) => (
            <RfqCard key={rfq.id} rfq={rfq} />
          ))}
        </div>
      ) : (
        <Card className="col-span-full text-center py-12 shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Inbox className="w-16 h-16 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-headline">No RFQs Yet</CardTitle>
            <CardDescription>You currently have no new requests for quotation.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              When homeowners select you for an RFQ, it will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
