import { Eye, HelpCircle, Play, QrCode, ShieldCheck } from 'lucide-react';
import { Panel } from '../../components/Panel';
import { gameModes, uiIcons } from '../drawing/data';
import type { ApprovalStatus, GameMode, ParentSettings, Player, Stage } from '../drawing/types';

type ParentDashboardProps = {
  activeStage?: Stage;
  activeMode: GameMode;
  childName: string;
  gameStarted: boolean;
  players: Player[];
  readyForReview: boolean;
  roomCode: string;
  savedDrawingUrl?: string;
  settings: ParentSettings;
  stages: Stage[];
  onApprove: () => void;
  onCopyInvite: () => void;
  onGallery: (value: boolean) => void;
  onHide: () => void;
  onLock: (value: boolean) => void;
  onMode: (mode: GameMode) => void;
  onPreview: () => void;
  onRequireApproval: (value: boolean) => void;
  onSound: (value: boolean) => void;
  onStage: (id: string) => void;
  onStart: () => void;
  onTimer: (value: number) => void;
  onShowHelp: () => void;
};

function IconImage({ src }: { src?: string }) {
  return src ? <img className="uiIcon" src={src} alt="" /> : null;
}

function QrMosaic({ value }: { value: string }) {
  const seed = value || 'UCHI';
  return (
    <div className="qrMosaic small" aria-label={`QR код комнаты ${value}`}>
      {Array.from({ length: 49 }, (_, index) => {
        const x = index % 7;
        const y = Math.floor(index / 7);
        const finder = (x < 2 && y < 2) || (x > 4 && y < 2) || (x < 2 && y > 4);
        const active = finder || ((seed.charCodeAt(index % seed.length) || 0) + index * 13) % 5 < 2;
        return <span className={active ? 'isDark' : ''} key={`${value}-${index}`} />;
      })}
    </div>
  );
}

export function ParentDashboard({
  activeStage,
  activeMode,
  childName,
  gameStarted,
  players,
  readyForReview,
  roomCode,
  savedDrawingUrl,
  settings,
  stages,
  onApprove,
  onCopyInvite,
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
  const firstPlayer = players[0];

  return (
    <section className="parentLayout">
      <section className="parentHero">
        <div>
          <p className="eyebrow">Панель взрослого</p>
          <h1>Комната, дети и проверка рисунков</h1>
          <p>Здесь создается занятие, выбирается категория, запускается раунд и проверяются готовые работы.</p>
        </div>
        <button className="roundHelp" type="button" onClick={onShowHelp} aria-label="Обучение">
          <HelpCircle size={24} />
        </button>
      </section>

      <section className="parentGrid dashboardGrid">
        <Panel title="Комната и вход" hint="Покажите детям код или QR-код. Вход работает через бекенд-комнату.">
          <div className="roomSummary">
            <div className="qrCard compact">
              <QrCode size={34} />
              <QrMosaic value={roomCode} />
              <span>Код комнаты</span>
              <strong>{roomCode}</strong>
            </div>
            <div>
              <strong>{players.length} игрока в списке</strong>
              <p className="panelHint">Текущий ребенок: {childName}. Код можно скопировать и отправить родителю или вывести на экран.</p>
            </div>
          </div>
          <div className="approvalActions">
            <button className="secondaryButton" type="button" onClick={onCopyInvite}>
              <IconImage src={uiIcons.copy} />
              Скопировать код
            </button>
            <button className="primaryButton" type="button" onClick={onStart}>
              <Play size={20} />
              {gameStarted ? 'Продолжить занятие' : 'Начать занятие'}
            </button>
          </div>
        </Panel>

        <Panel title="Режим игры" hint="Режим не скрывает категории: взрослый всегда видит все 6 рисунков.">
          <div className="modeList">
            {gameModes.map((mode) => (
              <button key={mode.id} className={mode.id === activeMode ? 'modeCard isSelected' : 'modeCard'} type="button" onClick={() => onMode(mode.id)}>
                <IconImage src={mode.id === 'quiz' ? uiIcons.quiz : uiIcons.game} />
                <strong>{mode.title}</strong>
                <small>{mode.note}</small>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Категории рисунков" hint="Все картинки из папки Images доступны как отдельные категории.">
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

        <Panel title="Игроки" hint="Прогресс обновляется, когда ребенок рисует и отправляет работу.">
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

        <Panel title="Контроль" hint="Настройки помогают вести занятие без лишних экранов.">
          <ToggleRow label="Проверять рисунок перед показом" checked={settings.requireApproval} onChange={onRequireApproval} />
          <ToggleRow label="Показать галерею в конце" checked={settings.galleryEnabled} onChange={onGallery} />
          <ToggleRow label="Звук подсказок" checked={settings.soundEnabled} onChange={onSound} />
          <ToggleRow label="Пауза рисования" checked={settings.drawingLocked} onChange={onLock} />
        </Panel>

        <Panel title="Таймер" hint="Для детей 5-6 лет лучше короткие раунды по 3-5 минут.">
          <label className="timerControl">
            <span>Минут на рисунок</span>
            <input min="2" max="10" value={settings.timer} type="range" onChange={(event) => onTimer(Number(event.target.value))} />
            <strong>{settings.timer}</strong>
          </label>
        </Panel>

        <Panel title="Проверка рисунка" hint="После кнопки Готово работа сохраняется на бекенд и появляется здесь.">
          <div className={readyForReview ? 'reviewNotice isReady' : 'reviewNotice'}>
            {readyForReview ? 'Работа готова к проверке' : 'Пока ребенок рисует'}
          </div>
          <div className="approvalPreview">
            {savedDrawingUrl ? <img src={savedDrawingUrl} alt="Рисунок ребенка" /> : activeStage?.src && <img src={activeStage.src} alt="" />}
            <div>
              <strong>{firstPlayer.name}</strong>
              <span>{firstPlayer.progress}% готово</span>
            </div>
          </div>
          <div className="approvalActions">
            <button className="secondaryButton" type="button" onClick={onPreview}>
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
    waiting: 'Ждет проверки',
    approved: 'Одобрено',
    hidden: 'Скрыто',
  };

  return <span className={`statusBadge ${status}`}>{labels[status]}</span>;
}
