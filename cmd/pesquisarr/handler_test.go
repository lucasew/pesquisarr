package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestEmbeddedGuestServesHome(t *testing.T) {
	if len(guestJS) < 10_000 {
		t.Skip("embed/guest.js is a placeholder; run: mise run embed")
	}
	handler, err := newHandler()
	require.NoError(t, err)
	srv := httptest.NewServer(handler)
	t.Cleanup(srv.Close)

	client := &http.Client{Timeout: 30 * time.Second}
	res, err := client.Get(srv.URL + "/")
	require.NoError(t, err)
	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	require.NoError(t, err)
	text := string(body)
	require.Equal(t, http.StatusOK, res.StatusCode, truncate(text, 400))
	require.Contains(t, text, "Buscar")

	logo, err := client.Get(srv.URL + "/logo.png")
	require.NoError(t, err)
	defer logo.Body.Close()
	require.Equal(t, http.StatusOK, logo.StatusCode)
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "…"
}
