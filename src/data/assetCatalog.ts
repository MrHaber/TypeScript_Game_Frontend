import avatarKidsUrl from '../assets/extracted/avatar_kids.svg';
import badgePackUrl from '../assets/extracted/badge_pack.svg';
import englishCreatureUrl from '../assets/extracted/english_creature.svg';
import farmFriendUrl from '../assets/extracted/farm_friend.svg';
import musicStageUrl from '../assets/extracted/music_stage.svg';
import profilePeopleUrl from '../assets/extracted/profile_people.svg';
import rewardDinoUrl from '../assets/extracted/reward_dino.svg';

export type VisualAsset = {
  id: string;
  title: string;
  src: string;
  width: number;
  height: number;
  aspectRatio: number;
  weightKb: number;
  category: 'icons' | 'characters' | 'theme';
  styleRole: 'primary-ui' | 'reward' | 'learning' | 'background' | 'seasonal';
  visualNotes: string;
  recommendedUse: string[];
  hasWhiteBoard: boolean;
};

export const visualAssets: VisualAsset[] = [
  {
    id: 'avatar-kids',
    title: 'Дети',
    src: avatarKidsUrl,
    width: 260,
    height: 250,
    aspectRatio: 260 / 250,
    weightKb: 51.5,
    category: 'characters',
    styleRole: 'primary-ui',
    visualNotes: 'Компактный персонажный кроп для аватаров, профиля и маленьких карточек.',
    recommendedUse: ['avatar-pool', 'profile-side-art', 'login-detail'],
    hasWhiteBoard: false,
  },
  {
    id: 'badges',
    title: 'Бейджи',
    src: badgePackUrl,
    width: 560,
    height: 240,
    aspectRatio: 560 / 240,
    weightKb: 25.1,
    category: 'icons',
    styleRole: 'primary-ui',
    visualNotes: 'Легкий набор UI-иконок для достижений, звезд и прогресса.',
    recommendedUse: ['achievement-badges', 'progress-icons', 'reward-stars'],
    hasWhiteBoard: false,
  },
  {
    id: 'people',
    title: 'Персонажи Учи.ру',
    src: profilePeopleUrl,
    width: 620,
    height: 360,
    aspectRatio: 620 / 360,
    weightKb: 124.9,
    category: 'characters',
    styleRole: 'primary-ui',
    visualNotes: 'Самый универсальный кроп для входа, меню и галереи.',
    recommendedUse: ['profile', 'login-hero', 'gallery-cards'],
    hasWhiteBoard: false,
  },
  {
    id: 'dinos',
    title: 'Завры',
    src: rewardDinoUrl,
    width: 680,
    height: 520,
    aspectRatio: 680 / 520,
    weightKb: 229.4,
    category: 'characters',
    styleRole: 'reward',
    visualNotes: 'Яркий брендовый кроп для награды и повышения уровня.',
    recommendedUse: ['reward-screen', 'level-up', 'locked-avatar-preview'],
    hasWhiteBoard: false,
  },
  {
    id: 'english',
    title: 'Английский герой',
    src: englishCreatureUrl,
    width: 320,
    height: 310,
    aspectRatio: 320 / 310,
    weightKb: 138.6,
    category: 'theme',
    styleRole: 'learning',
    visualNotes: 'Учебный персонаж для подсказок, редактора и обучающих карточек.',
    recommendedUse: ['tips', 'editor-background', 'drawing-card'],
    hasWhiteBoard: false,
  },
  {
    id: 'music',
    title: 'Музыкальная сцена',
    src: musicStageUrl,
    width: 720,
    height: 520,
    aspectRatio: 720 / 520,
    weightKb: 29,
    category: 'theme',
    styleRole: 'background',
    visualNotes: 'Легкий тематический кроп для редких событий и карточек.',
    recommendedUse: ['themed-background', 'special-event-card'],
    hasWhiteBoard: false,
  },
  {
    id: 'farm',
    title: 'Ферма',
    src: farmFriendUrl,
    width: 560,
    height: 520,
    aspectRatio: 560 / 520,
    weightKb: 495.7,
    category: 'theme',
    styleRole: 'seasonal',
    visualNotes: 'Детализированный сезонный кроп, использовать точечно.',
    recommendedUse: ['seasonal-background', 'large-preview-only'],
    hasWhiteBoard: false,
  },
];

export const drawingAssetById: Record<string, string> = {
  'forest-band': 'people',
  'space-friends': 'dinos',
  'city-day': 'english',
  'candy-park': 'badges',
  'sea-quest': 'music',
  'snow-stage': 'farm',
};

export function assetById(id: string) {
  return visualAssets.find((asset) => asset.id === id) ?? visualAssets[0];
}
