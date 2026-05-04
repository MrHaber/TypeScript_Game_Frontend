import { ShieldCheck, Settings } from 'lucide-react';
import { Header } from '../components/Header';
import { DrawingCard } from '../components/DrawingCard';
import { Card } from '../components/Card';
import { AssetShowcase } from '../components/AssetShowcase';
import { Drawing, Player, Screen } from '../types';
import { tips } from '../data/mockData';

type MenuScreenProps = {
  player: Player;
  drawings: Drawing[];
  onNavigate: (screen: Screen) => void;
  onSelectDrawing: (drawing: Drawing, nextScreen: Screen) => void;
};

export function MenuScreen({ player, drawings, onNavigate, onSelectDrawing }: MenuScreenProps) {
  return (
    <main className="screen">
      <Header title="Меню" player={player} onNavigate={onNavigate} showProfile />
      <section className="heroPanel heroPanelWithAssets">
        <div className="heroCopy">
          <p className="eyebrow">Выбери один из двух артов</p>
          <h2>Добавь своего бумажного героя в историю</h2>
        </div>
        <AssetShowcase />
        <div className="heroActions">
          <button className="primaryButton" type="button" onClick={() => onSelectDrawing(drawings[0], 'editor')}>
            <Settings size={22} />
            Меню настроек
          </button>
          <button className="primaryButton parentButton" type="button" onClick={() => onNavigate('parent')}>
            <ShieldCheck size={22} />
            Родителю
          </button>
        </div>
      </section>

      <section className="drawingGrid" aria-label="Сетка рисунков">
        {drawings.map((drawing) => (
          <DrawingCard key={drawing.id} drawing={drawing} onOpen={(item) => onSelectDrawing(item, 'reward')} />
        ))}
      </section>

      <section className="tipsGrid" aria-label="Подсказки">
        {tips.map((tip, index) => (
          <Card key={tip} className="tipCard">
            <span className="tipNumber">{index + 1}</span>
            <p>{tip}</p>
          </Card>
        ))}
      </section>
    </main>
  );
}
