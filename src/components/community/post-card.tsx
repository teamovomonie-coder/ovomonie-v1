
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
    Heart, 
    MessageCircle, 
    Share2, 
    MoreHorizontal, 
    Shield, 
    TrendingUp, 
    DollarSign,
    Eye,
    Bookmark
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export interface Post {
    id: string;
    authorName: string;
    authorAvatarUrl?: string;
    timestamp: string;
    title: string;
    content: string;
    imageUrl?: string;
    likes: number;
    comments: number;
    views?: number;
    category?: 'investment' | 'savings' | 'budgeting' | 'crypto' | 'general';
    isVerified?: boolean;
    isPinned?: boolean;
    tags?: string[];
}

const categoryConfig = {
    investment: { icon: TrendingUp, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', label: 'Investment' },
    savings: { icon: DollarSign, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', label: 'Savings' },
    budgeting: { icon: Shield, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', label: 'Budgeting' },
    crypto: { icon: TrendingUp, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', label: 'Crypto' },
    general: { icon: MessageCircle, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', label: 'General' }
};

export function PostCard({ post }: { post: Post }) {
    const [liked, setLiked] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likes);
    const [isImageLoading, setIsImageLoading] = useState(true);

    const handleLike = () => {
        setLiked(!liked);
        setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    };

    const categoryInfo = post.category ? categoryConfig[post.category] : categoryConfig.general;
    const CategoryIcon = categoryInfo.icon;

    return (
        <Card className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-primary/20">
            {post.isPinned && (
                <div className="absolute top-2 right-2 z-10">
                    <Badge variant="secondary" className="text-xs font-medium bg-primary/10 text-primary border-primary/20">
                        Pinned
                    </Badge>
                </div>
            )}
            
            <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                    <div className="relative">
                        <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                            <AvatarImage 
                                src={post.authorAvatarUrl} 
                                alt={post.authorName} 
                                className="object-cover"
                            />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                {post.authorName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        {post.isVerified && (
                            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                                <Shield className="h-3 w-3 text-primary-foreground" />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm text-foreground truncate">
                                {post.authorName}
                            </h4>
                            {post.category && (
                                <Badge variant="outline" className={cn("text-xs px-2 py-0.5 font-medium", categoryInfo.color)}>
                                    <CategoryIcon className="h-3 w-3 mr-1" />
                                    {categoryInfo.label}
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                        </p>
                    </div>
                    
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4 pb-4">
                <div className="space-y-3">
                    <h3 className="font-semibold text-base leading-tight text-foreground">
                        {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {post.content}
                    </p>
                </div>
                
                {post.imageUrl && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border/50 bg-muted/30">
                        {isImageLoading && (
                            <div className="absolute inset-0 bg-muted/50 animate-pulse flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            </div>
                        )}
                        <Image 
                            src={post.imageUrl} 
                            alt={post.title}
                            fill
                            className={cn(
                                "object-cover transition-opacity duration-300",
                                isImageLoading ? "opacity-0" : "opacity-100"
                            )}
                            onLoad={() => setIsImageLoading(false)}
                            onError={() => setIsImageLoading(false)}
                        />
                    </div>
                )}
                
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {post.tags.slice(0, 3).map((tag, index) => (
                            <Badge 
                                key={index} 
                                variant="secondary" 
                                className="text-xs px-2 py-1 bg-muted/50 text-muted-foreground hover:bg-muted/80 transition-colors"
                            >
                                #{tag}
                            </Badge>
                        ))}
                        {post.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs px-2 py-1 bg-muted/50 text-muted-foreground">
                                +{post.tags.length - 3}
                            </Badge>
                        )}
                    </div>
                )}
            </CardContent>
            
            <Separator className="mx-4" />
            
            <CardFooter className="pt-3 pb-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleLike}
                            className={cn(
                                "h-8 px-3 text-xs font-medium transition-all duration-200",
                                liked 
                                    ? "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <Heart className={cn(
                                "h-4 w-4 mr-1.5 transition-all duration-200",
                                liked ? "fill-red-500 text-red-500 scale-110" : ""
                            )} />
                            {likeCount.toLocaleString()}
                        </Button>
                        
                        <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        >
                            <MessageCircle className="h-4 w-4 mr-1.5" />
                            {post.comments.toLocaleString()}
                        </Button>
                        
                        {post.views && (
                            <div className="flex items-center gap-1 px-2 text-xs text-muted-foreground">
                                <Eye className="h-3 w-3" />
                                {post.views.toLocaleString()}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setBookmarked(!bookmarked)}
                            className={cn(
                                "h-8 w-8 p-0 transition-all duration-200",
                                bookmarked 
                                    ? "text-primary hover:text-primary/80" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Bookmark className={cn(
                                "h-4 w-4 transition-all duration-200",
                                bookmarked ? "fill-primary" : ""
                            )} />
                        </Button>
                        
                        <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        >
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
