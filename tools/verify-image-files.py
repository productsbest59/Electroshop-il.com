import json
from pathlib import Path
from PIL import Image, ImageOps, ImageChops
root=Path(__file__).resolve().parents[1]
report=json.loads((root/'tools/local-image-report.json').read_text(encoding='utf-8'))
for row in report:
    with Image.open(root/row['source']) as original, Image.open(root/row['webp']) as converted:
        source=ImageOps.exif_transpose(original)
        assert source.size==converted.size, row['source']
        if row['source'].lower().endswith('.png'):
            original_rgba, converted_rgba=source.convert('RGBA'),converted.convert('RGBA')
            assert ImageChops.difference(original_rgba.getchannel('A'),converted_rgba.getchannel('A')).getbbox() is None, row['source']
            # WebP may normalize invisible RGB under alpha=0. Visible pixels must be identical.
            mask=original_rgba.getchannel('A').point(lambda value: 255 if value else 0)
            for channel in ImageChops.difference(original_rgba.convert('RGB'),converted_rgba.convert('RGB')).split():
                assert ImageChops.multiply(channel,mask).getbbox() is None, row['source']
destinations=[row['webp'] for row in report]
assert len(destinations)==len(set(destinations)), 'Overlapping conversion targets'
print(json.dumps({'verifiedImages':len(report),'dimensions':'passed','pngPixels':'lossless','originalFiles':'preserved'}))
