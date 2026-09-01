#!/bin/bash
# Pre-commit hook: compress GLB files in public/models/ that exceed SIZE_THRESHOLD
# Uses gltf-transform to apply Draco mesh compression + WebP texture compression

SIZE_THRESHOLD_KB=5120  # 5MB

MODELS_DIR="public/models"

if [ ! -d "$MODELS_DIR" ]; then
  exit 0
fi

COMPRESSED=0

for file in "$MODELS_DIR"/*.glb; do
  [ -f "$file" ] || continue

  SIZE_KB=$(( $(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null) / 1024 ))

  if [ "$SIZE_KB" -gt "$SIZE_THRESHOLD_KB" ]; then
    echo "⚡ Compressing $file (${SIZE_KB}KB > ${SIZE_THRESHOLD_KB}KB threshold)..."

    TEMP_FILE="${file}.tmp.glb"
    npx gltf-transform optimize "$file" "$TEMP_FILE" --compress draco --texture-compress webp 2>/dev/null

    if [ $? -eq 0 ] && [ -f "$TEMP_FILE" ]; then
      NEW_SIZE_KB=$(( $(stat -f%z "$TEMP_FILE" 2>/dev/null || stat -c%s "$TEMP_FILE" 2>/dev/null) / 1024 ))
      mv "$TEMP_FILE" "$file"
      echo "  ✓ ${SIZE_KB}KB → ${NEW_SIZE_KB}KB"
      COMPRESSED=$((COMPRESSED + 1))
    else
      echo "  ✗ Compression failed, keeping original"
      rm -f "$TEMP_FILE"
    fi
  fi
done

if [ "$COMPRESSED" -gt 0 ]; then
  echo "📦 Compressed $COMPRESSED model(s). Re-staging..."
  git add "$MODELS_DIR"/*.glb
fi
