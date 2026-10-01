// Pesquisarr desktop host. The Astro SSR worker runs in one orvalho isolate.
//
//	lewkit release run --config eletrocromo.json
package main

import (
	"context"

	"github.com/lewtec/lewkit/x/app"
	"github.com/lewtec/lewkit/x/entry"
)

func init() { entry.Bind(runApp) }

func main() { entry.Main(runApp) }

func runApp(ctx context.Context) error {
	handler, err := newHandler()
	if err != nil {
		return err
	}
	return app.App{
		Title:   "Pesquisarr",
		Handler: app.Web(handler),
	}.Run(ctx)
}
