
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { CreatePostDialog } from './create-post-dialog';
import { PostCard } from './post-card';
import type { Post } from './post-card';

export function CommunityHub() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchPosts = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/community/posts');
            if (!response.ok) throw new Error('Failed to fetch posts');
            const data = await response.json();
            setPosts(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Community Feed</h2>
                <CreatePostDialog onPostCreated={fetchPosts} />
            </div>

            {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : posts.length === 0 ? (
                <Card className="text-center py-16">
                    <p className="text-muted-foreground">The feed is empty. Be the first to share your journey!</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
        </div>
    );
}
