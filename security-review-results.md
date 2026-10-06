## Security Review Results

### BLOCK (must fix before publishing)
- None.

### WARN (inform user, let them decide)
- None.

### PASS
- Hardcoded-secret pattern scan: no matches.
- `.env` scan: no non-`VITE_` secrets found; no applicable `.env` files with sensitive values found.
- Common vulnerability-pattern scan: the only match is `dangerouslySetInnerHTML` in `client/src/components/ui/chart.tsx:81`. It generates an inline style block from chart configuration; the component has no call sites in `client/src`, so no user-controlled input flow to this sink was identified.
- Python dangerous-pattern scan: no matches.
- Open CORS scan: no matches.

### Dependency audit (updated after dependency cleanup)

The runtime server dependencies (express, sweph, pdfkit, zod, luxon, …) are free of reported
advisories. `npm audit` still reports a handful of advisories, all confined to the **build
toolchain** (tailwindcss v3 and its postcss / source-map chain), which runs at build time only:

- `braces` — stack-exhaustion DoS via deeply nested patterns (fix available via `npm audit fix`).
- `source-map-js` — event-loop DoS through indexed source-map section offsets (no fix available).
- `postcss-selector-parser` / `postcss-nested` — via the tailwindcss v3 postcss chain.

None of these are reachable from a running server. The clean fix is to upgrade the frontend build
to Tailwind v4 (which drops the legacy postcss chain); until then these are accepted build-time risk.

> Note: the previous version of this file reported “0 vulnerabilities across 579 dependencies”.
> That count was stale: it predates both the dependency cleanup and newer advisories. The counts
> above are from a fresh `npm install` on this tree.
