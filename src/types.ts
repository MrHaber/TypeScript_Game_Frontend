export type Screen = 'login' | 'menu' | 'profile' | 'achievements' | 'reward' | 'editor' | 'parent';

export type BackgroundKind = 'shadow' | 'color' | 'art';

export type Drawing = {
  id: string;
  title: string;
  progress: number;
  palette: string[];
  shadowSlot: 1 | 2;
  completed: boolean;
};

export type Achievement = {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic';
};

export type Player = {
  id?: number;
  name: string;
  title: string;
  stars: number;
  dayStars: number;
  level: number;
  avatarId: string;
  unlockedAvatarIds: string[];
};

export type UnityOutboundEvent =
  | { type: 'drawing_selected'; drawingId: string; shadowSlot: 1 | 2 }
  | { type: 'reward_claimed'; drawingId: string; stars: number; level: number }
  | { type: 'background_saved'; drawingId: string; backgroundKind: BackgroundKind }
  | { type: 'profile_opened'; level: number; stars: number };

export type AppSnapshot = {
  player: Player;
  drawings: Drawing[];
  achievements: Achievement[];
};

export type AuthResponse = AppSnapshot & {
  token: string;
};
