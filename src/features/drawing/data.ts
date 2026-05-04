import type { GameMode, Player, Stage } from './types';

const imageModules = import.meta.glob('../../../Images/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

export const drawingColors = ['#765FDE', '#FF6170', '#87D34C', '#75C7FF', '#FFC388', '#2F2F45'];

export const gameModes: Array<{ id: GameMode; title: string; note: string }> = [
  { id: 'drawing', title: 'Рисование', note: 'Большой холст, короткая подсказка и простые инструменты.' },
  { id: 'quiz', title: 'Вопросы', note: 'Короткие вопросы от ведущего без лишнего текста у ребенка.' },
  { id: 'mixed', title: 'Рисунок + вопрос', note: 'Сначала рисуем, потом обсуждаем рисунок с группой.' },
  { id: 'free', title: 'Свободная игра', note: 'Без таймера: только фон, кисть и спокойное творчество.' },
];

export const initialPlayers: Player[] = [
  { id: 1, name: 'Миша', age: 6, progress: 0, status: 'waiting' },
  { id: 2, name: 'Ника', age: 5, progress: 30, status: 'approved' },
  { id: 3, name: 'Руслан', age: 6, progress: 60, status: 'waiting' },
];

function getAsset(part: string) {
  const entry = Object.entries(imageModules).find(([path]) => path.toLowerCase().includes(part.toLowerCase()));
  return entry?.[1] ?? Object.values(imageModules)[0] ?? '';
}

export function buildStages(): Stage[] {
  const stages: Stage[] = [
    {
      id: 'forest',
      title: 'Лесная прогулка',
      childTitle: 'Синий герой в лесу',
      prompt: 'Дорисуй другу смешной предмет или дорожку.',
      parentNote: 'Спокойный фон: крупный герой, много места для первых линий.',
      src: getAsset('ука'),
      score: 96,
      mode: 'drawing',
    },
    {
      id: 'island',
      title: 'Остров сокровищ',
      childTitle: 'Пиратский остров',
      prompt: 'Нарисуй клад, кораблик или смешного помощника.',
      parentNote: 'Подходит для свободного задания и короткого рассказа.',
      src: getAsset('Illustration343'),
      score: 91,
      mode: 'mixed',
    },
    {
      id: 'space',
      title: 'Космос',
      childTitle: 'Космическое небо',
      prompt: 'Добавь звезды, планету или ракету.',
      parentNote: 'Яркий фон для простых форм: круги, линии, точки.',
      src: getAsset('чч'),
      score: 88,
      mode: 'quiz',
    },
    {
      id: 'reward',
      title: 'Финальная награда',
      childTitle: 'Веселая награда',
      prompt: 'Укрась экран звездочками и конфетти.',
      parentNote: 'Экран для завершения занятия и поощрения ребенка.',
      src: getAsset('Illustration (2)'),
      score: 84,
      mode: 'free',
    },
  ];

  return stages.filter((stage) => stage.src);
}
