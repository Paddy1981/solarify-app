
import Link from 'next/link';
import { Sun } from 'lucide-react';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-2xl font-headline font-bold text-primary-foreground hover:text-primary-foreground/90 transition-colors">
      <Sun className="w-7 h-7 text-primary" />
      Solarify
    </Link>
  );
}
