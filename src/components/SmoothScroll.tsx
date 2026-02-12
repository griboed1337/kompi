"use client";

import { ReactLenis } from "lenis/react";
import { ReactNode, useState, useRef } from "react";

interface SmoothScrollProps {
    children: ReactNode;
    root?: boolean;
    options?: any;
    className?: string;
}

export const SmoothScroll = ({ children, root = true, className = "" }: SmoothScrollProps) => {
    if (root) {
        return (
            <ReactLenis
                root
                options={{
                    lerp: 0.18,
                    duration: 0.72,
                    wheelMultiplier: 0.8,
                    smoothWheel: true,
                }}
            >
                {children}
            </ReactLenis>
        );
    }

    return (
        <div
            className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent ${className}`}
            data-lenis-prevent="true"
        >
            {children}
        </div>
    );
};