# Build Directory

The build directory is used to house all the build files and assets for your application. 

The structure is:

* bin - Output directory
* darwin - macOS specific files
* linux - Linux specific files
* windows - Windows specific files

## Mac

The `darwin` directory holds files specific to Mac builds.
These may be customised and used as part of the build. To return these files to the default state, simply delete them
and
build with `wails build`.

The directory contains the following files:

- `Info.plist` - the main plist file used for Mac builds. It is used when building using `wails build`.
- `Info.dev.plist` - same as the main plist file but used when building using `wails dev`.

### Deep Links (macOS)

Deep links are automatically configured via the `protocols` section in `wails.json`. The `Info.plist` template
contains the necessary `CFBundleURLTypes` entries that get populated during build.

## Windows

The `windows` directory contains the manifest and rc files used when building with `wails build`.
These may be customised for your application. To return these files to the default state, simply delete them and
build with `wails build`.

- `icon.ico` - The icon used for the application. This is used when building using `wails build`. If you wish to
  use a different icon, simply replace this file with your own. If it is missing, a new `icon.ico` file
  will be created using the `appicon.png` file in the build directory.
- `installer/*` - The files used to create the Windows installer. These are used when building using `wails build`.
- `info.json` - Application details used for Windows builds. The data here will be used by the Windows installer,
  as well as the application itself (right click the exe -> properties -> details)
- `wails.exe.manifest` - The main application manifest file.

### Deep Links (Windows)

Deep links are registered via the NSIS installer using the `wails.associateCustomProtocols` macro. The protocol
scheme is defined in `wails.json` under `info.protocols`. When the installer runs, it creates the necessary
registry entries under `HKLM\Software\Classes\ybdownloader`.

## Linux

The `linux` directory contains files used by the CI/CD pipeline for Linux releases:

- `ybdownloader.desktop` - Desktop entry file with protocol handler registration (used in AppImage and tarball)
- `install-protocol.sh` - User script included in tarball for manual protocol registration

### Deep Links (Linux)

**AppImage (Recommended):**

The AppImage includes the `.desktop` file. When run with [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher),
the protocol handler is automatically registered.

**Tarball:**

The tarball includes `install-protocol.sh`. After extraction, run:

```bash
./install-protocol.sh ./ybdownloader-linux-amd64
```

This creates a user-level desktop entry in `~/.local/share/applications/` and registers the
`ybdownloader://` protocol handler.