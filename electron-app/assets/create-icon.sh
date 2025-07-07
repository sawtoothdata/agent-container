#!/bin/bash

# Create a simple icon using ImageMagick (if available) or skip icons for now
if command -v magick &> /dev/null; then
    # Create a simple icon
    magick -size 512x512 xc:transparent -fill "#667eea" -draw "roundrectangle 50,50 462,462 50,50" \
           -fill white -pointsize 120 -gravity center -annotate +0+0 "C" \
           icon.png
    echo "Icon created with ImageMagick"
elif command -v convert &> /dev/null; then
    # Try with older ImageMagick
    convert -size 512x512 xc:transparent -fill "#667eea" -draw "roundrectangle 50,50 462,462 50,50" \
            -fill white -pointsize 120 -gravity center -annotate +0+0 "C" \
            icon.png
    echo "Icon created with convert"
else
    echo "ImageMagick not available, will remove icon references"
fi