
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] bg-background text-foreground p-6 text-center">
      <SearchX className="w-16 h-16 text-primary mb-6" />
      <h1 className="text-4xl font-headline mb-4 text-accent">Page Not Found</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        Sorry, the page you are looking for does not exist or may have been moved.
      </p>
      <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
        <Link href="/">Go to Homepage</Link>
      </Button>
    </div>
  );
}
