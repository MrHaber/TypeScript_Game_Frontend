import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import {
  Award,
  Brush,
  Check,
  ChevronRight,
  Clock3,
  Download,
  Eraser,
  Eye,
  HelpCircle,
  Lock,
  Palette,
  Play,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Star,
  Trash2,
  Undo2,
  Users,
  Wand2,
} from 'lucide-react';

type Role = 'child' | 'parent';
type Tool = 'brush' | 'eraser';
type ApprovalStatus = 'waiting' | 'approved' | 'hidden';

type Stage = {
  id: string;
  title: string;
  childTitle: string;
  prompt: string;
  parentNote: string;
  src: string;
  score: number;
};

type Player = {
  id: number;
  name: string;
  progress: number;
  status: ApprovalStatus;
};

const imageModules = import.meta.glob('../Images/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

const colors = ['#765FDE', '#FF6170', '#87D34C', '#75C7FF', '#FFC388', '#2F2F45'];

const playersSeed: Player[] = [
  { id: 1, name: 'Миша', progress: 0, status: 'waiting' },
  { id: 2, name: 'Ника', progress: 30, status: 'approved' },
  { id: 3, name: 'Руслан', progress: 60, status: 'waiting' },
];

function getAsset(part: string) {
  const entry = Object.entries(imageModules).find(([path]) => path.toLowerCase().includes(part.toLowerCase()));
  return entry?.[1] ?? Object.values(imageModules)[0] ?? '';
}

function buildStages(): Stage[] {
  return [
    {
      id: 'forest',
      title: 'Лесная прогулка',
      childTitle: 'Синий герой в лесу',
      prompt: 'Дорисуй другу смешной предмет или дорожку.',
      parentNote: 'Спокойный фон: крупный герой, много места для первых линий.',
      src: getAsset('ука'),
      score: 96,
    },
    {
      id: 'island',
      title: 'Остров сокровищ',
      childTitle: 'Пиратский остров',
      prompt: 'Нарисуй клад, кораблик или смешного помощника.',
      parentNote: 'Хорошо подходит для свободного задания и короткого рассказа.',
      src: getAsset('Illustration343'),
      score: 91,
    },
    {
      id: 'space',
      title: 'Космос',
      childTitle: 'Космическое небо',
      prompt: 'Добавь звезды, планету или ракету.',
      parentNote: 'Яркий фон для простых форм: круги, линии, точки.',
      src: getAsset('чч'),
      score: 88,
    },
    {
      id: 'reward',
      title: 'Финальная награда',
      childTitle: 'Веселая награда',
      prompt: 'Укрась экран звездочками и конфетти.',
      parentNote: 'Экран для завершения занятия и поощрения ребенка.',
      src: getAsset('Illustration (2)'),
      score: 84,
    },
  ].filter((stage) => stage.src);
}

export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const historyRef = useRef<string[]>([]);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const stages = useMemo(buildStages, []);
  const [role, setRole] = useState<Role>('child');
  const [selectedStageId, setSelectedStageId] = useState(stages[0]?.id ?? '');
  const [tool, setTool] = useState<Tool>('brush');
  const [color, setColor] = useState(colors[0]);
  const [size, setSize] = useState(18);
  const [progress, setProgress] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [timer, setTimer] = useState(5);
  const [requireApproval, setRequireApproval] = useState(true);
  const [galleryEnabled, setGalleryEnabled] = useState(false);
  const [drawingLocked, setDrawingLocked] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [players, setPlayers] = useState<Player[]>(playersSeed);
  const [showChildTour, setShowChildTour] = useState(() => localStorage.getItem('uchi-child-tour') !== 'done');
  const [showParentTour, setShowParentTour] = useState(() => localStorage.getItem('uchi-parent-tour') !== 'done');

  const activeStage = stages.find((stage) => stage.id === selectedStageId) ?? stages[0];
  const selectedPlayer = players[0];

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
  }, [role, activeStage?.id]);

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
    if (!canvas || drawingLocked) return;

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
    if (!canvas || !context || !drawingRef.current || !last || drawingLocked) return;

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
      setProgress((value) => Math.min(100, value + 10));
      setPlayers((current) => current.map((player, index) => (index === 0 ? { ...player, progress: Math.min(100, player.progress + 10) } : player)));
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
    setProgress((value) => Math.max(0, value - 12));
    setSaved(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    historyRef.current = [...historyRef.current.slice(-9), canvas.toDataURL()];
    setHistoryCount(historyRef.current.length);
    context.clearRect(0, 0, canvas.width, canvas.height);
    setProgress(0);
    setPlayers((current) => current.map((player, index) => (index === 0 ? { ...player, progress: 0, status: 'waiting' } : player)));
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

  function setApproval(status: ApprovalStatus) {
    setPlayers((current) => current.map((player, index) => (index === 0 ? { ...player, status } : player)));
  }

  function finishChildTour() {
    localStorage.setItem('uchi-child-tour', 'done');
    setShowChildTour(false);
  }

  function finishParentTour() {
    localStorage.setItem('uchi-parent-tour', 'done');
    setShowParentTour(false);
  }

  return (
    <main className="appShell">
      <header className="topbar">
        <button className="brandButton" type="button" onClick={() => setRole('child')}>
          <span className="brandMark">У</span>
          <span>Рисовашка</span>
        </button>

        <div className="roleSwitch" aria-label="Выбор экрана">
          <button className={role === 'child' ? 'isSelected' : ''} type="button" onClick={() => setRole('child')}>
            Ребенок
          </button>
          <button className={role === 'parent' ? 'isSelected' : ''} type="button" onClick={() => setRole('parent')}>
            Хост
          </button>
        </div>

        <div className="sessionBadges">
          <span>
            <Clock3 size={18} />
            {timer} мин
          </span>
          <span>
            <Star size={18} />
            {progress}%
          </span>
        </div>
      </header>

      {role === 'child' ? (
        <ChildDrawingScreen
          activeStage={activeStage}
          color={color}
          drawingLocked={drawingLocked}
          gameStarted={gameStarted}
          historyCount={historyCount}
          progress={progress}
          saved={saved}
          size={size}
          soundEnabled={soundEnabled}
          tool={tool}
          canvasRef={canvasRef}
          onClear={clearCanvas}
          onColor={setColor}
          onDownload={downloadDrawing}
          onDraw={draw}
          onFinish={() => setRole('parent')}
          onSize={setSize}
          onStartDrawing={startDrawing}
          onStopDrawing={stopDrawing}
          onTool={setTool}
          onUndo={undo}
          onShowHelp={() => setShowChildTour(true)}
        />
      ) : (
        <ParentPanel
          activeStage={activeStage}
          drawingLocked={drawingLocked}
          galleryEnabled={galleryEnabled}
          gameStarted={gameStarted}
          players={players}
          requireApproval={requireApproval}
          soundEnabled={soundEnabled}
          stages={stages}
          timer={timer}
          onApprove={() => setApproval('approved')}
          onHide={() => setApproval('hidden')}
          onLock={setDrawingLocked}
          onRequireApproval={setRequireApproval}
          onGallery={setGalleryEnabled}
          onSound={setSoundEnabled}
          onStage={setSelectedStageId}
          onStart={() => {
            setGameStarted(true);
            setRole('child');
          }}
          onTimer={setTimer}
          onShowHelp={() => setShowParentTour(true)}
        />
      )}

      {role === 'child' && showChildTour && <TourCard audience="child" onClose={finishChildTour} />}
      {role === 'parent' && showParentTour && <TourCard audience="parent" onClose={finishParentTour} />}
    </main>
  );
}

