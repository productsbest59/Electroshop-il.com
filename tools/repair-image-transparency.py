"""Preserve PNG color-key transparency as an explicit WebP alpha channel."""
import json
from pathlib import Path
from PIL import Image, ImageOps
root=Path(__file__).resolve().parents[1]
report_path=root/'tools/local-image-report.json'
report=json.loads(report_path.read_text(encoding='utf-8'))
repaired=[]
for row in report:
    with Image.open(root/row['source']) as source:
        if (source.mode=='RGB' and 'transparency' in source.info) or ('A' in source.getbands() and source.mode!='RGBA'):
            image=ImageOps.exif_transpose(source).convert('RGBA')
            image.save(root/row['webp'],'WEBP',lossless=True,quality=96,method=6,icc_profile=source.info.get('icc_profile',b''))
            row['webpBytes']=(root/row['webp']).stat().st_size
            row['used']=row['webpBytes']<row['originalBytes']
            repaired.append(row['source'])
report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'repairedTransparency':repaired}))
