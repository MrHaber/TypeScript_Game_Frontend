import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

type StarCounterProps = {
  stars: number;
  max?: number;
  animated?: boolean;
};

export function StarCounter({ stars, max = 3, animated = true }: StarCounterProps) {
  return (
    <div className="starCounter" aria-label={`${stars} звезд`}>
      {Array.from({ length: max }).map((_, index) => {
        const active = index < stars;
        return (
          <motion.span
            key={index}
            className={`starPill ${active ? 'starActive' : ''}`}
            whileHover={animated ? { y: -3, rotate: 8, scale: 1.12 } : undefined}
            transition={{ type: 'spring', stiffness: 460, damping: 18 }}
          >
            <Star size={22} fill={active ? 'currentColor' : 'none'} />
          </motion.span>
        );
      })}
    </div>
  );
}
