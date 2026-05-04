import type { Stage } from './types';

export type QuizQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
};

export type QuizPack = {
  id: 'sea' | 'space' | 'travel';
  title: string;
  questions: QuizQuestion[];
};

export const quizPacks: QuizPack[] = [
  {
    id: 'sea',
    title: 'Морские приключения',
    questions: [
      {
        prompt: 'На чем люди путешествуют по морю?',
        options: ['На поезде', 'На корабле', 'На машине', 'На велосипеде'],
        correctIndex: 1,
      },
      {
        prompt: 'Как называется главный на корабле?',
        options: ['Водитель', 'Капитан', 'Учитель', 'Пилот'],
        correctIndex: 1,
      },
      {
        prompt: 'Что бросают в воду, чтобы корабль не уплыл?',
        options: ['Веревку', 'Якорь', 'Камень', 'Сеть'],
        correctIndex: 1,
      },
      {
        prompt: 'Кто такие пираты?',
        options: ['Рыбаки', 'Морские разбойники', 'Туристы', 'Водители'],
        correctIndex: 1,
      },
      {
        prompt: 'Что ищут пираты в приключениях?',
        options: ['Книги', 'Сокровища', 'Игрушки', 'Одежду'],
        correctIndex: 1,
      },
      {
        prompt: 'Что помогает кораблю двигаться вперед?',
        options: ['Колеса', 'Парус', 'Лестница', 'Дверь'],
        correctIndex: 1,
      },
      {
        prompt: 'Что используют, чтобы смотреть вдаль на море?',
        options: ['Телескоп', 'Бинокль', 'Микроскоп', 'Очки'],
        correctIndex: 1,
      },
      {
        prompt: 'Кто готовит еду на корабле?',
        options: ['Капитан', 'Кок', 'Учитель', 'Пассажир'],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 'space',
    title: 'Космос',
    questions: [
      {
        prompt: 'Как называется звезда, которая освещает Землю?',
        options: ['Луна', 'Марс', 'Солнце', 'Венера'],
        correctIndex: 2,
      },
      {
        prompt: 'Как называется спутник Земли?',
        options: ['Марс', 'Луна', 'Юпитер', 'Сатурн'],
        correctIndex: 1,
      },
      {
        prompt: 'Какая планета самая близкая к Солнцу?',
        options: ['Земля', 'Марс', 'Меркурий', 'Юпитер'],
        correctIndex: 2,
      },
      {
        prompt: 'Как называется путь, по которому движется планета?',
        options: ['Дорога', 'Орбита', 'Линия', 'Круг'],
        correctIndex: 1,
      },
      {
        prompt: 'Что можно увидеть на небе ночью?',
        options: ['Дома', 'Звезды', 'Рыбы', 'Машины'],
        correctIndex: 1,
      },
      {
        prompt: 'Какая планета известна своими кольцами?',
        options: ['Марс', 'Сатурн', 'Венера', 'Земля'],
        correctIndex: 1,
      },
      {
        prompt: 'Как называется устройство для наблюдения за звездами?',
        options: ['Микроскоп', 'Телескоп', 'Бинокль', 'Камера'],
        correctIndex: 1,
      },
      {
        prompt: 'Как называется место, откуда запускают ракеты?',
        options: ['Аэропорт', 'Космодром', 'Вокзал', 'Порт'],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 'travel',
    title: 'Путешествия',
    questions: [
      {
        prompt: 'Как называется место, откуда улетают самолеты?',
        options: ['Вокзал', 'Аэропорт', 'Порт', 'Станция'],
        correctIndex: 1,
      },
      {
        prompt: 'Какой транспорт ездит по рельсам?',
        options: ['Автобус', 'Машина', 'Поезд', 'Самолет'],
        correctIndex: 2,
      },
      {
        prompt: 'Что используют, чтобы не заблудиться?',
        options: ['Телевизор', 'Карта', 'Игрушка', 'Подушка'],
        correctIndex: 1,
      },
      {
        prompt: 'Что надевают в путешествие на море?',
        options: ['Шапку-ушанку', 'Купальник', 'Пальто', 'Сапоги'],
        correctIndex: 1,
      },
      {
        prompt: 'Как называется место, где останавливаются поезда?',
        options: ['Порт', 'Аэропорт', 'Вокзал', 'Школа'],
        correctIndex: 2,
      },
      {
        prompt: 'Какой документ нужен для поездки за границу?',
        options: ['Дневник', 'Паспорт', 'Тетрадь', 'Книга'],
        correctIndex: 1,
      },
      {
        prompt: 'Что берут с собой, чтобы делать фотографии?',
        options: ['Лампу', 'Камеру', 'Чайник', 'Книгу'],
        correctIndex: 1,
      },
      {
        prompt: 'Как называется отдых на природе с палаткой?',
        options: ['Экскурсия', 'Поездка', 'Кемпинг', 'Работа'],
        correctIndex: 2,
      },
    ],
  },
];

export function quizPackForStage(stage?: Stage): QuizPack {
  const text = `${stage?.title ?? ''} ${stage?.childTitle ?? ''} ${stage?.id ?? ''}`.toLowerCase();
  if (text.includes('космос')) return quizPacks[1];
  if (text.includes('путеше')) return quizPacks[2];
  return quizPacks[0];
}
