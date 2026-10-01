package main

import (
	"embed"
	"io/fs"
	"log/slog"
	"net/http"

	"github.com/lucasew/orvalho/pkg/workers"
)

//go:embed embed/guest.js
var guestJS string

//go:embed all:embed/assets
var assetsRoot embed.FS

func newHandler() (http.Handler, error) {
	assets, err := fs.Sub(assetsRoot, "embed/assets")
	if err != nil {
		return nil, err
	}
	iso := workers.New(guestJS, workers.Options{
		Bindings: map[string]workers.Binding{
			"ASSETS": workers.NewAssetBinding(assets, "."),
		},
		// Result pages are whichever host the search engine returned.
		Fetch: workers.HTTPFetch(workers.EgressList{"*"}, nil, 0),
	})
	inner := workers.Handler(iso)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rw := &statusRecorder{ResponseWriter: w, code: http.StatusOK}
		inner.ServeHTTP(rw, r)
		if rw.code >= 500 {
			slog.Error("pesquisarr", "method", r.Method, "uri", r.URL.RequestURI(), "status", rw.code)
		}
	}), nil
}

// statusRecorder captures WriteHeader so the host can log 5xx responses.
type statusRecorder struct {
	http.ResponseWriter
	code int
}

func (s *statusRecorder) WriteHeader(code int) {
	s.code = code
	s.ResponseWriter.WriteHeader(code)
}
