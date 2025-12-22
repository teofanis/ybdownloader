package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"

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
		Bind: []interface{}{
			application,
		},
	})

	if err != nil {
		log.Fatalf("Error running application: %v", err)
	}
}
