"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";

import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
    weight: ['400'],
    subsets: ['latin'],
    variable: "--font-jakarta",
});

export default function Hero() {
    const containerRef = useRef(null);
    const logoRef = useRef(null);
    const dotRef = useRef(null);
    const paraRef = useRef(null);
    const traderCharsRef = useRef([]);
    const osCharsRef = useRef([]);

    const traderStr = "Trader";
    const osStr = "OS";

    useEffect(() => {
        const tl = gsap.timeline();

        // 1. Initial states
        gsap.set([traderCharsRef.current, osCharsRef.current, logoRef.current, paraRef.current], { 
            opacity: 0,
            y: 10
        });
        gsap.set(logoRef.current, { width: 0, scale: 0, y: 50 });
        
        // Dot starts far left and is visible
        gsap.set(dotRef.current, { x: -600, opacity: 1 });

        // 2. The Trace & Reveal Sequence
        
        // Dot starts moving from far left
        tl.to(dotRef.current, {
            x: -250, // Moving towards 'Trader'
            duration: 0.4,
            ease: "none"
        })
        // Reveal 'Trader' characters as dot passes
        .to(traderCharsRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.1,
            ease: "power2.out",
            onStart: () => {
                // Keep dot moving alongside letters
                gsap.to(dotRef.current, { x: -100, duration: 0.6, ease: "none" });
            }
        })
        // 3. Logo Pop + Side Text Slide as dot crosses middle
        .to(logoRef.current, {
            width: "auto",
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.8,
            ease: "back.out(1.7)",
            onStart: () => {
                // Move dot past the logo
                gsap.to(dotRef.current, { x: 50, duration: 0.4, ease: "none" });
            }
        }, "-=0.2")
        // Reveal 'OS' characters
        .to(osCharsRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.1,
            ease: "power2.out",
            onStart: () => {
                // Move dot to the end
                gsap.to(dotRef.current, { x: 0, duration: 0.3, ease: "power2.out" });
            }
        }, "-=0.1")
        
        // 4. The Playful Bounce
        .to(dotRef.current, {
            y: -35,
            duration: 0.4,
            ease: "power2.out"
        })
        .to(dotRef.current, {
            y: 0,
            duration: 0.6,
            ease: "bounce.out"
        })

        // 5. Paragraph Reveal (Last)
        .to(paraRef.current, {
            opacity: 1,
            y: 0,
            duration: 1,
            startAt: { y: 20 },
            ease: "power3.out"
        }, "+=0.2");

        return () => tl.kill();
    }, []);

    return (
        <div ref={containerRef} className={`h-[70vh] items-center justify-center flex flex-col ${jakarta.className} overflow-hidden`}>
            <div className="flex flex-col items-center justify-center w-full relative">
                {/* Paragraph Above */}
                <div ref={paraRef}>
                    <h2 className="text-black text-2xl text-center font-bold mb-12">
                        Optimize every Trade. <br />Minimize every tax.
                    </h2>
                </div>

                {/* Main Heading */}
                <h1 className="flex items-center justify-center text-9xl font-black tracking-tighter">
                    {/* Trader Chars */}
                    <div className="flex">
                        {traderStr.split("").map((char, i) => (
                            <span 
                                key={i} 
                                ref={el => traderCharsRef.current[i] = el}
                                className="inline-block"
                            >
                                {char}
                            </span>
                        ))}
                    </div>
                    
                    <div ref={logoRef} className="flex items-center justify-center overflow-hidden mx-4">
                        <Image 
                            src={'/Logo4.png'} 
                            className="rounded-xl shadow-2xl" 
                            height={120} 
                            width={120} 
                            alt="logo"
                            style={{ minWidth: '120px' }}
                        />
                    </div>

                    {/* OS Chars + Dot */}
                    <div className="flex items-center">
                        {osStr.split("").map((char, i) => (
                            <span 
                                key={i} 
                                ref={el => osCharsRef.current[i] = el}
                                className="inline-block"
                            >
                                {char}
                            </span>
                        ))}
                        <span ref={dotRef} className="inline-block">.</span>
                    </div>
                </h1>
            </div>
        </div>
    );
}