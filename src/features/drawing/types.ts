import type { PointerEvent as ReactPointerEvent, ReactNode, RefObject } from 'react';

export type Role = 'login' | 'child' | 'parent';
export type Tool = 'brush' | 'eraser';
export type ApprovalStatus = 'drawing' | 'waiting' | 'approved' | 'hidden';
export type GameMode = 'drawing' | 'quiz' | 'mixed' | 'free';

export type Stage = {
  id: string;
  title: string;
  childTitle: string;
  prompt: string;
  parentNote: string;
  src: string;
  score: number;
  mode: GameMode;
};

export type Player = {
  id: number;
  name: string;
  age: number;
  progress: number;
  status: ApprovalStatus;
  rating?: number;
  stageId?: string;
  drawingData?: string | null;
};

export type ParentSettings = {
  requireApproval: boolean;
  galleryEnabled: boolean;
  drawingLocked: boolean;
  soundEnabled: boolean;
  timer: number;
};

export type DrawingHandlers = {
  canvasRef: RefObject<HTMLCanvasElement>;
  historyCount: number;
  startDrawing: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  draw: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  stopDrawing: (event?: ReactPointerEvent<HTMLCanvasElement>) => void;
  undo: () => void;
  clearCanvas: () => void;
  downloadDrawing: () => void | Promise<void>;
  getSnapshot: () => string;
  getCompositeSnapshot: () => Promise<string>;
};

export type PanelProps = {
  title: string;
  hint?: string;
  className?: string;
  children: ReactNode;
};
