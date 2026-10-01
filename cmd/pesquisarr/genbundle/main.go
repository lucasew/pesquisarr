// genbundle pre-bundles the assembled Cloudflare worker for //go:embed.
//
//	mise run embed
package main

import (
	"fmt"
	"io"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/lucasew/orvalho/pkg/workers/bundle"
)

func main() {
	root, err := repoRoot()
	if err != nil {
		fatal(err)
	}
	host := filepath.Join(root, "cmd", "pesquisarr")
	workerDir := filepath.Join(host, "worker")
	entry := filepath.Join(workerDir, "entry.mjs")
	if _, err := os.Stat(entry); err != nil {
		fatal(fmt.Errorf("%w: %s — run the assemble step in mise run embed", os.ErrNotExist, entry))
	}
	esbuild, err := findEsbuild(root)
	if err != nil {
		fatal(err)
	}

	script, err := bundle.BundleEntry(bundle.BundleOptions{
		PackageDir: workerDir,
		Entry:      "entry.mjs",
		Esbuild:    esbuild,
	})
	if err != nil {
		fatal(err)
	}

	embedDir := filepath.Join(host, "embed")
	assetsOut := filepath.Join(embedDir, "assets")
	if err := os.MkdirAll(embedDir, 0o755); err != nil {
		fatal(err)
	}
	if err := os.WriteFile(filepath.Join(embedDir, "guest.js"), []byte(script), 0o644); err != nil {
		fatal(err)
	}
	if err := os.RemoveAll(assetsOut); err != nil {
		fatal(err)
	}
	if err := os.MkdirAll(assetsOut, 0o755); err != nil {
		fatal(err)
	}
	srcAssets := filepath.Join(workerDir, "assets")
	if st, err := os.Stat(srcAssets); err == nil && st.IsDir() {
		if err := copyTree(srcAssets, assetsOut); err != nil {
			fatal(err)
		}
	}
	empty, err := dirEmpty(assetsOut)
	if err != nil {
		fatal(err)
	}
	if empty {
		if err := os.WriteFile(filepath.Join(assetsOut, ".gitkeep"), nil, 0o644); err != nil {
			fatal(err)
		}
	}
	fmt.Printf("wrote cmd/pesquisarr/embed/guest.js (%d bytes) and embed/assets/\n", len(script))
}

func repoRoot() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for {
		if _, err := os.Stat(filepath.Join(dir, "astro.config.mjs")); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("astro.config.mjs not found from %s: %w", dir, os.ErrNotExist)
		}
		dir = parent
	}
}

func findEsbuild(root string) (string, error) {
	candidates := []string{
		filepath.Join(root, "node_modules", ".bin", "esbuild"),
		filepath.Join(root, "node_modules", "esbuild", "bin", "esbuild"),
	}
	nested, err := filepath.Glob(filepath.Join(root, "node_modules", ".orvalho", "esbuild@*", "node_modules", "esbuild", "bin", "esbuild"))
	if err != nil {
		return "", err
	}
	// Lexical order picks the newest 0.x tag orvalho laid down.
	if len(nested) > 0 {
		candidates = append(candidates, nested[len(nested)-1])
	}
	for _, path := range candidates {
		st, err := os.Stat(path)
		if err == nil && !st.IsDir() {
			return path, nil
		}
	}
	path, err := exec.LookPath("esbuild")
	if err != nil {
		return "", fmt.Errorf("esbuild not in node_modules or PATH: %w", err)
	}
	return path, nil
}

func dirEmpty(path string) (bool, error) {
	f, err := os.Open(path)
	if err != nil {
		return false, err
	}
	defer f.Close()
	_, err = f.Readdirnames(1)
	if err == io.EOF {
		return true, nil
	}
	return false, err
}

func copyTree(src, dst string) error {
	return filepath.WalkDir(src, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		target := filepath.Join(dst, rel)
		if d.IsDir() {
			return os.MkdirAll(target, 0o755)
		}
		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			return err
		}
		in, err := os.Open(path)
		if err != nil {
			return err
		}
		defer in.Close()
		out, err := os.OpenFile(target, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0o644)
		if err != nil {
			return err
		}
		defer out.Close()
		_, err = io.Copy(out, in)
		return err
	})
}

func fatal(err error) {
	fmt.Fprintf(os.Stderr, "genbundle: %v\n", err)
	os.Exit(1)
}
