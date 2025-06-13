
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sun, Users, Briefcase, StoreIcon, ArrowRight, CheckCircle2, FileText, BarChartBig, SolarPanel, Home, Signal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const features = [
    {
      title: "Energy Needs Calculation",
      description: "Calculate your energy needs by inputting home appliances and current usage.",
      icon: <Sun className="w-8 h-8 text-accent" />,
      link: "/homeowner/energy-needs",
      userType: "For Homeowners"
    },
    {
      title: "Savings Potential Estimator",
      description: "Estimate potential savings, payback period, and ROI with our AI-powered tool.",
      icon: <CheckCircle2 className="w-8 h-8 text-accent" />,
      link: "/homeowner/savings-estimator",
      userType: "For Homeowners"
    },
    {
      title: "RFQ Generation",
      description: "Auto-populate a Request for Quotation based on your calculated needs.",
      icon: <FileText className="w-8 h-8 text-accent" />,
      link: "/homeowner/rfq",
      userType: "For Homeowners"
    },
    {
      title: "Installer Portfolio",
      description: "Installers can showcase their completed projects and expertise.",
      icon: <Briefcase className="w-8 h-8 text-accent" />,
      link: "/installer/portfolio",
      userType: "For Installers"
    },
    {
      title: "Supplier Storefront",
      description: "Suppliers manage digital storefronts and track inventory in real time.",
      icon: <StoreIcon className="w-8 h-8 text-accent" />,
      link: "/supplier/store",
      userType: "For Suppliers"
    },
    {
      title: "Performance Dashboard",
      description: "Monitor your solar system's real-time energy generation, consumption, and savings.",
      icon: <BarChartBig className="w-8 h-8 text-accent" />,
      link: "/homeowner/dashboard",
      userType: "For Homeowners"
    }
  ];

  return (
    <div className="flex flex-col items-center">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container px-4 md:px-6 text-center">
          <h1 className="text-4xl font-headline tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-accent">
            Solarify
          </h1>
          <p className="mt-4 max-w-[700px] mx-auto text-foreground/80 md:text-xl">
            Your All-In-One Platform for Residential Solar Projects. Connect, Calculate, and Control Your Solar Journey.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/homeowner/energy-needs">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline tracking-tighter sm:text-4xl md:text-5xl">Core Features</h2>
            <p className="mt-2 max-w-[700px] mx-auto text-foreground/70 md:text-lg">
              Solarify provides tailored experiences for homeowners, installers, and suppliers.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="items-center text-center">
                  {feature.icon}
                  <CardTitle className="mt-4 font-headline text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-xs text-accent">{feature.userType}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-foreground/70 text-center">{feature.description}</p>
                </CardContent>
                <div className="p-6 pt-0 mt-auto">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={feature.link}>
                      Explore <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="upcoming-features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline tracking-tighter sm:text-4xl md:text-5xl">
              The Future is Bright: What's Coming to Solarify
            </h2>
            <p className="mt-2 max-w-[900px] mx-auto text-foreground/70 md:text-lg">
              We're constantly innovating to bring you the best solar experience. Get ready for these exciting new features designed to put even more power in your hands!
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div data-ai-hint="iot smart home" className="mx-auto aspect-video overflow-hidden rounded-xl sm:w-full bg-primary/5 flex items-center justify-center p-8 shadow-lg border border-primary/10">
              <Signal className="w-3/4 h-3/4 text-primary/40" />
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <div className="inline-block rounded-lg bg-accent px-3 py-1 text-sm text-accent-foreground font-medium self-start">
                Coming Soon
              </div>
              <h3 className="text-2xl md:text-3xl font-headline text-accent">
                Live Solar Performance Tracking with IoT Integration
              </h3>
              <p className="text-foreground/80 text-lg">
                Imagine seeing your solar system's performance unfold in real-time, right within your Solarify dashboard! We're working on integrating smart IoT-enabled solar monitoring devices to give you unparalleled insight.
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/70 pl-5 text-md">
                <li>
                  <strong>Live Data Stream:</strong> Monitor your Solar Generation (kW), Daily Energy produced (kWh), CO₂ Savings, and even Car Miles Avoided, all updated live.
                </li>
                <li>
                  <strong>Seamless Device Pairing:</strong> Securely connect your compatible smart solar monitoring devices with your Solarify account with ease.
                </li>
                <li>
                  <strong>Enhanced Dashboard Experience:</strong> Visualize your live and historical data through intuitive charts and summaries on your Homeowner Dashboard.
                </li>
                <li>
                  <strong>Personalized Control (Future):</strong> Eventually, you'll be able to customize data refresh intervals, set up performance alerts, and tailor reporting preferences to your needs.
                </li>
              </ul>
              <p className="font-semibold text-accent text-md pt-2">
                Stay tuned for updates as we get closer to launching this powerful new feature!
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container grid items-center gap-6 px-4 md:px-6 lg:grid-cols-2 lg:gap-12">
          <div
            data-ai-hint="solar panels roof"
            className="mx-auto aspect-video overflow-hidden rounded-xl sm:w-full lg:order-last bg-primary/5 flex items-center justify-center p-8 shadow-lg border border-primary/10"
          >
            <Home className="w-3/4 h-3/4 text-primary/30" />
          </div>
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground font-medium">
                Empower Your Home
              </div>
              <h2 className="text-3xl font-headline tracking-tighter sm:text-5xl">
                Take Control of Your Energy Future
              </h2>
              <p className="max-w-[600px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Solarify empowers homeowners to understand their energy consumption, explore solar potential,
                connect with qualified installers, and monitor their system's performance. Make informed
                decisions and contribute to a greener planet.
              </p>
            </div>
            <ul className="grid gap-2 py-4">
              <li className="flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5 text-accent" />
                Detailed energy usage insights
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5 text-accent" />
                Accurate solar savings estimations
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5 text-accent" />
                Seamless connection with local installers
              </li>
            </ul>
            <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90 w-fit">
              <Link href="/signup">
                Join Solarify Today <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
