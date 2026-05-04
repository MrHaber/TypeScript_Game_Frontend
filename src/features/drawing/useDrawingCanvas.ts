import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Tool } from './types';

type UseDrawingCanvasOptions = {
  color: string;
  size: number;
  tool: Tool;
  locked: boolean;
  activeStageId?: string;
  backgroundSrc?: string;
  onProgress: (delta: number, snapshot?: string) => void;
};

type Point = { x: number; y: number };

export function useDrawingCanvas({ color, size, tool, locked, activeStageId, backgroundSrc, onProgress }: UseDrawingCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const historyRef = useRef<string[]>([]);
  const lastPointRef = useRef<Point | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(rect.width * ratio));
      const height = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width === width && canvas.height === height) return;

      const snapshot = canvas.width > 1 && canvas.height > 1 ? canvas.toDataURL() : '';
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) return;
      configureContext(context);

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

  function ratio() {
    return window.devicePixelRatio || 1;
  }

  function configureContext(context: CanvasRenderingContext2D) {
    const scale = ratio();
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.miterLimit = 2;
  }

  function getPoint(event: ReactPointerEvent<HTMLCanvasElement> | PointerEvent): Point {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function applyBrush(context: CanvasRenderingContext2D) {
    configureContext(context);
    context.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = tool === 'eraser' ? size * 1.7 : size;
  }

  function startDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas || locked) return;

    event.preventDefault();
    historyRef.current = [...historyRef.current.slice(-9), canvas.toDataURL()];
    drawingRef.current = true;
    lastPointRef.current = getPoint(event);
    setSaved(false);
    drawPoint(lastPointRef.current);
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is not guaranteed in every embedded webview.
    }
  }

  function draw(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || locked) return;
    event.preventDefault();

    const nativeEvent = event.nativeEvent;
    const coalesced = typeof nativeEvent.getCoalescedEvents === 'function' ? nativeEvent.getCoalescedEvents() : [nativeEvent];
    coalesced.forEach((pointerEvent) => drawTo(getPoint(pointerEvent)));
  }

  function drawTo(next: Point) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const last = lastPointRef.current;
    if (!canvas || !context || !last) return;

    applyBrush(context);
    const mid = {
      x: (last.x + next.x) / 2,
      y: (last.y + next.y) / 2,
    };
    context.beginPath();
    context.moveTo(last.x, last.y);
    context.quadraticCurveTo(last.x, last.y, mid.x, mid.y);
    context.stroke();
    lastPointRef.current = next;
  }

  function drawPoint(point: Point | null) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || !point) return;

    applyBrush(context);
    context.beginPath();
    context.arc(point.x, point.y, context.lineWidth / 2, 0, Math.PI * 2);
    context.fill();
  }

  function stopDrawing(event?: ReactPointerEvent<HTMLCanvasElement>) {
    if (drawingRef.current) {
      void getCompositeSnapshot().then((snapshot) => onProgress(10, snapshot));
      setHistoryCount(historyRef.current.length);
    }
    if (event?.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drawingRef.current = false;
    lastPointRef.current = null;
  }

  function clearCanvasPixels(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
    configureContext(context);
  }

  function undo() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const last = historyRef.current[historyRef.current.length - 1];
    if (!canvas || !context || !last) return;

    const image = new window.Image();
    historyRef.current = historyRef.current.slice(0, -1);
    setHistoryCount(historyRef.current.length);
    image.onload = () => {
      const rect = canvas.getBoundingClientRect();
      clearCanvasPixels(context, canvas);
      context.drawImage(image, 0, 0, rect.width, rect.height);
      void getCompositeSnapshot().then((snapshot) => onProgress(-12, snapshot));
    };
    image.src = last;
    setSaved(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    historyRef.current = [...historyRef.current.slice(-9), canvas.toDataURL()];
    setHistoryCount(historyRef.current.length);
    clearCanvasPixels(context, canvas);
    void getCompositeSnapshot().then((snapshot) => onProgress(-100, snapshot));
    setSaved(false);
  }

  function getSnapshot() {
    return canvasRef.current?.toDataURL('image/png') ?? '';
  }

  function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const scale = Math.max(width / sourceWidth, height / sourceHeight);
    const cropWidth = width / scale;
    const cropHeight = height / scale;
    const cropX = (sourceWidth - cropWidth) / 2;
    const cropY = (sourceHeight - cropHeight) / 2;

    context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, width, height);
  }

  async function getCompositeSnapshot() {
    const canvas = canvasRef.current;
    if (!canvas) return '';

    const output = document.createElement('canvas');
    output.width = canvas.width;
    output.height = canvas.height;

    const context = output.getContext('2d');
    if (!context) return getSnapshot();

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    if (backgroundSrc) {
      try {
        const background = await loadImage(backgroundSrc);
        drawCover(context, background, output.width, output.height);
      } catch {
        context.fillStyle = '#fff';
        context.fillRect(0, 0, output.width, output.height);
      }
    } else {
      context.fillStyle = '#fff';
      context.fillRect(0, 0, output.width, output.height);
    }

    context.drawImage(canvas, 0, 0, output.width, output.height);
    return output.toDataURL('image/png');
  }

  async function downloadDrawing() {
    const snapshot = await getCompositeSnapshot();
    if (!snapshot) return;

    const link = document.createElement('a');
    link.href = snapshot;
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
    getSnapshot,
    getCompositeSnapshot,
  };
}
