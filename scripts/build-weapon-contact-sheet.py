from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path('/home/ubuntu/crwiki/attached_assets/scraped_weapons')
files = sorted(root.glob('*.png'))
cell_w, cell_h = 260, 170
cols = 4
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * cell_w, rows * cell_h), '#11161d')
draw = ImageDraw.Draw(sheet)
for i, path in enumerate(files):
    try:
        image = Image.open(path).convert('RGBA')
        image.thumbnail((240, 120), Image.Resampling.LANCZOS)
        x = (i % cols) * cell_w + (cell_w - image.width) // 2
        y = (i // cols) * cell_h + 8
        sheet.paste(image, (x, y), image)
        draw.text(((i % cols) * cell_w + 8, (i // cols) * cell_h + 135), path.stem[:34], fill='#e8edf3')
    except Exception as exc:
        draw.text(((i % cols) * cell_w + 8, (i // cols) * cell_h + 20), f'{path.name}: {exc}', fill='#f87171')
sheet.save('/tmp/crossfire-local-weapon-contact-sheet.png')
print(f'files={len(files)} output=/tmp/crossfire-local-weapon-contact-sheet.png')
