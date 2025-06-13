import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Sun, Users, Briefcase, StoreIcon, HomeIcon, Calculator, FileText, BarChartBig } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home', icon: HomeIcon },
  {
    label: 'For Homeowners',
    icon: Users,
    subLinks: [
      { href: '/homeowner/energy-needs', label: 'Energy Needs Calculator', icon: Calculator },
      { href: '/homeowner/savings-estimator', label: 'Savings Estimator', icon: BarChartBig },
      { href: '/homeowner/rfq', label: 'Generate RFQ', icon: FileText },
      { href: '/homeowner/dashboard', label: 'Performance Dashboard', icon: BarChartBig },
    ],
  },
  { href: '/installer/portfolio', label: 'Installer Portfolio', icon: Briefcase },
  { href: '/supplier/store', label: 'Supplier Store', icon: StoreIcon },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) =>
            link.subLinks ? (
              <DesktopDropdownMenu key={link.label} link={link} />
            ) : (
              <Link
                key={link.label}
                href={link.href!}
                className="transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
        <div className="hidden md:flex items-center space-x-2">
          <AuthButtons />
        </div>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-4 mt-6">
                {navLinks.map((link) =>
                  link.subLinks ? (
                    <MobileAccordionMenu key={link.label} link={link} />
                  ) : (
                    <Link
                      key={link.label}
                      href={link.href!}
                      className="flex items-center gap-2 rounded-md p-2 text-lg font-medium hover:bg-accent hover:text-accent-foreground"
                    >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  )
                )}
                <div className="mt-auto pt-4 border-t">
                  <AuthButtons column />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

function DesktopDropdownMenu({ link }: { link: typeof navLinks[0] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 transition-colors hover:text-primary outline-none">
        {link.label} <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {link.subLinks?.map((subLink) => (
          <DropdownMenuItem key={subLink.label} asChild>
            <Link href={subLink.href} className="flex items-center gap-2">
              <subLink.icon className="h-4 w-4 text-muted-foreground" /> {subLink.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function MobileAccordionMenu({ link }: { link: typeof navLinks[0] }) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={link.label} className="border-b-0">
        <AccordionTrigger className="flex items-center gap-2 rounded-md p-2 text-lg font-medium hover:bg-accent hover:text-accent-foreground hover:no-underline">
           <link.icon className="h-5 w-5" /> {link.label}
        </AccordionTrigger>
        <AccordionContent className="pl-4">
          {link.subLinks?.map((subLink) => (
            <Link
              key={subLink.label}
              href={subLink.href}
              className="flex items-center gap-2 rounded-md p-2 text-base font-medium hover:bg-accent hover:text-accent-foreground mt-1"
            >
              <subLink.icon className="h-5 w-5" />
              {subLink.label}
            </Link>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// Placeholder for AuthButtons
function AuthButtons({ column = false }: { column?: boolean }) {
  // In a real app, this would check auth state
  const isAuthenticated = false; 

  if (isAuthenticated) {
    return (
      <Button variant="outline">
        Logout
      </Button>
    );
  }

  return (
    <div className={`flex ${column ? 'flex-col space-y-2' : 'space-x-2'}`}>
      <Button variant="ghost" asChild>
        <Link href="/login">Login</Link>
      </Button>
      <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
        <Link href="/signup">Sign Up</Link>
      </Button>
    </div>
  );
}
