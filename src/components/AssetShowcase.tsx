import { assetById } from '../data/assetCatalog';
import { AssetPreview } from './AssetPreview';

const showcaseAssets = ['people', 'badges', 'dinos'];

export function AssetShowcase() {
  return (
    <div className="assetShowcase" aria-label="Визуальный стиль проекта">
      {showcaseAssets.map((assetId) => {
        const asset = assetById(assetId);
        return (
          <div className="assetShowcaseItem" key={asset.id}>
            <AssetPreview asset={asset} />
          </div>
        );
      })}
    </div>
  );
}
