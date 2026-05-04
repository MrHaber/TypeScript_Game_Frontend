import { Star, Trophy } from 'lucide-react';
import type { Player, Role, Stage } from './types';

type WinnersScreenProps = {
  childName: string;
  players: Player[];
  role: Role;
  stages: Stage[];
  winnersBackground: string;
  onClose?: () => void;
  onPreview: (childName?: string) => void;
  onRestart?: () => void;
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';
}

function stars(value = 0) {
  return Array.from({ length: 5 }, (_, index) => (
    <Star key={index} size={16} fill={index < value ? 'currentColor' : 'none'} />
  ));
}

export function WinnersScreen({ childName, players, role, stages, winnersBackground, onClose, onPreview, onRestart }: WinnersScreenProps) {
  const ranked = [...players].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.progress - a.progress || a.name.localeCompare(b.name, 'ru'));
  const ratedPlayers = ranked.filter((player) => (player.rating ?? 0) > 0);
  const averageRating =
    ratedPlayers.length > 0
      ? ratedPlayers.reduce((sum, player) => sum + (player.rating ?? 0), 0) / ratedPlayers.length
      : 0;
  const ownPlayer = ranked.find((player) => player.name.toLowerCase() === childName.toLowerCase()) ?? ranked[0];

  function stageFor(player: Player) {
    return stages.find((stage) => stage.id === player.stageId) ?? stages[0];
  }

  return (
    <section className="winnersScreen">
      <div className="winnersTopbar">
        <div>
          <p className="eyebrow">Итоги занятия</p>
          <h1>Победители</h1>
        </div>
        {role === 'parent' && (
          <div className="winnersActions">
            {onClose && (
              <button className="secondaryButton compactButton" type="button" onClick={onClose}>
                Вернуться
              </button>
            )}
            {onRestart && (
              <button className="primaryButton compactButton" type="button" onClick={onRestart}>
                Перезапустить
              </button>
            )}
          </div>
        )}
      </div>

      <div className="winnersLayout">
        <div className="podiumScene" style={{ backgroundImage: winnersBackground ? `url("${winnersBackground}")` : undefined }}>
          {ranked.slice(0, 3).map((player, index) => (
            <button className={`podiumAvatar podium${index + 1}`} type="button" key={player.id} onClick={() => onPreview(player.name)}>
              <span>{initials(player.name)}</span>
              <strong>{player.name}</strong>
              <em>{index + 1}</em>
            </button>
          ))}
        </div>

        <aside className="winnersTablePanel">
          <div className="averageCard">
            <Trophy size={24} />
            <span>Средняя оценка</span>
            <strong>{averageRating.toFixed(1)}</strong>
          </div>

          <div className="ratingTable">
            {ranked.map((player, index) => (
              <article className={player.name.toLowerCase() === childName.toLowerCase() ? 'isOwn' : ''} key={player.id}>
                <span>{index + 1}</span>
                <strong>{player.name}</strong>
                <em>{stars(player.rating ?? 0)}</em>
                <small>{player.progress}%</small>
              </article>
            ))}
          </div>
        </aside>
      </div>

      {ownPlayer && (
        <section className="ownResultPanel">
          <div>
            <p className="eyebrow">Мой результат</p>
            <h2>{ownPlayer.name}</h2>
          </div>
          <div className="ownResultStats">
            <span>{ownPlayer.progress}% готово</span>
            <strong>{stars(ownPlayer.rating ?? 0)}</strong>
          </div>
        </section>
      )}

      <section className="resultGallery">
        {ranked.map((player) => {
          const stage = stageFor(player);
          return (
            <article className={player.name.toLowerCase() === childName.toLowerCase() ? 'isOwn' : ''} key={player.id}>
              <button type="button" onClick={() => onPreview(player.name)}>
                {stage?.src && <img src={stage.src} alt="" />}
                {player.drawingData && <img className="galleryDrawingLayer" src={player.drawingData} alt={`Рисунок ${player.name}`} />}
              </button>
              <div>
                <strong>{player.name}</strong>
                <span>{stars(player.rating ?? 0)}</span>
              </div>
              <small>{player.progress}% готово</small>
            </article>
          );
        })}
      </section>
    </section>
  );
}
