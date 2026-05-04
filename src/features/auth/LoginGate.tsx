import { LogIn, QrCode, ShieldCheck, Sparkles } from 'lucide-react';
import { uiIcons } from '../drawing/data';
import type { Role } from '../drawing/types';

type LoginGateProps = {
  childName: string;
  hostName: string;
  roomCode: string;
  statusText?: string;
  onChildName: (value: string) => void;
  onHostName: (value: string) => void;
  onRoomCode: (value: string) => void;
  onLogin: (role: Exclude<Role, 'login'>) => void;
  onCopyRoom: () => void;
};

function IconImage({ src }: { src?: string }) {
  return src ? <img className="uiIcon" src={src} alt="" /> : null;
}

function QrMosaic({ value }: { value: string }) {
  const seed = value || 'UCHI';
  const cells = Array.from({ length: 49 }, (_, index) => {
    const x = index % 7;
    const y = Math.floor(index / 7);
    const finder =
      (x < 2 && y < 2) ||
      (x > 4 && y < 2) ||
      (x < 2 && y > 4);
    const char = seed.charCodeAt(index % seed.length) || 0;
    return finder || (char + index * 11) % 5 < 2;
  });

  return (
    <div className="qrMosaic" aria-label={`QR код комнаты ${value}`}>
      {cells.map((active, index) => (
        <span className={active ? 'isDark' : ''} key={`${value}-${index}`} />
      ))}
    </div>
  );
}

export function LoginGate({
  childName,
  hostName,
  roomCode,
  statusText,
  onChildName,
  onHostName,
  onRoomCode,
  onLogin,
  onCopyRoom,
}: LoginGateProps) {
  return (
    <section className="loginLayout">
      <div className="loginHero">
        <p className="eyebrow">Вход в занятие</p>
        <h1>Кто сегодня рисует?</h1>
        <p>
          Взрослый создает комнату и показывает QR-код. Ребенок вводит имя и код комнаты,
          после этого попадает в рисовашку.
        </p>
      </div>

      {statusText && <div className="loginStatus">{statusText}</div>}

      <div className="loginCards">
        <article className="loginCard">
          <Sparkles size={34} />
          <h2>Ребенок</h2>
          <label>
            <span>Имя ребенка</span>
            <input value={childName} onChange={(event) => onChildName(event.target.value)} placeholder="Например, Миша" />
          </label>
          <label>
            <span>Код комнаты</span>
            <input value={roomCode} onChange={(event) => onRoomCode(event.target.value.toUpperCase())} placeholder="UCHI-482" />
          </label>
          <button className="primaryButton" type="button" onClick={() => onLogin('child')}>
            <LogIn size={20} />
            Войти рисовать
          </button>
        </article>

        <article className="loginCard host">
          <ShieldCheck size={34} />
          <h2>Взрослый</h2>
          <label>
            <span>Имя ведущего</span>
            <input value={hostName} onChange={(event) => onHostName(event.target.value)} placeholder="Например, Светлана" />
          </label>
          <div className="qrCard compact">
            <QrCode size={36} />
            <QrMosaic value={roomCode} />
            <span>Код для детей</span>
            <strong>{roomCode}</strong>
          </div>
          <div className="loginActions">
            <button className="secondaryButton" type="button" onClick={onCopyRoom}>
              <IconImage src={uiIcons.copy} />
              Скопировать код
            </button>
            <button className="primaryButton" type="button" onClick={() => onLogin('parent')}>
              <IconImage src={uiIcons.addPeople} />
              Создать комнату
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
