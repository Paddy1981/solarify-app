"use client";

import React, { memo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart as CartIcon } from 'lucide-react';
import { useCart } from '@/context/cart-context';

export const CartButton = memo(function CartButton() {
  const { getItemCount } = useCart();
  const itemCount = getItemCount();

  return (
    <Button variant="ghost" size="icon" asChild className="relative">
      <Link href="/cart">
        <CartIcon className="h-5 w-5" />
        <span className="sr-only">View Cart</span>
        {itemCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </Badge>
        )}
      </Link>
    </Button>
  );
});