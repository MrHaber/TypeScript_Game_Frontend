import { Header } from '../components/Header';
import { Avatar } from '../components/Avatar';
import { AchievementCard } from '../components/AchievementCard';
import { AssetPreview } from '../components/AssetPreview';
import { assetById } from '../data/assetCatalog';
import { Achievement, Player, Screen } from '../types';

type AchievementsScreenProps = {
  player: Player;
  achievements: Achievement[];
  onNavigate: (screen: Screen) => void;
};

export function AchievementsScreen({ player, achievements, onNavigate }: AchievementsScreenProps) {
  const badgeAsset = assetById('badges');

  return (
    <main className="screen">
      <Header title="Достижения" player={player} onNavigate={onNavigate} showBack showProfile={false} />

      <section className="achievementHero achievementHeroWithAsset">
        <Avatar avatarId={player.avatarId} size="md" />
        <div>
          <p className="eyebrow">Титул</p>
          <h2>
            {player.title} {player.name}
          </h2>
        </div>
        <div className="achievementAssetFrame">
          <AssetPreview asset={badgeAsset} alt="Бейджи достижений" />
        </div>
      </section>

      <section className="achievementList" aria-label="Список достижений">
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </section>
    </main>
  );
}
