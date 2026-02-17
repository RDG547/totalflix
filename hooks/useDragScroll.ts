import { useRef, useState, useCallback, useEffect } from 'react';

export function useDragScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  useEffect(() => {
    return () => {
      isDraggingRef.current = false;
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Se clicou em um botão, link ou elemento interativo, não inicia o drag
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('[data-no-drag]')) {
      return;
    }

    if (!scrollRef.current) return;
    if (e.button !== 0) return;
    
    e.preventDefault();
    
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    setIsDragging(true);
    
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
    
    scrollRef.current.style.cursor = 'grabbing';
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
    }
    
    // Delay antes de resetar hasMoved
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 100);
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    
    e.preventDefault();
    
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    
    if (Math.abs(walk) > 5) {
      hasMovedRef.current = true;
    }
    
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('[data-no-drag]')) {
      return;
    }

    if (!scrollRef.current) return;
    
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    setIsDragging(true);
    
    startXRef.current = e.touches[0].pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    
    if (Math.abs(walk) > 5) {
      hasMovedRef.current = true;
    }
    
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 100);
  }, []);

  // Previne clicks em links quando arrastou significativamente
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return {
    scrollRef,
    isDragging,
    handleMouseDown,
    handleMouseLeave,
    handleMouseUp,
    handleMouseMove,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleClick,
  };
}
