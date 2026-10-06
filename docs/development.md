# Development and release

The source of truth is `src/`, `assets/scss/`, and `assets/js/`. `npm run build` compiles one CSS file per component and three independent browser scripts into `dist/`. Commit generated output and icon font files with source changes. Composer consumers require no build step.

Run `npm ci`, `npm run check`, and `composer validate --strict`. The PHP scripts test WordPress-free rendering and selected WordPress asset loading; Node tests cover modal, busy state, toast, icon assets, and CSS scoping. CI runs PHP checks on 7.4 and 8.4 and verifies that `dist/` matches source.

Use the root checkout of `webilia/webilia-ui`, fetch `origin/main`, and branch from that remote ref. Open a PR with checks and playground screenshots. After review and merge, create the annotated `v1.1.0` tag on the merged `main` commit and push the tag. Verify an authenticated Composer VCS consumer can resolve `webilia/ui:^1.1` from that tag. Do not tag an unmerged feature branch.

The private GitHub repository is the initial Composer distribution channel. Consumers provide GitHub credentials through their local or CI Composer configuration, not a committed `auth.json` or token. Multiple active WordPress plugins are supported when they bundle the same package version. Coordinate package upgrades across products; v1 does not promise mixed-version runtime compatibility.
