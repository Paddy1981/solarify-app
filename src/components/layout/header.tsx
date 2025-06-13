
"use client"; // Required for useEffect, useState

import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Sun, Users, Briefcase, StoreIcon, HomeIcon, Calculator, FileText, BarChartBig, LogOut, LogIn, UserPlus, ChevronDown, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  {
    label: 'For Installers',
    icon: Briefcase,
    subLinks: [
        { href: '/installer/dashboard', label: 'Dashboard', icon: HomeIcon },
        { href: '/installer/portfolio', label: 'Project Portfolio', icon: Briefcase },
        { href: '/installer/rfqs', label: 'View RFQs', icon: FileText },
    ]
  },
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


function DesktopDropdownMenu({ link }: { link: typeof navLinks[0] & { subLinks: NonNullable<typeof navLinks[0]['subLinks']> }}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 transition-colors hover:text-primary outline-none">
        {link.label} <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {link.subLinks.map((subLink) => (
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


function MobileAccordionMenu({ link }: { link: typeof navLinks[0] & { subLinks: NonNullable<typeof navLinks[0]['subLinks']> }}) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={link.label} className="border-b-0">
        <AccordionTrigger className="flex items-center gap-2 rounded-md p-2 text-lg font-medium hover:bg-accent hover:text-accent-foreground hover:no-underline">
           <link.icon className="h-5 w-5" /> {link.label}
        </AccordionTrigger>
        <AccordionContent className="pl-4">
          {link.subLinks.map((subLink) => (
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


function AuthButtons({ column = false }: { column?: boolean }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", description: "Could not log you out. Please try again.", variant: "destructive" });
    }
  };

  if (isLoadingAuth) {
    // Simple loading state to prevent flicker
    return (
      <div className={`flex ${column ? 'flex-col space-y-2 w-full' : 'space-x-2'}`}>
        <Button variant="ghost" disabled className={column ? 'w-full justify-start' : ''}>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
        </Button>
      </div>
    );
  }

  if (currentUser) {
    return (
      <Button variant="outline" onClick={handleLogout} className={column ? 'w-full' : ''}>
        <LogOut className="mr-2 h-4 w-4" /> Logout
      </Button>
    );
  }

  return (
    <div className={`flex ${column ? 'flex-col space-y-2 w-full' : 'space-x-2'}`}>
      <Button variant="ghost" asChild className={column ? 'w-full justify-start' : ''}>
        <Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Login</Link>
      </Button>
      <Button asChild className={`bg-accent text-accent-foreground hover:bg-accent/90 ${column ? 'w-full' : ''}`}>
        <Link href="/signup"><UserPlus className="mr-2 h-4 w-4" /> Sign Up</Link>
      </Button>
    </div>
  );
}
