"""Non-destructive local image conversion; run from repository root."""
import json
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
mapping, report = {}, []
icons = {'apple-touch-icon.png', 'favicon-16x16.png', 'favicon-32x32.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png', 'carholder-fav.png'}
for source in sorted(root.rglob('*')):
    if source.suffix.lower() not in {'.jpg', '.jpeg', '.png'} or '.git' in source.parts:
        continue
    relative = source.relative_to(root).as_posix()
    if relative in icons:
        continue
    destination = source.with_suffix('.webp')
    with Image.open(source) as original:
        if getattr(original, 'is_animated', False):
            continue
        image = ImageOps.exif_transpose(original)
        if image.mode not in {'RGB', 'RGBA'} or ('transparency' in image.info and image.mode != 'RGBA'):
            image = image.convert('RGBA' if 'transparency' in image.info or 'A' in image.getbands() else 'RGB')
        # PNG graphics remain pixel-exact; JPEG uses high quality without resizing.
        image.save(destination, 'WEBP', lossless=source.suffix.lower()=='.png', quality=96, method=6, icc_profile=original.info.get('icc_profile', b''))
        entry = {'source': relative, 'webp': destination.relative_to(root).as_posix(), 'originalBytes': source.stat().st_size, 'webpBytes': destination.stat().st_size, 'width': image.width, 'height': image.height}
    entry['used'] = entry['webpBytes'] < entry['originalBytes']
    if entry['used']:
        mapping[relative] = entry['webp']
    report.append(entry)

# Rewrite only site source files, never historical SQL or image originals.
for source in root.iterdir():
    if source.suffix not in {'.html', '.css', '.js', '.json'} or source.name=='shop-local-image-map.js':
        continue
    original = source.read_text(encoding='utf-8-sig')
    result = original
    for before, after in sorted(mapping.items(), key=lambda pair: -len(pair[0])):
        result = result.replace(before, after)
    if result != original:
        source.write_text(result, encoding='utf-8')
(root/'shop-local-image-map.js').write_text('export const localImageMap = '+json.dumps(mapping, ensure_ascii=False, indent=2)+';\nexport function localImagePath(value){const text=String(value||\'\');const match=text.match(/^((?:\\.\\/)?)([^?#]+)(.*)$/);return match?match[1]+(localImageMap[match[2]]||match[2])+match[3]:text}\n', encoding='utf-8')
(root/'tools/local-image-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'converted':len(report), 'used':len(mapping), 'savedBytes':sum(r['originalBytes']-r['webpBytes'] for r in report if r['used'])}))
