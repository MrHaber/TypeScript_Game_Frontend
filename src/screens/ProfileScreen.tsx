import { Award, Pencil } from 'lucide-react';
import { Header } from '../components/Header';
import { Avatar } from '../components/Avatar';
import { DrawingCard } from '../components/DrawingCard';
import { StarCounter } from '../components/StarCounter';
import { AssetPreview } from '../components/AssetPreview';
import { assetById } from '../data/assetCatalog';
import { Drawing, Player, Screen } from '../types';

type ProfileScreenProps = {
  player: Player;
  drawings: Drawing[];
  onNavigate: (screen: Screen) => void;
  onSelectDrawing: (drawing: Drawing, nextScreen: Screen) => void;
  onAvatarEdit: () => void;
};

export function ProfileScreen({ player, drawings, onNavigate, onSelectDrawing, onAvatarEdit }: ProfileScreenProps) {
  const levelProgress = Math.min(100, (player.dayStars / 3) * 100);
  const avatarAsset = assetById('avatar-kids');

  return (
    <main className="screen">
      <Header title="Профиль" player={player} onNavigate={onNavigate} showBack showProfile={false} />

      <section className="profileHero">
        <Avatar avatarId={player.avatarId} size="lg" />
        <div className="profileInfo">
          <p className="eyebrow">{player.title}</p>
          <h2>{player.name}</h2>
          <StarCounter stars={player.stars} max={3} />
          <div className="levelBlock">
            <div className="levelHeader">
              <span>Уровень {player.level}</span>
              <span>{player.dayStars}/3 звезды сегодня</span>
            </div>
            <div className="levelTrack">
              <div className="levelFill" style={{ width: `${levelProgress}%` }} />
            </div>
          </div>
        </div>
        <div className="profileAssetFrame">
          <AssetPreview asset={avatarAsset} alt="Открытые аватары" />
        </div>
        <button className="primaryButton" type="button" onClick={onAvatarEdit}>
          <Pencil size={22} />
          Аватар
        </button>
      </section>

      <section className="profileActions">
        <button className="achievementActionButton" type="button" onClick={() => onNavigate('achievements')}>
          <Award size={24} />
          <span>Достижения</span>
        </button>
      </section>

      <section className="galleryHeader">
        <h2>Галерея рисунков</h2>
      </section>
      <section className="profileGallery">
        {drawings.slice(0, 4).map((drawing) => (
          <DrawingCard key={drawing.id} drawing={drawing} onOpen={(item) => onSelectDrawing(item, 'reward')} />
        ))}
      </section>
    </main>
  );
}
