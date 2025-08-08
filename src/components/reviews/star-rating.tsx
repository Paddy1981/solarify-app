"use client";

import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 'md', 
  interactive = false, 
  onRatingChange,
  className 
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = React.useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const handleStarHover = (starRating: number) => {
    if (interactive) {
      setHoveredRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoveredRating(0);
    }
  };

  return (
    <div 
      className={cn("flex items-center space-x-1", className)}
      onMouseLeave={handleMouseLeave}
    >
      {Array.from({ length: maxRating }, (_, index) => {
        const starRating = index + 1;
        const isFilled = (hoveredRating || rating) >= starRating;
        const isPartiallyFilled = !Number.isInteger(rating) && 
                                  Math.floor(rating) === index && 
                                  hoveredRating === 0;

        return (
          <button
            key={index}
            type="button"
            className={cn(
              "relative transition-colors",
              interactive ? "cursor-pointer hover:scale-110" : "cursor-default",
              sizeClasses[size]
            )}
            onClick={() => handleStarClick(starRating)}
            onMouseEnter={() => handleStarHover(starRating)}
            disabled={!interactive}
          >
            <Star
              className={cn(
                "transition-colors",
                sizeClasses[size],
                isFilled 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "fill-gray-200 text-gray-200"
              )}
            />
            {isPartiallyFilled && (
              <Star
                className={cn(
                  "absolute top-0 left-0 transition-colors overflow-hidden",
                  sizeClasses[size],
                  "fill-yellow-400 text-yellow-400"
                )}
                style={{
                  clipPath: `inset(0 ${100 - (rating - Math.floor(rating)) * 100}% 0 0)`
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}