import { Check, Printer, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '../components/Header';
import { Avatar } from '../components/Avatar';
import { StarCounter } from '../components/StarCounter';
import { AnimatedCharacter } from '../components/AnimatedCharacter';
import { AssetPreview } from '../components/AssetPreview';
import { assetById } from '../data/assetCatalog';
import { Drawing, Player, Screen } from '../types';
import { makeSvgDataUri } from '../utils/art';

type RewardScreenProps = {
  player: Player;
  drawing: Drawing;
  justClaimed: boolean;
  onNavigate: (screen: Screen) => void;
  onClaimReward: () => void;
};

export function RewardScreen({ player, drawing, justClaimed, onNavigate, onClaimReward }: RewardScreenProps) {
  const rewardAsset = assetById('dinos');

  return (
    <main className="screen">
      <Header title="Награда" player={player} onNavigate={onNavigate} showBack showProfile={false} />

      <section className="rewardTop">
        <Avatar avatarId={player.avatarId} size="md" />
        <StarCounter stars={Math.min(player.stars, 3)} max={3} />
      </section>

      <section className="rewardCard">
        <AssetPreview asset={rewardAsset} className="rewardDecorAsset" alt="Наградный персонаж" />
        <img className="rewardDrawingImage" src={makeSvgDataUri(drawing, 420)} alt="Загруженный рисунок" />
        <AnimatedCharacter />
        {justClaimed && (
          <motion.div
            className="rewardBurst"
            initial={{ scale: 0.2, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          >
            +1 звезда
          </motion.div>
        )}
      </section>

      <div className="rewardActions">
        <button className="primaryButton largeButton" type="button" onClick={onClaimReward}>
          <Check size={24} />
          Получить награду
        </button>
        <button className="iconTextButton" type="button">
          <Printer size={22} />
          Печать
        </button>
        <button className="iconTextButton" type="button">
          <Share2 size={22} />
          Поделиться
        </button>
      </div>
    </main>
  );
}
