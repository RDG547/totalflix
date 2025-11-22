import { useRef, useState, useEffect, MouseEvent } from 'react';

export function useDragScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const animationFrameRef = useRef<number>();

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    e.preventDefault();
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    lastXRef.current = e.pageX;
    velocityRef.current = 0;
    scrollRef.current.style.cursor = 'grabbing';
    scrollRef.current.style.userSelect = 'none';

    // Cancelar animação de inércia anterior
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging && scrollRef.current && Math.abs(velocityRef.current) > 1) {
      // Aplicar inércia ao soltar
      applyMomentum();
    }
    setIsDragging(false);
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
      scrollRef.current.style.userSelect = 'auto';
    }
  };

  const handleMouseUp = () => {
    if (isDragging && scrollRef.current && Math.abs(velocityRef.current) > 1) {
      // Aplicar inércia ao soltar
      applyMomentum();
    }
    setIsDragging(false);
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
      scrollRef.current.style.userSelect = 'auto';
    }
  };

  const applyMomentum = () => {
    if (!scrollRef.current) return;

    const friction = 0.95;
    const minVelocity = 0.5;

    const animate = () => {
      if (!scrollRef.current || Math.abs(velocityRef.current) < minVelocity) {
        return;
      }

      scrollRef.current.scrollLeft -= velocityRef.current;
      velocityRef.current *= friction;

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2.5; // Aumentado de 2 para 2.5 para mais velocidade

    // Calcular velocidade para inércia
    const currentX = e.pageX;
    velocityRef.current = (currentX - lastXRef.current) * 0.5;
    lastXRef.current = currentX;

    // Detecta se houve movimento significativo
    if (Math.abs(walk) > 5) {
      setHasMoved(true);
    }

    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Previne cliques em links quando está arrastando
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (hasMoved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return {
    scrollRef,
    handleMouseDown,
    handleMouseLeave,
    handleMouseUp,
    handleMouseMove,
    handleClick,
  };
}
