
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function Footer() {
  const [footerText, setFooterText] = useState<string>('© Solarify. All rights reserved.');

  useEffect(() => {
    setFooterText(`© ${new Date().getFullYear()} Solarify. All rights reserved.`);
  }, []);

  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        {footerText}
        <p className="mt-1">Empowering Your Solar Journey.</p>
        <div className="mt-2 flex justify-center space-x-4">
          <Link href="/help" className="hover:text-primary hover:underline">
            Help & Support
          </Link>
          <span className="text-muted-foreground/50">|</span>
          <Link href="/contact" className="hover:text-primary hover:underline">
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  );
}
