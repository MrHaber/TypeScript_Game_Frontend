import { motion } from 'framer-motion';

type AnimatedCharacterProps = {
  compact?: boolean;
};

export function AnimatedCharacter({ compact = false }: AnimatedCharacterProps) {
  return (
    <motion.div
      className={`paperCharacter ${compact ? 'paperCharacterCompact' : ''}`}
      animate={{ y: [0, -8, 0], rotate: [-1.5, 1.5, -1.5] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      aria-label="Анимированный бумажный персонаж"
    >
      <motion.div className="paperHead" animate={{ scaleY: [1, 0.92, 1] }} transition={{ duration: 3, repeat: Infinity }} />
      <div className="paperBody" />
      <motion.div className="paperArm left" animate={{ rotate: [-18, 10, -18] }} transition={{ duration: 2, repeat: Infinity }} />
      <motion.div className="paperArm right" animate={{ rotate: [18, -10, 18] }} transition={{ duration: 2, repeat: Infinity }} />
      <div className="paperFace">
        <span />
        <span />
      </div>
    </motion.div>
  );
}
