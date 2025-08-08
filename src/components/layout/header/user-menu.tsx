"use client";

import React, { memo, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, LogIn, UserPlus, Settings, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserRole } from '@/lib/mock-data/users';

interface UserMenuProps {
  currentUser: FirebaseUser | null;
  userRole: UserRole | null;
  isLoadingAuth: boolean;
  onSignOut: () => Promise<void>;
}

export const UserMenu = memo(function UserMenu({ 
  currentUser, 
  userRole, 
  isLoadingAuth, 
  onSignOut 
}: UserMenuProps) {
  const handleSignOut = useCallback(async () => {
    await onSignOut();
  }, [onSignOut]);

  if (isLoadingAuth) {
    return (
      <div className="flex items-center">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center space-x-2">
        <Button variant="ghost" asChild>
          <Link href="/login" className="flex items-center">
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Link>
        </Button>
        <Button asChild>
          <Link href="/signup" className="flex items-center">
            <UserPlus className="w-4 h-4 mr-2" />
            Sign Up
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center">
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">
              {currentUser.displayName || currentUser.email}
            </span>
            {userRole && (
              <span className="text-xs text-muted-foreground capitalize">
                {userRole}
              </span>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center w-full">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="flex items-center w-full">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});