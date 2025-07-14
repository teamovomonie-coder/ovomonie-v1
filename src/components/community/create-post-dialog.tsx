
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Upload } from 'lucide-react';

const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title is too long."),
  content: z.string().min(10, "Post content is too short.").max(500, "Post is too long."),
  imageUrl: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

export function CreatePostDialog({ onPostCreated }: { onPostCreated: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const { toast } = useToast();

    const form = useForm<PostFormData>({
        resolver: zodResolver(postSchema),
        defaultValues: { title: "", content: "", imageUrl: "" },
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                form.setValue('imageUrl', result);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleGenerateContent = async () => {
        const title = form.getValues('title');
        if (!title) {
            toast({ variant: 'destructive', title: 'Please enter a title first.' });
            return;
        }
        // In a real app, you'd call an AI flow here.
        form.setValue('content', `I'm excited to share that I'm working on my goal: "${title}". I'm making steady progress by setting aside funds regularly. It's a journey, but every step counts! #FinancialGoal`);
    }

    const onSubmit = async (data: PostFormData) => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('ovo-auth-token');
            if (!token) throw new Error("You must be logged in to post.");

            const response = await fetch('/api/community/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to create post.');
            
            toast({ title: "Post Published!", description: "Your financial milestone has been shared with the community." });
            setIsOpen(false);
            form.reset();
            setImagePreview(null);
            onPostCreated();

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>Create Post</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Share Your Financial Journey</DialogTitle>
                    <DialogDescription>Inspire others by sharing a goal, milestone, or question.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Title / Goal</FormLabel><FormControl><Input placeholder="e.g., Saved for my first car!" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="content" render={({ field }) => (
                            <FormItem><FormLabel>Your Story</FormLabel>
                                <div className="relative">
                                    <FormControl><Textarea placeholder="Share more details about your journey..." {...field} rows={6} /></FormControl>
                                    <Button type="button" size="icon" variant="ghost" className="absolute bottom-2 right-2 h-7 w-7" onClick={handleGenerateContent}>
                                        <Sparkles className="h-4 w-4" />
                                    </Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="imageUrl" render={() => (
                            <FormItem><FormLabel>Add a Photo (Optional)</FormLabel>
                                <div className="relative w-full h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted cursor-pointer">
                                    <Input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="absolute h-full w-full opacity-0 cursor-pointer" />
                                    {imagePreview ? (<Image src={imagePreview} alt="Post preview" layout="fill" objectFit="contain" className="p-2"/>) : (<div className="text-center"><Upload className="mx-auto h-8 w-8" /><p className="text-xs mt-1">Upload Photo</p></div>)}
                                </div>
                            </FormItem>
                         )} />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="animate-spin mr-2"/>}
                                Publish Post
                            </Button>
                        </DialogFooter>
                    </form>
                 </Form>
            </DialogContent>
        </Dialog>
    )
}
