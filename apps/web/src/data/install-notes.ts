export const desktopInstallNotes = {
  windows: [
    "Download the `.exe` installer from the latest release.",
    "SmartScreen may warn on first run — choose More info → Run anyway.",
    "The installer registers the `ybdownloader://` protocol for extension deep links.",
  ],
  macos: [
    "Download the `.dmg` and drag YBDownloader to Applications.",
    "First launch: right-click the app → Open to bypass Gatekeeper.",
    "Deep links require the app to be installed normally (not quarantined).",
  ],
  linuxAppImage: [
    "Download `ybdownloader-linux-amd64.AppImage`.",
    "Make it executable: `chmod +x ybdownloader-linux-amd64.AppImage`.",
    "Run directly, or use AppImageLauncher for desktop integration and deep links.",
  ],
  linuxTarball: [
    "Download `ybdownloader-linux-amd64.tar.gz` for a portable folder layout.",
    "Extract and run the binary; use `install-protocol.sh` for `ybdownloader://` registration.",
  ],
} as const;

export const extensionInstallNotes = [
  "Download the Chrome or Firefox zip from the latest `ext-v*` release.",
  "Chrome: extract and load unpacked at `chrome://extensions` (Developer mode).",
  "Firefox: install temporarily via `about:debugging` → This Firefox → Load Temporary Add-on.",
  "Install the desktop app so `ybdownloader://` deep links open the queue.",
] as const;
