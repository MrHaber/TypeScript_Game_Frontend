import type { GameMode, Player, Stage } from './types';

const imageModules = import.meta.glob('../../../Images/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

export const drawingColors = ['#765FDE', '#FF6170', '#87D34C', '#75C7FF', '#FFC388', '#2F2F45'];

export const gameModes: Array<{ id: GameMode; title: string; note: string }> = [
  { id: 'drawing', title: 'Рисование', note: 'Большой холст, короткая подсказка и понятные инструменты.' },
  { id: 'quiz', title: 'Вопросы', note: 'Простые задания от ведущего: один вопрос, один выбор.' },
  { id: 'mixed', title: 'Рисунок + вопрос', note: 'Сначала дети рисуют, потом обсуждают работу с группой.' },
  { id: 'free', title: 'Свободная игра', note: 'Без таймера: только фон, кисть и спокойное творчество.' },
];

export const initialPlayers: Player[] = [
  { id: 1, name: 'Миша', age: 6, progress: 0, status: 'waiting' },
  { id: 2, name: 'Ника', age: 5, progress: 30, status: 'approved' },
  { id: 3, name: 'Руслан', age: 6, progress: 60, status: 'waiting' },
];

function normalizePath(path: string) {
  return path.toLowerCase().replace(/\\/g, '/');
}

function getAsset(part: string) {
  const entry = Object.entries(imageModules).find(([path]) => normalizePath(path).includes(part.toLowerCase()));
  return entry?.[1] ?? '';
}

function unusedImages(used: Set<string>) {
  return Object.values(imageModules).filter((src) => src && !used.has(src));
}

export const uiIcons = {
  addPeople: new URL('../../../Images/icon pack/add_people.png', import.meta.url).href,
  check: new URL('../../../Images/icon pack/check_circle.png', import.meta.url).href,
  copy: new URL('../../../Images/icon pack/copy.png', import.meta.url).href,
  download: new URL('../../../Images/icon pack/download.png', import.meta.url).href,
  game: new URL('../../../Images/icon pack/game.png', import.meta.url).href,
  help: new URL('../../../Images/icon pack/help.png', import.meta.url).href,
  play: new URL('../../../Images/icon pack/play.png', import.meta.url).href,
  quiz: new URL('../../../Images/icon pack/quiz.png', import.meta.url).href,
  secure: new URL('../../../Images/icon pack/secure.png', import.meta.url).href,
  timer: new URL('../../../Images/icon pack/timer.png', import.meta.url).href,
  visibility: new URL('../../../Images/icon pack/visibility/on.png', import.meta.url).href,
  whiteboard: new URL('../../../Images/icon pack/whiteboard.png', import.meta.url).href,
};

export function buildStages(): Stage[] {
  const island = getAsset('Illustration343');
  const reward = getAsset('Illustration (2)');
  const used = new Set([island, reward].filter(Boolean));
  const rest = unusedImages(used);
  const imageAt = (index: number) => rest[index] ?? island ?? reward ?? Object.values(imageModules)[0] ?? '';

  const stages: Stage[] = [
    {
      id: 'forest',
      title: 'Лесная прогулка',
      childTitle: 'Герой в лесу',
      prompt: 'Дорисуй друга, листик, цветок или смешной предмет.',
      parentNote: 'Спокойный фон: хорошо видно толстые детские линии.',
      src: imageAt(0),
      score: 96,
      mode: 'drawing',
    },
    {
      id: 'island',
      title: 'Остров сокровищ',
      childTitle: 'Пиратский остров',
      prompt: 'Нарисуй клад, кораблик или веселого помощника.',
      parentNote: 'Хорош для истории: ребенок легко понимает, что добавить.',
      src: island || imageAt(1),
      score: 94,
      mode: 'mixed',
    },
    {
      id: 'space',
      title: 'Космос',
      childTitle: 'Космическое небо',
      prompt: 'Добавь звезды, планету или ракету.',
      parentNote: 'Яркая категория для короткого задания и вопроса после рисунка.',
      src: imageAt(1),
      score: 90,
      mode: 'quiz',
    },
    {
      id: 'farm',
      title: 'Зеленая поляна',
      childTitle: 'Веселая поляна',
      prompt: 'Нарисуй домик, солнышко или маленького зверя.',
      parentNote: 'Много светлого места, подходит детям 5-6 лет.',
      src: imageAt(2),
      score: 88,
      mode: 'drawing',
    },
    {
      id: 'city',
      title: 'Город фантазий',
      childTitle: 'Мой город',
      prompt: 'Дорисуй окно, машинку, дерево или человечка.',
      parentNote: 'Категория для детей, которым проще рисовать знакомые предметы.',
      src: imageAt(3),
      score: 86,
      mode: 'free',
    },
    {
      id: 'reward',
      title: 'Праздник рисунков',
      childTitle: 'Финальная награда',
      prompt: 'Укрась картинку звездочками, шариками или конфетти.',
      parentNote: 'Лучше использовать в конце занятия или как свободный режим.',
      src: reward || imageAt(4),
      score: 84,
      mode: 'free',
    },
  ];

  return stages.filter((stage) => Boolean(stage.src));
}
