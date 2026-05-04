import { LogIn, QrCode, ShieldCheck, Sparkles } from 'lucide-react';
import type { Role } from '../drawing/types';

type LoginGateProps = {
  childName: string;
  error?: string;
  hostName: string;
  loading?: boolean;
  roomCode: string;
  onChildName: (value: string) => void;
  onHostName: (value: string) => void;
  onRoomCode: (value: string) => void;
  onLogin: (role: Exclude<Role, 'login'>) => void | Promise<void>;
};

export function LoginGate({
  childName,
  error,
  hostName,
  loading = false,
  roomCode,
  onChildName,
  onHostName,
  onRoomCode,
  onLogin,
}: LoginGateProps) {
  return (
    <section className="loginLayout">
      <div className="loginHero">
        <p className="eyebrow">Вход в занятие</p>
        <h1>Кто сегодня рисует?</h1>
        <p>Хост открывает комнату по своему имени и UUID, дети входят в ту же комнату по имени.</p>
        {error && (
          <div className="loginError" role="alert">
            {error}
          </div>
        )}
      </div>

      <div className="loginCards">
        <article className="loginCard">
          <Sparkles size={34} />
          <h2>Ребенок</h2>
          <label>
            <span>Имя ребенка</span>
            <input value={childName} onChange={(event) => onChildName(event.target.value)} placeholder="Например, Миша" />
          </label>
          <label>
            <span>UUID комнаты</span>
            <input value={roomCode} onChange={(event) => onRoomCode(event.target.value.trim())} placeholder="UUID комнаты" />
          </label>
          <button className="primaryButton" type="button" onClick={() => onLogin('child')} disabled={loading}>
            <LogIn size={20} />
            {loading ? 'Подключаем...' : 'Войти рисовать'}
          </button>
        </article>

        <article className="loginCard host">
          <ShieldCheck size={34} />
          <h2>Хост</h2>
          <label>
            <span>Логин хоста</span>
            <input value={hostName} onChange={(event) => onHostName(event.target.value)} placeholder="Например, Светлана" />
          </label>
          <div className="qrCard compact">
            <QrCode size={42} />
            <span>UUID комнаты</span>
            <strong>{roomCode}</strong>
          </div>
          <button className="secondaryButton" type="button" onClick={() => onLogin('parent')} disabled={loading}>
            <ShieldCheck size={20} />
            {loading ? 'Открываем...' : 'Открыть панель'}
          </button>
        </article>
      </div>
    </section>
  );
}
