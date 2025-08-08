"use client";

import React, { memo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NavLinkItem } from './types';

interface DesktopNavProps {
  navLinks: NavLinkItem[];
  pathname: string;
}

export const DesktopNav = memo(function DesktopNav({ navLinks, pathname }: DesktopNavProps) {
  return (
    <nav className="hidden md:flex items-center space-x-4">
      {navLinks.map((link) => {
        if (link.subLinks) {
          return (
            <DropdownMenu key={link.label}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center">
                  <link.icon className="w-4 h-4 mr-2" />
                  {link.label}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {link.subLinks.map((subLink) => (
                  <DropdownMenuItem key={subLink.href} asChild>
                    <Link href={subLink.href} className="flex items-center w-full">
                      <subLink.icon className="w-4 h-4 mr-2" />
                      {subLink.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        return (
          <Button
            key={link.href}
            variant={pathname === link.href ? "default" : "ghost"}
            asChild
          >
            <Link href={link.href || '#'} className="flex items-center">
              <link.icon className="w-4 h-4 mr-2" />
              {link.label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
});