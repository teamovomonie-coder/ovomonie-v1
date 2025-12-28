
"use client";

import { useState, useEffect } from 'react';
import CustomLink from '@/components/layout/custom-link';
import { motion, AnimatePresence } from 'framer-motion';
import { OvoLogo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export default function WelcomePage() {
    const [showContent, setShowContent] = useState(false);
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated === true) {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, router]);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowContent(true);
        }, 2500);
        return () => clearTimeout(timer);
    }, []);
    
    if (isAuthenticated === null) {
        return <div className="h-screen w-screen bg-primary flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-foreground" /></div>
    }
    
    if (isAuthenticated === true) {
        return null;
    }

    return (
        <div className="h-screen w-screen bg-primary flex flex-col items-center justify-center p-8 text-primary-foreground ">
            <AnimatePresence mode="wait">
                {!showContent ? (
                    <motion.div
                        key="splash"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col items-center"
                    >
                        <OvoLogo className="mx-auto" />
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="mt-4 text-lg"
                        >
                            Innovative Banking
                        </motion.p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="welcome"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-sm text-center"
                    >
                        <OvoLogo className="mx-auto" />
                        <h2 className="text-3xl font-bold mt-8 mb-4">Welcome to OVOMONIE</h2>
                        <p className="text-primary-foreground/80 mb-12">Innovative Banking...</p>
                        <div className="space-y-4">
                             <Button asChild size="lg" className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                                <CustomLink href="/register">Register Now</CustomLink>
                            </Button>
                             <Button asChild variant="link" className="text-primary-foreground">
                                <CustomLink href="/login">Already have an account? Log In</CustomLink>
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
