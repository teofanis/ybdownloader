# Getting Help

Having trouble with YBDownloader? Here's how to get help.

## Before Opening an Issue

1. **Check the README** - Most setup questions are answered there
2. **Search existing issues** - Someone might have had the same problem
3. **Check the logs** - They're in your config directory under `logs/`

## Common Issues

### "FFmpeg not found"

The app needs FFmpeg for audio extraction and format conversion. Options:

- Let the app download it for you (Settings → FFmpeg → Download)
- Install it yourself via your package manager (`apt`, `brew`, `choco`, etc.)
- Point the app to your existing FFmpeg installation in Settings

### Downloads fail or hang

- Check your internet connection
- Try a different video (some have restrictions)
- Look at the logs for error details
- YouTube occasionally changes things that break downloaders—open an issue if it persists

### App won't start on Linux

Make sure you have the required GTK/WebKit libraries:

```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-dev libwebkit2gtk-4.1-dev

# Fedora
sudo dnf install gtk3-devel webkit2gtk4.1-devel
```

## Opening an Issue

If you've checked the above and still have a problem:

1. Go to [Issues](https://github.com/teofanis/ybdownloader/issues)
2. Use the appropriate template (bug report or feature request)
3. Include relevant details: OS, app version, error messages, logs

## Feature Requests

Got an idea? Open a feature request issue. No guarantees, but good ideas often get implemented. Check the roadmap in the README first—it might already be planned.

## Contributing

Want to fix it yourself? See [CONTRIBUTING.md](../CONTRIBUTING.md).

