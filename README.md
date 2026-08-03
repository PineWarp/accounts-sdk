# accounts-sdk

Bilup's mod of **rotur-sdk** — a typed client SDK for the Accounts API (formerly Rotur).

The SDK wraps the full platform API in a single library:

- **Typed REST client** — every endpoint is exposed through namespaced methods with full TypeScript types.
- **Authentication** — popup / iframe OAuth-style login that returns a bearer token, plus token-based session restoration.
- **Real-time WebSocket** — presence, statuses, activities and per-user key-value state with automatic reconnection.
- **Permission resolution** — maps the SDK methods you actually use to the minimal token permissions required.
- **Icon rendering** — converts Scratch-style icon strings into SVG.

## Installation

```bash
npm install accounts-sdk
```

Both ESM and CommonJS entry points are provided, with type declarations.

```js
// ESM / TypeScript
import { Rotur } from "accounts-sdk";

// CommonJS
const { Rotur } = require("accounts-sdk");
```

## Quick Start

```js
import { Rotur } from "accounts-sdk";

const rotur = new Rotur();

// Opens the auth popup, waits for the token
await rotur.login();

console.log(rotur.loggedIn); // true
console.log(rotur.token);    // the bearer token

// --- REST API ---
const me = await rotur.me.get();
const feed = await rotur.posts.feed(50);
await rotur.posts.create("Hello from accounts-sdk!");

// --- WebSocket (presence & live state) ---
await rotur.connectSocket();
rotur.socket.join("general");

rotur.socket.on("member_join", (msg) => {
  console.log(`${msg.username} joined ${msg.room}`);
});

rotur.socket.setStatus("Working on something", "online");

// Stop everything
rotur.logout();
```

## Authentication

### Interactive login

`rotur.login()` (via `performAuth`) opens the auth page at `https://accounts.bilup.org/auth` in a popup window, listens for the token over `postMessage`, and stores it. If the popup is blocked, it falls back to a full-screen embedded iframe.

```js
await rotur.login({
  system: "MyApp",      // optional system name
  requires: ["posts:create"], // request specific permissions
  timeout: 120_000,     // default timeout
  signal: abortController.signal, // support cancellation
  popupOnly: true,      // never fall back to iframe; throw if popup is blocked
});
```

On failure a `AuthError` is thrown with a `code` of one of: `timeout`, `aborted`, `popup_blocked`, `no_token`.

### Restoring a session

Pass a stored token to the constructor, or set it later:

```js
const rotur = new Rotur({ token: localStorage.getItem("rotur_token") });
// or
rotur.setToken(storedToken);

rotur.logout(); // clears the token and disconnects the socket
```

### Device / code linking

For non-browser or cross-device flows, the `link` namespace exchanges a one-time code for a token:

```js
const { code } = await rotur.link.getCode();
// show `code` to the user, then:
const token = await rotur.link.pollUntilLinked(code, 1500, 120_000);
```

## REST API

All authenticated requests automatically include the `Authorization: Bearer <token>` header. Public methods (marked below) can be called without a token.

### Namespaces

| Namespace | Description |
| --- | --- |
| `rotur.me` | Current user profile, key-value store, transfers, daily claims, badges, blocking, notes, friend requests, transactions, subscription |
| `rotur.posts` | Create / delete / like / reply / repost / pin posts, feed, search, limits |
| `rotur.friends` | Friend list, send / accept / reject / remove / cancel requests |
| `rotur.following` | Follow / unfollow users, list followers / following |
| `rotur.notifications` | Notification inbox |
| `rotur.keys` | API keys — create, sell, subscribe, grant / revoke access, buy |
| `rotur.items` | User items — create, buy, sell, transfer, set price |
| `rotur.gifts` | Credit gift codes — create, claim, cancel |
| `rotur.tokens` | Sub-tokens with scoped permissions — create, list, update, revoke |
| `rotur.groups` | Group management — roles, members, invites, announcements, events, tips, products, bans |
| `rotur.systems` | System-level users and configuration |
| `rotur.stats` | Economy, user and follower statistics |
| `rotur.status` | Fetch a user's status and presence |
| `rotur.validators` | Generate / validate validators for a key |
| `rotur.link` | Code-based account linking |
| `rotur.cosmetics` | Cosmetic shop, purchase, equip / unequip |
| `rotur.push` | Web Push notifications — register devices, send, manage senders |
| `rotur.files` | File storage — index, upload, usage, delete |
| `rotur.standing` | User standing (good / warning / suspended / banned) |
| `rotur.profiles` | Public profiles, avatar / banner URL helpers |
| `rotur.devfund` | Dev fund escrow transfers and releases |
| `rotur.check` | Batch checks (e.g. banned users) |

