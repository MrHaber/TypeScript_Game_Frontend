import { Award, Check, ChevronRight, Users } from 'lucide-react';
import type { Role } from '../features/drawing/types';

export function TourCard({ audience, onClose }: { audience: Exclude<Role, 'login'>; onClose: () => void }) {
  const isParent = audience === 'parent';
  const steps = isParent
    ? [
        'Сначала создайте комнату: дети смогут войти по коду или QR-карточке.',
        'Выберите режим и одну из 6 категорий рисунка. Категорию можно поменять до старта.',
        'Нажмите "Начать занятие". После кнопки "Готово" работа ребенка появится в проверке.',
      ]
    : [
        'Смотри на большую картинку и рисуй прямо поверх нее.',
        'Выбери цвет и толстую кисть. Для маленьких детей крупные линии работают лучше.',
        'Когда закончишь, нажми "Готово", чтобы взрослый увидел и одобрил рисунок.',
      ];

  return (
    <div className="tourBackdrop">
      <section className="tourCard">
        <div className="tourIcon">{isParent ? <Users size={34} /> : <Award size={34} />}</div>
        <p className="eyebrow">{isParent ? 'Обучение для взрослого' : 'Обучение для ребенка'}</p>
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
