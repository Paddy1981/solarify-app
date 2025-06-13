
"use client";

import type { PromotionPost } from "@/lib/mock-data/promotions";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, CalendarDays, Percent, ExternalLink, Palette } from "lucide-react"; // Added Palette for placeholder image hint
import { formatDistanceToNow, parseISO } from 'date-fns';

interface PromotionCardProps {
  post: PromotionPost;
}

export function PromotionCard({ post }: PromotionCardProps) {
  let postDateFormatted = post.postDate;
  try {
    postDateFormatted = `${formatDistanceToNow(parseISO(post.postDate))} ago`;
  } catch (e) {
    // if date is invalid, use original
  }

  let validUntilFormatted = post.validUntil;
  if (post.validUntil) {
    try {
      validUntilFormatted = `Valid until ${new Date(post.validUntil).toLocaleDateString()}`;
    } catch (e) { /* use original */ }
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden">
      {post.imageUrl && (
        <div className="relative w-full h-48 bg-muted/30">
          <Image
            src={post.imageUrl}
            alt={post.title}
            data-ai-hint={post.imageHint || "promotion relevant"}
            layout="fill"
            objectFit="cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-center space-x-3 mb-2">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={post.authorAvatarUrl} alt={post.authorName} />
            <AvatarFallback>{post.authorName?.substring(0, 2).toUpperCase() || 'AA'}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg font-headline leading-tight">{post.authorName}</CardTitle>
            <CardDescription className="text-xs">
              {post.authorRole.charAt(0).toUpperCase() + post.authorRole.slice(1)} - Posted {postDateFormatted}
            </CardDescription>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-accent line-clamp-2 h-14">{post.title}</h3>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
        {post.discountOffer && (
          <div className="flex items-center text-accent">
            <Percent className="w-5 h-5 mr-2" />
            <span className="font-semibold">{post.discountOffer}</span>
          </div>
        )}
        {post.validUntil && (
           <p className="text-xs text-muted-foreground flex items-center"><CalendarDays className="w-3 h-3 mr-1.5"/> {validUntilFormatted}</p>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start space-y-3 pt-0">
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                <Tag className="w-3 h-3 mr-1" /> {tag}
              </Badge>
            ))}
          </div>
        )}
        {post.callToActionText && post.callToActionLink && (
          <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90 mt-auto">
            <Link href={post.callToActionLink}>
              {post.callToActionText} <ExternalLink className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
