import { LogIn, QrCode, ShieldCheck, Sparkles } from 'lucide-react';
import type { Role } from '../drawing/types';

type LoginGateProps = {
  childName: string;
  hostName: string;
  roomCode: string;
  onChildName: (value: string) => void;
  onHostName: (value: string) => void;
  onRoomCode: (value: string) => void;
  onLogin: (role: Exclude<Role, 'login'>) => void;
};

export function LoginGate({
  childName,
  hostName,
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
        <p>Ребенок входит по имени, а хост управляет комнатой, режимами и проверкой работ.</p>
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
          <h2>Хост</h2>
          <label>
            <span>Имя взрослого</span>
            <input value={hostName} onChange={(event) => onHostName(event.target.value)} placeholder="Например, Светлана" />
          </label>
          <div className="qrCard compact">
            <QrCode size={42} />
            <span>Код для детей</span>
            <strong>{roomCode}</strong>
          </div>
          <button className="secondaryButton" type="button" onClick={() => onLogin('parent')}>
            <ShieldCheck size={20} />
            Открыть панель
          </button>
        </article>
      </div>
    </section>
  );
}
