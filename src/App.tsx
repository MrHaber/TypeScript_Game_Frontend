import { useEffect, useMemo, useState } from 'react';
import { Clock3, Eye, Star } from 'lucide-react';
import { TourCard } from './components/TourCard';
import { api, type RoomSnapshot } from './api/client';
import { LoginGate } from './features/auth/LoginGate';
import { buildStages, drawingColors, initialPlayers } from './features/drawing/data';
import { DrawingScreen } from './features/drawing/DrawingScreen';
import type { ApprovalStatus, GameMode, ParentSettings, Player, Role, Tool } from './features/drawing/types';
import { useDrawingCanvas } from './features/drawing/useDrawingCanvas';
import { ParentDashboard } from './features/parent/ParentDashboard';

function makeRoomCode() {
  return globalThis.crypto?.randomUUID?.() ?? `room-${Date.now()}`;
}

export function App() {
  const stages = useMemo(buildStages, []);
  const [role, setRole] = useState<Role>('login');
  const [childName, setChildName] = useState('Миша');
  const [hostName, setHostName] = useState('Светлана');
  const [roomCode, setRoomCodeState] = useState(() => localStorage.getItem('uchi-room-code') ?? makeRoomCode());
  const [activeMode, setActiveMode] = useState<GameMode>('drawing');
  const [selectedStageId, setSelectedStageId] = useState(stages[0]?.id ?? '');
  const [tool, setTool] = useState<Tool>('brush');
  const [color, setColor] = useState(drawingColors[0]);
  const [size, setSize] = useState(18);
  const [progress, setProgress] = useState(0);
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
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
  const [previewPlayerName, setPreviewPlayerName] = useState<string | null>(null);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
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

  const previewPlayer = players.find((player) => player.name === previewPlayerName) ?? players.find((player) => player.name === childName) ?? players[0];
  const previewStage = stages.find((stage) => stage.id === previewPlayer?.stageId) ?? activeStage;
  const previewDrawing = previewPlayer?.drawingData || (previewPlayer?.name === childName ? drawing.getSnapshot() : '');

  useEffect(() => {
    if (role === 'login' || !roomCode) return;

    let cancelled = false;
    const refresh = async () => {
      try {
        const room = await api.room(roomCode);
        if (!cancelled) {
          applyRoom(room);
        }
      } catch {
        // The login screen reports connection errors. During a live room we keep the last known state.
      }
    };

    refresh();
    const id = window.setInterval(refresh, 1200);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [role, roomCode, childName]);

  function setRoomCode(value: string) {
    setRoomCodeState(value);
    if (value) {
      localStorage.setItem('uchi-room-code', value);
    }
  }

  function applyRoom(room: RoomSnapshot) {
    setRoomCode(room.code);
    setGameStarted(room.gameStarted);
    setSettings(room.settings);
    setActiveMode(room.activeMode);
    if (stages.some((stage) => stage.id === room.activeStageId)) {
      setSelectedStageId(room.activeStageId);
    }
    if (room.players.length > 0) {
      setPlayers(room.players);
    }

    const currentChild = room.players.find((player) => player.name.toLowerCase() === childName.toLowerCase());
    if (currentChild) {
      setProgress(currentChild.progress);
      setReadyForReview(currentChild.status === 'waiting');
    }
  }

  function updateProgress(delta: number, snapshot?: string) {
    setProgress((value) => {
      const next = delta <= -100 ? 0 : Math.max(0, Math.min(100, value + delta));
      const nextStatus: ApprovalStatus = readyForReview ? 'waiting' : 'drawing';
      setPlayers((current) => {
        const found = current.some((player) => player.name.toLowerCase() === childName.toLowerCase());
        const updated = current.map((player) =>
          player.name.toLowerCase() === childName.toLowerCase() || player.id === 1
            ? {
                ...player,
                name: childName,
                progress: next,
                status: nextStatus,
                stageId: activeStage?.id,
                drawingData: snapshot ?? player.drawingData,
              }
            : player,
        );
        return found ? updated : [{ id: Date.now(), name: childName, age: 6, progress: next, status: nextStatus, stageId: activeStage?.id, drawingData: snapshot }, ...updated];
      });
      syncChildWork(next, nextStatus, snapshot);
      return next;
    });
  }

  function syncChildWork(nextProgress: number, status: ApprovalStatus, snapshot?: string) {
    if (!roomCode || role !== 'child') return;

    void api.updateRoomPlayer(roomCode, {
      child_name: childName,
      progress: nextProgress,
      status,
      stage_id: activeStage?.id,
      drawing_data: snapshot,
    }).catch(() => undefined);
  }

  async function login(nextRole: Exclude<Role, 'login'>) {
    setLoginError('');
    setLoginLoading(true);
    try {
      const room =
        nextRole === 'parent'
          ? await api.hostRoom(hostName.trim() || 'Хост', roomCode.trim() || undefined)
          : await api.childRoom(childName.trim() || 'Ребенок', roomCode.trim());
      applyRoom(room);
      setRole(nextRole);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Не удалось подключиться к комнате');
    } finally {
      setLoginLoading(false);
    }
  }

  function patchRoom(payload: Parameters<typeof api.updateRoom>[1]) {
    if (!roomCode) return;
    void api.updateRoom(roomCode, payload).then(applyRoom).catch(() => undefined);
  }

  function setSetting<K extends keyof ParentSettings>(key: K, value: ParentSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
    if (key === 'requireApproval') patchRoom({ require_approval: Boolean(value) });
    if (key === 'galleryEnabled') patchRoom({ gallery_enabled: Boolean(value) });
    if (key === 'drawingLocked') patchRoom({ drawing_locked: Boolean(value) });
    if (key === 'soundEnabled') patchRoom({ sound_enabled: Boolean(value) });
    if (key === 'timer') patchRoom({ timer: Number(value) });
  }

  function setApproval(status: ApprovalStatus) {
    const name = previewPlayerName ?? childName;
    setPlayers((current) => current.map((player) => (player.name === name ? { ...player, status } : player)));
    setReadyForReview(status === 'waiting');
    void api.updateRoomPlayer(roomCode, { child_name: name, status }).catch(() => undefined);
  }

  function finishDrawing() {
    const snapshot = drawing.getSnapshot();
    const status: ApprovalStatus = settings.requireApproval ? 'waiting' : 'approved';
    const nextProgress = Math.max(progress, 90);
    setReadyForReview(status === 'waiting');
    setProgress(nextProgress);
    setPlayers((current) =>
      current.map((player) =>
        player.name.toLowerCase() === childName.toLowerCase() || player.id === 1
          ? {
              ...player,
              name: childName,
              progress: nextProgress,
              status,
              stageId: activeStage?.id,
              drawingData: snapshot,
            }
          : player,
      ),
    );
    syncChildWork(nextProgress, status, snapshot);
    openPreview(childName);
  }

  function startGame() {
    setGameStarted(true);
    setSettings((current) => ({ ...current, drawingLocked: false }));
    patchRoom({
      active_mode: activeMode,
      active_stage_id: activeStage?.id,
      game_started: true,
      drawing_locked: false,
    });
  }

  function changeMode(mode: GameMode) {
    setActiveMode(mode);
    patchRoom({ active_mode: mode });
  }

  function changeStage(id: string) {
    setSelectedStageId(id);
    patchRoom({ active_stage_id: id });
  }

  function openPreview(name = childName) {
    setPreviewPlayerName(name);
    setPreviewOpen(true);
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
          error={loginError}
          hostName={hostName}
          loading={loginLoading}
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
          onPreview={() => openPreview(childName)}
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
          onMode={changeMode}
          onPreview={openPreview}
          onRequireApproval={(value) => setSetting('requireApproval', value)}
          onSound={(value) => setSetting('soundEnabled', value)}
          onStage={changeStage}
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
              {previewStage?.src && <img src={previewStage.src} alt={previewStage.title} />}
              {previewDrawing ? (
                <img className="previewDrawingLayer" src={previewDrawing} alt={`Рисунок ${previewPlayer?.name ?? childName}`} />
              ) : (
                <div className="previewPaper">
                  <strong>{previewPlayer?.name ?? childName}</strong>
                  <span>Рисунок пока не сохранен</span>
                </div>
              )}
            </div>
            <div className="previewMeta">
              <strong>{previewPlayer?.name ?? childName}</strong>
              <span>{previewPlayer?.progress ?? progress}% готово</span>
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
