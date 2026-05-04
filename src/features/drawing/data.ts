import type { GameMode, Player, Stage } from './types';

const imageModules = import.meta.glob('../../../Images/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

type ImageEntry = {
  fileName: string;
  src: string;
};

const imageEntries: ImageEntry[] = Object.entries(imageModules)
  .map(([path, src]) => ({
    fileName: path.split('/').pop()?.replace(/\.png$/i, '') ?? path,
    src,
  }))
  .sort((a, b) => a.fileName.localeCompare(b.fileName, 'ru'));

export const drawingColors = ['#765FDE', '#FF6170', '#87D34C', '#75C7FF', '#FFC388', '#2F2F45'];

export const gameModes: Array<{ id: GameMode; title: string; note: string }> = [
  { id: 'drawing', title: 'Рисование', note: 'Большой холст, короткая подсказка и простые инструменты.' },
  { id: 'quiz', title: 'Вопросы', note: 'Короткие вопросы от ведущего без лишнего текста у ребенка.' },
  { id: 'mixed', title: 'Рисунок + вопрос', note: 'Сначала рисуем, потом обсуждаем работу с группой.' },
  { id: 'free', title: 'Свободная игра', note: 'Без таймера: только фон, кисть и спокойное творчество.' },
];

export const initialPlayers: Player[] = [
  { id: 1, name: 'Миша', age: 6, progress: 0, status: 'drawing', rating: 0 },
  { id: 2, name: 'Ника', age: 5, progress: 30, status: 'approved', rating: 4 },
  { id: 3, name: 'Руслан', age: 6, progress: 60, status: 'waiting', rating: 0 },
];

export function getAsset(part: string) {
  const entry = imageEntries.find(({ fileName }) => fileName.toLowerCase().includes(part.toLowerCase()));
  return entry?.src ?? imageEntries[0]?.src ?? '';
}

export const winnersBackground = getAsset('Экран победителей');

function stageMode(artNumber: number): GameMode {
  const modes: GameMode[] = ['drawing', 'mixed', 'free', 'quiz'];
  return modes[(artNumber - 1) % modes.length];
}

function readableTheme(rawTheme: string) {
  return rawTheme
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function stageId(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function promptForTheme(theme: string) {
  const lower = theme.toLowerCase();
  if (lower.includes('космос')) {
    return 'Добавь звезды, планету, ракету или космического друга.';
  }
  if (lower.includes('мор')) {
    return 'Нарисуй клад, кораблик, волну или смешного помощника.';
  }
  if (lower.includes('путеше')) {
    return 'Дорисуй смешной предмет, дорожку или друга для путешествия.';
  }
  return 'Дорисуй деталь, героя или забавный предмет на картинке.';
}

function noteForTheme(theme: string, artNumber: number) {
  const lower = theme.toLowerCase();
  if (lower.includes('космос')) {
    return 'Яркий фон для простых форм: круги, точки и линии.';
  }
  if (lower.includes('мор')) {
    return 'Подходит для свободного задания и спокойного творчества.';
  }
  if (lower.includes('путеше')) {
    return 'Крупные формы и понятная сцена: удобно для первых линий.';
  }
  return `Вариант ${artNumber}: можно использовать для отдельного задания.`;
}

export function buildStages(): Stage[] {
  return imageEntries
    .filter(({ fileName }) => !fileName.toLowerCase().includes('экран победителей'))
    .map(({ fileName, src }, index) => {
      const match = fileName.match(/^Тема\s+(.+?)\s+Арт\s*(\d+)/i);
      const theme = readableTheme(match?.[1] ?? fileName);
      const artNumber = Number(match?.[2] ?? index + 1);
      return {
        id: stageId(fileName) || `stage-${index + 1}`,
        title: artNumber > 1 ? `${theme} ${artNumber}` : theme,
        childTitle: theme,
        prompt: promptForTheme(theme),
        parentNote: noteForTheme(theme, artNumber),
        src,
        score: Math.max(78, 98 - index * 2),
        mode: stageMode(artNumber),
      };
    });
}
