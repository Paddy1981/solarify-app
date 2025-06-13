
"use client"; 

import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Sun, Users, Briefcase, StoreIcon, HomeIcon, Calculator, FileText, BarChartBig, LogOut, LogIn, UserPlus, ChevronDown, Loader2, PackagePlus, ShoppingBag, ShoppingCart as CartIcon, Award } from 'lucide-react';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/cart-context';
import { getMockUserByEmail, type UserRole } from '@/lib/mock-data/users'; 

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

const navLinksBase = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/installer/portfolio', label: 'Project Showcase', icon: Award },
  { href: '/supplier/store', label: 'Shop Products', icon: ShoppingBag }, 
];

const navLinksAuthenticated = [
  {
    label: 'For Homeowners',
    role: 'homeowner' as UserRole,
    icon: Users,
    subLinks: [
      { href: '/homeowner/dashboard', label: 'Dashboard', icon: BarChartBig },
      { href: '/homeowner/energy-needs', label: 'Energy Needs Calculator', icon: Calculator },
      { href: '/homeowner/savings-estimator', label: 'Savings Estimator', icon: BarChartBig },
      { href: '/homeowner/rfq', label: 'Generate RFQ', icon: FileText },
    ],
  },
  {
    label: 'For Installers',
    role: 'installer' as UserRole,
    icon: Briefcase,
    subLinks: [
        { href: '/installer/dashboard', label: 'Dashboard', icon: HomeIcon },
        { href: '/installer/portfolio', label: 'My Portfolio', icon: Briefcase },
        { href: '/installer/rfqs', label: 'View RFQs', icon: FileText },
    ]
  },
  {
    label: 'For Suppliers',
    role: 'supplier' as UserRole,
    icon: StoreIcon,
    subLinks: [
        { href: '/supplier/dashboard', label: 'Dashboard', icon: HomeIcon },
        { href: '/supplier/store', label: 'Manage Storefront', icon: StoreIcon }, 
        { href: '/supplier/store/add-product', label: 'Add Product', icon: PackagePlus },
    ]
  },
];


export function Header() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const { getItemCount } = useCart(); 
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  
  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email) {
        const profile = getMockUserByEmail(user.email);
        setUserRole(profile?.role || null);
      } else {
        setUserRole(null);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe(); 
  }, []);
  
  const cartItemCount = mounted ? getItemCount() : 0;

  const onAuthPages = pathname === '/login' || pathname === '/signup';
  let displayedNavLinks: Array<(typeof navLinksBase[0]) | (typeof navLinksAuthenticated[0])> = [...navLinksBase];

  if (currentUser && !onAuthPages && userRole) {
    const roleSpecificLinks = navLinksAuthenticated.filter(link => link.role === userRole);
    // For logged-in users, remove the generic "Project Showcase" if they have "My Portfolio" under their role
    // This avoids duplication.
    const baseLinksFiltered = navLinksBase.filter(bl => {
      if (bl.label === 'Project Showcase' && roleSpecificLinks.some(rs => rs.subLinks?.some(sl => sl.href === bl.href))) {
        return false;
      }
      return true;
    });
    displayedNavLinks = [...baseLinksFiltered, ...roleSpecificLinks];
  } else {
    // Logged-out users or users on auth pages see all base links.
    displayedNavLinks = [...navLinksBase];
  }


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center space-x-4 text-sm font-medium">
          {displayedNavLinks.map((link) =>
            (link as typeof navLinksAuthenticated[0]).subLinks ? ( 
              <DesktopDropdownMenu key={link.label} link={link as typeof navLinksAuthenticated[0]} />
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
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild className="relative hidden md:inline-flex">
            <Link href="/cart">
              <CartIcon className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {cartItemCount}
                </span>
              )}
              <span className="sr-only">View Cart</span>
            </Link>
          </Button>
          <div className="hidden md:flex items-center space-x-2">
             <AuthButtons isLoadingAuth={isLoadingAuth} currentUser={currentUser} />
          </div>
        </div>
        <div className="md:hidden flex items-center space-x-2">
           <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/cart">
              <CartIcon className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {cartItemCount}
                </span>
              )}
              <span className="sr-only">View Cart</span>
            </Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-4 mt-6">
                {displayedNavLinks.map((link) =>
                  (link as typeof navLinksAuthenticated[0]).subLinks ? ( 
                    <MobileAccordionMenu key={link.label} link={link as typeof navLinksAuthenticated[0]} />
                  ) : (
                    <Link
                      key={link.label}
                      href={link.href!}
                      className="flex items-center gap-2 rounded-md p-2 text-lg font-medium hover:bg-accent hover:text-accent-foreground"
                    >
                      {(link.icon) && <link.icon className="h-5 w-5" />}
                      {link.label}
                    </Link>
                  )
                )}
                <div className="mt-auto pt-4 border-t">
                  <AuthButtons column isLoadingAuth={isLoadingAuth} currentUser={currentUser} />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}


function DesktopDropdownMenu({ link }: { link: typeof navLinksAuthenticated[0] & { subLinks: NonNullable<typeof navLinksAuthenticated[0]['subLinks']> }}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 transition-colors hover:text-primary outline-none text-sm font-medium">
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


function MobileAccordionMenu({ link }: { link: typeof navLinksAuthenticated[0] & { subLinks: NonNullable<typeof navLinksAuthenticated[0]['subLinks']> }}) {
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


function AuthButtons({ column = false, isLoadingAuth, currentUser }: { column?: boolean, isLoadingAuth: boolean, currentUser: FirebaseUser | null }) {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login'); 
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", description: "Could not log you out. Please try again.", variant: "destructive" });
    }
  };

  if (isLoadingAuth) {
    return (
      <div className={`flex ${column ? 'flex-col space-y-2 w-full' : 'space-x-2'}`}>
        <Button variant="ghost" disabled className={`${column ? 'w-full justify-start' : ''} text-sm`}>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
        </Button>
      </div>
    );
  }

  if (currentUser) {
    return (
      <Button variant="outline" onClick={handleLogout} className={`${column ? 'w-full' : ''} text-sm`}>
        <LogOut className="mr-2 h-4 w-4" /> Logout
      </Button>
    );
  }

  return (
    <div className={`flex ${column ? 'flex-col space-y-2 w-full' : 'space-x-2'}`}>
      <Button variant="ghost" asChild className={`${column ? 'w-full justify-start' : ''} text-sm`}>
        <Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Login</Link>
      </Button>
      <Button asChild className={`bg-accent text-accent-foreground hover:bg-accent/90 ${column ? 'w-full' : ''} text-sm`}>
        <Link href="/signup"><UserPlus className="mr-2 h-4 w-4" /> Sign Up</Link>
      </Button>
    </div>
  );
}