type ChildDrawingScreenProps = {
  activeStage?: Stage;
  color: string;
  drawingLocked: boolean;
  gameStarted: boolean;
  historyCount: number;
  progress: number;
  saved: boolean;
  size: number;
  soundEnabled: boolean;
  tool: Tool;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onClear: () => void;
  onColor: (value: string) => void;
  onDownload: () => void;
  onDraw: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onFinish: () => void;
  onSize: (value: number) => void;
  onStartDrawing: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onStopDrawing: () => void;
  onTool: (value: Tool) => void;
  onUndo: () => void;
  onShowHelp: () => void;
};

function ChildDrawingScreen({
  activeStage,
  color,
  drawingLocked,
  gameStarted,
  historyCount,
  progress,
  saved,
  size,
  soundEnabled,
  tool,
  canvasRef,
  onClear,
  onColor,
  onDownload,
  onDraw,
  onFinish,
  onSize,
  onStartDrawing,
  onStopDrawing,
  onTool,
  onUndo,
  onShowHelp,
}: ChildDrawingScreenProps) {
  return (
    <section className="childLayout">
      <section className="drawingBoard">
        <div className="taskBubble">
          <span>
            <Wand2 size={20} />
          </span>
          <div>
            <p>{activeStage?.childTitle}</p>
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
            onPointerDown={onStartDrawing}
            onPointerMove={onDraw}
            onPointerUp={onStopDrawing}
            onPointerCancel={onStopDrawing}
            onPointerLeave={onStopDrawing}
          />
          <div className="drawHint">
            <Brush size={20} />
            Рисуй здесь
          </div>
          {!gameStarted && (
            <div className="softOverlay">
              <Play size={34} />
              <span>Хост скоро начнет занятие</span>
            </div>
          )}
          {drawingLocked && (
            <div className="softOverlay">
              <Lock size={34} />
              <span>Хост остановил рисование</span>
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
            {colors.map((item) => (
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

        <HintBox icon={<Eye size={20} />} title="Подсказка">
          Большие линии лучше видны на общем экране. Для детей 5-6 лет это проще, чем мелкая кисть.
        </HintBox>

        <div className="actionStack">
          <button className="secondaryButton" type="button" onClick={onUndo} disabled={historyCount === 0}>
            <Undo2 size={20} />
            Назад
          </button>
          <button className="secondaryButton" type="button" onClick={onClear}>
            <Trash2 size={20} />
            Очистить
          </button>
          <button className="secondaryButton" type="button" onClick={onDownload}>
            <Download size={20} />
            {saved ? 'Сохранено' : 'Сохранить'}
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

type ParentPanelProps = {
  activeStage?: Stage;
  drawingLocked: boolean;
  galleryEnabled: boolean;
  gameStarted: boolean;
  players: Player[];
  requireApproval: boolean;
  soundEnabled: boolean;
  stages: Stage[];
  timer: number;
  onApprove: () => void;
  onGallery: (value: boolean) => void;
  onHide: () => void;
  onLock: (value: boolean) => void;
  onRequireApproval: (value: boolean) => void;
  onSound: (value: boolean) => void;
  onStage: (id: string) => void;
  onStart: () => void;
  onTimer: (value: number) => void;
  onShowHelp: () => void;
};

function ParentPanel({
  activeStage,
  drawingLocked,
  galleryEnabled,
  gameStarted,
  players,
  requireApproval,
  soundEnabled,
  stages,
  timer,
  onApprove,
  onGallery,
  onHide,
  onLock,
  onRequireApproval,
  onSound,
  onStage,
  onStart,
  onTimer,
  onShowHelp,
}: ParentPanelProps) {
  return (
    <section className="parentLayout">
      <section className="parentHero">
        <div>
          <p className="eyebrow">Панель хоста</p>
          <h1>Настройте занятие для детей</h1>
          <p>Выберите фон, запустите рисование и проверьте работы перед показом.</p>
        </div>
        <button className="roundHelp" type="button" onClick={onShowHelp} aria-label="Обучение">
          <HelpCircle size={24} />
        </button>
      </section>

      <section className="parentGrid">
        <Panel title="Категории рисунков" hint="Хост выбирает категорию. Ребенок не переключает фон сам.">
          <div className="stageList">
            {stages.map((stage) => (
              <button className={stage.id === activeStage?.id ? 'stageCard isSelected' : 'stageCard'} type="button" key={stage.id} onClick={() => onStage(stage.id)}>
                <img src={stage.src} alt="" />
                <span>
                  <strong>{stage.title}</strong>
                  <small>{stage.parentNote}</small>
                </span>
                <em>{stage.score}/100</em>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Игроки" hint="Прогресс обновляется, когда ребенок проводит линию на холсте.">
          <div className="playerList">
            {players.map((player) => (
              <article key={player.id}>
                <strong>{player.name}</strong>
                <div className="smallTrack">
                  <span style={{ width: `${player.progress}%` }} />
                </div>
                <StatusBadge status={player.status} />
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Контроль" hint="Эти настройки помогают взрослому вести занятие без лишних экранов.">
          <ToggleRow label="Проверять рисунок перед показом" checked={requireApproval} onChange={onRequireApproval} />
          <ToggleRow label="Показать галерею в конце" checked={galleryEnabled} onChange={onGallery} />
          <ToggleRow label="Звук подсказок" checked={soundEnabled} onChange={onSound} />
          <ToggleRow label="Пауза рисования" checked={drawingLocked} onChange={onLock} />
        </Panel>

        <Panel title="Запуск" hint="Для детей 5-6 лет лучше короткие раунды по 3-5 минут.">
          <label className="timerControl">
            <span>Минут на рисунок</span>
            <input min="2" max="10" value={timer} type="range" onChange={(event) => onTimer(Number(event.target.value))} />
            <strong>{timer}</strong>
          </label>
          <div className="qrCard">
            <QrCode size={42} />
            <span>Код комнаты</span>
            <strong>UCHI-482</strong>
          </div>
          <button className="primaryButton" type="button" onClick={onStart}>
            <Play size={20} />
            {gameStarted ? 'Продолжить' : 'Начать'}
          </button>
        </Panel>

        <Panel title="Проверка рисунка" hint="Если работа готова, можно одобрить ее для общего экрана.">
          <div className="approvalPreview">
            {activeStage?.src && <img src={activeStage.src} alt="" />}
            <div>
              <strong>{players[0].name}</strong>
              <span>{players[0].progress}% готово</span>
            </div>
          </div>
          <div className="approvalActions">
            <button className="primaryButton" type="button" onClick={onApprove}>
              <ShieldCheck size={20} />
              Одобрить
            </button>
            <button className="dangerButton" type="button" onClick={onHide}>
              Скрыть
            </button>
          </div>
        </Panel>
      </section>
    </section>
  );
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>{title}</h2>
        {hint && (
          <span title={hint}>
            <HelpCircle size={18} />
          </span>
        )}
      </div>
      {hint && <p className="panelHint">{hint}</p>}
      {children}
    </section>
  );
}

function HintBox({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <aside className="hintBox">
      {icon}
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </aside>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="toggleRow">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function StatusBadge({ status }: { status: ApprovalStatus }) {
  const labels = {
    waiting: 'Ждет проверки',
    approved: 'Одобрено',
    hidden: 'Скрыто',
  };

  return <span className={`statusBadge ${status}`}>{labels[status]}</span>;
}

function TourCard({ audience, onClose }: { audience: Role; onClose: () => void }) {
  const isParent = audience === 'parent';
  const steps = isParent
    ? [
        'Выберите категорию рисунка. Фон у ребенка поменяется сам.',
        'Поставьте время: для малышей лучше 3-5 минут.',
        'Нажмите "Начать", а после работы проверьте рисунок.',
      ]
    : [
        'Смотри на большое поле с картинкой.',
        'Выбери цвет и рисуй пальцем или мышкой прямо по картинке.',
        'Когда закончишь, нажми "Готово".',
      ];

  return (
    <div className="tourBackdrop">
      <section className="tourCard">
        <div className="tourIcon">{isParent ? <Users size={34} /> : <Award size={34} />}</div>
        <p className="eyebrow">{isParent ? 'Обучение для хоста' : 'Обучение для ребенка'}</p>
        <h2>{isParent ? 'Как провести занятие' : 'Как рисовать'}</h2>
        <ol>
          {steps.map((step) => (
            <li key={step}>
              <ChevronRight size={18} />
              {step}
            </li>
          ))}
        </ol>
        <button className="primaryButton" type="button" onClick={onClose}>
          <Check size={20} />
          Понятно
        </button>
      </section>
    </div>
  );
}

export default App;
