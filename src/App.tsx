import { useMemo, useState } from 'react';
import { Clock3, Eye, Star } from 'lucide-react';
import { TourCard } from './components/TourCard';
import { api, type RoomDto } from './api/client';
import { LoginGate } from './features/auth/LoginGate';
import { buildStages, drawingColors, initialPlayers } from './features/drawing/data';
import { DrawingScreen } from './features/drawing/DrawingScreen';
import type { ApprovalStatus, GameMode, ParentSettings, Player, Role, Tool } from './features/drawing/types';
import { useDrawingCanvas } from './features/drawing/useDrawingCanvas';
import { ParentDashboard } from './features/parent/ParentDashboard';

function roomPlayersToUi(room: RoomDto, fallbackName: string): Player[] {
  if (room.players.length === 0) {
    return initialPlayers.map((player, index) => (index === 0 ? { ...player, name: fallbackName } : player));
  }

  return room.players.map((player) => ({
    id: player.id,
    name: player.child_name,
    age: player.age,
    progress: player.progress,
    status: player.status,
  }));
}

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
  const [savedDrawingUrl, setSavedDrawingUrl] = useState('');
  const [roomPlayerId, setRoomPlayerId] = useState<number | null>(null);
  const [roomDrawingId, setRoomDrawingId] = useState<number | null>(null);
  const [apiMessage, setApiMessage] = useState('');
  const [showChildTour, setShowChildTour] = useState(() => localStorage.getItem('uchi-child-tour') !== 'done');
  const [showParentTour, setShowParentTour] = useState(() => localStorage.getItem('uchi-parent-tour') !== 'done');

  const activeStage = stages.find((stage) => stage.id === selectedStageId) ?? stages[0];

  const drawing = useDrawingCanvas({
    activeStageId: activeStage?.id,
    backgroundSrc: activeStage?.src,
    color,
    locked: settings.drawingLocked,
    size,
    tool,
    onProgress: updateProgress,
  });

  function applyRoom(room: RoomDto, fallbackName = childName) {
    setRoomCode(room.code);
    setActiveMode((room.mode as GameMode) || 'drawing');
    setSelectedStageId(room.stage_id || stages[0]?.id || '');
    setGameStarted(room.started);
    setSettings((current) => ({
      ...current,
      drawingLocked: room.locked,
      timer: room.timer,
    }));
    setPlayers(roomPlayersToUi(room, fallbackName));

    const currentPlayer = room.players.find((player) => player.child_name.toLowerCase() === fallbackName.toLowerCase());
    if (currentPlayer) {
      setRoomPlayerId(currentPlayer.id);
      setProgress(currentPlayer.progress);
    }

    const latestDrawing = room.drawings[room.drawings.length - 1];
    if (latestDrawing) {
      setRoomDrawingId(latestDrawing.id);
      setSavedDrawingUrl(latestDrawing.image_data);
      setReadyForReview(latestDrawing.status === 'waiting');
    }
  }

  function updateProgress(delta: number) {
    setProgress((value) => {
      const next = delta <= -100 ? 0 : Math.max(0, Math.min(100, value + delta));
      setPlayers((current) =>
        current.map((player, index) =>
          (roomPlayerId ? player.id === roomPlayerId : index === 0)
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

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(roomCode);
      setApiMessage(`Код ${roomCode} скопирован`);
    } catch {
      setApiMessage(`Код комнаты: ${roomCode}`);
    }
  }

  async function login(nextRole: Exclude<Role, 'login'>) {
    setApiMessage(nextRole === 'parent' ? 'Создаю комнату...' : 'Подключаю к комнате...');

    try {
      if (nextRole === 'parent') {
        const room = await api.createRoom({
          hostName,
          mode: activeMode,
          timer: settings.timer,
          stageId: selectedStageId,
        });
        applyRoom(room);
        setApiMessage(`Комната ${room.code} создана`);
        setRole('parent');
        return;
      }

      const room = await api.joinRoom(roomCode, { childName, age: 6 });
      applyRoom(room, childName);
      setApiMessage(`Вход в комнату ${room.code} выполнен`);
      setRole('child');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось связаться с бекендом';
      setApiMessage(message);
    }
  }

  async function updateRoomPatch(patch: Parameters<typeof api.updateRoom>[1]) {
    try {
      const room = await api.updateRoom(roomCode, patch);
      applyRoom(room);
      setApiMessage('Комната обновлена');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Комната обновлена только на экране';
      setApiMessage(message);
    }
  }

  function setSetting<K extends keyof ParentSettings>(key: K, value: ParentSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
    if (key === 'drawingLocked') void updateRoomPatch({ locked: Boolean(value) });
    if (key === 'timer') void updateRoomPatch({ timer: Number(value) });
  }

  async function setApproval(status: ApprovalStatus) {
    setPlayers((current) =>
      current.map((player, index) => ((roomPlayerId ? player.id === roomPlayerId : index === 0) ? { ...player, status } : player)),
    );
    setReadyForReview(status === 'waiting');

    if (!roomDrawingId) return;
    try {
      const room = await api.updateRoomDrawing(roomCode, roomDrawingId, status);
      applyRoom(room);
      setApiMessage(status === 'approved' ? 'Рисунок одобрен' : status === 'hidden' ? 'Рисунок скрыт' : 'Рисунок ждет проверки');
    } catch (error) {
      setApiMessage(error instanceof Error ? error.message : 'Не удалось обновить статус рисунка');
    }
  }

  async function finishDrawing() {
    const imageData = await drawing.getComposedDataUrl();
    const nextStatus: ApprovalStatus = settings.requireApproval ? 'waiting' : 'approved';
    const nextProgress = Math.max(progress, 90);

    if (imageData) setSavedDrawingUrl(imageData);
    setReadyForReview(nextStatus === 'waiting');
    setPlayers((current) =>
      current.map((player, index) =>
        (roomPlayerId ? player.id === roomPlayerId : index === 0)
          ? {
              ...player,
              name: childName,
              progress: nextProgress,
              status: nextStatus,
            }
          : player,
      ),
    );
    setProgress(nextProgress);

    if (imageData) {
      try {
        const room = await api.saveRoomDrawing(roomCode, {
          playerId: roomPlayerId,
          childName,
          stageId: activeStage?.id ?? selectedStageId,
          imageData,
          progress: nextProgress,
          status: nextStatus,
        });
        applyRoom(room, childName);
        setApiMessage('Рисунок сохранен на бекенд');
      } catch (error) {
        setApiMessage(error instanceof Error ? error.message : 'Рисунок сохранен только в браузере');
      }
    }

    setRole('parent');
    setPreviewOpen(true);
  }

  async function startGame() {
    setGameStarted(true);
    setSettings((current) => ({ ...current, drawingLocked: false }));
    await updateRoomPatch({
      started: true,
      locked: false,
      mode: activeMode,
      timer: settings.timer,
      stageId: selectedStageId,
    });
    setRole('child');
  }

  function changeMode(mode: GameMode) {
    setActiveMode(mode);
    void updateRoomPatch({ mode });
  }

  function changeStage(stageId: string) {
    setSelectedStageId(stageId);
    setProgress(0);
    setReadyForReview(false);
    setSavedDrawingUrl('');
    void updateRoomPatch({ stageId });
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
            <span>Учи.ру Рисовашка</span>
          </button>

          <div className="roleSwitch" aria-label="Выбор экрана">
            <button className={role === 'child' ? 'isSelected' : ''} type="button" onClick={() => setRole('child')}>
              Ребенок
            </button>
            <button className={role === 'parent' ? 'isSelected' : ''} type="button" onClick={() => setRole('parent')}>
              Взрослый
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
          statusText={apiMessage}
          onChildName={setChildName}
          onHostName={setHostName}
          onRoomCode={setRoomCode}
          onLogin={login}
          onCopyRoom={copyInvite}
        />
      )}

      {role === 'child' && (
        <DrawingScreen
          {...drawing}
          activeStage={activeStage}
          childName={childName}
          color={color}
          drawingLocked={settings.drawingLocked}
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
          savedDrawingUrl={savedDrawingUrl}
          settings={settings}
          stages={stages}
          onApprove={() => void setApproval('approved')}
          onCopyInvite={copyInvite}
          onGallery={(value) => setSetting('galleryEnabled', value)}
          onHide={() => void setApproval('hidden')}
          onLock={(value) => setSetting('drawingLocked', value)}
          onMode={changeMode}
          onPreview={() => setPreviewOpen(true)}
          onRequireApproval={(value) => setSetting('requireApproval', value)}
          onSound={(value) => setSetting('soundEnabled', value)}
          onStage={changeStage}
          onStart={startGame}
          onTimer={(value) => setSetting('timer', value)}
          onShowHelp={() => setShowParentTour(true)}
        />
      )}

      {apiMessage && role !== 'login' && <div className="floatingNotice">{apiMessage}</div>}

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
              {savedDrawingUrl ? (
                <img className="savedDrawingImage" src={savedDrawingUrl} alt="Сохраненный рисунок ребенка" />
              ) : (
                activeStage?.src && <img src={activeStage.src} alt={activeStage.title} />
              )}
              {!savedDrawingUrl && (
                <div className="previewPaper">
                  <strong>{childName}</strong>
                  <span>{readyForReview ? 'Работа отправлена взрослому' : 'Черновик рисунка'}</span>
                </div>
              )}
            </div>
            <div className="approvalActions">
              <button className="primaryButton" type="button" onClick={() => void setApproval('approved')}>
                Одобрить
              </button>
              <button className="dangerButton" type="button" onClick={() => void setApproval('hidden')}>
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
