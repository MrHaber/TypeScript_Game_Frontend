import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Tool } from './types';

type UseDrawingCanvasOptions = {
  color: string;
  size: number;
  tool: Tool;
  locked: boolean;
  activeStageId?: string;
  onProgress: (delta: number) => void;
};

export function useDrawingCanvas({ color, size, tool, locked, activeStageId, onProgress }: UseDrawingCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const historyRef = useRef<string[]>([]);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(rect.width * ratio));
      const height = Math.max(1, Math.round(rect.height * ratio));
      const shouldResize = canvas.width !== width || canvas.height !== height;
      const snapshot = shouldResize && canvas.width > 1 && canvas.height > 1 ? canvas.toDataURL() : '';

      if (shouldResize) {
        canvas.width = width;
        canvas.height = height;
      }

      const context = canvas.getContext('2d');
      if (!context) return;

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineCap = 'round';
      context.lineJoin = 'round';

      if (snapshot) {
        const image = new window.Image();
        image.onload = () => context.drawImage(image, 0, 0, rect.width, rect.height);
        image.src = snapshot;
      }
    };

    const observer = new ResizeObserver(resize);
    resize();
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [activeStageId]);

  function getPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function startDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas || locked) return;

    historyRef.current = [...historyRef.current.slice(-9), canvas.toDataURL()];
    drawingRef.current = true;
    lastPointRef.current = getPoint(event);
    setSaved(false);
    canvas.setPointerCapture(event.pointerId);
  }

  function draw(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const last = lastPointRef.current;
    if (!canvas || !context || !drawingRef.current || !last || locked) return;

    const next = getPoint(event);
    context.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    context.strokeStyle = color;
    context.lineWidth = tool === 'eraser' ? size * 1.6 : size;
    context.beginPath();
    context.moveTo(last.x, last.y);
    context.lineTo(next.x, next.y);
    context.stroke();
    lastPointRef.current = next;
  }

  function stopDrawing() {
    if (drawingRef.current) {
      onProgress(10);
      setHistoryCount(historyRef.current.length);
    }
    drawingRef.current = false;
    lastPointRef.current = null;
  }

  function undo() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const last = historyRef.current[historyRef.current.length - 1];
    if (!canvas || !context || !last) return;

    const image = new window.Image();
    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
    };
    image.src = last;
    historyRef.current = historyRef.current.slice(0, -1);
    setHistoryCount(historyRef.current.length);
    onProgress(-12);
    setSaved(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    historyRef.current = [...historyRef.current.slice(-9), canvas.toDataURL()];
    setHistoryCount(historyRef.current.length);
    context.clearRect(0, 0, canvas.width, canvas.height);
    onProgress(-100);
    setSaved(false);
  }

  function downloadDrawing() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'uchi-drawing.png';
    link.click();
    setSaved(true);
  }

  return {
    canvasRef,
    historyCount,
    saved,
    startDrawing,
    draw,
    stopDrawing,
    undo,
    clearCanvas,
    downloadDrawing,
  };
}
