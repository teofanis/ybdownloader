package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"

	"ybdownload/internal/app"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	application, err := app.New()
	if err != nil {
		log.Fatalf("Failed to create application: %v", err)
	}

	// Create application with options
	err = wails.Run(&options.App{
		Title:     "YBDownload",
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
		Bind: []interface{}{
			application,
		},
	})

	if err != nil {
		log.Fatalf("Error running application: %v", err)
	}
}
