import { Achievement, Drawing, Player } from '../types';

export const initialPlayer: Player = {
  name: 'Миша',
  title: 'Юный художник',
  stars: 3,
  dayStars: 2,
  level: 1,
  avatarId: 'sun',
  unlockedAvatarIds: ['sun', 'rocket'],
};

export const drawings: Drawing[] = [
  {
    id: 'forest-band',
    title: 'Рисунок',
    progress: 60,
    palette: ['#9fd6b6', '#f9d66d', '#ff8c66'],
    shadowSlot: 1,
    completed: false,
  },
  {
    id: 'space-friends',
    title: 'Рисунок',
    progress: 20,
    palette: ['#92b7ff', '#ffd166', '#ef476f'],
    shadowSlot: 2,
    completed: false,
  },
  {
    id: 'city-day',
    title: 'Рисунок',
    progress: 100,
    palette: ['#8ecae6', '#ffb703', '#fb8500'],
    shadowSlot: 1,
    completed: true,
  },
  {
    id: 'candy-park',
    title: 'Рисунок',
    progress: 45,
    palette: ['#ffc6ff', '#bdb2ff', '#a0c4ff'],
    shadowSlot: 2,
    completed: false,
  },
  {
    id: 'sea-quest',
    title: 'Рисунок',
    progress: 80,
    palette: ['#80ed99', '#57cc99', '#38a3a5'],
    shadowSlot: 1,
    completed: false,
  },
  {
    id: 'snow-stage',
    title: 'Рисунок',
    progress: 10,
    palette: ['#caf0f8', '#ffd6a5', '#fdffb6'],
    shadowSlot: 2,
    completed: false,
  },
];

export const achievements: Achievement[] = [
  {
    id: 'first-star',
    icon: 'Star',
    title: 'Первая звезда',
    description: 'Завершить первый рисунок и получить награду.',
    unlocked: true,
    rarity: 'common',
  },
  {
    id: 'daily-three',
    icon: 'Trophy',
    title: 'Три за день',
    description: 'Собрать 3 звезды за день и повысить уровень.',
    unlocked: true,
    rarity: 'rare',
  },
  {
    id: 'background-maker',
    icon: 'Palette',
    title: 'Мастер фона',
    description: 'Сохранить рисунок с собственным вариантом фона.',
    unlocked: false,
    rarity: 'common',
  },
  {
    id: 'living-paper',
    icon: 'Sparkles',
    title: 'Живой герой',
    description: 'Открыть анимированного персонажа из бумажного рисунка.',
    unlocked: false,
    rarity: 'epic',
  },
];

export const tips = [
  'Ребенок может менять фон для артов',
  'Можно создать фон вручную',
  'Можно использовать мультяшные фоны',
];

export const titlesByLevel = ['Юный художник', 'Искатель звезд', 'Мастер бумаги', 'Герой историй'];
