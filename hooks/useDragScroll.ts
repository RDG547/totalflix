import { useCallback, useEffect, useRef, type MouseEvent, type PointerEvent } from 'react';

const DRAG_THRESHOLD = 4;
const MIN_MOMENTUM_VELOCITY = 0.02;

export function useDragScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const distanceRef = useRef(0);
  const suppressClickRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const previousStylesRef = useRef({ scrollBehavior: '', scrollSnapType: '', userSelect: '', cursor: '' });

  const stopMomentum = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const restoreStyles = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const previous = previousStylesRef.current;
    container.style.scrollBehavior = previous.scrollBehavior;
    container.style.scrollSnapType = previous.scrollSnapType;
    container.style.userSelect = previous.userSelect;
    container.style.cursor = previous.cursor;
  }, []);

  const startMomentum = useCallback(() => {
    const container = scrollRef.current;
    if (
      !container
      || Math.abs(velocityRef.current) < MIN_MOMENTUM_VELOCITY
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      restoreStyles();
      return;
    }

    let previousTime = performance.now();
    const animate = (time: number) => {
      const currentContainer = scrollRef.current;
      if (!currentContainer || Math.abs(velocityRef.current) < MIN_MOMENTUM_VELOCITY) {
        animationFrameRef.current = null;
        restoreStyles();
        return;
      }

      const elapsed = Math.min(time - previousTime, 32);
      previousTime = time;
      const before = currentContainer.scrollLeft;
      currentContainer.scrollLeft += velocityRef.current * elapsed;
      velocityRef.current *= Math.pow(0.94, elapsed / 16.67);

      if (currentContainer.scrollLeft === before) {
        animationFrameRef.current = null;
        restoreStyles();
        return;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [restoreStyles]);

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;

    stopMomentum();
    pointerIdRef.current = event.pointerId;
    lastXRef.current = event.clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    distanceRef.current = 0;
    suppressClickRef.current = false;
    previousStylesRef.current = {
      scrollBehavior: container.style.scrollBehavior,
      scrollSnapType: container.style.scrollSnapType,
      userSelect: container.style.userSelect,
      cursor: container.style.cursor,
    };
    container.style.scrollBehavior = 'auto';
    container.style.scrollSnapType = 'none';
    container.style.userSelect = 'none';
    container.style.cursor = 'grabbing';
    container.setPointerCapture(event.pointerId);
  }, [stopMomentum]);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container || pointerIdRef.current !== event.pointerId) return;

    const now = performance.now();
    const deltaX = event.clientX - lastXRef.current;
    const elapsed = Math.max(now - lastTimeRef.current, 1);
    const deltaScroll = -deltaX;

    distanceRef.current += Math.abs(deltaX);
    if (distanceRef.current >= DRAG_THRESHOLD) {
      suppressClickRef.current = true;
      event.preventDefault();
    }

    container.scrollLeft += deltaScroll;
    const instantVelocity = deltaScroll / elapsed;
    velocityRef.current = velocityRef.current * 0.65 + instantVelocity * 0.35;
    lastXRef.current = event.clientX;
    lastTimeRef.current = now;
  }, []);

  const finishDrag = useCallback((event: PointerEvent<HTMLDivElement>, withMomentum: boolean) => {
    const container = scrollRef.current;
    if (!container || pointerIdRef.current !== event.pointerId) return;

    if (container.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }
    pointerIdRef.current = null;
    container.style.userSelect = previousStylesRef.current.userSelect;
    container.style.cursor = previousStylesRef.current.cursor;

    if (withMomentum && suppressClickRef.current) startMomentum();
    else restoreStyles();
  }, [restoreStyles, startMomentum]);

  const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    finishDrag(event, true);
  }, [finishDrag]);

  const handlePointerCancel = useCallback((event: PointerEvent<HTMLDivElement>) => {
    finishDrag(event, false);
  }, [finishDrag]);

  const handleClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  }, []);

  useEffect(() => () => {
    stopMomentum();
    restoreStyles();
  }, [restoreStyles, stopMomentum]);

  return {
    scrollRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleClick,
  };
}
