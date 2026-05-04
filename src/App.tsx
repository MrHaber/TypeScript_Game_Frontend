import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, Eye, Star } from 'lucide-react';
import { TourCard } from './components/TourCard';
import { api, type RoomSnapshot } from './api/client';
import { LoginGate } from './features/auth/LoginGate';
import { buildStages, drawingColors, winnersBackground } from './features/drawing/data';
import { DrawingScreen } from './features/drawing/DrawingScreen';
import { QuizScreen } from './features/drawing/QuizScreen';
import { quizPackForStage } from './features/drawing/quizData';
import { WinnersScreen } from './features/drawing/WinnersScreen';
import type { ApprovalStatus, GameMode, ParentSettings, Player, Role, Tool } from './features/drawing/types';
import { useDrawingCanvas } from './features/drawing/useDrawingCanvas';
import { ParentDashboard } from './features/parent/ParentDashboard';

function makeRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const suffix = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  return `UCHI-${suffix}`;
}

const MEMORY_SECONDS = 60;

export function App() {
  const stages = useMemo(buildStages, []);
  const [role, setRole] = useState<Role>('login');
  const [childName, setChildName] = useState('Миша');
  const [hostName, setHostName] = useState('Светлана');
  const [parentLogin, setParentLogin] = useState(() => localStorage.getItem('uchi-parent-login') ?? '');
  const [parentPassword, setParentPassword] = useState('');
  const [parentRegistering, setParentRegistering] = useState(false);
  const [parentToken, setParentToken] = useState(() => localStorage.getItem('uchi-parent-token') ?? '');
  const [roomCode, setRoomCodeState] = useState(() => {
    const saved = localStorage.getItem('uchi-room-code');
    return saved && saved.length <= 12 ? saved : makeRoomCode();
  });
  const [activeMode, setActiveMode] = useState<GameMode>('drawing');
  const [selectedStageId, setSelectedStageId] = useState(stages[0]?.id ?? '');
  const [tool, setTool] = useState<Tool>('brush');
  const [color, setColor] = useState(drawingColors[0]);
  const [size, setSize] = useState(7);
  const [progress, setProgress] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<ParentSettings>({
    requireApproval: true,
    galleryEnabled: false,
    drawingLocked: false,
    soundEnabled: true,
    timer: 5,
  });
  const [gameStarted, setGameStarted] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(settings.timer * 60);
  const [memorySeconds, setMemorySeconds] = useState(MEMORY_SECONDS);
  const [memoryDone, setMemoryDone] = useState(false);
  const [localDrawingSession, setLocalDrawingSession] = useState(false);
  const [readyForReview, setReadyForReview] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPlayerName, setPreviewPlayerName] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [winnersOpen, setWinnersOpen] = useState(false);
  const [winnersRevealed, setWinnersRevealed] = useState(false);
  const [parentWinnersDismissed, setParentWinnersDismissed] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [roomError, setRoomError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showChildTour, setShowChildTour] = useState(() => localStorage.getItem('uchi-child-tour') !== 'done');
  const [showParentTour, setShowParentTour] = useState(() => localStorage.getItem('uchi-parent-tour') !== 'done');
  const memoryRoomKeyRef = useRef('');
  const memoryDoneRef = useRef(false);
  const localDrawingSessionRef = useRef(false);
  const localWorkSubmittedRef = useRef(false);

  const activeStage = stages.find((stage) => stage.id === selectedStageId) ?? stages[0];
  const currentChildPlayer = players.find((player) => player.name.toLowerCase() === childName.toLowerCase());
  const quizActive = activeMode === 'quiz';
  const lessonTimeUp = gameStarted && (quizActive || memoryDone) && timerStarted && remainingSeconds === 0;
  const childWorkSubmitted = role === 'child' && !localDrawingSession && Boolean(currentChildPlayer && currentChildPlayer.status !== 'drawing');
  const memoryActive = role === 'child' && !quizActive && gameStarted && !showChildTour && !memoryDone && !childWorkSubmitted && !lessonTimeUp;
  const childDrawingLocked = settings.drawingLocked || !gameStarted || !memoryDone || readyForReview || childWorkSubmitted || lessonTimeUp;

  const drawing = useDrawingCanvas({
    activeStageId: activeStage?.id,
    backgroundSrc: undefined,
    color,
    locked: childDrawingLocked,
    size,
    tool,
    onProgress: updateProgress,
  });

  const previewPlayer = players.find((player) => player.name === previewPlayerName) ?? players.find((player) => player.name === childName) ?? players[0];
  const previewStage = stages.find((stage) => stage.id === previewPlayer?.stageId) ?? activeStage;
  const previewDrawing = previewPlayer?.drawingData || (previewPlayer?.name === childName ? drawing.getSnapshot() : '');
  const activeQuizPack = quizPackForStage(activeStage);
  const everyoneRated =
    players.length > 0 &&
    players.every((player) => (player.rating ?? 0) > 0 && (player.status === 'approved' || player.status === 'hidden'));
  const childHasSubmittedWork = role === 'child' && Boolean(currentChildPlayer && currentChildPlayer.status !== 'drawing') && !localDrawingSession;
  const childIsInActiveRound =
    role === 'child' &&
    gameStarted &&
    !lessonTimeUp &&
    !childHasSubmittedWork &&
    (quizActive || memoryActive || localDrawingSession || memoryDone);
  const childShouldSeeResults = role === 'child' && (lessonTimeUp || (winnersRevealed && childHasSubmittedWork && everyoneRated));
  const blockChildWinners = role === 'child' && localDrawingSession;
  const showWinnersScreen =
    role === 'parent'
      ? winnersOpen || (winnersRevealed && !parentWinnersDismissed)
      : role === 'child' && !blockChildWinners && !childIsInActiveRound && childShouldSeeResults;

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
  }, [role, roomCode, childName, localDrawingSession, memoryDone]);

  useEffect(() => {
    if (!timerStarted) {
      setRemainingSeconds(settings.timer * 60);
    }
  }, [settings.timer, gameStarted, timerStarted]);

  useEffect(() => {
    if (!gameStarted || !timerStarted || remainingSeconds <= 0) return;

    const id = window.setInterval(() => {
      setRemainingSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [gameStarted, timerStarted, remainingSeconds]);

  useEffect(() => {
    if (role !== 'child' || !gameStarted || showChildTour || timerStarted || (!quizActive && !memoryDone)) return;
    setTimerStarted(true);
    patchRoom({ timer_started: true });
  }, [role, gameStarted, showChildTour, timerStarted, memoryDone, quizActive]);

  useEffect(() => {
    if (!memoryActive) return;
    if (memorySeconds <= 0) {
      completeMemoryPhase();
      return;
    }

    const id = window.setTimeout(() => {
      setMemorySeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [memoryActive, memorySeconds]);

  useEffect(() => {
    if (role !== 'parent' || winnersRevealed || !lessonTimeUp || !everyoneRated) return;
    revealWinners();
  }, [role, winnersRevealed, lessonTimeUp, everyoneRated]);

  function resetMemoryPhase() {
    memoryDoneRef.current = false;
    localDrawingSessionRef.current = false;
    localWorkSubmittedRef.current = false;
    setMemoryDone(false);
    setLocalDrawingSession(false);
    setMemorySeconds(MEMORY_SECONDS);
  }

  function completeMemoryPhase() {
    memoryDoneRef.current = true;
    localDrawingSessionRef.current = true;
    localWorkSubmittedRef.current = false;
    setMemoryDone(true);
    setLocalDrawingSession(true);
    setReadyForReview(false);
    setProgress(0);
    setMemorySeconds(MEMORY_SECONDS);
    setTimerStarted(false);
    setRemainingSeconds(settings.timer * 60);
    setWinnersOpen(false);
    setWinnersRevealed(false);
    void api.updateRoomPlayer(roomCode, {
      child_name: childName,
      progress: 0,
      status: 'drawing',
      stage_id: activeStage?.id,
      drawing_data: '',
    }).catch(() => undefined);
  }

  function setRoomCode(value: string) {
    const next = value.toUpperCase();
    setRoomCodeState(next);
    if (next) {
      localStorage.setItem('uchi-room-code', next);
    }
  }

  function applyRoom(room: RoomSnapshot, roleOverride: Role = role) {
    const effectiveRole = roleOverride;
    const roomQuizActive = room.activeMode === 'quiz';
    const isChildRoom = effectiveRole === 'child';
    const isLocalChildDrawing = isChildRoom && localDrawingSessionRef.current;
    const isLocalChildSubmitted = isChildRoom && localWorkSubmittedRef.current;
    const isFreshChildRound =
      isChildRoom &&
      room.gameStarted &&
      !isLocalChildSubmitted &&
      (roomQuizActive || (!room.timerStarted && !room.winnersRevealed));
    const keepLocalChildTimer = isChildRoom && room.gameStarted && (memoryDoneRef.current || roomQuizActive);
    setRoomCode(room.code);
    setGameStarted(room.gameStarted);
    if (!keepLocalChildTimer) {
      setTimerStarted(room.timerStarted);
    }
    setWinnersRevealed(isLocalChildDrawing || isFreshChildRound ? false : room.winnersRevealed);
    if (!room.winnersRevealed || isFreshChildRound) {
      setParentWinnersDismissed(false);
    }
    if (!keepLocalChildTimer) {
      if (room.timerEndsAt) {
        setRemainingSeconds(Math.max(0, Math.ceil((Date.parse(room.timerEndsAt) - Date.now()) / 1000)));
      } else if (!room.timerStarted) {
        setRemainingSeconds(room.settings.timer * 60);
      }
    }
    setSettings(room.settings);
    setActiveMode(room.activeMode);
    if (stages.some((stage) => stage.id === room.activeStageId)) {
      setSelectedStageId(room.activeStageId);
    }
    const roomPlayers =
      isLocalChildDrawing || isFreshChildRound
        ? room.players.map((player) =>
            player.name.toLowerCase() === childName.toLowerCase()
              ? {
                  ...player,
                  progress: isFreshChildRound ? 0 : player.progress,
                  status: 'drawing' as ApprovalStatus,
                  rating: isFreshChildRound ? 0 : player.rating,
                  drawingData: isFreshChildRound ? null : player.drawingData,
                  stageId: room.activeStageId,
                }
              : player,
          )
        : room.players;
    setPlayers(roomPlayers);

    const currentChild = roomPlayers.find((player) => player.name.toLowerCase() === childName.toLowerCase());
    if (isChildRoom) {
      const memoryKey = `${room.code}:${room.activeStageId}:${room.gameStarted ? 'started' : 'idle'}`;
      if (memoryRoomKeyRef.current !== memoryKey) {
        memoryRoomKeyRef.current = memoryKey;
        resetMemoryPhase();
      }
    }

    if (currentChild) {
      setProgress(currentChild.progress);
      setReadyForReview(isLocalChildDrawing || isFreshChildRound ? false : currentChild.status === 'waiting');
    } else {
      setProgress(0);
      setReadyForReview(false);
    }
  }

  function updateProgress(delta: number, snapshot?: string) {
    setProgress((value) => {
      const next = delta <= -100 ? 0 : Math.max(0, Math.min(100, value + delta));
      const nextStatus: ApprovalStatus = readyForReview ? 'waiting' : 'drawing';
      setPlayers((current) => {
        const found = current.some((player) => player.name.toLowerCase() === childName.toLowerCase());
        const updated = current.map((player) =>
          player.name.toLowerCase() === childName.toLowerCase()
            ? {
                ...player,
                name: childName,
                progress: next,
                status: nextStatus,
                rating: player.rating ?? 0,
                stageId: activeStage?.id,
                drawingData: snapshot ?? player.drawingData,
              }
            : player,
        );
        return found
          ? updated
          : [{ id: Date.now(), name: childName, age: 6, progress: next, status: nextStatus, rating: 0, stageId: activeStage?.id, drawingData: snapshot }, ...updated];
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
      if (nextRole === 'parent') {
        const loginValue = parentLogin.trim();
        const passwordValue = parentPassword.trim();
        const displayName = hostName.trim() || loginValue || 'Родитель';
        const auth = parentRegistering
          ? await api.parentRegister(loginValue, passwordValue, displayName)
          : await api.parentLogin(loginValue, passwordValue);
        localStorage.setItem('uchi-parent-token', auth.token);
        localStorage.setItem('uchi-parent-login', auth.parent.login);
        setParentToken(auth.token);
        setHostName(auth.parent.displayName || displayName);
        applyRoom(auth.room, 'parent');
        setRole('parent');
        return;
      }

      const room = await api.childRoom(childName.trim() || 'Ребенок', roomCode.trim());
      applyRoom(room, 'child');
      setRole(nextRole);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Не удалось подключиться к комнате');
    } finally {
      setLoginLoading(false);
    }
  }

  function patchRoom(payload: Parameters<typeof api.updateRoom>[1]) {
    if (!roomCode) return;
    void api
      .updateRoom(roomCode, payload, parentToken)
      .then((room) => {
        setRoomError('');
        applyRoom(room);
      })
      .catch((error) => {
        if (role === 'parent') {
          setRoomError(error instanceof Error ? error.message : 'Не удалось обновить комнату');
        }
      });
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
    setPlayers((current) => current.map((player) => (player.name === name ? { ...player, status, rating: selectedRating || player.rating || 0 } : player)));
    setReadyForReview(status === 'waiting');
    setPreviewOpen(false);
    void api
      .updateRoomPlayer(roomCode, { child_name: name, status, ...(selectedRating ? { rating: selectedRating } : {}) }, parentToken)
      .then(applyRoom)
      .catch(() => undefined);
  }

  function submitArtwork(snapshot: string, minimumProgress = 90) {
    const status: ApprovalStatus = settings.requireApproval ? 'waiting' : 'approved';
    const nextProgress = Math.max(progress, minimumProgress);
    localDrawingSessionRef.current = false;
    localWorkSubmittedRef.current = true;
    setLocalDrawingSession(false);
    setReadyForReview(status === 'waiting');
    setProgress(nextProgress);
    setPlayers((current) =>
      current.some((player) => player.name.toLowerCase() === childName.toLowerCase())
        ? current.map((player) =>
            player.name.toLowerCase() === childName.toLowerCase()
              ? {
                  ...player,
                  name: childName,
                  progress: nextProgress,
                  status,
                  rating: player.rating ?? 0,
                  stageId: activeStage?.id,
                  drawingData: snapshot,
                }
              : player,
          )
        : [
            {
              id: Date.now(),
              name: childName,
              age: 6,
              progress: nextProgress,
              status,
              rating: 0,
              stageId: activeStage?.id,
              drawingData: snapshot,
            },
            ...current,
          ],
    );
    syncChildWork(nextProgress, status, snapshot);
  }

  async function finishDrawing() {
    const snapshot = await drawing.getCompositeSnapshot();
    submitArtwork(snapshot, 90);
  }

  function importDrawingPhoto(dataUrl: string) {
    submitArtwork(dataUrl, 100);
  }

  function finishQuiz(result: { correct: number; total: number; snapshot: string }) {
    const percent = Math.round((result.correct / result.total) * 100);
    submitArtwork(result.snapshot, percent);
  }

  async function startGame() {
    setRoomError('');
    try {
      const room = await api.updateRoom(
        roomCode,
        {
          active_mode: activeMode,
          active_stage_id: activeStage?.id,
          game_started: true,
          drawing_locked: false,
          timer_started: false,
          winners_revealed: false,
          reset_players: true,
        },
        parentToken,
      );
      resetMemoryPhase();
      setWinnersOpen(false);
      setWinnersRevealed(false);
      setParentWinnersDismissed(false);
      setProgress(0);
      setReadyForReview(false);
      setRemainingSeconds(room.settings.timer * 60);
      applyRoom(room);
    } catch (error) {
      setRoomError(error instanceof Error ? error.message : 'Не удалось начать занятие');
    }
  }

  function restartGame() {
    setGameStarted(true);
    setTimerStarted(false);
    resetMemoryPhase();
    setWinnersOpen(false);
    setWinnersRevealed(false);
    setParentWinnersDismissed(false);
    setProgress(0);
    setReadyForReview(false);
    patchRoom({
      active_mode: activeMode,
      active_stage_id: activeStage?.id,
      game_started: true,
      drawing_locked: false,
      timer_started: false,
      winners_revealed: false,
      reset_players: true,
    });
  }

  function clearLesson() {
    setGameStarted(false);
    setTimerStarted(false);
    resetMemoryPhase();
    setWinnersOpen(false);
    setWinnersRevealed(false);
    setParentWinnersDismissed(false);
    setProgress(0);
    setReadyForReview(false);
    patchRoom({
      game_started: false,
      drawing_locked: false,
      timer_started: false,
      winners_revealed: false,
      clear_drawings: true,
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
    const player = players.find((item) => item.name === name);
    setSelectedRating(player?.rating ?? 0);
    setPreviewOpen(true);
  }

  function revealWinners() {
    setWinnersOpen(true);
    setWinnersRevealed(true);
    setParentWinnersDismissed(false);
    patchRoom({ winners_revealed: true, drawing_locked: true });
  }

  function closeParentWinners() {
    setWinnersOpen(false);
    setParentWinnersDismissed(true);
  }

  function finishChildTour() {
    localStorage.setItem('uchi-child-tour', 'done');
    setShowChildTour(false);
    if (gameStarted && (memoryDone || quizActive) && !timerStarted) {
      setTimerStarted(true);
      patchRoom({ timer_started: true });
    }
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

          <div className="roleSwitch" aria-label="Текущий экран">
            <button className="isSelected" type="button">
              {role === 'parent' ? 'Родитель' : 'Ребенок'}
            </button>
          </div>

          {role === 'child' && (
            <div className="sessionBadges">
              <span>
                <Clock3 size={18} />
              {timerStarted ? `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}` : `${settings.timer} мин`}
              </span>
            <span>
              <Star size={18} />
              {progress}%
            </span>
            </div>
          )}
        </header>
      )}

      {role === 'login' && (
        <LoginGate
          childName={childName}
          error={loginError}
          hostName={hostName}
          loading={loginLoading}
          parentLogin={parentLogin}
          parentPassword={parentPassword}
          parentRegistering={parentRegistering}
          roomCode={roomCode}
          onChildName={setChildName}
          onHostName={setHostName}
          onParentLogin={setParentLogin}
          onParentPassword={setParentPassword}
          onParentRegistering={setParentRegistering}
          onRoomCode={setRoomCode}
          onLogin={login}
        />
      )}

      {showWinnersScreen && (
        <WinnersScreen
          childName={childName}
          players={players}
          role={role}
          stages={stages}
          winnersBackground={winnersBackground}
          onClose={role === 'parent' ? closeParentWinners : undefined}
          onPreview={openPreview}
          onRestart={role === 'parent' ? restartGame : undefined}
        />
      )}

      {role === 'child' && !showWinnersScreen && quizActive && (
        <QuizScreen
          activeStage={activeStage}
          childName={childName}
          gameStarted={gameStarted}
          pack={activeQuizPack}
          readyForReview={readyForReview || childWorkSubmitted}
          onFinish={finishQuiz}
          onShowHelp={() => setShowChildTour(true)}
        />
      )}

      {role === 'child' && !showWinnersScreen && !quizActive && (
        <DrawingScreen
          {...drawing}
          activeStage={activeStage}
          childName={childName}
          color={color}
          drawingLocked={childDrawingLocked}
          gameStarted={gameStarted}
          memoryActive={memoryActive}
          memorySeconds={memorySeconds}
          progress={progress}
          readyForReview={readyForReview || childWorkSubmitted}
          size={size}
          soundEnabled={settings.soundEnabled}
          tool={tool}
          onColor={setColor}
          onFinish={finishDrawing}
          onImportImage={importDrawingPhoto}
          onPreview={() => openPreview(childName)}
          onSkipMemory={completeMemoryPhase}
          onSize={setSize}
          onTool={setTool}
          onShowHelp={() => setShowChildTour(true)}
        />
      )}

      {role === 'parent' && !showWinnersScreen && (
        <ParentDashboard
          activeStage={activeStage}
          activeMode={activeMode}
          childName={childName}
          gameStarted={gameStarted}
          players={players}
          readyForReview={readyForReview}
          roomCode={roomCode}
          roomError={roomError}
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
          onRestart={restartGame}
          onClearLesson={clearLesson}
          onShowWinners={() => {
            setParentWinnersDismissed(false);
            setWinnersOpen(true);
          }}
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
            <div className={previewDrawing ? 'previewStage artworkOnly' : 'previewStage'}>
              {!previewDrawing && previewStage?.src && <img src={previewStage.src} alt={previewStage.title} />}
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
            {role === 'parent' && (
              <>
            <div className="ratingRow" aria-label="Оценка звездами">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  className={rating <= selectedRating ? 'starButton isSelected' : 'starButton'}
                  type="button"
                  onClick={() => setSelectedRating(rating)}
                  aria-label={`${rating} звезд`}
                >
                  <Star size={24} fill="currentColor" />
                </button>
              ))}
            </div>
            <div className="approvalActions">
              <button className="primaryButton" type="button" onClick={() => setApproval('approved')}>
                Одобрить
              </button>
              <button className="dangerButton" type="button" onClick={() => setApproval('hidden')}>
                Скрыть
              </button>
            </div>
              </>
            )}
            {role !== 'parent' && (
              <div className="childPreviewResult">
                <strong>{(previewPlayer?.rating ?? 0) > 0 ? 'Оценка родителя' : 'Работа отправлена'}</strong>
                <span>{(previewPlayer?.rating ?? 0) > 0 ? `${previewPlayer?.rating} из 5` : 'Оценка появится после проверки родителем.'}</span>
              </div>
            )}
          </section>
        </div>
      )}

      {role === 'child' && showChildTour && <TourCard audience="child" onClose={finishChildTour} />}
      {role === 'parent' && showParentTour && <TourCard audience="parent" onClose={finishParentTour} />}
    </main>
  );
}

export default App;
