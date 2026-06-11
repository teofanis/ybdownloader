package main

import (
	"embed"
	"log"
	"os"
	"strings"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"

	"ybdownloader/internal/app"
)

// Version is set at build time via ldflags
var Version = "0.0.0-dev"

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	application, err := app.New(Version)
	if err != nil {
		log.Fatalf("Failed to create application: %v", err)
	}

	// Check for deep link URL in command line args (Windows/Linux first launch)
	// On Windows/Linux, when app is launched via deep link, the URL is passed as an arg
	for _, arg := range os.Args[1:] {
		if strings.HasPrefix(arg, "ybdownloader://") {
			application.SetPendingDeepLink(arg)
			break
		}
	}

	err = wails.Run(&options.App{
		Title:     "YBDownloader",
		Width:     1024,
		Height:    768,
		MinWidth:  800,
		MinHeight: 600,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 15, G: 23, B: 42, A: 1},
		OnStartup:        application.Startup,
		OnShutdown:       application.Shutdown,
		SingleInstanceLock: &options.SingleInstanceLock{
			UniqueId:               "com.ybdownloader.app",
			OnSecondInstanceLaunch: application.OnSecondInstance,
		},
		Mac: &mac.Options{
			// OnUrlOpen is called on macOS when the app is launched via a deep link
			// or when a deep link is clicked while the app is running
			OnUrlOpen: application.OnUrlOpen,
		},
		Bind: []interface{}{
			application,
		},
	})

	if err != nil {
		log.Fatalf("Error running application: %v", err)
	}
}
