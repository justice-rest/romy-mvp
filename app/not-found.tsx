'use client';

import { useEffect, useMemo,useRef } from 'react';
import Link from 'next/link';

import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  const gridRef = useRef<HTMLDivElement>(null);

  // Generate grid cells with random properties
  const gridCells = useMemo(() => {
    const cols = 20;
    const rows = 10;
    const cells: React.ReactNode[] = [];
    
    for (let i = 0; i < cols * rows; i++) {
      const grade = Math.floor(Math.random() * 12 - 6);
      const opacity = Math.min(Math.random(), 0.2);
      const hue = Math.floor(Math.random() * 30);
      
      cells.push(
        <div
          key={i}
          style={{
            '--grade': grade,
            '--opacity': opacity,
            '--hue': hue,
          } as React.CSSProperties}
        >
          +
        </div>
      );
    }
    
    return cells;
  }, []);

  useEffect(() => {
    if (!gridRef.current) return;

    const grid = gridRef.current;
    grid.style.setProperty('--cols', '20');
    grid.style.setProperty('--rows', '10');

    // Handle touch devices
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
      const handlePointerMove = (event: PointerEvent) => {
        const hovered = document.querySelector('[data-hover]');
        hovered?.removeAttribute('data-hover');
        
        const target = document.elementFromPoint(event.clientX, event.clientY);
        if (target && grid.contains(target as Node)) {
          (target as HTMLElement).dataset.hover = 'true';
        }
      };

      const handlePointerLeave = () => {
        const hovered = document.querySelector('[data-hover]');
        hovered?.removeAttribute('data-hover');
      };

      grid.addEventListener('pointermove', handlePointerMove, true);
      grid.addEventListener('pointerleave', handlePointerLeave, true);

      return () => {
        grid.removeEventListener('pointermove', handlePointerMove, true);
        grid.removeEventListener('pointerleave', handlePointerLeave, true);
      };
    }
  }, []);

  return (
    <div className="flex flex-col font-sans items-center justify-center min-h-screen bg-background text-foreground p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-4xl w-full"
      >
        <div className="mb-6 flex justify-center">
          <div ref={gridRef} className="not-found-grid w-full max-w-[600px] aspect-square">
            {gridCells}
          </div>
        </div>

        <div className="flex justify-center">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft size={18} />
              <span>Return to home</span>
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

