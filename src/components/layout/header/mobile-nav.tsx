"use client";

import React, { memo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { NavLinkItem } from './types';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  navLinks: NavLinkItem[];
  pathname: string;
}

export const MobileNav = memo(function MobileNav({ navLinks, pathname }: MobileNavProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="mobile"
            className="h-10 w-10 p-0"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className="w-80 overflow-y-auto p-0 flex flex-col"
          aria-describedby="mobile-nav-description"
        >
          <SheetHeader className="border-b px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-left">Navigation</SheetTitle>
              <SheetClose asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Close navigation menu"
                >
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>
          
          <div id="mobile-nav-description" className="sr-only">
            Mobile navigation menu with links to different sections of the application
          </div>
          
          <div className="flex-1 px-4 py-6 overflow-y-auto">
            <nav className="space-y-2">
              {navLinks.map((link, index) => {
                if (link.subLinks) {
                  return (
                    <Accordion key={link.label} type="single" collapsible className="w-full">
                      <AccordionItem value={`item-${index}`} className="border-none">
                        <AccordionTrigger 
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-accent/50 hover:no-underline",
                            "min-h-[44px] touch-manipulation"
                          )}
                        >
                          <div className="flex items-center">
                            <link.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                            <span className="font-medium">{link.label}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                          <div className="space-y-1 ml-8">
                            {link.subLinks.map((subLink) => (
                              <SheetClose key={subLink.href} asChild>
                                <Link 
                                  href={subLink.href}
                                  className={cn(
                                    "flex items-center px-3 py-2.5 rounded-md transition-colors",
                                    "min-h-[44px] touch-manipulation",
                                    pathname === subLink.href 
                                      ? 'bg-accent text-accent-foreground font-medium' 
                                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                                  )}
                                  onClick={() => setIsOpen(false)}
                                >
                                  <subLink.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                                  <span>{subLink.label}</span>
                                </Link>
                              </SheetClose>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  );
                }

                return (
                  <SheetClose key={link.href || link.label} asChild>
                    <Link 
                      href={link.href || '#'}
                      className={cn(
                        "flex items-center px-3 py-3 rounded-lg transition-colors",
                        "min-h-[44px] touch-manipulation w-full",
                        pathname === link.href 
                          ? 'bg-accent text-accent-foreground font-medium' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <link.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span>{link.label}</span>
                    </Link>
                  </SheetClose>
                );
              })}
            </nav>
          </div>
          
          {/* Footer section for additional mobile actions */}
          <div className="border-t px-4 py-3 bg-muted/50">
            <p className="text-xs text-muted-foreground text-center">
              Swipe left to close menu
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
});