
"use client"; 

import Link from 'next/link';
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Menu, Users, Briefcase, StoreIcon, HomeIcon, Calculator, FileText, BarChartBig, LogOut, LogIn, UserPlus, ChevronDown, Loader2, PackagePlus, ShoppingBag, ShoppingCart as CartIcon, Award, Megaphone, Settings, TrendingUp, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase'; // Import db for Firestore
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/cart-context';
// Removed getMockUserByEmail as role now comes from Firestore for authenticated users
import type { UserRole } from '@/lib/mock-data/users'; 

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface NavLinkItem {
  href?: string;
  label: string;
  icon: LucideIcon;
  role?: UserRole;
  subLinks?: Array<{ href: string; label: string; icon: LucideIcon }>;
}

const navLinksBase: NavLinkItem[] = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/promotions', label: 'Promotions', icon: Megaphone },
  { href: '/installer/portfolio', label: 'Showcase', icon: Award },
  { href: '/supplier/store', label: 'Shop', icon: ShoppingBag },
];

const navLinksAuthenticated: NavLinkItem[] = [
  {
    label: 'For Homeowners',
    role: 'homeowner' as UserRole,
    icon: Users,
    subLinks: [
      { href: '/homeowner/dashboard', label: 'Dashboard', icon: BarChartBig },
      { href: '/homeowner/energy-needs', label: 'Energy Needs Calculator', icon: Calculator },
      { href: '/homeowner/savings-estimator', label: 'Savings Estimator', icon: BarChartBig },
      { href: '/homeowner/savings-tracker', label: 'Savings Tracker', icon: TrendingUp },
      { href: '/homeowner/maintenance', label: 'Maintenance Hub', icon: Wrench },
      { href: '/homeowner/rfq', label: 'Generate RFQ', icon: FileText },
      { href: '/settings', label: 'Settings', icon: Settings },
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
        { href: '/settings', label: 'Settings', icon: Settings },
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
        { href: '/settings', label: 'Settings', icon: Settings },
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
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  
  const [currentNavLinks, setCurrentNavLinks] = useState<NavLinkItem[]>([]);
  const onAuthPages = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => { 
      setCurrentUser(user);
      if (user) {
        // Fetch role from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserRole(userDocSnap.data()?.role as UserRole);
        } else {
          setUserRole(null); // Role not found in Firestore
          console.warn("User document not found in Firestore for UID:", user.uid);
        }
      } else {
        setUserRole(null);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe(); 
  }, []);
  
  const cartItemCount = mounted ? getItemCount() : 0;


  useEffect(() => {
    if (!mounted) return;

    let newLinks: NavLinkItem[] = [];

    if (onAuthPages) {
      newLinks = navLinksBase.filter(link => link.label === 'Home' || link.label === 'Shop');
    } else {
      newLinks = [...navLinksBase]; 

      if (currentUser && userRole && !isLoadingAuth) {
        const roleSpecificMenu = navLinksAuthenticated.find(link => link.role === userRole);
        if (roleSpecificMenu) {
          const alreadyHasRoleMenu = newLinks.some(link => link.label === roleSpecificMenu.label && link.role === roleSpecificMenu.role);
          if (!alreadyHasRoleMenu) {
            newLinks.push(roleSpecificMenu);
          }
        }
      }
    }
    setCurrentNavLinks(newLinks);

  }, [mounted, currentUser, userRole, isLoadingAuth, onAuthPages, pathname]);


  const closeMobileSheet = () => setIsMobileSheetOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center space-x-4 text-sm font-medium">
          {currentNavLinks.map((link) =>
            (link.subLinks && !onAuthPages && currentUser && userRole) ? ( 
              <DesktopDropdownMenu key={link.label} link={link} />
            ) : (
              link.href && 
              <Link
                key={link.label}
                href={link.href}
                className="transition-colors hover:text-accent"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
        <div className="flex items-center space-x-2">
          {!onAuthPages && (
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
          )}
          <div className="hidden md:flex items-center space-x-2">
             <AuthButtons isLoadingAuth={isLoadingAuth} currentUser={currentUser} />
          </div>
        </div>
        <div className="md:hidden flex items-center space-x-2">
           {!onAuthPages && (
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
           )}
          <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="sr-only">Main Navigation Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-4 mt-6">
                {currentNavLinks.map((link) =>
                  (link.subLinks && !onAuthPages && currentUser && userRole) ? ( 
                    <MobileAccordionMenu key={link.label} link={link} onLinkClick={closeMobileSheet} />
                  ) : (
                    link.href && 
                    <SheetClose asChild key={link.label}>
                      <Link
                        href={link.href}
                        className="flex items-center gap-2 rounded-md p-2 text-lg font-medium hover:bg-accent hover:text-accent-foreground"
                        onClick={closeMobileSheet}
                      >
                        {(link.icon) && <link.icon className="h-5 w-5" />}
                        {link.label}
                      </Link>
                    </SheetClose>
                  )
                )}
                <div className="mt-auto pt-4 border-t">
                  <AuthButtons column isLoadingAuth={isLoadingAuth} currentUser={currentUser} onAuthAction={closeMobileSheet} />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}


function DesktopDropdownMenu({ link }: { link: NavLinkItem }) {
  if (!link.subLinks) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 transition-colors hover:text-accent outline-none text-sm font-medium">
        {link.icon && <link.icon className="h-4 w-4 mr-1" />}
        {link.label} <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {link.subLinks.map((subLink, index) => (
          <React.Fragment key={subLink.label}>
            <DropdownMenuItem asChild>
              <Link href={subLink.href} className="flex items-center gap-2">
                {subLink.icon && <subLink.icon className="h-4 w-4 text-muted-foreground" />} {subLink.label}
              </Link>
            </DropdownMenuItem>
            {(subLink.label === "Generate RFQ" || subLink.label === "Maintenance Hub" || subLink.label === "Savings Tracker") && link.label === "For Homeowners" && index < link.subLinks.length - 2 && <DropdownMenuSeparator />}
            {subLink.label === "View RFQs" && link.label === "For Installers" && <DropdownMenuSeparator />}
            {subLink.label === "Add Product" && link.label === "For Suppliers" && <DropdownMenuSeparator />}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


function MobileAccordionMenu({ 
  link,
  onLinkClick 
}: { 
  link: NavLinkItem;
  onLinkClick: () => void;
}) {
  if (!link.subLinks) return null;
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={link.label} className="border-b-0">
        <AccordionTrigger className="flex items-center gap-2 rounded-md p-2 text-lg font-medium hover:bg-accent hover:text-accent-foreground hover:no-underline">
           {link.icon && <link.icon className="h-5 w-5" />} {link.label}
        </AccordionTrigger>
        <AccordionContent className="pl-4">
          {link.subLinks.map((subLink) => (
            <SheetClose asChild key={subLink.label}>
              <Link
                href={subLink.href}
                className="flex items-center gap-2 rounded-md p-2 text-base font-medium hover:bg-accent hover:text-accent-foreground mt-1"
                onClick={onLinkClick}
              >
                {subLink.icon && <subLink.icon className="h-5 w-5" />}
                {subLink.label}
              </Link>
            </SheetClose>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}


function AuthButtons({ 
  column = false, 
  isLoadingAuth, 
  currentUser,
  onAuthAction 
}: { 
  column?: boolean, 
  isLoadingAuth: boolean, 
  currentUser: FirebaseUser | null,
  onAuthAction?: () => void; 
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [clientMounted, setClientMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setClientMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      if (onAuthAction) onAuthAction();
      router.push('/login'); 
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", description: "Could not log you out. Please try again.", variant: "destructive" });
    }
  };

  const handleLoginClick = () => {
    if (onAuthAction) onAuthAction();
    router.push('/login');
  };

  const handleSignupClick = () => {
    if (onAuthAction) onAuthAction();
    router.push('/signup');
  };

  if (!clientMounted || isLoadingAuth) {
    return (
      <div className={`flex ${column ? 'flex-col space-y-2 w-full' : 'space-x-2'}`}>
        <Button variant="ghost" disabled className={`${column ? 'w-full justify-start text-sm' : 'text-sm'} h-9 px-3`}>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
        </Button>
      </div>
    );
  }

  if (currentUser) {
     // Don't show logout button on login/signup pages if already logged in (edge case, user might navigate there directly)
    if (pathname === '/login' || pathname === '/signup') {
      return null; 
    }
    const buttonContent = (
      <>
        <LogOut className="mr-2 h-4 w-4" /> Logout
      </>
    );
    if (column) {
      return (
          <Button variant="outline" onClick={handleLogout} className="w-full text-sm">
            {buttonContent}
          </Button>
      );
    }
    return (
      <Button variant="outline" onClick={handleLogout} className="text-sm">
        {buttonContent}
      </Button>
    );
  }

  // Show Login/Signup buttons if not logged in
  if (column) { // For mobile sheet
    return (
      <div className="flex flex-col space-y-2 w-full">
        {pathname !== '/login' && (
          <SheetClose asChild>
            <Button variant="ghost" onClick={handleLoginClick} className="w-full justify-start text-sm">
              <LogIn className="mr-2 h-4 w-4" /> Login
            </Button>
          </SheetClose>
        )}
        {pathname !== '/signup' && (
          <SheetClose asChild>
            <Button onClick={handleSignupClick} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-sm">
              <UserPlus className="mr-2 h-4 w-4" /> Sign Up
            </Button>
          </SheetClose>
        )}
      </div>
    );
  }

  // For desktop header
  return (
    <div className="flex space-x-2">
      {pathname !== '/login' && (
        <Button variant="ghost" onClick={handleLoginClick} className="text-sm">
          <LogIn className="mr-2 h-4 w-4" /> Login
        </Button>
      )}
      {pathname !== '/signup' && (
        <Button onClick={handleSignupClick} className="bg-accent text-accent-foreground hover:bg-accent/90 text-sm">
          <UserPlus className="mr-2 h-4 w-4" /> Sign Up
        </Button>
      )}
    </div>
  );
}
