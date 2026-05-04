import { Award, Check, ChevronRight, Users } from 'lucide-react';
import type { Role } from '../features/drawing/types';

export function TourCard({ audience, onClose }: { audience: Exclude<Role, 'login'>; onClose: () => void }) {
  const isParent = audience === 'parent';
  const steps = isParent
    ? [
        'Сначала выберите режим и категорию рисунка. У ребенка фон поменяется автоматически.',
        'Проверьте список детей: кто вошел, кто рисует и чья работа ждет проверки.',
        'Нажмите "Начать", а после готовности ребенка откройте просмотр и одобрите рисунок.',
      ]
    : [
        'Смотри на большое поле с картинкой.',
        'Выбери цвет и рисуй пальцем или мышкой прямо по картинке.',
        'Когда закончишь, нажми "Готово", чтобы хост увидел работу.',
      ];

  return (
    <div className="tourBackdrop">
      <section className="tourCard">
        <div className="tourIcon">{isParent ? <Users size={34} /> : <Award size={34} />}</div>
        <p className="eyebrow">{isParent ? 'Обучение для хоста' : 'Обучение для ребенка'}</p>
        <h2>{isParent ? 'Как провести занятие' : 'Как рисовать'}</h2>
        <ol>
          {steps.map((step) => (
            <li key={step}>
              <ChevronRight size={18} />
              {step}
            </li>
          ))}
        </ol>
        <button className="primaryButton" type="button" onClick={onClose}>
          <Check size={20} />
          Понятно
        </button>
      </section>
    </div>
  );
}
