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
                    lerp: 0.12,
                    duration: 1.2,
                    wheelMultiplier: 1,
                    smoothWheel: true,
                }}
            >
                {children}
            </ReactLenis>
        );
    }

    return (
        <ReactLenis
            root={false}
            options={{
                lerp: 0.1,
                duration: 1.2,
                smoothWheel: true,
                syncTouch: true,
            }}
            className={`flex-1 overflow-y-auto overflow-x-hidden ${className}`}
            data-lenis-prevent
        >
            <div className="min-h-full w-full">
                {children}
            </div>
        </ReactLenis>
    );
};