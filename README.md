# rotur-sdk

The official TypeScript SDK for the [Rotur](https://rotur.dev) platform. Covers auth, profiles, posts, credits, keys, groups, items, gifts, tokens, validators, status, files, cosmetics, push notifications, and more — all with full type safety.

## Install

```bash
npm install rotur-sdk
```

## Quick Start

```ts
import { Rotur } from "rotur-sdk";

const rotur = new Rotur();

// Browser auth - opens the Rotur login popup
await rotur.login();

// Or provide a token you already have
const rotur = new Rotur({ token: "your-token-here" });
```

## API Reference

### Authentication

```ts
// Popup-based OAuth flow (browser only)
await rotur.login({ system: "my-app", timeout: 60_000 });

// Check current auth state
rotur.loggedIn; // boolean
rotur.token; // string | null

// Set/refresh token manually
rotur.setToken("new-token");

// Logout (clears token + disconnects socket)
rotur.logout();
```

### Link-based Auth (for CLI / server)

```ts
const code = await rotur.link.getCode();
console.log(`Visit https://rotur.dev/link and enter: ${code}`);

// Polls until the user links on the website
const token = await rotur.link.pollUntilLinked(code);
```

## Automatic Permission Scoping

Rotur's auth page accepts a `?requires=` parameter — a comma-separated list of token permissions the app needs. When present, the user grants a **scoped sub-token** holding exactly those permissions instead of full account access.

The SDK can compute this list for you at build time. A Vite plugin statically scans your source for the SDK methods you actually call, maps each to its required permission, dedupes, and injects the result. `rotur.login()` then appends `?requires=...` automatically — no hardcoding, and it stays in sync with your code.

### Setup (Vite)

```bash
npm install -D ts-morph   # optional peer dep used by the plugin at build time
```

```ts
// vite.config.ts
import { defineConfig } from "vite";
import roturPermissions from "rotur-sdk/vite";

export default defineConfig({
  plugins: [roturPermissions()],
});
```

That's it. If your app calls `rotur.posts.create()`, `rotur.me.transfer()`, and `rotur.tokens.create()`, the build computes:

```
[rotur-permissions] 3 permission(s): credits:transfer, full, posts:create
```

and `rotur.login()` opens `rotur.dev/auth?...&requires=credits:transfer,full,posts:create`.

Methods that hit endpoints requiring the **main account token** (e.g. `tokens.create`, `me.refreshToken`) resolve to `full`, which prompts the user for full access since a sub-token cannot satisfy them.

### Options

```ts
roturPermissions({
  tsConfigFilePath: "tsconfig.json",   // default
  include: ["src/**/*.{ts,tsx,js,jsx}"], // files to scan
  extraPermissions: ["files:manage"],  // add perms the scan can't detect
  verbose: true,                       // log the computed list
});
```

### Manual / dynamic calls

The static scan can't see dynamic dispatch like `rotur[ns][method]()`. Cover those with `extraPermissions` above, or pass them at the call site (merged with the injected set):

```ts
await rotur.login({ requires: ["files:manage", "notifications:send"] });
```

### Without the plugin

Pass the list yourself — `resolvePermissions` maps method keys to permissions using the same manifest:

```ts
import { resolvePermissions } from "rotur-sdk";

const requires = resolvePermissions(["posts.create", "me.transfer"]);
await rotur.login({ requires });
```

> The permission manifest is generated from the backend's route definitions via `npm run gen:permissions`. Regenerate it in the SDK repo whenever backend routes change.

### Profiles

```ts
const profile = await rotur.profiles.get("username");
const { exists } = await rotur.profiles.exists("username");
const avatarUrl = rotur.profiles.getAvatarUrl("username");
```

### Account (me)

```ts
await rotur.me.get();
await rotur.me.update("bio", "hello world");
await rotur.me.transfer("recipient", 100, "a note");
await rotur.me.claimDaily();
await rotur.me.badges();
await rotur.me.block("username");
await rotur.me.unblock("username");
await rotur.me.checkAuth();
```

### Posts

```ts
const post = await rotur.posts.create("Hello from the SDK!");
await rotur.posts.reply(post.id, "Nice post!");
await rotur.posts.like(post.id);
await rotur.posts.repost(post.id);
await rotur.posts.pin(post.id);

const feed = await rotur.posts.feed(100, 0);
const top = await rotur.posts.top(50, 24);
const results = await rotur.posts.search("query");
```

### Friends

```ts
const { friends } = await rotur.friends.list();
await rotur.friends.request("username");
await rotur.friends.accept("username");
await rotur.friends.remove("username");
```

### Following

```ts
await rotur.following.follow("username");
await rotur.following.unfollow("username");
const { followers } = await rotur.following.followers("username");
const { following } = await rotur.following.following("username");
```

### Keys

```ts
await rotur.keys.create("my-key", { price: 50, subscription: true });
const myKeys = await rotur.keys.mine();
const key = await rotur.keys.get("key-id");
const { owned } = await rotur.keys.check("username", "key-name");
await rotur.keys.buy("key-id");
```

### Items

```ts
const item = await rotur.items.create({
  name: "sword",
  price: 100,
  selling: true,
});
const item = await rotur.items.get("sword");
const items = await rotur.items.list("username");
await rotur.items.buy("sword");
await rotur.items.sell("sword");
```

### Gifts

```ts
await rotur.gifts.create(500, { note: "Happy birthday!", expiresInHrs: 48 });
const { gift } = await rotur.gifts.get("code");
await rotur.gifts.claim("code");
```

### Tokens (sub-tokens / scoped access)

```ts
const { permissions, groups } = await rotur.tokens.permissions();
const { tokens } = await rotur.tokens.list();

const sub = await rotur.tokens.create(
  "bot-token",
  ["posts:view", "posts:create", "account:profile"],
  { expiresInHrs: 24, origin: "my-app" },
);

await rotur.tokens.revoke(sub.id);
```

### Groups

```ts
const group = await rotur.groups.create("devs", "Developers", {
  description: "A group for devs",
  public: true,
  joinPolicy: "OPEN",
});

await rotur.groups.join("devs");
await rotur.groups.represent("devs");
const announcements = await rotur.groups.announcements("devs");
const roles = await rotur.groups.roles("devs");
await rotur.groups.assignRole("devs", userId, roleId);
```

### Cosmetics

```ts
const shop = await rotur.cosmetics.shop({ sort: "newest", limit: 20 });
const mine = await rotur.cosmetics.mine();
await rotur.cosmetics.purchase("cosmetic-id");
await rotur.cosmetics.equip("cosmetic-id");
await rotur.cosmetics.unequip("hat");
```

### Files

```ts
const files = await rotur.files.index();
const { used, max } = await rotur.files.usage();
const file = await rotur.files.getByUUID("uuid");
const file = await rotur.files.getByPath("path/to/file");
await rotur.files.upload({
  /* file data */
});
```

### Push Notifications

```ts
const { public_key } = await rotur.push.vapidKeys();
await rotur.push.register(endpoint, p256dh, auth, "my-app", "fingerprint");
const { endpoints } = await rotur.push.endpoints();
await rotur.push.send("username", "my-app", {
  title: "Hi!",
  body: "You have a message",
});
```

### Status & Validators

```ts
const status = await rotur.status.get("username");
const { validator } = await rotur.validators.generate("key");
const result = await rotur.validators.validate(validator, "key");
```

### Standing, Stats, DevFund, Check

```ts
const standing = await rotur.standing.get("username");
const economy = await rotur.stats.economy();
await rotur.devfund.escrowTransfer(100, "petition-id");
const { banned } = await rotur.check.banned(["user1", "user2"]);
```

## WebSocket (Real-time)

```ts
// Connect after login
const { user_id, username } = await rotur.connectSocket();

// Join presence rooms
rotur.socket.join(["lobby", "chat"]);

// Listen for events
rotur.socket.on("member_join", (msg) => {
  console.log(`${msg.username} joined ${msg.room}`);
});

rotur.socket.on("status_update", (msg) => {
  console.log(`${msg.username} is now ${msg.presence}`);
});

// Set your own status
rotur.socket.setStatus("Building something cool", "online");

// Rich presence — "Playing" activity
rotur.socket.setPlaying("My Game", {
  title: "Level 3",
  status: "In-game",
  url: "https://mygame.com",
});

// "Listening to" activity
rotur.socket.setMusic("Spotify", {
  title: "Song Name",
  artist: "Artist",
  album: "Album",
  start: Date.now(),
  end: Date.now() + 180_000,
});

// Wildcard — receive every message
rotur.socket.on("*", (msg) => console.log(msg.cmd, msg));

// Disconnect
rotur.socket.disconnect();
```

The socket auto-reconnects with exponential backoff and sends heartbeats every 25s.

## Error Handling

```ts
import { ApiError, AuthError } from "rotur-sdk";

try {
  await rotur.me.transfer("user", 1000);
} catch (e) {
  if (e instanceof ApiError) {
    console.log(e.status); // HTTP status code
    console.log(e.data); // response body
    console.log(e.message); // human-readable error
  }
}

try {
  await rotur.login();
} catch (e) {
  if (e instanceof AuthError) {
    console.log(e.code); // "timeout" | "aborted" | "popup_blocked" | "no_token"
  }
}
```

## Building

```bash
npm run build           # build CJS + ESM + types via tsup
npm run dev             # watch mode
npm run typecheck       # tsc --noEmit
npm test                # vitest
npm run gen:permissions # regenerate src/permissions.ts from backend routes
```

## Exports

| Export                      | Description                                                |
| --------------------------- | ---------------------------------------------------------- |
| `Rotur`                     | Main client class                                          |
| `RoturSocket`               | WebSocket connection (real-time presence)                  |
| `ApiError`                  | HTTP error with `status` and `data`                        |
| `performAuth`, `AuthError`  | Browser auth flow                                          |
| `AuthOptions`, `AuthResult` | Auth option types                                          |
| `resolvePermissions`        | Map `"namespace.method"` keys → required permissions       |
| `METHOD_PERMISSIONS`        | Static manifest of method → permission                     |
| `rotur-sdk/vite`            | Vite plugin for automatic permission scoping               |
| All types from `types.ts`   | `UserProfile`, `NetPost`, `GroupPublic`, `WSMessage`, etc. |

## License

MIT
