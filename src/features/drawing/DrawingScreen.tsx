import type { ChangeEvent } from 'react';
import { Brush, Check, Clock3, Download, Eraser, Eye, HelpCircle, Lock, Play, Trash2, Undo2, Upload, Wand2 } from 'lucide-react';
import type { DrawingHandlers, Stage, Tool } from './types';
import { drawingColors } from './data';

type DrawingScreenProps = DrawingHandlers & {
  activeStage?: Stage;
  childName: string;
  color: string;
  drawingLocked: boolean;
  gameStarted: boolean;
  progress: number;
  readyForReview: boolean;
  memoryActive: boolean;
  memorySeconds: number;
  saved: boolean;
  size: number;
  soundEnabled: boolean;
  tool: Tool;
  onColor: (value: string) => void;
  onFinish: () => void | Promise<void>;
  onImportImage: (dataUrl: string) => void;
  onPreview: () => void;
  onSkipMemory: () => void;
  onSize: (value: number) => void;
  onTool: (value: Tool) => void;
  onShowHelp: () => void;
};

export function DrawingScreen({
  activeStage,
  canvasRef,
  childName,
  color,
  drawingLocked,
  gameStarted,
  historyCount,
  progress,
  readyForReview,
  memoryActive,
  memorySeconds,
  saved,
  size,
  soundEnabled,
  tool,
  clearCanvas,
  downloadDrawing,
  draw,
  startDrawing,
  stopDrawing,
  undo,
  onColor,
  onFinish,
  onImportImage,
  onPreview,
  onSkipMemory,
  onSize,
  onTool,
  onShowHelp,
}: DrawingScreenProps) {
  function normalizeImportedImage(dataUrl: string) {
    return new Promise<string>((resolve) => {
      const image = new Image();
      image.onload = () => {
        const maxSide = 1600;
        const sourceWidth = image.naturalWidth || image.width;
        const sourceHeight = image.naturalHeight || image.height;
        const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
        const width = Math.max(1, Math.round(sourceWidth * scale));
        const height = Math.max(1, Math.round(sourceHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) {
          resolve(dataUrl);
          return;
        }
        context.fillStyle = '#fff';
        context.fillRect(0, 0, width, height);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      image.onerror = () => resolve(dataUrl);
      image.src = dataUrl;
    });
  }

  function handleImportImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        void normalizeImportedImage(reader.result).then(onImportImage);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <section className="childLayout">
      <section className="drawingBoard">
        <div className="taskBubble">
          <span>
            <Wand2 size={20} />
          </span>
          <div>
            <p>{childName}, твое задание</p>
            <strong>{memoryActive ? 'Смотри внимательно: через минуту арт исчезнет, и ты нарисуешь его по памяти.' : activeStage?.prompt}</strong>
          </div>
          <button className="roundHelp" type="button" aria-label="Помощь" onClick={onShowHelp}>
            <HelpCircle size={22} />
          </button>
        </div>

        <div className={`drawingStage ${drawingLocked ? 'isLocked' : ''} ${memoryActive ? 'isMemoryPhase' : ''}`}>
          {memoryActive && activeStage?.src && <img className="stageArt" src={activeStage.src} alt={activeStage.title} />}
          <canvas
            ref={canvasRef}
            className="drawingCanvas"
            aria-label="Большой холст для рисования"
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onPointerLeave={stopDrawing}
          />
          {!readyForReview && !memoryActive && (
            <div className="drawHint">
              <Brush size={20} />
              Рисуй здесь
            </div>
          )}
          {memoryActive && (
            <div className="memoryOverlay">
              <span>
                <Clock3 size={24} />
                {memorySeconds} с
              </span>
              <strong>Запомни картинку</strong>
              <p>Посмотри на героя, формы, цвета и крупные детали. Потом будет чистый холст.</p>
              <button className="primaryButton" type="button" onClick={onSkipMemory}>
                Я запомнил
              </button>
            </div>
          )}
          {!gameStarted && (
            <div className="softOverlay">
              <Play size={34} />
              <span>Родитель скоро начнет занятие</span>
            </div>
          )}
          {readyForReview && (
            <div className="softOverlay reviewOverlay">
              <Check size={34} />
              <span>Ваш рисунок проверяется</span>
            </div>
          )}
          {gameStarted && drawingLocked && !readyForReview && !memoryActive && (
            <div className="softOverlay">
              <Lock size={34} />
              <span>Родитель остановил рисование</span>
            </div>
          )}
        </div>

        <div className="progressRow">
          <span>Мой рисунок</span>
          <div className="progressTrack">
            <span style={{ width: `${Math.max(4, progress)}%` }} />
          </div>
          <strong>{progress}%</strong>
        </div>
      </section>

      <aside className="kidTools">
        <div className="toolBlock">
          <p className="eyebrow">Чем рисуем?</p>
          <div className="bigToggle">
            <button className={tool === 'brush' ? 'isSelected' : ''} type="button" onClick={() => onTool('brush')}>
              <Brush size={22} />
              Кисть
            </button>
            <button className={tool === 'eraser' ? 'isSelected' : ''} type="button" onClick={() => onTool('eraser')}>
              <Eraser size={22} />
              Ластик
            </button>
          </div>
        </div>

        <div className="toolBlock">
          <p className="eyebrow">Цвет</p>
          <div className="paletteGrid">
            {drawingColors.map((item) => (
              <button
                key={item}
                className={item === color ? 'swatch isSelected' : 'swatch'}
                style={{ background: item }}
                type="button"
                aria-label={`Цвет ${item}`}
                onClick={() => onColor(item)}
              />
            ))}
          </div>
        </div>

        <label className="sizeControl">
          <span>Толщина линии</span>
          <input min="3" max="18" value={size} type="range" onChange={(event) => onSize(Number(event.target.value))} />
        </label>

        <aside className="hintBox">
          <Eye size={20} />
          <div>
            <strong>Подсказка</strong>
            <p>Сначала запомни арт, потом рисуй по памяти. Если рисуешь на бумаге, можно загрузить фото листа.</p>
          </div>
        </aside>

        <div className="actionStack">
          <button className="secondaryButton" type="button" onClick={undo} disabled={historyCount === 0 || readyForReview || memoryActive}>
            <Undo2 size={20} />
            Назад
          </button>
          <button className="secondaryButton" type="button" onClick={clearCanvas} disabled={readyForReview || memoryActive}>
            <Trash2 size={20} />
            Очистить
          </button>
          <label className={`secondaryButton uploadButton ${readyForReview || memoryActive ? 'isDisabled' : ''}`}>
            <Upload size={20} />
            Загрузить фото
            <input type="file" accept="image/*" onChange={handleImportImage} disabled={readyForReview || memoryActive} />
          </label>
          <button className="secondaryButton" type="button" onClick={downloadDrawing} disabled={memoryActive}>
            <Download size={20} />
            {saved ? 'Сохранено' : 'Сохранить'}
          </button>
          <button className="secondaryButton" type="button" onClick={onPreview}>
            <Eye size={20} />
            Просмотр
          </button>
          <button className="primaryButton" type="button" onClick={onFinish} disabled={readyForReview || memoryActive}>
            <Check size={20} />
            Готово
          </button>
        </div>

        <div className="miniStatus">
          <span>{soundEnabled ? 'Звук включен' : 'Звук выключен'}</span>
        </div>
      </aside>
    </section>
  );
}
