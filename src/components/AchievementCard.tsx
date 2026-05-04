import { Lock, Palette, Sparkles, Star, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Achievement } from '../types';
import { Card } from './Card';

const iconMap = {
  Star,
  Trophy,
  Palette,
  Sparkles,
};

type AchievementCardProps = {
  achievement: Achievement;
};

export function AchievementCard({ achievement }: AchievementCardProps) {
  const Icon = iconMap[achievement.icon as keyof typeof iconMap] ?? Star;

  return (
    <Card interactive={achievement.unlocked} className={`achievementCard rarity-${achievement.rarity}`}>
      <div className={`achievementIcon ${achievement.unlocked ? 'unlocked' : 'locked'}`}>
        {achievement.unlocked ? <Icon size={26} /> : <Lock size={24} />}
      </div>
      <div className="achievementContent">
        <div className="achievementTitleRow">
          <h3>{achievement.title}</h3>
          <span className={achievement.unlocked ? 'statusOpen' : 'statusClosed'}>
            {achievement.unlocked ? 'открыто' : 'закрыто'}
          </span>
        </div>
        <p>{achievement.description}</p>
      </div>
      {achievement.unlocked && (
        <motion.div
          className="badge"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 360, damping: 18 }}
        >
          badge
        </motion.div>
      )}
    </Card>
  );
}
