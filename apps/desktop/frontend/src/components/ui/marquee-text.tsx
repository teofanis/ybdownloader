import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface MarqueeTextProps {
  children: React.ReactNode;
  className?: string;
  speed?: number; // pixels per second
}

export function MarqueeText({
  children,
  className,
  speed = 30,
}: MarqueeTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [overflow, setOverflow] = useState(0);
  const [offset, setOffset] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Check if text overflows container
  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const textWidth = textRef.current.scrollWidth;
        setOverflow(Math.max(0, textWidth - containerWidth));
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [children]);

  // Animate on hover
  const animate = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      setOffset((prev) => {
        const newOffset = prev + speed * deltaTime;
        // Stop at the end (with a small buffer for padding)
        if (newOffset >= overflow + 8) {
          return overflow + 8;
        }
        return newOffset;
      });

      animationRef.current = requestAnimationFrame(animate);
    },
    [overflow, speed]
  );

  useEffect(() => {
    if (isHovered && overflow > 0) {
      lastTimeRef.current = null;
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      // Smoothly reset to start
      setOffset(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHovered, overflow, animate]);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <span
      ref={containerRef}
      className={cn("inline-block overflow-hidden", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        ref={textRef}
        className="inline-block whitespace-nowrap transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(-${offset}px)`,
          transitionDuration: isHovered ? "0ms" : "300ms",
        }}
      >
        {children}
      </span>
    </span>
  );
}
