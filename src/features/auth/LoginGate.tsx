import { LogIn, QrCode, ShieldCheck, Sparkles } from 'lucide-react';
import type { Role } from '../drawing/types';

type LoginGateProps = {
  childName: string;
  error?: string;
  hostName: string;
  loading?: boolean;
  parentLogin: string;
  parentPassword: string;
  parentRegistering: boolean;
  roomCode: string;
  onChildName: (value: string) => void;
  onHostName: (value: string) => void;
  onParentLogin: (value: string) => void;
  onParentPassword: (value: string) => void;
  onParentRegistering: (value: boolean) => void;
  onRoomCode: (value: string) => void;
  onLogin: (role: Exclude<Role, 'login'>) => void | Promise<void>;
};

export function LoginGate({
  childName,
  error,
  hostName,
  loading = false,
  parentLogin,
  parentPassword,
  parentRegistering,
  roomCode,
  onChildName,
  onHostName,
  onParentLogin,
  onParentPassword,
  onParentRegistering,
  onRoomCode,
  onLogin,
}: LoginGateProps) {
  return (
    <section className="loginLayout">
      <div className="loginHero">
        <p className="eyebrow">Вход в занятие</p>
        <h1>Кто сегодня рисует?</h1>
        <p>Родитель открывает комнату по своему имени и коду, дети входят в ту же комнату по имени.</p>
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
          <h2>Родитель</h2>
          <div className="authModeSwitch" aria-label="Режим входа родителя">
            <button className={!parentRegistering ? 'isSelected' : ''} type="button" onClick={() => onParentRegistering(false)}>
              Войти
            </button>
            <button className={parentRegistering ? 'isSelected' : ''} type="button" onClick={() => onParentRegistering(true)}>
              Регистрация
            </button>
          </div>
          <label>
            <span>Логин аккаунта</span>
            <input value={parentLogin} onChange={(event) => onParentLogin(event.target.value)} placeholder="email или имя" />
          </label>
          <label>
            <span>Пароль</span>
            <input value={parentPassword} onChange={(event) => onParentPassword(event.target.value)} placeholder="Минимум 4 символа" type="password" />
          </label>
          <label>
            <span>Имя на занятии</span>
            <input value={hostName} onChange={(event) => onHostName(event.target.value)} placeholder="Например, Светлана" />
          </label>
          <div className="qrCard compact">
            <QrCode size={42} />
            <span>UUID комнаты</span>
            <strong>{roomCode}</strong>
          </div>
          <button className="secondaryButton" type="button" onClick={() => onLogin('parent')} disabled={loading}>
            <ShieldCheck size={20} />
            {loading ? 'Открываем...' : parentRegistering ? 'Создать аккаунт' : 'Войти в панель'}
          </button>
        </article>
      </div>
    </section>
  );
}
