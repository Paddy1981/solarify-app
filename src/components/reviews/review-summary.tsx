"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StarRating } from "./star-rating";
import type { ReviewSummary } from '@/lib/types/reviews';

interface ReviewSummaryProps {
  summary: ReviewSummary;
  className?: string;
}

export function ReviewSummaryCard({ summary, className }: ReviewSummaryProps) {
  const { averageRating, totalReviews, ratingDistribution } = summary;

  const getPercentage = (count: number) => {
    return totalReviews > 0 ? (count / totalReviews) * 100 : 0;
  };

  return (
    <Card className={`shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-headline">Customer Reviews</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-accent mb-2">
              {averageRating.toFixed(1)}
            </div>
            <StarRating rating={averageRating} size="lg" className="justify-center mb-2" />
            <p className="text-sm text-muted-foreground">
              Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center space-x-2">
                <span className="text-sm w-3">{stars}</span>
                <StarRating rating={1} maxRating={1} size="sm" />
                <Progress 
                  value={getPercentage(ratingDistribution[stars as keyof typeof ratingDistribution])} 
                  className="flex-1 h-2"
                />
                <span className="text-xs text-muted-foreground w-8">
                  {ratingDistribution[stars as keyof typeof ratingDistribution]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}