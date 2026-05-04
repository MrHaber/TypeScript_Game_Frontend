import { Check } from 'lucide-react';
import { Header } from '../components/Header';
import { AnimatedCharacter } from '../components/AnimatedCharacter';
import { AssetPreview } from '../components/AssetPreview';
import { assetById } from '../data/assetCatalog';
import { BackgroundKind, Drawing, Player, Screen } from '../types';
import { makeSvgDataUri } from '../utils/art';

const options: Array<{ id: BackgroundKind; label: string }> = [
  { id: 'shadow', label: 'Белая тень' },
  { id: 'color', label: 'Цветной фон' },
  { id: 'art', label: 'Арт фон' },
];

type EditorScreenProps = {
  player: Player;
  drawing: Drawing;
  selectedBackground: BackgroundKind;
  onBackgroundChange: (kind: BackgroundKind) => void;
  onNavigate: (screen: Screen) => void;
  onSave: () => void;
};

export function EditorScreen({
  player,
  drawing,
  selectedBackground,
  onBackgroundChange,
  onNavigate,
  onSave,
}: EditorScreenProps) {
  const learningAsset = assetById(selectedBackground === 'art' ? 'music' : 'english');

  return (
    <main className="screen">
      <Header title="Меню настроек" player={player} onNavigate={onNavigate} showBack showProfile={false} />

      <section className={`editorPreview editor-${selectedBackground}`}>
        <AssetPreview asset={learningAsset} className="editorDecorAsset" alt="Тематический фон" />
        <img className="editorDrawingImage" src={makeSvgDataUri(drawing, 560)} alt="Preview canvas" />
        <AnimatedCharacter compact />
      </section>

      <section className="segmentedControl" aria-label="Выбор фона">
        {options.map((option) => (
          <button
            key={option.id}
            className={selectedBackground === option.id ? 'segmentActive' : ''}
            type="button"
            onClick={() => onBackgroundChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </section>

      <button className="primaryButton largeButton saveButton" type="button" onClick={onSave}>
        <Check size={24} />
        Сохранить
      </button>
    </main>
  );
}
