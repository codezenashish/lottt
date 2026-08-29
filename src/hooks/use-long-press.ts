import { useRef, useCallback } from "react";

interface UseLongPressOptions {
  onLongPress: (e: React.SyntheticEvent) => void;
  onClick?: (e: React.SyntheticEvent) => void;
  threshold?: number;
}

export function useLongPress({
  onLongPress,
  onClick,
  threshold = 500,
}: UseLongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback(
    (e: React.SyntheticEvent) => {
      isLongPressRef.current = false;
      if ("touches" in e && (e as React.TouchEvent).touches.length > 0) {
        const touch = (e as React.TouchEvent).touches[0];
        startPosRef.current = { x: touch.clientX, y: touch.clientY };
      } else if ("clientX" in e) {
        const mouse = e as React.MouseEvent;
        startPosRef.current = { x: mouse.clientX, y: mouse.clientY };
      }

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        onLongPress(e);
      }, threshold);
    },
    [onLongPress, threshold]
  );

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const move = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!startPosRef.current) return;
      let currentX = 0;
      let currentY = 0;

      if ("touches" in e && e.touches.length > 0) {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        currentX = (e as React.MouseEvent).clientX;
        currentY = (e as React.MouseEvent).clientY;
      }

      const deltaX = Math.abs(currentX - startPosRef.current.x);
      const deltaY = Math.abs(currentY - startPosRef.current.y);

      // If user moved more than 10px, treat as scroll or drag and cancel long-press
      if (deltaX > 10 || deltaY > 10) {
        cancel();
      }
    },
    [cancel]
  );

  const handleEnd = useCallback(
    (e: React.SyntheticEvent) => {
      cancel();
      if (!isLongPressRef.current && onClick) {
        onClick(e);
      }
    },
    [cancel, onClick]
  );

  return {
    onMouseDown: start,
    onMouseUp: handleEnd,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: handleEnd,
    onTouchMove: move,
    onContextMenu: (e: React.SyntheticEvent) => {
      if (isLongPressRef.current) {
        e.preventDefault();
      }
    },
  };
}
