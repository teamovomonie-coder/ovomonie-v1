
"use client";

import { useState, useEffect } from 'react';
import CustomLink from '@/components/layout/custom-link';
import { motion, AnimatePresence } from 'framer-motion';
import { OvoLogo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Loader2, Shield, TrendingUp, Smartphone, Lock } from 'lucide-react';

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
        return (
            <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        )
    }

    return (
        <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform rotate-12"></div>
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-blue-300/5 to-transparent transform -rotate-12"></div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-32 right-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl animate-pulse delay-500"></div>
            
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 text-white">
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
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                            >
                                <OvoLogo className="mx-auto drop-shadow-2xl" />
                            </motion.div>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5, duration: 1 }}
                                className="mt-6 text-xl font-medium tracking-wide text-blue-100"
                            >
                                Innovative Banking
                            </motion.p>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100px" }}
                                transition={{ delay: 1, duration: 0.8 }}
                                className="h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 mt-4 rounded-full"
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="w-full max-w-md text-center"
                        >
                            <motion.div
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.6 }}
                            >
                                <OvoLogo className="mx-auto drop-shadow-2xl" />
                            </motion.div>
                            
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                                className="text-4xl font-bold mt-8 mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent"
                            >
                                Welcome to OVOMONIE
                            </motion.h1>
                            
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                                className="text-blue-100/90 mb-8 text-lg leading-relaxed"
                            >
                                Innovative Banking...
                            </motion.p>
                            
                            {/* Feature Icons */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                                className="flex justify-center space-x-8 mb-10"
                            >
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-2 backdrop-blur-sm border border-blue-400/30">
                                        <Shield className="w-6 h-6 text-blue-300" />
                                    </div>
                                    <span className="text-xs text-blue-200">Secure</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-2 backdrop-blur-sm border border-green-400/30">
                                        <TrendingUp className="w-6 h-6 text-green-300" />
                                    </div>
                                    <span className="text-xs text-blue-200">Growth</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-2 backdrop-blur-sm border border-purple-400/30">
                                        <Smartphone className="w-6 h-6 text-purple-300" />
                                    </div>
                                    <span className="text-xs text-blue-200">Mobile</span>
                                </div>
                            </motion.div>
                            
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.6 }}
                                className="space-y-4"
                            >
                                <Button 
                                    asChild 
                                    size="lg" 
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border-0"
                                >
                                    <CustomLink href="/register">
                                        <span className="flex items-center justify-center space-x-2">
                                            <span>Register Now</span>
                                            <Lock className="w-4 h-4" />
                                        </span>
                                    </CustomLink>
                                </Button>
                                
                                <Button 
                                    asChild 
                                    variant="ghost" 
                                    className="w-full text-blue-200 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-blue-400/30 rounded-xl py-4 transition-all duration-300"
                                >
                                    <CustomLink href="/login">
                                        Already have an account? Log In
                                    </CustomLink>
                                </Button>
                            </motion.div>
                            
                            {/* Trust Indicators */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6, duration: 0.6 }}
                                className="mt-8 pt-6 border-t border-blue-400/20"
                            >
                                <p className="text-xs text-blue-300/70 mb-2">Trusted by thousands of users</p>
                                <div className="flex justify-center space-x-4 text-blue-300/50">
                                    <span className="text-xs">🔒 Bank-level Security</span>
                                    <span className="text-xs">⚡ Instant Transfers</span>
                                    <span className="text-xs">📱 24/7 Support</span>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
