## 2024-05-23 - Unintended Changes to Auto-Generated Files
**Issue:** A pull request with a small, focused fix also contained large, unrelated changes to an auto-generated file (`src/lib/paraglide/messages/_index.js`).
**Root Cause:** Running `bun install` or other build-related commands can trigger scripts (like `paraglide-js compile`) that modify auto-generated files based on the current environment or dependencies. These changes are not part of the intended fix.
**Solution:** After running any installation or build commands, carefully review the changed files. Revert any unintended modifications to auto-generated files before committing.
**Pattern:** Auto-generated files, especially in i18n libraries like `paraglide-js`, are sensitive to the build environment. Always revert changes to these files if they are not directly related to the task at hand to keep commits small, focused, and reviewable.

## 2024-05-24 - Consolidate Scattered Configuration
**Issue:** Configuration data for different search engines (URL templates, regex patterns) was scattered across multiple functions in `src/lib/search.ts`. This led to code duplication and made it cumbersome to add, remove, or modify search providers.
**Root Cause:** The initial implementation likely evolved by adding one search engine at a time, resulting in separate, hardcoded constants within each new function rather than a unified configuration structure.
**Solution:** I refactored the code to define a single `SEARCH_ENGINES` object. This object acts as a centralized registry, mapping each search engine's name to its specific configuration (URL template and regex). The individual search functions were then simplified to look up their configuration from this object.
**Pattern:** For related entities (like different providers, themes, or feature flags) that share a common data structure, group their configuration into a single, structured object or map. This improves code organization, reduces boilerplate, and makes the system more scalable and maintainable.

## 2024-07-24 - Exclude Non-Code Directories from Linting
**Issue:** The `bun lint` command was failing because `prettier` was attempting to format files in the `.jules/` directory, which contains markdown files for agent journals, not application code. This caused unnecessary CI failures and developer friction.
**Root Cause:** The `.prettierignore` file did not include the `.jules/` directory, so the linting script was checking all files in the repository, including non-code files.
**Solution:** I added `.jules/` to the `.prettierignore` file. This tells `prettier` to skip this directory, ensuring the linting process only focuses on actual source code.
**Pattern:** Configure linting and formatting tools to ignore non-code directories like `.jules/`, `.github/`, or documentation folders. This prevents tool-related noise and ensures that CI checks are focused on code quality.

## 2026-01-10 - Centralize JSON Response Logic
**Issue:** API route handlers in `src/routes/api/` were manually creating `Response` objects for JSON, leading to duplicated headers and inconsistent status code handling.
**Root Cause:** The absence of a shared utility function for creating JSON responses encouraged developers to write boilerplate code for each endpoint.
**Solution:** I created a `json` helper function in `src/lib/requests.ts` that encapsulates the logic for creating a `Response` with the correct JSON headers and status. All API routes were updated to use this new helper.
**Pattern:** When a specific task, such as returning a JSON response, is performed in multiple places, extract the common logic into a reusable helper function. This reduces code duplication, enforces consistency, and makes the code easier to maintain.

## 2026-01-11 - Reuse Existing Helper Functions
**Issue:** The `getTorrentStreams` function was manually combining search results from multiple engines, even though a `combined` function already existed in `search.ts` for this purpose. This created unnecessary code duplication.
**Root Cause:** The developer who wrote `getTorrentStreams` may not have been aware of the `combined` function, or it was created after `getTorrentStreams` was implemented.
**Solution:** I refactored `getTorrentStreams` to use the existing `combined` function, removing the redundant logic.
**Pattern:** Before implementing logic that aggregates results from multiple sources, check for existing helper functions that already provide this functionality. Reusing code improves maintainability and reduces the chance of bugs.

## 2024-07-25 - Fix Linter Formatting Issues
**Issue:** The `bun lint` command failed due to a formatting inconsistency in `src/lib/url.ts`, blocking CI/CD pipelines and preventing developers from verifying their changes.
**Root Cause:** A file was committed with formatting that did not adhere to the project's Prettier configuration. This is a common issue in projects without pre-commit hooks that enforce code style.
**Solution:** I ran `prettier --write src/lib/url.ts` to automatically correct the formatting. I then verified the fix by running the linter again, which passed.
**Pattern:** Always run the linter and formatter before committing code. Integrating these checks into a pre-commit hook is the best way to prevent this class of issue from ever reaching the main branch.

## 2026-01-19 - Centralize Magnet Link Creation
**Issue:** Magnet link construction was duplicated and coupled with route logic in `src/routes/search/torrent/result/+page.server.ts`. Search engine parameter parsing was also repetitive.
**Root Cause:** Lack of a centralized method for creating magnet links and manual handling of multiple boolean parameters.
**Solution:** Added `createMagnet` to `TorrentService` and refactored the route handler to use it. Simplified engine selection using a loop.
**Pattern:** Move domain-specific string formatting (like magnet links) into the relevant service. Use loops for repetitive parameter extraction.
