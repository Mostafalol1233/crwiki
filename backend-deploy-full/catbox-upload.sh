#!/bin/bash
# CATBOX QUICK UPLOAD HELPER
# Usage: bash catbox-upload.sh
# Uploads all images to catbox.moe and saves URLs to catbox-urls.txt

UPLOAD_DIR="attached_assets"
OUTPUT_FILE="catbox-urls.txt"
CATBOX_API="https://catbox.moe/user/api.php"

> "$OUTPUT_FILE"  # Clear output file

echo "🚀 Starting Catbox Upload..."
echo ""

# Upload mercenaries
echo "⚔️ Uploading Mercenaries..."
for file in "$UPLOAD_DIR"/merc-*.jpg; do
    if [ -f "$file" ]; then
        response=$(curl -s -F "reqtype=fileupload" -F "fileToUpload=@$file" "$CATBOX_API")
        echo "MERC:$(basename "$file"):$response" >> "$OUTPUT_FILE"
        echo "  ✅ $(basename "$file") → $response"
    fi
done

# Upload weapons
echo ""
echo "📦 Uploading Weapons..."
count=0
for file in "$UPLOAD_DIR"/weapons/*; do
    if [ -f "$file" ]; then
        response=$(curl -s -F "reqtype=fileupload" -F "fileToUpload=@$file" "$CATBOX_API")
        echo "WEAPON:$(basename "$file"):$response" >> "$OUTPUT_FILE"
        count=$((count+1))
        if [ $((count % 10)) -eq 0 ]; then
            echo "  ✅ Uploaded $count weapons..."
        fi
    fi
done
echo "  ✅ Total: $count weapons"

# Upload modes
echo ""
echo "🎮 Uploading Modes..."
count=0
for file in "$UPLOAD_DIR"/modes/*; do
    if [ -f "$file" ]; then
        response=$(curl -s -F "reqtype=fileupload" -F "fileToUpload=@$file" "$CATBOX_API")
        echo "MODE:$(basename "$file"):$response" >> "$OUTPUT_FILE"
        count=$((count+1))
        if [ $((count % 50)) -eq 0 ]; then
            echo "  ✅ Uploaded $count modes..."
        fi
    fi
done
echo "  ✅ Total: $count modes"

# Upload ranks
echo ""
echo "🏅 Uploading Ranks..."
count=0
for file in "$UPLOAD_DIR"/ranks/*; do
    if [ -f "$file" ]; then
        response=$(curl -s -F "reqtype=fileupload" -F "fileToUpload=@$file" "$CATBOX_API")
        echo "RANK:$(basename "$file"):$response" >> "$OUTPUT_FILE"
        count=$((count+1))
        if [ $((count % 10)) -eq 0 ]; then
            echo "  ✅ Uploaded $count ranks..."
        fi
    fi
done
echo "  ✅ Total: $count ranks"

echo ""
echo "✅ Upload complete! URLs saved to: $OUTPUT_FILE"
echo "📋 Format: TYPE:FILENAME:CATBOX_URL"
