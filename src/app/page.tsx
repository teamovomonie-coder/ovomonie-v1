
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { OvoLogo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function WelcomePage() {
    const [showContent, setShowContent] = useState(false);
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, router]);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowContent(true);
        }, 2500); // 2.5 seconds for splash animation
        return () => clearTimeout(timer);
    }, []);
    
    if (isAuthenticated === true || isAuthenticated === null) {
        // Show a loader or blank screen while checking auth or redirecting
        return <div className="h-screen w-screen bg-primary flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-foreground" /></div>
    }

    return (
        <div className="h-screen w-screen bg-primary flex flex-col items-center justify-center p-8 text-primary-foreground">
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
                        <OvoLogo />
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
                        <OvoLogo />
                        <h2 className="text-3xl font-bold mt-8 mb-4">Welcome to OVOMONIE</h2>
                        <p className="text-primary-foreground/80 mb-12">Your partner in financial wellness. Register today to start enjoying modern banking solutions.</p>
                        <div className="space-y-4">
                             <Button asChild size="lg" className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                                <Link href="/register">Register Now</Link>
                            </Button>
                             <Button asChild variant="link" className="text-primary-foreground">
                                <Link href="/login">Already have an account? Log In</Link>
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
