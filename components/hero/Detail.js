"use client";

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Detail = () => {
    const containerRef = useRef(null);
    const cardRef = useRef(null);
    const logoRef = useRef(null);
    const videoRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 95%", // Start very early to handle the negative margin overlap
                    end: "+=2200", 
                    scrub: 1,      
                    pin: true,     
                    pinSpacing: true,
                    anticipatePin: 1,
                }
            });

            // Initial Card Setup: Reset y to 0 so it aligns with the negative margin pull-up
            gsap.set(cardRef.current, {
                width: "70vw",
                height: "60vh",
                borderRadius: "60px",
                scale: 0.8,
                y: 0, 
            });

            // 1. PHASE ONE: Slide Up slightly and hold for a bit
            tl.to(cardRef.current, {
                scale: 1,
                duration: 0.8,
                ease: "power2.out"
            })
            // 2. PHASE TWO: Full Screen Expansion
            .to(cardRef.current, {
                width: "100vw",
                height: "100vh",
                borderRadius: "0px",
                duration: 2,
                ease: "power2.inOut"
            })
            // 3. PHASE THREE: Content Reveal
            .to(logoRef.current, {
                opacity: 0,
                scale: 0.9,
                duration: 0.5
            })
            .to(videoRef.current, {
                opacity: 1,
                duration: 1,
                onStart: () => {
                    const video = videoRef.current?.querySelector('video');
                    if (video) video.play().catch(e => console.log("Video play failed:", e));
                }
            }, "-=0.3");

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section 
            ref={containerRef} 
            className="relative w-full min-h-screen bg-transparent z-50 pointer-events-none flex items-center justify-center p-0 m-0"
        >
            {/* The Expanding Card */}
            <div 
                ref={cardRef} 
                className="relative bg-white border-4 border-black/5 overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex items-center justify-center pointer-events-auto"
            >
                {/* Face 1: Logo (Visible initially) */}
                <div 
                    ref={logoRef}
                    className="absolute inset-0 flex flex-col items-center justify-center z-10 p-10 bg-white"
                >
                    <div className="p-12 rounded-[50px] bg-slate-50 border-2 border-slate-100 flex items-center justify-center shadow-inner">
                        <Image 
                            src={'/TraderOS_Logo_Final.png'} 
                            height={240} 
                            width={240} 
                            alt='Trader OS Logo'
                            className="w-56 h-56 object-contain"
                        /> 
                    </div>
                </div>

                {/* Face 2: Video Reveal */}
                <div 
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full opacity-0 z-0 bg-black"
                >
                    <video 
                        muted 
                        loop 
                        playsInline 
                        className="w-full h-full object-cover"
                    >
                        {/* Reliable stock trading video source */}
                        <source src="https://assets.mixkit.co/videos/preview/mixkit-stock-market-data-on-a-digital-screen-34356-large.mp4" type="video/mp4" />
                    </video>

                    {/* Dashboard Detail Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-16 left-16 text-white max-w-2xl">
                        <h3 className="text-5xl font-black uppercase tracking-tighter mb-4 decoration-emerald-500 underline">System Active</h3>
                        <p className="text-xl text-slate-300 font-medium">Real-time valuation engine operational. Monitoring global exchange liquidity.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Detail;