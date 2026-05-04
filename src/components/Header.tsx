import { ArrowLeft, UserRound } from 'lucide-react';
import { Avatar } from './Avatar';
import { Player, Screen } from '../types';

type HeaderProps = {
  title: string;
  player: Player;
  onNavigate: (screen: Screen) => void;
  showBack?: boolean;
  showProfile?: boolean;
};

export function Header({ title, player, onNavigate, showBack = false, showProfile = true }: HeaderProps) {
  return (
    <header className="topbar">
      <div className="topbarLeft">
        {showBack && (
          <button className="iconButton" type="button" aria-label="Назад" onClick={() => onNavigate('menu')}>
            <ArrowLeft size={24} />
          </button>
        )}
        <h1>{title}</h1>
      </div>

      <div className="topbarActions">
        {showProfile && (
          <button className="primaryButton ghostButton" type="button" onClick={() => onNavigate('profile')}>
            <UserRound size={22} />
            Профиль
          </button>
        )}
        <button className="avatarButton" type="button" aria-label="Открыть профиль" onClick={() => onNavigate('profile')}>
          <Avatar avatarId={player.avatarId} size="sm" />
        </button>
      </div>
    </header>
  );
}
