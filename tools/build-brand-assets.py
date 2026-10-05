"""Build favicon sizes and the social banner without redesigning or cropping the supplied art."""
import argparse
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('robot', type=Path)
args = parser.parse_args()
with Image.open(args.robot) as source:
    robot = ImageOps.exif_transpose(source).convert('RGB')
    # Keep the complete robot; pad the slightly portrait source instead of cropping it.
    square = Image.new('RGB', (512, 512), 'black')
    contained = ImageOps.contain(robot, (512, 512), Image.Resampling.LANCZOS)
    square.paste(contained, ((512-contained.width)//2, (512-contained.height)//2))
    for name, size in [('favicon-16x16.png',16),('favicon-32x32.png',32),
                       ('apple-touch-icon.png',180),('android-chrome-192x192.png',192),
                       ('android-chrome-512x512.png',512)]:
        square.resize((size,size), Image.Resampling.LANCZOS).save(root/name, optimize=True)
    square.save(root/'favicon.ico', sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])
with Image.open(root/'images/hero-banner.webp') as source:
    banner = ImageOps.exif_transpose(source).convert('RGB')
    banner.save(root/'images/electroshop-share-banner.jpg', quality=97, subsampling=0, optimize=True)
print('Built six robot icon files and the complete social banner.')
