Place 16.png, 48.png, and 128.png here.

Quick generation with ImageMagick:

  magick -size 128x128 xc:none \
    -fill '#22c55e' -draw 'circle 64,64 64,2' \
    -fill white -font Arial-Bold -pointsize 72 \
    -gravity center -annotate 0 '⚡' \
    128.png

  magick 128.png -resize 48x48 48.png
  magick 128.png -resize 16x16 16.png

Or use any icon editor — the design is a green circle with a white lightning bolt.
