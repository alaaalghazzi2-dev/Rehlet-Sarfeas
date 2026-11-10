# رحلة سرفيس — Rehlat Sarfees
Arabic RTL, responsive, personal-only Site. No app-owned login. Deployment access must remain owner-only until server-side administrator authorization is added.

- Leaflet 1.9.4 / OpenStreetMap map tiles. Bundled Leaflet code retains its license header.
- Six named lines from published Damascus transport sources. Initial geometry, boarding nodes and mirrored return directions are explicitly illustrative, not researched real-world routing data. All start as demo. They are excluded from journey planning unless the user opts into simulation.
- Direct and one-transfer journey alternatives; geolocation stays client-side. Walking distances are great-circle estimates, not street routes or live ETAs. Search covers registered places only.
- D1 saves route edits with optimistic concurrency. Separate outbound/inbound paths; admin can add/reorder/remove points, name boarding points, choose color, record sources and verify routes.
- A labelled, inactive ad placement is reserved in the sidebar, outside the map. No Google ad script, publisher ID, or ad trackers are configured.
- Installable PWA with Arabic/English branding, 192/512 PNG icons, iOS touch icon, installation help, and a network-only service worker. No private records are cached. Native Android APK has not been built.

Build: npm install; npm run build. Schema: db/schema.ts, migrations generated with npx drizzle-kit generate.

Validation completed: JS parsing, routing and demo-exclusion cases, data validation, SQLite-backed Worker read/write, stale revision and origin rejection. Browser visual QA and WebMCP runtime validation unavailable for this custom Worker preview profile.

Sources reviewed September 28, 2026:
https://t.me/s/damascusgovrnorat?q=%23%D8%A7%D9%84%D8%AA%D8%AA%D8%A8%D8%B9_%D8%A7%D9%84%D8%A7%D9%84%D9%83%D8%AA%D8%B1%D9%88%D9%86%D9%8A
https://3lyameen.com/
