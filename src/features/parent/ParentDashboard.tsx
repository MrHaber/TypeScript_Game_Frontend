import { useEffect, useRef, useState } from 'react';
import { Copy, Eye, HelpCircle, Play, QrCode, ShieldCheck } from 'lucide-react';
import { Panel } from '../../components/Panel';
import { gameModes } from '../drawing/data';
import type { ApprovalStatus, GameMode, ParentSettings, Player, Stage } from '../drawing/types';

type ParentDashboardProps = {
  activeStage?: Stage;
  activeMode: GameMode;
  childName: string;
  gameStarted: boolean;
  players: Player[];
  readyForReview: boolean;
  roomCode: string;
  settings: ParentSettings;
  stages: Stage[];
  onApprove: () => void;
  onGallery: (value: boolean) => void;
  onHide: () => void;
  onLock: (value: boolean) => void;
  onMode: (mode: GameMode) => void;
  onPreview: (childName?: string) => void;
  onRequireApproval: (value: boolean) => void;
  onSound: (value: boolean) => void;
  onStage: (id: string) => void;
  onStart: () => void;
  onTimer: (value: number) => void;
  onShowHelp: () => void;
};

export function ParentDashboard({
  activeStage,
  activeMode,
  childName,
  gameStarted,
  players,
  readyForReview,
  roomCode,
  settings,
  stages,
  onApprove,
  onGallery,
  onHide,
  onLock,
  onMode,
  onPreview,
  onRequireApproval,
  onSound,
  onStage,
  onStart,
  onTimer,
  onShowHelp,
}: ParentDashboardProps) {
  const filteredStages = stages.filter((stage) => activeMode === 'mixed' || stage.mode === activeMode || activeMode === 'free');
  const firstPlayer = players[0] ?? { name: childName, progress: 0, drawingData: null };
  const didMountRef = useRef(false);
  const noticeTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const [roomNotice, setRoomNotice] = useState<{ id: number; text: string } | null>(null);

  function showRoomNotice(text = 'Комната обновлена') {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }

    setRoomNotice({ id: Date.now(), text });
    noticeTimerRef.current = window.setTimeout(() => setRoomNotice(null), 3200);
  }

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    showRoomNotice();
  }, [gameStarted, players.length, roomCode]);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  async function copyRoomCode() {
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard is unavailable');
      }
      await navigator.clipboard.writeText(roomCode);
      showRoomNotice('Код скопирован');
    } catch {
      showRoomNotice('Код комнаты готов');
    }
  }

  return (
    <section className="parentLayout">
      <section className="parentHero">
        <div>
          <p className="eyebrow">Панель хоста</p>
          <h1>Дэшборд занятия</h1>
          <p>Вход детей, режимы игры, категории, проверка рисунков и быстрый просмотр в одном месте.</p>
        </div>
        <button className="roundHelp" type="button" onClick={onShowHelp} aria-label="Обучение">
          <HelpCircle size={24} />
        </button>
      </section>

      <section className="parentGrid dashboardGrid">
        <div className="dashboardColumn">
          <Panel title="Комната и вход" hint="Покажите код детям. Они входят по имени, а хост видит их в списке.">
            {roomNotice && (
              <div key={roomNotice.id} className="roomUpdateToast" role="status">
                {roomNotice.text}
              </div>
            )}
            <div className="roomSummary">
              <div className="qrCard compact">
                <QrCode size={42} />
                <span>Код комнаты</span>
                <strong>{roomCode}</strong>
              </div>
              <div>
                <strong>{players.length} игрока подключено</strong>
                <p className="panelHint">Текущий ребенок: {childName}</p>
              </div>
            </div>
            <div className="roomActions">
              <button className="secondaryButton" type="button" onClick={copyRoomCode}>
                <Copy size={20} />
                Скопировать код
              </button>
              <button className="primaryButton" type="button" onClick={onStart}>
                <Play size={20} />
                {gameStarted ? 'Продолжить занятие' : 'Начать занятие'}
              </button>
            </div>
          </Panel>

          <Panel title="Категории рисунков" hint="Категорию выбирает хост. У ребенка остается только большой холст.">
            <div className="stageList">
              {filteredStages.map((stage) => (
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

          <Panel title="Контроль" hint="Эти настройки помогают вести занятие без лишних экранов.">
            <ToggleRow label="Проверять рисунок перед показом" checked={settings.requireApproval} onChange={onRequireApproval} />
            <ToggleRow label="Показать галерею в конце" checked={settings.galleryEnabled} onChange={onGallery} />
            <ToggleRow label="Звук подсказок" checked={settings.soundEnabled} onChange={onSound} />
            <ToggleRow label="Пауза рисования" checked={settings.drawingLocked} onChange={onLock} />
          </Panel>
        </div>

        <div className="dashboardColumn">
          <Panel title="Режим игры" hint="Режимы не удалены: хост выбирает, будет ли только рисование, вопросы или смешанный сценарий.">
            <div className="modeList">
              {gameModes.map((mode) => (
                <button key={mode.id} className={mode.id === activeMode ? 'modeCard isSelected' : 'modeCard'} type="button" onClick={() => onMode(mode.id)}>
                  <strong>{mode.title}</strong>
                  <small>{mode.note}</small>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Игроки" hint="Прогресс обновляется, когда ребенок рисует. После кнопки “Готово” работа попадает в проверку.">
            <div className="playerList">
              {players.map((player) => (
                <article key={player.id}>
                  <strong>{player.name}</strong>
                  <div className="smallTrack">
                    <span style={{ width: `${player.progress}%` }} />
                  </div>
                  <StatusBadge status={player.status} />
                  <button className="iconAction" type="button" onClick={() => onPreview(player.name)} aria-label={`Просмотреть рисунок ${player.name}`}>
                    <Eye size={18} />
                  </button>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="Таймер" hint="Для детей 5-6 лет лучше короткие раунды по 3-5 минут.">
            <label className="timerControl">
              <span>Минут на рисунок</span>
              <input min="2" max="10" value={settings.timer} type="range" onChange={(event) => onTimer(Number(event.target.value))} />
              <strong>{settings.timer}</strong>
            </label>
          </Panel>

          <Panel title="Проверка рисунка" hint="Кнопка “Просмотр” открывает работу крупно. После “Готово” статус становится “Ждет проверки”.">
            <div className={readyForReview ? 'reviewNotice isReady' : 'reviewNotice'}>
              {readyForReview ? 'Работа готова к проверке' : 'Пока ребенок рисует'}
            </div>
            <div className="approvalPreview">
              {activeStage?.src && <img src={activeStage.src} alt="" />}
              <div>
                <strong>{firstPlayer.name}</strong>
                <span>{firstPlayer.progress}% готово</span>
              </div>
            </div>
            <div className="approvalActions">
              <button className="secondaryButton" type="button" onClick={() => onPreview(firstPlayer.name)}>
                <Eye size={20} />
                Просмотр
              </button>
              <button className="primaryButton" type="button" onClick={onApprove}>
                <ShieldCheck size={20} />
                Одобрить
              </button>
              <button className="dangerButton" type="button" onClick={onHide}>
                Скрыть
              </button>
            </div>
          </Panel>
        </div>
      </section>
    </section>
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
    drawing: 'Рисует',
    waiting: 'Ждет проверки',
    approved: 'Одобрено',
    hidden: 'Скрыто',
  };

  return <span className={`statusBadge ${status}`}>{labels[status]}</span>;
}
