"use client";

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LogIn } from 'lucide-react';
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
    weight: ['400'],
    subsets: ['latin'],
    variable: "--font-jakarta",
});

gsap.registerPlugin(ScrollTrigger);

const AdaptiveAuthButton = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const buttonRef = useRef(null);
    const textRef = useRef(null);
    const divRef = useRef(null);
    
    // Use refs for animation state to avoid "glitchy" React re-renders during high-frequency scrolls
    const isExpandedRef = useRef(true); 
    const isHoveredRef = useRef(false);

    const isLoggedIn = !!session?.user?.id;

    useEffect(() => {
        // Set a static vertical position once
        gsap.set(divRef.current, { translateY: -80 });
        gsap.set(textRef.current, { opacity: 1, x: 0 });

        const trigger = ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: (self) => {
                const atTop = self.scroll() < 10;
                const atBottom = self.progress > 0.98;

                // Stop scroll-based commands from fighting with the mouse hover
                if (!isHoveredRef.current) {
                    if (atTop || atBottom) {
                        expand();
                    } else {
                        collapse();
                    }
                }
            }
        });

        return () => trigger.kill();
    }, []);

    const expand = () => {
        // Ensure we don't restart if already in expanded state
        if (isExpandedRef.current && gsap.getProperty(buttonRef.current, "width") > 400) return; 
        isExpandedRef.current = true;

        gsap.to(buttonRef.current, {
            width: '350px',
            duration: 0.6,  
            ease: "expo.out",
            overwrite: "auto"
        });

        gsap.to(textRef.current, {
            opacity: 1,
            x: 0,
            duration: 0.4,
            delay: 0.1,
            overwrite: "auto"
        });
    };

    const collapse = () => {
        if (!isExpandedRef.current) return; 
        isExpandedRef.current = false;

        gsap.to(buttonRef.current, {
            width: '120px',
            duration: 0.6,
            ease: "expo.out",
            overwrite: "auto"
        });

        gsap.to(textRef.current, {
            opacity: 0,
            x: 20,
            duration: 0.3,
            overwrite: "auto"
        });
    };

    const handleClick = () => {
        if (isLoggedIn) {
            router.push('/dashboard');
        } else {
            signIn('google', { callbackUrl: '/dashboard' });
        }
    };

    return (
        /* 
           STABLE HIT ZONE: 
           This container is stationary. Hover triggers are on THIS, not the moving button.
        */
        <div 
            className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[100] w-[600px] h-[250px] flex items-end justify-center pointer-events-none pb-10"
            onMouseEnter={() => {
                isHoveredRef.current = true;
                expand();
            }}
            onMouseLeave={() => {
                isHoveredRef.current = false;
                const scrollY = window.scrollY;
                const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                // Return to scroll-based logic
                if (scrollY > 10 && scrollY < maxScroll - 50) {
                    collapse();
                } else {
                    expand();
                }
            }}
        >
            <div 
                ref={divRef} 
                className={`${jakarta.className} flex items-center justify-center pointer-events-none`}
            >
                <button
                    ref={buttonRef}
                    onClick={handleClick}
                    className="pointer-events-auto h-20 bg-[#22c55e] border-4 border-black rounded-full overflow-hidden transition-all group translate-y-20"
                    style={{ width: '350px' }} 
                >
                    <div className="flex flex-col w-full  transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-1/2">
                        {/* Face 1: Normal State */}
                        <div className="h-20 flex items-center   px-4 shrink-0">
                            <div className="flex shrink-0 -space-x-4 mr-4">
                                <div className="w-10 h-10 rounded-full bg-yellow-400 border-2 border-black" />
                                <div className="w-10 h-10 rounded-full bg-pink-400 border-2 border-black" />
                                <div className="w-10 h-10 rounded-full bg-blue-400 border-2 border-black" />
                            </div>

                            <div ref={textRef} className="whitespace-nowrap flex items-center gap-3">
                                <span className="text-xl font-black text-black uppercase tracking-tighter">
                                    {isLoggedIn ? 'Continue' : 'Login to Trader OS'}
                                </span>
                                {isLoggedIn ? <ArrowRight className="w-6 h-6 stroke-[3px]" /> : <LogIn className="w-6 h-6 stroke-[3px]" />}
                            </div>
                        </div>

                        {/* Face 2: Hover (Roll) State */}
                        <div className="h-20 flex items-center px-4 shrink-0 bg-black text-white">
                             <div className="flex shrink-0 -space-x-4 mr-4">
                                <div className="w-10 h-10 rounded-full bg-yellow-400 border-2 border-white" />
                                <div className="w-10 h-10 rounded-full bg-pink-400 border-2 border-white" />
                                <div className="w-10 h-10 rounded-full bg-blue-400 border-2 border-white" />
                            </div>

                            <div className="whitespace-nowrap flex items-center gap-3">
                                <span className="text-xl font-black uppercase tracking-tighter">
                                    {isLoggedIn ? 'Go to Portfolio' : 'Login'}
                                </span>
                                <ArrowRight className="w-6 h-6 stroke-[3px]" />
                            </div>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default AdaptiveAuthButton;