### Errors

Non-2xx responses throw an `ApiError` with a `status` number and the parsed `data` payload:

```js
try {
  await rotur.posts.create("");
} catch (err) {
  if (err instanceof ApiError) {
    console.error(err.status, err.data);
  }
}
```

If a method requires authentication and no token is present, an `ApiError` with status `401` is thrown.

## WebSocket

The socket connects to `wss://api.accounts.bilup.org/status/ws`, authenticates with your token, sends heartbeats every 25 s and reconnects automatically after drops.

```js
await rotur.connectSocket(); // resolves once "ready" is received
const socket = rotur.socket;

console.log(socket.connected, socket.userId, socket.username);
```

### Events

Listen with `socket.on(cmd, handler)` (returns an unsubscribe function) or `socket.once(cmd)` for a single-shot promise.

| Event | Description |
| --- | --- |
| `ready` | Connection authenticated; carries `user_id`, `username`, initial keys |
| `join_ok` / `leave_ok` | Confirmed room join / leave |
| `room_state` | Members currently in a room |
| `member_join` / `member_leave` | Member entered / left a room |
| `status_update` | A member's status, presence or activities changed |
| `profile_update` | A user's profile key changed |
| `key_update` | One of your keys changed (also fires `onKeyChange`) |
| `error` / `close` | Socket-level errors and disconnects |

### Rooms, status & activities

```js
socket.join(["general", "dev"]);
socket.leave("general");
const rooms = await socket.listRooms();
socket.roomState("general");

socket.setStatus("Playing a game", "dnd");

socket.setPlaying("My Game", {
  title: "Level 4",
  url: "https://example.com/game",
  status: "Playing",
  image: "https://example.com/screenshot.png",
});

socket.setMusic("Spotify", {
  title: "Song",
  artist: "Artist",
  album: "Album",
  start: 0,
  end: 240,
});

socket.clearActivity("My Game");
```

### Key-value state

The socket maintains a live cache of your user keys (`sys.*` and custom keys):

```js
socket.getKey("custom.score");          // current value
socket.getAllKeys();                    // full snapshot
const off = socket.onKeyChange((key, value, oldValue) => {
  console.log(`${key}: ${oldValue} -> ${value}`);
});
```

## Permissions

The SDK ships a permission model that maps every SDK method to the token permission it requires. `resolvePermissions()` reduces a list of used methods to the minimal sorted permission set — `"full"` wins and collapses the whole set.

```js
import { resolvePermissions, METHOD_PERMISSIONS } from "accounts-sdk";

const perms = resolvePermissions(["posts.create", "me.transfer", "groups.create"]);
// e.g. ["credits:transfer", "groups:manage", "posts:create"]
```

### Vite plugin

`tools/vite-plugin` provides a Vite plugin that scans your source, detects every SDK method you call, computes the required permissions and injects them into `__ROTUR_REQUIRES__`, which is then requested during authentication.

```js
// vite.config.js
import roturPermissions from "accounts-sdk/tools/vite-plugin";

export default {
  plugins: [
    roturPermissions({
      verbose: true,
      extraPermissions: ["credits:view"], // force-include extras
    }),
  ],
};
```

During `login()`, pass the requested permissions through `requires` so the auth page grants the minimal scope:

```js
const requires = typeof __ROTUR_REQUIRES__ !== "undefined" ? __ROTUR_REQUIRES__ : [];
await rotur.login({ requires });
```

## Icons

`iconToSvg()` renders Scratch-style icon strings to SVG.

```js
import { iconToSvg } from "accounts-sdk";

const svg = iconToSvg("c #ff0000 w 1 line 0 0 10 10", {
  size: 1,
  color: "#ffffff",
  strokeWidth: 1,
  boldness: 0,
  svgAttrs: { class: "icon" },
});
```

## Tooling

- `tools/permissions/gen.mjs` — regenerates `src/permissions.ts` (`METHOD_PERMISSIONS` / `NAMESPACE_BY_CLASS`) by parsing the Go API sources (expected in `~/api` by default). Run with `node tools/permissions/gen.mjs [path-to-api]`.
- `tools/vite-plugin` — the permission-scanning Vite plugin described above.

## Development

This package is built from TypeScript sources in `src/` and published as the `dist/` bundle (`index.js`, `index.mjs`, `index.d.ts`, `index.d.mts`). The shipped type declarations are the source of truth for the API surface.

## License

ISC
