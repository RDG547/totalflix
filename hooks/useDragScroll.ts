import { useRef, useState, useCallback, useEffect } from 'react';

export function useDragScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  
  // Use refs para valores que não precisam triggerar re-render
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    
    // Só permite drag com botão esquerdo
    if (e.button !== 0) return;
    
    // Previne comportamento padrão de drag do browser
    e.preventDefault();
    
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    setIsDragging(true);
    setHasMoved(false);
    
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
    
    // Adiciona classe para cursor
    scrollRef.current.style.cursor = 'grabbing';
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    setIsDragging(false);
    
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
    }
    
    // Delay para resetar hasMoved (permite click após drag)
    setTimeout(() => {
      hasMovedRef.current = false;
      setHasMoved(false);
    }, 50);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    setIsDragging(false);
    
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
    }
    
    setTimeout(() => {
      hasMovedRef.current = false;
      setHasMoved(false);
    }, 50);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    
    e.preventDefault();
    
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5; // Multiplicador de velocidade
    
    // Detecta movimento significativo
    if (Math.abs(walk) > 3) {
      hasMovedRef.current = true;
      setHasMoved(true);
    }
    
    // Aplica scroll diretamente (mais performático que setState)
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  }, []);

  // Touch events para mobile
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    setIsDragging(true);
    setHasMoved(false);
    
    startXRef.current = e.touches[0].pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    
    if (Math.abs(walk) > 3) {
      hasMovedRef.current = true;
      setHasMoved(true);
    }
    
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    
    setTimeout(() => {
      hasMovedRef.current = false;
      setHasMoved(false);
    }, 50);
  }, []);

  // Previne clicks em links quando arrastou
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (hasMovedRef.current || hasMoved) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [hasMoved]);

  return {
    scrollRef,
    isDragging,
    hasMoved,
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
