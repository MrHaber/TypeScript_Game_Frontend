import { useEffect, useState } from 'react';
import { VisualAsset } from '../data/assetCatalog';

type AssetPreviewProps = {
  asset: VisualAsset;
  className?: string;
  alt?: string;
  transparentWhiteBoard?: boolean;
};

const transparentCache = new Map<string, string>();

function removeWhiteBoard(svg: string) {
  return svg.replace(/(<svg[^>]*>\s*)<path[^>]+fill="white"\/>/, '$1');
}

export function AssetPreview({ asset, className = '', alt, transparentWhiteBoard = true }: AssetPreviewProps) {
  const [src, setSrc] = useState(asset.src);

  useEffect(() => {
    if (!transparentWhiteBoard || !asset.hasWhiteBoard) {
      setSrc(asset.src);
      return;
    }

    const cached = transparentCache.get(asset.src);
    if (cached) {
      setSrc(cached);
      return;
    }

    let alive = true;
    fetch(asset.src)
      .then((response) => response.text())
      .then((svgText) => {
        if (!alive) {
          return;
        }
        const blob = new Blob([removeWhiteBoard(svgText)], { type: 'image/svg+xml' });
        const objectUrl = URL.createObjectURL(blob);
        transparentCache.set(asset.src, objectUrl);
        setSrc(objectUrl);
      })
      .catch(() => setSrc(asset.src));

    return () => {
      alive = false;
    };
  }, [asset, transparentWhiteBoard]);

  return (
    <img
      className={`assetPreview ${className}`.trim()}
      src={src}
      alt={alt ?? asset.title}
      width={asset.width}
      height={asset.height}
      loading="lazy"
      decoding="async"
    />
  );
}
