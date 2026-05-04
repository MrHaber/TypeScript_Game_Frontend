import { useMemo, useState } from 'react';
import { Clock3, Eye, Star } from 'lucide-react';
import { TourCard } from './components/TourCard';
import { LoginGate } from './features/auth/LoginGate';
import { buildStages, drawingColors, initialPlayers } from './features/drawing/data';
import { DrawingScreen } from './features/drawing/DrawingScreen';
import type { ApprovalStatus, GameMode, ParentSettings, Role, Tool } from './features/drawing/types';
import { useDrawingCanvas } from './features/drawing/useDrawingCanvas';
import { ParentDashboard } from './features/parent/ParentDashboard';

export function App() {
  const stages = useMemo(buildStages, []);
  const [role, setRole] = useState<Role>('login');
  const [childName, setChildName] = useState('Миша');
  const [hostName, setHostName] = useState('Светлана');
  const [roomCode, setRoomCode] = useState('UCHI-482');
  const [activeMode, setActiveMode] = useState<GameMode>('drawing');
  const [selectedStageId, setSelectedStageId] = useState(stages[0]?.id ?? '');
  const [tool, setTool] = useState<Tool>('brush');
  const [color, setColor] = useState(drawingColors[0]);
  const [size, setSize] = useState(18);
  const [progress, setProgress] = useState(0);
  const [players, setPlayers] = useState(initialPlayers);
  const [settings, setSettings] = useState<ParentSettings>({
    requireApproval: true,
    galleryEnabled: false,
    drawingLocked: false,
    soundEnabled: true,
    timer: 5,
  });
  const [gameStarted, setGameStarted] = useState(false);
  const [readyForReview, setReadyForReview] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showChildTour, setShowChildTour] = useState(() => localStorage.getItem('uchi-child-tour') !== 'done');
  const [showParentTour, setShowParentTour] = useState(() => localStorage.getItem('uchi-parent-tour') !== 'done');

  const activeStage = stages.find((stage) => stage.id === selectedStageId) ?? stages[0];

  const drawing = useDrawingCanvas({
    activeStageId: activeStage?.id,
    color,
    locked: settings.drawingLocked || !gameStarted,
    size,
    tool,
    onProgress: updateProgress,
  });

  function updateProgress(delta: number) {
    setProgress((value) => {
      const next = delta <= -100 ? 0 : Math.max(0, Math.min(100, value + delta));
      setPlayers((current) =>
        current.map((player, index) =>
          index === 0
            ? {
                ...player,
                name: childName,
                progress: next,
                status: readyForReview ? player.status : 'waiting',
              }
            : player,
        ),
      );
      return next;
    });
  }

  function login(nextRole: Exclude<Role, 'login'>) {
    setPlayers((current) => current.map((player, index) => (index === 0 ? { ...player, name: childName } : player)));
    setRole(nextRole);
  }

  function setSetting<K extends keyof ParentSettings>(key: K, value: ParentSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function setApproval(status: ApprovalStatus) {
    setPlayers((current) => current.map((player, index) => (index === 0 ? { ...player, status } : player)));
    setReadyForReview(status === 'waiting');
  }

  function finishDrawing() {
    setReadyForReview(true);
    setPlayers((current) =>
      current.map((player, index) =>
        index === 0
          ? {
              ...player,
              name: childName,
              progress: Math.max(progress, 90),
              status: settings.requireApproval ? 'waiting' : 'approved',
            }
          : player,
      ),
    );
    setProgress((value) => Math.max(value, 90));
    setRole('parent');
    setPreviewOpen(true);
  }

  function startGame() {
    setGameStarted(true);
    setSettings((current) => ({ ...current, drawingLocked: false }));
    setRole('child');
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
      {role !== 'login' && (
        <header className="topbar">
          <button className="brandButton" type="button" onClick={() => setRole('login')}>
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
              {settings.timer} мин
            </span>
            <span>
              <Star size={18} />
              {progress}%
            </span>
          </div>
        </header>
      )}

      {role === 'login' && (
        <LoginGate
          childName={childName}
          hostName={hostName}
          roomCode={roomCode}
          onChildName={setChildName}
          onHostName={setHostName}
          onRoomCode={setRoomCode}
          onLogin={login}
        />
      )}

      {role === 'child' && (
        <DrawingScreen
          {...drawing}
          activeStage={activeStage}
          childName={childName}
          color={color}
          drawingLocked={settings.drawingLocked || !gameStarted}
          gameStarted={gameStarted}
          progress={progress}
          readyForReview={readyForReview}
          size={size}
          soundEnabled={settings.soundEnabled}
          tool={tool}
          onColor={setColor}
          onFinish={finishDrawing}
          onPreview={() => setPreviewOpen(true)}
          onSize={setSize}
          onTool={setTool}
          onShowHelp={() => setShowChildTour(true)}
        />
      )}

      {role === 'parent' && (
        <ParentDashboard
          activeStage={activeStage}
          activeMode={activeMode}
          childName={childName}
          gameStarted={gameStarted}
          players={players}
          readyForReview={readyForReview}
          roomCode={roomCode}
          settings={settings}
          stages={stages}
          onApprove={() => setApproval('approved')}
          onGallery={(value) => setSetting('galleryEnabled', value)}
          onHide={() => setApproval('hidden')}
          onLock={(value) => setSetting('drawingLocked', value)}
          onMode={setActiveMode}
          onPreview={() => setPreviewOpen(true)}
          onRequireApproval={(value) => setSetting('requireApproval', value)}
          onSound={(value) => setSetting('soundEnabled', value)}
          onStage={setSelectedStageId}
          onStart={startGame}
          onTimer={(value) => setSetting('timer', value)}
          onShowHelp={() => setShowParentTour(true)}
        />
      )}

      {previewOpen && (
        <div className="previewBackdrop">
          <section className="previewModal">
            <div className="panelHeader">
              <h2>Просмотр работы</h2>
              <button className="roundHelp" type="button" aria-label="Закрыть" onClick={() => setPreviewOpen(false)}>
                <Eye size={20} />
              </button>
            </div>
            <div className="previewStage">
              {activeStage?.src && <img src={activeStage.src} alt={activeStage.title} />}
              <div className="previewPaper">
                <strong>{childName}</strong>
                <span>{readyForReview ? 'Работа отправлена хосту' : 'Черновик рисунка'}</span>
              </div>
            </div>
            <div className="approvalActions">
              <button className="primaryButton" type="button" onClick={() => setApproval('approved')}>
                Одобрить
              </button>
              <button className="dangerButton" type="button" onClick={() => setApproval('hidden')}>
                Скрыть
              </button>
            </div>
          </section>
        </div>
      )}

      {role === 'child' && showChildTour && <TourCard audience="child" onClose={finishChildTour} />}
      {role === 'parent' && showParentTour && <TourCard audience="parent" onClose={finishParentTour} />}
    </main>
  );
}

export default App;
