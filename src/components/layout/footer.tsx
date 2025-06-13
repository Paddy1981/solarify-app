export function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Solarify. All rights reserved.
        <p className="mt-1">Empowering Your Solar Journey.</p>
      </div>
    </footer>
  );
}
