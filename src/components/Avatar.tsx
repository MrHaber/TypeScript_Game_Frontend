import { motion } from 'framer-motion';

const avatarStyles: Record<string, string> = {
  sun: 'linear-gradient(135deg, #ffd166, #f97316)',
  rocket: 'linear-gradient(135deg, #8ecae6, #4361ee)',
  paint: 'linear-gradient(135deg, #ffafcc, #bde0fe)',
};

type AvatarProps = {
  avatarId: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
};

export function Avatar({ avatarId, size = 'md', label = 'Аватар' }: AvatarProps) {
  return (
    <motion.div
      aria-label={label}
      className={`avatar avatar-${size}`}
      style={{ background: avatarStyles[avatarId] ?? avatarStyles.sun }}
      whileHover={{ rotate: -3, scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 320, damping: 18 }}
    >
      <span>{avatarId === 'rocket' ? 'R' : avatarId === 'paint' ? 'P' : 'U'}</span>
    </motion.div>
  );
}
