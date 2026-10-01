## Security Review Results

### BLOCK (must fix before publishing)
- None.

### WARN (inform user, let them decide)
- None.

### PASS
- Dependency audit (`npm audit`): 0 reported vulnerabilities across 579 dependencies; no high or critical findings.
- Hardcoded-secret pattern scan: no matches.
- `.env` scan: no non-`VITE_` secrets found; no applicable `.env` files with sensitive values found.
- Common vulnerability-pattern scan: the only match is `dangerouslySetInnerHTML` in `client/src/components/ui/chart.tsx:81`. It generates an inline style block from chart configuration; the component has no call sites in `client/src`, so no user-controlled input flow to this sink was identified.
- Python dangerous-pattern scan: no matches.
- Open CORS scan: no matches.
