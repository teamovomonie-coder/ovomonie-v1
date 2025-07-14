
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface Post {
    id: string;
    authorName: string;
    authorAvatarUrl?: string;
    timestamp: string; // ISO string
    title: string;
    content: string;
    imageUrl?: string;
    likes: number;
    comments: number;
}

export function PostCard({ post }: { post: Post }) {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likes);

    const handleLike = () => {
        setLiked(!liked);
        setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                 <Avatar>
                    <AvatarImage src={post.authorAvatarUrl} alt={post.authorName} data-ai-hint="person avatar" />
                    <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                    <p className="font-semibold">{post.authorName}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}</p>
                </div>
                 <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <h3 className="text-lg font-bold">{post.title}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                {post.imageUrl && (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                         <Image src={post.imageUrl} alt={post.title} layout="fill" objectFit="cover" data-ai-hint="financial goal" />
                    </div>
                )}
            </CardContent>
            <Separator className="my-2"/>
            <CardFooter className="p-2">
                <div className="flex justify-around w-full">
                    <Button variant="ghost" onClick={handleLike}>
                        <Heart className={liked ? "fill-red-500 text-red-500" : ""} />
                        <span className="ml-2">{likeCount}</span>
                    </Button>
                     <Button variant="ghost">
                        <MessageCircle />
                        <span className="ml-2">{post.comments}</span>
                    </Button>
                     <Button variant="ghost">
                        <Share2 />
                        <span className="ml-2">Share</span>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
