"use client";

import { useCallback, useRef } from 'react';

export interface SwipeGestureConfig {
  threshold?: number; // Minimum distance for a valid swipe (default: 50)
  velocity?: number; // Minimum velocity for a valid swipe (default: 0.3)
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  disabled?: boolean;
}

export interface SwipeGestureHandlers {
  onPanStart: (event: MouseEvent | TouchEvent | PointerEvent, info: { point: { x: number; y: number } }) => void;
  onPan: (event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number } }) => void;
  onPanEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) => void;
}

export function useSwipeGesture(config: SwipeGestureConfig): SwipeGestureHandlers {
  const {
    threshold = 50,
    velocity = 0.3,
    onSwipeLeft,
    onSwipeRight,
    onSwipeStart,
    onSwipeEnd,
    disabled = false,
  } = config;

  const startX = useRef<number>(0);
  const isSwipingRef = useRef<boolean>(false);

  const onPanStart = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: { point: { x: number; y: number } }) => {
    if (disabled) return;
    
    startX.current = info.point.x;
    isSwipingRef.current = true;
    onSwipeStart?.();
  }, [disabled, onSwipeStart]);

  const onPan = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number } }) => {
    if (disabled || !isSwipingRef.current) return;
    
    // Provide haptic feedback on supported devices
    if ('vibrate' in navigator && Math.abs(info.offset.x) > threshold / 2) {
      navigator.vibrate(1); // Very short vibration
    }
  }, [disabled, threshold]);

  const onPanEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) => {
    if (disabled || !isSwipingRef.current) return;

    const deltaX = info.offset.x;
    const velocityX = info.velocity.x;
    
    isSwipingRef.current = false;
    onSwipeEnd?.();

    // Determine if this is a valid swipe based on distance and velocity
    const isValidSwipe = Math.abs(deltaX) > threshold || Math.abs(velocityX) > velocity;
    
    if (isValidSwipe) {
      if (deltaX > 0 && onSwipeRight) {
        // Swipe right
        onSwipeRight();
        
        // Stronger haptic feedback for successful swipe
        if ('vibrate' in navigator) {
          navigator.vibrate([10, 50, 10]);
        }
      } else if (deltaX < 0 && onSwipeLeft) {
        // Swipe left
        onSwipeLeft();
        
        // Stronger haptic feedback for successful swipe
        if ('vibrate' in navigator) {
          navigator.vibrate([10, 50, 10]);
        }
      }
    }
  }, [disabled, threshold, velocity, onSwipeLeft, onSwipeRight, onSwipeEnd]);

  return {
    onPanStart,
    onPan,
    onPanEnd,
  };
}

// Helper hook for simple left/right swipe detection without framer-motion
export function useBasicSwipeGesture(config: SwipeGestureConfig) {
  const {
    threshold = 50,
    onSwipeLeft,
    onSwipeRight,
    onSwipeStart,
    onSwipeEnd,
    disabled = false,
  } = config;

  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const startTime = useRef<number>(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    startTime.current = Date.now();
    onSwipeStart?.();
  }, [disabled, onSwipeStart]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (disabled) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = touch.clientY - startY.current;
    const deltaTime = Date.now() - startTime.current;

    // Only count as swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      const velocity = Math.abs(deltaX) / deltaTime;
      
      if (velocity > 0.1) { // Minimum velocity threshold
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }
    }
    
    onSwipeEnd?.();
  }, [disabled, threshold, onSwipeLeft, onSwipeRight, onSwipeEnd]);

  return {
    handleTouchStart,
    handleTouchEnd,
  };
}
