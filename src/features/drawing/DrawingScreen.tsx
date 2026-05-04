import { Brush, Check, Eraser, Eye, HelpCircle, Lock, Trash2, Undo2, Wand2 } from 'lucide-react';
import type { DrawingHandlers, Stage, Tool } from './types';
import { drawingColors, uiIcons } from './data';

type DrawingScreenProps = DrawingHandlers & {
  activeStage?: Stage;
  childName: string;
  color: string;
  drawingLocked: boolean;
  gameStarted: boolean;
  progress: number;
  readyForReview: boolean;
  saved: boolean;
  size: number;
  soundEnabled: boolean;
  tool: Tool;
  onColor: (value: string) => void;
  onFinish: () => void;
  onPreview: () => void;
  onSize: (value: number) => void;
  onTool: (value: Tool) => void;
  onShowHelp: () => void;
};

function IconImage({ src }: { src?: string }) {
  return src ? <img className="uiIcon" src={src} alt="" /> : null;
}

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
  onPreview,
  onSize,
  onTool,
  onShowHelp,
}: DrawingScreenProps) {
  return (
    <section className="childLayout">
      <section className="drawingBoard">
        <div className="taskBubble">
          <span>
            <Wand2 size={20} />
          </span>
          <div>
            <p>{childName}, твое задание</p>
            <strong>{activeStage?.prompt}</strong>
          </div>
          <button className="roundHelp" type="button" aria-label="Помощь" onClick={onShowHelp}>
            <HelpCircle size={22} />
          </button>
        </div>

        <div className={`drawingStage ${drawingLocked ? 'isLocked' : ''}`}>
          {activeStage?.src && <img className="stageArt" src={activeStage.src} alt={activeStage.title} />}
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
          <div className="drawHint">
            <Brush size={20} />
            Рисуй здесь
          </div>
          {!gameStarted && !drawingLocked && (
            <div className="readyRibbon waiting">
              Можно потренироваться. Взрослый скоро нажмет старт.
            </div>
          )}
          {drawingLocked && (
            <div className="softOverlay">
              <Lock size={34} />
              <span>Взрослый поставил рисование на паузу</span>
            </div>
          )}
          {readyForReview && (
            <div className="readyRibbon">
              <Check size={20} />
              Рисунок отправлен взрослому
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
          <span>Толстая линия</span>
          <input min="8" max="36" value={size} type="range" onChange={(event) => onSize(Number(event.target.value))} />
        </label>

        <aside className="hintBox">
          <Eye size={20} />
          <div>
            <strong>Подсказка</strong>
            <p>Для детей 5-6 лет лучше рисовать крупно: солнышко, круг, домик, улыбку или звездочку.</p>
          </div>
        </aside>

        <div className="actionStack">
          <button className="secondaryButton" type="button" onClick={undo} disabled={historyCount === 0}>
            <Undo2 size={20} />
            Назад
          </button>
          <button className="secondaryButton" type="button" onClick={clearCanvas}>
            <Trash2 size={20} />
            Очистить
          </button>
          <button className="secondaryButton" type="button" onClick={downloadDrawing}>
            <IconImage src={uiIcons.download} />
            {saved ? 'Сохранено' : 'Сохранить'}
          </button>
          <button className="secondaryButton" type="button" onClick={onPreview}>
            <Eye size={20} />
            Просмотр
          </button>
          <button className="primaryButton" type="button" onClick={onFinish}>
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
