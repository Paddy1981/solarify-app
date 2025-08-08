"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./star-rating";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import type { Review } from '@/lib/types/reviews';

interface ReviewFormProps {
  targetId: string;
  targetType: 'product' | 'installer' | 'supplier';
  onReviewSubmitted?: (review: Review) => void;
  className?: string;
}

export function ReviewForm({ 
  targetId, 
  targetType, 
  onReviewSubmitted,
  className 
}: ReviewFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a review.",
        variant: "destructive"
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating.",
        variant: "destructive"
      });
      return;
    }

    if (!title.trim() || !comment.trim()) {
      toast({
        title: "Complete Review Required",
        description: "Please provide both a title and comment.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const reviewData = {
        userId: user.uid,
        userEmail: user.email || '',
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        targetId,
        targetType,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        isVerified: false, // This would be set based on purchase history
        isHelpful: 0,
        isReported: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "reviews"), reviewData);
      
      const newReview: Review = {
        id: docRef.id,
        ...reviewData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (onReviewSubmitted) {
        onReviewSubmitted(newReview);
      }

      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!"
      });

      // Reset form
      setRating(0);
      setTitle('');
      setComment('');
      
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card className={`shadow-lg ${className}`}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please log in to write a review</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-headline">Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rating *</label>
            <StarRating
              rating={rating}
              interactive={true}
              onRatingChange={setRating}
              size="lg"
            />
          </div>

          <div>
            <label htmlFor="review-title" className="block text-sm font-medium mb-2">
              Review Title *
            </label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience..."
              maxLength={100}
              required
            />
          </div>

          <div>
            <label htmlFor="review-comment" className="block text-sm font-medium mb-2">
              Your Review *
            </label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this product..."
              rows={4}
              maxLength={1000}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/1000 characters
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}