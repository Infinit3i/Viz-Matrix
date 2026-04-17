# Viz-Matrix

MITRE ATT&CK visibility coverage matrix for defenders. Map your log sources to ATT&CK techniques and see where your blind spots are.

**Live:** [infinit3i.github.io/Viz-Matrix](https://infinit3i.github.io/Viz-Matrix/)

## What It Does

- Select your environment (OS, cloud, email, SaaS, CI/CD)
- Toggle the sourcetypes you're actually ingesting
- See coverage: red = blind spot, yellow = single source, green = defense in depth
- Per-OS split view when running multiple platforms
- Recommendations for what to implement next
- Click any red cell to open the MITRE ATT&CK page

## Run Locally

```bash
npm install
npm run dev
```

## Commands

```bash
npm run dev        # Dev server
npm run build      # Type-check + production build
npm run test       # Unit tests
npm run lint       # ESLint
npm run ci         # All of the above
```
