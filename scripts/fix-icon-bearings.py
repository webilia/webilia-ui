from pathlib import Path

from fontTools.ttLib import TTFont


font_directory = Path(__file__).resolve().parent.parent / "dist" / "fonts"
font = TTFont(font_directory / "webilia-ui-icons.woff2", recalcTimestamp=False)
glyphs = font["glyf"]

for name in font.getGlyphOrder():
    glyph = glyphs[name]
    if glyph.numberOfContours == 0:
        continue

    advance_width, _ = font["hmtx"][name]
    # Keep each icon's layout width and restore the outline's left padding.
    font["hmtx"][name] = (advance_width, glyph.xMin)

for flavor in ("woff", "woff2"):
    font.flavor = flavor
    font.save(font_directory / f"webilia-ui-icons.{flavor}")
