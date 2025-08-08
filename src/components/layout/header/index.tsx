"use client";

import React, { memo, useEffect, useState, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import type { UserRole } from '@/lib/mock-data/users';

import { Logo } from '@/components/layout/logo';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { DesktopNav } from './desktop-nav';
import { MobileNav } from './mobile-nav';
import { UserMenu } from './user-menu';
import { CartButton } from './cart-button';
import { getFilteredNavLinks } from './nav-links';

export const Header = memo(function Header() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // Memoize nav links based on user role
  const navLinks = useMemo(() => {
    return getFilteredNavLinks(userRole);
  }, [userRole]);

  // Memoized auth state handler
  const handleAuthStateChange = useCallback(async (user: FirebaseUser | null) => {
    setCurrentUser(user);
    
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData?.role || null);
        } else {
          setUserRole(null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }
    
    setIsLoadingAuth(false);
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);
    return () => unsubscribe();
  }, [handleAuthStateChange]);

  // Memoized sign out handler
  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserRole(null);
      router.push('/');
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign out failed",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  }, [router, toast]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex min-h-[3.5rem] sm:h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0">
          <Logo />
        </div>

        {/* Desktop Navigation */}
        <DesktopNav navLinks={navLinks} pathname={pathname} />

        {/* Right side actions */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {/* Notifications (only for authenticated users) */}
          {currentUser && (
            <div className="hidden xs:block">
              <NotificationBell />
            </div>
          )}

          {/* Cart Button */}
          <CartButton />

          {/* User Menu */}
          <UserMenu 
            currentUser={currentUser}
            userRole={userRole}
            isLoadingAuth={isLoadingAuth}
            onSignOut={handleSignOut}
          />

          {/* Mobile Navigation */}
          <MobileNav navLinks={navLinks} pathname={pathname} />
        </div>
      </div>
    </header>
  );
});