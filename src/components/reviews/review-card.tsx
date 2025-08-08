"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "./star-rating";
import { ThumbsUp, Flag, CheckCircle } from "lucide-react";
import { format } from 'date-fns';
import type { Review } from '@/lib/types/reviews';

interface ReviewCardProps {
  review: Review;
  onHelpfulClick?: (reviewId: string) => void;
  onReportClick?: (reviewId: string) => void;
  compact?: boolean;
}

export function ReviewCard({ 
  review, 
  onHelpfulClick, 
  onReportClick, 
  compact = false 
}: ReviewCardProps) {
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM dd, yyyy');
  };

  return (
    <Card className={`shadow-md hover:shadow-lg transition-shadow ${compact ? 'p-3' : ''}`}>
      <CardHeader className={compact ? 'pb-2' : ''}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-sm font-medium">{review.rating}/5</span>
              {review.isVerified && (
                <Badge variant="secondary" className="text-xs flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <h4 className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
              {review.title}
            </h4>
            <p className="text-xs text-muted-foreground">
              By {review.userName} • {formatDate(review.createdAt)}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={compact ? 'pt-0' : ''}>
        <p className={`text-foreground/80 ${compact ? 'text-sm' : ''} ${compact ? 'line-clamp-2' : ''}`}>
          {review.comment}
        </p>
        
        {!compact && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              {onHelpfulClick && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onHelpfulClick(review.id)}
                  className="text-xs"
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Helpful ({review.isHelpful || 0})
                </Button>
              )}
            </div>
            
            {onReportClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReportClick(review.id)}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                <Flag className="w-4 h-4 mr-1" />
                Report
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}