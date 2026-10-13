# Development and release

The source of truth is `src/`, `assets/scss/`, and `assets/js/`. `npm run build` compiles one CSS file per component and six independent browser scripts into `dist/`. Commit generated output and icon font files with source changes. Composer consumers require no build step.

Run `npm ci`, `npm run check`, and `composer validate --strict`. The PHP scripts test WordPress-free rendering and the opt-in WordPress adapters; Node tests cover modal, busy state, toast, icon assets, and CSS scoping. CI runs PHP checks on 7.4 and 8.4 and verifies that `dist/` matches source.

For Chromium parity checks, run `npx playwright install chromium`, start
`php -S 127.0.0.1:8877 -t .`, and run `npm run test:browser` in another terminal.
`PARITY_BASE_URL` can select a different local server and `PLAYWRIGHT_CHROMIUM_EXECUTABLE`
can select an already installed browser. The checks exercise real form serialization,
nested focus/scrolling, modal close policy, rich notice dismissal, mobile RTL/reduced motion,
and feedback failure/Skip without making remote submissions. They refresh the screenshots
in `docs/parity-*.png`. CI runs them on both supported PHP versions.

Use the root checkout of `webilia/webilia-ui`, fetch `origin/main`, and branch from that remote ref. Open a PR with checks and playground screenshots. After review and merge, create the annotated `v1.4.0` tag on the merged `main` commit and push the tag. Verify an authenticated Composer VCS consumer can resolve `webilia/ui:^1.4` from that tag. Do not tag an unmerged feature branch.

The existing `v1.3.0` tag already reports internal 1.4.0. Keep it immutable;
publish the reviewed consumer-parity additions in the new `v1.4.0` release,
matching `Version::VALUE`, npm metadata, documentation, and regenerated assets.

The private GitHub repository is the initial Composer distribution channel. Consumers provide GitHub credentials through their local or CI Composer configuration, not a committed `auth.json` or token. Multiple active WordPress plugins are supported when they bundle the same package version. Coordinate package upgrades across products; v1 does not promise mixed-version runtime compatibility.
