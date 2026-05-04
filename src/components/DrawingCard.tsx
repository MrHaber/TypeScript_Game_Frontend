import { ImagePlus } from 'lucide-react';
import { Drawing } from '../types';
import { makeSvgDataUri } from '../utils/art';
import { Card } from './Card';
import { AssetPreview } from './AssetPreview';
import { assetById, drawingAssetById } from '../data/assetCatalog';

type DrawingCardProps = {
  drawing: Drawing;
  onOpen: (drawing: Drawing) => void;
};

export function DrawingCard({ drawing, onOpen }: DrawingCardProps) {
  const visualAssetId = drawingAssetById[drawing.id];
  const visualAsset = visualAssetId ? assetById(visualAssetId) : null;

  return (
    <Card interactive className="drawingCard" onClick={() => onOpen(drawing)}>
      <div className="drawingPreview">
        {visualAsset ? (
          <AssetPreview asset={visualAsset} alt="Превью рисунка" />
        ) : (
          <img src={makeSvgDataUri(drawing, 320)} alt="Превью рисунка" />
        )}
        <span className="progressBadge">{drawing.progress}%</span>
      </div>
      <div className="drawingMeta">
        <span>{drawing.title}</span>
        <ImagePlus size={20} />
      </div>
    </Card>
  );
}
