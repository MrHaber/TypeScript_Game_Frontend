import { ReactNode } from 'react';
import { HTMLMotionProps, motion } from 'framer-motion';

type CardProps = HTMLMotionProps<'section'> & {
  children: ReactNode;
  interactive?: boolean;
};

export function Card({ children, interactive = false, className = '', ...props }: CardProps) {
  const classNames = `card ${interactive ? 'cardInteractive' : ''} ${className}`.trim();

  return (
    <motion.section
      className={classNames}
      whileHover={interactive ? { y: -4, scale: 1.01 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 360, damping: 24 }}
      {...props}
    >
      {children}
    </motion.section>
  );
}
