#!/bin/bash
# User-level protocol handler installation script for YBDownloader
# Run this script if you installed YBDownloader without using a package manager
# Usage: ./install-protocol.sh [path-to-ybdownloader-binary]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICON_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor/256x256/apps"

# Try to find the binary in this order:
# 1. Provided argument
# 2. Same directory as this script (tarball extraction)
# 3. In PATH
# 4. Default install location
if [ -n "$1" ]; then
    BINARY_PATH="$1"
elif [ -f "$SCRIPT_DIR/ybdownloader-linux-amd64" ]; then
    BINARY_PATH="$SCRIPT_DIR/ybdownloader-linux-amd64"
elif [ -f "$SCRIPT_DIR/ybdownloader" ]; then
    BINARY_PATH="$SCRIPT_DIR/ybdownloader"
elif command -v ybdownloader &> /dev/null; then
    BINARY_PATH="$(which ybdownloader)"
else
    BINARY_PATH="$HOME/.local/bin/ybdownloader"
fi

# Convert to absolute path
BINARY_PATH="$(cd "$(dirname "$BINARY_PATH")" 2>/dev/null && pwd)/$(basename "$BINARY_PATH")"

# Verify the binary exists
if [ ! -f "$BINARY_PATH" ]; then
    echo "Error: YBDownloader binary not found at $BINARY_PATH"
    echo "Usage: $0 [path-to-ybdownloader-binary]"
    exit 1
fi

# Create directories
mkdir -p "$DESKTOP_DIR"
mkdir -p "$ICON_DIR"

# Copy icon if available in the same directory
if [ -f "$SCRIPT_DIR/ybdownloader.png" ]; then
    cp "$SCRIPT_DIR/ybdownloader.png" "$ICON_DIR/ybdownloader.png"
    echo "✓ Icon installed to $ICON_DIR/ybdownloader.png"
fi

# Create the desktop entry
cat > "$DESKTOP_DIR/ybdownloader.desktop" << EOF
[Desktop Entry]
Name=YBDownloader
Comment=A fast, modern YouTube downloader and converter
Exec=$BINARY_PATH %u
Icon=ybdownloader
Terminal=false
Type=Application
Categories=AudioVideo;Audio;Video;Network;
MimeType=x-scheme-handler/ybdownloader;
StartupWMClass=ybdownloader
EOF

# Update desktop database
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
fi

# Update icon cache
if command -v gtk-update-icon-cache &> /dev/null; then
    gtk-update-icon-cache -f "${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor" 2>/dev/null || true
fi

echo ""
echo "✓ Protocol handler 'ybdownloader://' registered successfully"
echo "  Desktop entry: $DESKTOP_DIR/ybdownloader.desktop"
echo "  Binary: $BINARY_PATH"
echo ""
echo "You can now use the YBDownloader browser extension!"
echo ""
echo "Tip: Add the binary to your PATH or move it to ~/.local/bin/ for easier access."

