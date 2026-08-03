"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ApiError: () => ApiError,
  AuthError: () => AuthError,
  METHOD_PERMISSIONS: () => METHOD_PERMISSIONS,
  NAMESPACE_BY_CLASS: () => NAMESPACE_BY_CLASS,
  Rotur: () => Rotur,
  RoturSocket: () => RoturSocket,
  iconToSvg: () => iconToSvg,
  performAuth: () => performAuth,
  resolvePermissions: () => resolvePermissions
});
module.exports = __toCommonJS(index_exports);

// src/http.ts
var ApiError = class extends Error {
  constructor(status, data) {
    super(
      typeof data === "object" && data !== null && "error" in data ? String(data.error) : `API error ${status}`
    );
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
  status;
  data;
};
var Http = class {
  baseUrl = "https://api.accounts.bilup.org";
  getToken;
  constructor(getToken) {
    this.getToken = getToken;
  }
  buildUrl(path, params) {
    const url = new URL(path, this.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === void 0 || value === null) continue;
        url.searchParams.set(
          key,
          typeof value === "object" ? JSON.stringify(value) : String(value)
        );
      }
    }
    return url.toString();
  }
  async get(path, params, auth = true) {
    const token = this.getToken();
    if (auth && !token)
      throw new ApiError(401, {
        error: "Not authenticated \u2014 call rotur.login() first"
      });
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(this.buildUrl(path, params), { headers });
    return this.handle(res);
  }
  async post(path, body, auth = true) {
    const token = this.getToken();
    if (auth && !token)
      throw new ApiError(401, {
        error: "Not authenticated \u2014 call rotur.login() first"
      });
    const opts = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...token ? { Authorization: `Bearer ${token}` } : {}
      },
      body: body ? JSON.stringify(body) : void 0
    };
    const res = await fetch(`${this.baseUrl}${path}`, opts);
    return this.handle(res);
  }
  async patch(path, body) {
    const token = this.getToken();
    if (!token) throw new ApiError(401, { error: "Not authenticated" });
    const opts = {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    };
    if (body !== void 0) opts.body = JSON.stringify(body);
    const res = await fetch(`${this.baseUrl}${path}`, opts);
    return this.handle(res);
  }
  async del(path, body) {
    const token = this.getToken();
    if (!token) throw new ApiError(401, { error: "Not authenticated" });
    const opts = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    };
    if (body !== void 0) opts.body = JSON.stringify(body);
    const res = await fetch(`${this.baseUrl}${path}`, opts);
    return this.handle(res);
  }
  async handle(res) {
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      if (!res.ok) throw new ApiError(res.status, text);
      return void 0;
    }
    if (!res.ok) throw new ApiError(res.status, data);
    return data;
  }
};

// src/websocket.ts
var RoturSocket = class extends EventTarget {
  constructor(url = "wss://api.accounts.bilup.org/status/ws") {
    super();
    this.url = url;
  }
  url;
  ws = null;
  token = null;
  reconnectTimer = null;
  heartbeat = null;
  _connected = false;
  _userId = null;
  _username = null;
  handlers = /* @__PURE__ */ new Map();
  rooms = /* @__PURE__ */ new Set();
  keyCache = {};
  keyChangeCallbacks = /* @__PURE__ */ new Set();
  get connected() {
    return this._connected;
  }
  get userId() {
    return this._userId;
  }
  get username() {
    return this._username;
  }
  get joinedRooms() {
    return [...this.rooms];
  }
  getKey(key) {
    return this.keyCache[key];
  }
  getAllKeys() {
    return { ...this.keyCache };
  }
  onKeyChange(callback) {
    this.keyChangeCallbacks.add(callback);
    return () => this.keyChangeCallbacks.delete(callback);
  }
  offKeyChange(callback) {
    this.keyChangeCallbacks.delete(callback);
  }
  notifyKeyChange(key, value, oldValue) {
    for (const cb of this.keyChangeCallbacks) {
      try {
        cb(key, value, oldValue);
      } catch {
      }
    }
  }
  connect(token) {
    this.token = token;
    return new Promise((resolve, reject) => {
      this.cleanup();
      this.ws = new WebSocket(this.url);
      this.ws.onmessage = (e) => {
        let msg;
        try {
          msg = JSON.parse(e.data);
        } catch {
          return;
        }
        const cmd = msg.cmd;
        if (cmd === "ready") {
          this._connected = true;
          this._userId = msg.user_id;
          this._username = msg.username;
          if (msg.user && typeof msg.user === "object") {
            this.keyCache = { ...msg.user };
          }
          this.startHeartbeat();
          resolve(
            msg
          );
        }
        if (cmd === "join_ok") this.rooms.add(msg.room);
        if (cmd === "leave_ok") this.rooms.delete(msg.room);
        if (cmd === "key_update" && typeof msg.key === "string") {
          const old = this.keyCache[msg.key];
          this.keyCache[msg.key] = msg.value;
          this.notifyKeyChange(msg.key, msg.value, old);
        }
        this.emit(cmd, msg);
      };
      this.ws.onerror = (e) => {
        if (!this._connected) reject(new Error("WebSocket connection failed"));
        this.emit("error", e);
      };
      this.ws.onclose = () => {
        this._connected = false;
        this.emit("close", {});
        this.scheduleReconnect();
      };
      this.ws.onopen = () => {
        this.send({ cmd: "auth", key: token });
      };
    });
  }
  startHeartbeat() {
    this.heartbeat = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ cmd: "ping" }));
      }
    }, 25e3);
  }
  scheduleReconnect() {
    if (!this.token) return;
    this.reconnectTimer = setTimeout(
      () => this.connect(this.token).catch(() => {
      }),
      3e3
    );
  }
  cleanup() {
    if (this.heartbeat) clearInterval(this.heartbeat);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.heartbeat = null;
    this.reconnectTimer = null;
  }
  emit(cmd, msg) {
    this.handlers.get(cmd)?.forEach((h) => h(msg));
    this.dispatchEvent(new CustomEvent(cmd, { detail: msg }));
    this.dispatchEvent(new CustomEvent("*", { detail: msg }));
  }
  send(packet) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(packet));
    }
  }
  on(cmd, handler) {
    if (!this.handlers.has(cmd)) this.handlers.set(cmd, /* @__PURE__ */ new Set());
    this.handlers.get(cmd).add(handler);
    return () => this.handlers.get(cmd)?.delete(handler);
  }
  off(cmd, handler) {
    this.handlers.get(cmd)?.delete(handler);
  }
  once(cmd) {
    return new Promise((resolve) => {
      const h = (msg) => {
        this.off(cmd, h);
        resolve(
          msg
        );
      };
      this.on(cmd, h);
    });
  }
  join(rooms) {
    this.send({ cmd: "join", rooms: Array.isArray(rooms) ? rooms : [rooms] });
  }
  leave(rooms) {
    this.send({ cmd: "leave", rooms: Array.isArray(rooms) ? rooms : [rooms] });
  }
  listRooms() {
    this.send({ cmd: "rooms" });
    return this.once("rooms").then((m) => m.rooms);
  }
  roomState(room) {
    this.send({ cmd: "room_state", room });
  }
  setStatus(status, presence) {
    this.send({ cmd: "set_status", status, presence });
  }
  addActivity(activity) {
    this.send({ cmd: "add_activity", ...activity });
  }
  removeActivity(id) {
    this.send({ cmd: "remove_activity", id });
  }
  setMusic(application, media, title) {
    this.send({
      cmd: "add_activity",
      id: application,
      title: title ?? `Listening to ${application}`,
      application: { name: application },
      media
    });
  }
  setPlaying(application, options) {
    this.send({
      cmd: "add_activity",
      id: application,
      title: options?.title ?? application,
      application: { name: application, url: options?.url },
      status: options?.status,
      image: options?.image
    });
  }
  clearActivity(id) {
    this.send({ cmd: "remove_activity", id });
  }
  disconnect() {
    this.token = null;
    this.cleanup();
    this.rooms.clear();
    this.keyCache = {};
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this._connected = false;
  }
};

// src/auth.ts
var AUTH_URL = "https://accounts.bilup.org/auth";
var ORIGIN = "https://accounts.bilup.org";
function buildRequires(explicit) {
  const injected = typeof __ROTUR_REQUIRES__ !== "undefined" ? __ROTUR_REQUIRES__ : [];
  const set = /* @__PURE__ */ new Set([...injected, ...explicit ?? []]);
  if (set.has("full")) return ["full"];
  return [...set].sort();
}
var AuthError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "AuthError";
  }
  code;
};
function performAuth(options) {
  if (options?.signal?.aborted) {
    throw new AuthError("aborted", "Auth was aborted");
  }
  const timeout = options?.timeout ?? 12e4;
  const authUrl = new URL(AUTH_URL);
  if (options?.system) authUrl.searchParams.set("system", options.system);
  const returnTo = options?.returnTo ?? window.location.href;
  authUrl.searchParams.set("return_to", returnTo);
  const requires = buildRequires(options?.requires);
  if (requires.length) authUrl.searchParams.set("requires", requires.join(","));
  const returnToOrigin = new URL(returnTo).origin;
  let iframe;
  const w = window.open(authUrl.toString(), "rotur-auth");
  if (!w && options?.popupOnly) {
    throw new AuthError(
      "popup_blocked",
      "Auth popup was blocked \u2014 allow popups for this site and try again"
    );
  }
  return new Promise((resolve, reject) => {
    const signal = options?.signal;
    const rejectWithError = (code, msg) => {
      cleanup();
      reject(new AuthError(code, msg));
    };
    const timer = setTimeout(() => {
      rejectWithError("timeout", `Auth timed out after ${timeout}ms`);
    }, timeout);
    const onAbort = () => rejectWithError("aborted", "Auth was aborted");
    signal?.addEventListener("abort", onAbort, { once: true });
    function handler(e) {
      if (e.origin !== ORIGIN && e.origin !== returnToOrigin) return;
      if (e.data?.type !== "rotur-auth-token") return;
      if (!e.data.token) return;
      cleanup();
      resolve({ token: e.data.token });
    }
    function closePopup() {
      if (!w || w.closed) return;
      try {
        w.postMessage({ type: "rotur-auth-close" }, ORIGIN);
      } catch {
      }
      try {
        w.close();
      } catch {
      }
      if (!w.closed) {
        let attempts = 0;
        const retry = setInterval(() => {
          attempts++;
          if (!w || w.closed || attempts >= 20) {
            clearInterval(retry);
            return;
          }
          try {
            w.postMessage({ type: "rotur-auth-close" }, ORIGIN);
          } catch {
          }
          try {
            w.close();
          } catch {
          }
        }, 100);
      }
    }
    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener("message", handler);
      signal?.removeEventListener("abort", onAbort);
      iframe?.remove();
      closePopup();
    }
    window.addEventListener("message", handler);
    if (w) return;
    iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:none;z-index:9999";
    iframe.src = authUrl.toString();
    document.body.appendChild(iframe);
  });
}

// src/client/base.ts
var Namespace = class {
  constructor(r) {
    this.r = r;
  }
  r;
  $get(path, params, auth = true) {
    return this.r._http.get(path, params, auth);
  }
  $post(path, body, auth = true) {
    return this.r._http.post(path, body, auth);
  }
  $patch(path, body) {
    return this.r._http.patch(path, body);
  }
  $del(path, body) {
    return this.r._http.del(path, body);
  }
  $postQuery(path, params, auth = true) {
    return this.r._http.post(withQuery(path, params), void 0, auth);
  }
  $delQuery(path, params) {
    return this.r._http.del(withQuery(path, params));
  }
};
function withQuery(path, params) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === void 0 || value === null) continue;
    query.set(key, String(value));
  }
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}
async function handleMessageOrError(res) {
  const raw = await res;
  if (raw.error) return { ok: false, error: String(raw.error) };
  return { ok: true, message: String(raw.message ?? "") };
}

// src/client/me.ts
var MeNamespace = class extends Namespace {
  async get() {
    return this.$get("/me");
  }
  async update(key, value) {
    return this.$post("/me/update", { key, value });
  }
  async deleteKey(key) {
    return this.$del("/me/delete", { key });
  }
  async deleteAccount() {
    return this.$del("/users");
  }
  async refreshToken() {
    return this.$post("/me/refresh_token");
  }
  getKey(key) {
    return this.r.socket.getKey(key);
  }
  getAllKeys() {
    return this.r.socket.getAllKeys();
  }
  onKeyChange(callback) {
    return this.r.socket.onKeyChange(callback);
  }
  async transfer(to, amount, note) {
    return this.$post("/me/transfer", { to, amount, note });
  }
  async claimDaily() {
    return this.$get("/claim_daily");
  }
  async claimTime() {
    return this.$get("/claim_time");
  }
  async badges() {
    return this.$get("/badges");
  }
  async abilities() {
    return this.$get("/me/able");
  }
  async blocked() {
    return this.$get("/me/blocked");
  }
  async block(username) {
    return this.$post(`/me/block/${username}`);
  }
  async unblock(username) {
    return this.$post(`/me/unblock/${username}`);
  }
  async note(username, content) {
    return this.$post(`/me/note/${username}`, { content });
  }
  async deleteNote(username) {
    return this.$del(`/me/note/${username}`);
  }
  async checkAuth() {
    return this.$get("/check_auth");
  }
  async requests() {
    const data = await this.$get("/requests");
    return { requests: data.requests ?? [] };
  }
  async outgoing() {
    const data = await this.$get("/requests_out");
    return { outgoing: data.requests_out ?? [] };
  }
  async transactions() {
    const data = await this.$get("/me");
    return data["sys.transactions"] ?? [];
  }
  async subscription() {
    const data = await this.$get("/me");
    return data["sys.subscription"] ?? { active: false, tier: "Free", next_billing: 0 };
  }
};

// src/client/posts.ts
var PostsNamespace = class extends Namespace {
  async create(content, options) {
    const params = { content };
    if (options?.attachment) params.attachment = options.attachment;
    if (options?.profileOnly) params.profile_only = "1";
    if (options?.os) params.os = options.os;
    return this.$get("/post", params);
  }
  async delete(id) {
    return this.$get("/delete", { id });
  }
  async like(id) {
    return this.$get("/rate", { id, rating: 1 });
  }
  async unlike(id) {
    return this.$get("/rate", { id, rating: 0 });
  }
  async reply(id, content) {
    return this.$get("/reply", { id, content });
  }
  async repost(id) {
    return this.$get("/repost", { id });
  }
  async pin(id) {
    return this.$get("/pin_post", { id });
  }
  async unpin(id) {
    return this.$get("/unpin_post", { id });
  }
  async feed(limit = 100, offset = 0) {
    return this.$get("/feed", { limit, offset }, false);
  }
  async followingFeed(limit = 100) {
    return this.$get("/following_feed", { limit });
  }
  async top(limit = 50, timePeriod = 24) {
    return this.$get("/top_posts", { limit, time_period: timePeriod }, false);
  }
  async search(query, limit = 20) {
    return this.$get("/search_posts", { q: query, limit }, false);
  }
  async limits() {
    return this.$get("/limits", void 0, false);
  }
};

// src/client/friends.ts
var FriendsNamespace = class extends Namespace {
  async list() {
    return this.$get("/friends");
  }
  async request(username) {
    return handleMessageOrError(this.$post(`/friends/request/${username}`));
  }
  async accept(username) {
    return handleMessageOrError(this.$post(`/friends/accept/${username}`));
  }
  async reject(username) {
    return handleMessageOrError(this.$post(`/friends/reject/${username}`));
  }
  async remove(username) {
    return handleMessageOrError(this.$post(`/friends/remove/${username}`));
  }
  async cancel(username) {
    return handleMessageOrError(this.$post(`/friends/cancel/${username}`));
  }
};

// src/client/following.ts
var FollowingNamespace = class extends Namespace {
  async follow(username) {
    return handleMessageOrError(this.$get("/follow", { username }));
  }
  async unfollow(username) {
    return handleMessageOrError(this.$get("/unfollow", { username }));
  }
  async followers(username) {
    return this.$get("/followers", { username }, false);
  }
  async following(username) {
    return this.$get("/following", { username }, false);
  }
};

// src/client/notifications.ts
var NotificationsNamespace = class extends Namespace {
  async list(afterDays = 1) {
    return this.$get("/notifications", { after: afterDays });
  }
};

// src/client/keys.ts
var KeysNamespace = class extends Namespace {
  async create(name, options) {
    const params = { name };
    if (options?.description) params.description = options.description;
    if (options?.price !== void 0) params.price = String(options.price);
    if (options?.subscription) params.subscription = "true";
    if (options?.frequency) params.frequency = String(options.frequency);
    if (options?.period) params.period = options.period;
    return this.$get("/keys/create", params);
  }
  async mine() {
    return this.$get("/keys/mine");
  }
  async get(id) {
    return this.$get(`/keys/get/${id}`, void 0, false);
  }
  async check(username, key) {
    return this.$get(`/keys/check/${username}`, { key }, false);
  }
  async rename(id, name) {
    return this.$get(`/keys/name/${id}`, { name });
  }
  async update(id, key, data) {
    return this.$get(`/keys/update/${id}`, { key, data });
  }
  async revoke(id, user) {
    return this.$get(`/keys/revoke/${id}`, { user });
  }
  async delete(id) {
    return this.$get(`/keys/delete/${id}`);
  }
  async addUser(id, user) {
    return this.$get(`/keys/admin_add/${id}`, { user });
  }
  async removeUser(id, user) {
    return this.$get(`/keys/admin_remove/${id}`, { user });
  }
  async buy(id) {
    return this.$get(`/keys/buy/${id}`);
  }
  async cancel(id) {
    return this.$get(`/keys/cancel/${id}`);
  }
};

// src/client/items.ts
var ItemsNamespace = class extends Namespace {
  async create(item) {
    return this.$get("/items/create", { item: JSON.stringify(item) });
  }
  async get(name) {
    return this.$get(`/items/get/${name}`, void 0, false);
  }
  async list(username) {
    return this.$get(`/items/list/${username}`, void 0, false);
  }
  async selling(limit = 50) {
    return this.$get("/items/selling", { limit }, false);
  }
  async buy(name) {
    return this.$get(`/items/buy/${name}`);
  }
  async transfer(name, username) {
    return this.$get(`/items/transfer/${name}`, { username });
  }
  async sell(name) {
    return this.$get(`/items/sell/${name}`);
  }
  async stopSelling(name) {
    return this.$get(`/items/stop_selling/${name}`);
  }
  async setPrice(name, price) {
    return this.$get(`/items/set_price/${name}`, { price: String(price) });
  }
  async update(name, data) {
    return this.$get(`/items/update/${name}`, { data: JSON.stringify(data) });
  }
  async delete(name) {
    return this.$get(`/items/delete/${name}`);
  }
};

// src/client/gifts.ts
var GiftsNamespace = class extends Namespace {
  async create(amount, options) {
    return this.$post("/gifts/create", {
      amount,
      note: options?.note,
      expires_in_hrs: options?.expiresInHrs
    });
  }
  async get(code) {
    return this.$get(`/gifts/${code}`, void 0, false);
  }
  async claim(code) {
    return this.$post(`/gifts/claim/${code}`);
  }
  async cancel(id) {
    return this.$post(`/gifts/cancel/${id}`);
  }
  async mine() {
    return this.$get("/gifts/mine");
  }
};

// src/client/tokens.ts
var TokensNamespace = class extends Namespace {
  async permissions() {
    return this.$get("/tokens/permissions", void 0, false);
  }
  async list() {
    return this.$get("/tokens");
  }
  async active() {
    return this.$get("/tokens/active");
  }
  async create(name, permissions, options) {
    return this.$post("/tokens/create", {
      name,
      permissions,
      expires_in_hrs: options?.expiresInHrs,
      origin: options?.origin,
      description: options?.description,
      websites: options?.websites
    });
  }
  async get(id) {
    return this.$get(`/tokens/${id}`);
  }
  async activity(id) {
    return this.$get(`/tokens/${id}/activity`);
  }
  async update(id, options) {
    return this.$patch(`/tokens/${id}`, options);
  }
  async rename(id, name) {
    return this.$post(`/tokens/${id}/rename`, { name });
  }
  async revoke(id) {
    return this.$post(`/tokens/${id}/revoke`);
  }
  async delete(id) {
    return this.$del(`/tokens/${id}`);
  }
};

// src/client/groups.ts
var GroupsNamespace = class extends Namespace {
  async mine() {
    return this.$get("/groups/mine");
  }
  async search(query) {
    return this.$get("/groups/search", { query });
  }
  async create(tag, name, options) {
    const params = { tag, name };
    if (options?.description) params.description = options.description;
    if (options?.iconUrl) params.icon_url = options.iconUrl;
    if (options?.bannerUrl) params.banner_url = options.bannerUrl;
    if (options?.public !== void 0) params.public = String(options.public);
    if (options?.joinPolicy) params.join_policy = options.joinPolicy;
    return this.$post("/groups/create", params);
  }
  async get(grouptag) {
    return this.$get(`/groups/${grouptag}`);
  }
  async update(grouptag, updates) {
    return this.$patch(`/groups/${grouptag}`, updates);
  }
  async delete(grouptag) {
    return this.$del(`/groups/${grouptag}`);
  }
  async join(grouptag) {
    return this.$post(`/groups/${grouptag}/join`);
  }
  async requestJoin(grouptag, message) {
    return this.$postQuery(`/groups/${grouptag}/join_requests`, { message });
  }
  async leave(grouptag) {
    return this.$post(`/groups/${grouptag}/leave`);
  }
  async represent(grouptag) {
    return this.$post(`/groups/${grouptag}/rep`);
  }
  async disrepresent(grouptag) {
    return this.$post(`/groups/${grouptag}/disrep`);
  }
  async report(grouptag) {
    return this.$post(`/groups/${grouptag}/report`);
  }
  async announcements(grouptag) {
    return this.$get(`/groups/${grouptag}/announcements`, void 0, false);
  }
  async createAnnouncement(grouptag, title, body, options) {
    return this.$post(`/groups/${grouptag}/announcements`, {
      title,
      body,
      ping_members: options?.pingMembers
    });
  }
  async deleteAnnouncement(grouptag, id) {
    return this.$del(`/groups/${grouptag}/announcements/${id}`);
  }
  async muteAnnouncements(grouptag) {
    return this.$post(`/groups/${grouptag}/announcements/mute`);
  }
  async events(grouptag) {
    return this.$get(`/groups/${grouptag}/events`);
  }
  async createEvent(grouptag, event) {
    return this.$post(`/groups/${grouptag}/events`, event);
  }
  async updateEvent(grouptag, eventId, updates) {
    return this.$patch(`/groups/${grouptag}/events/${eventId}`, updates);
  }
  async deleteEvent(grouptag, eventId) {
    return this.$del(`/groups/${grouptag}/events/${eventId}`);
  }
  async tips(grouptag) {
    return this.$get(`/groups/${grouptag}/tips`);
  }
  async sendTip(grouptag, amount, note) {
    return this.$postQuery(`/groups/${grouptag}/tips`, { amount, note });
  }
  async products(grouptag) {
    return this.$get(`/groups/${grouptag}/products`);
  }
  async createProduct(grouptag, product) {
    return this.$postQuery(`/groups/${grouptag}/products`, {
      name: product.name,
      description: product.description,
      price_credits: product.priceCredits,
      role_id: product.roleId,
      subscription: product.subscription,
      frequency: product.frequency,
      period: product.period
    });
  }
  async deleteProduct(grouptag, productId) {
    return this.$del(`/groups/${grouptag}/products/${productId}`);
  }
  async purchaseProduct(grouptag, productId) {
    return this.$post(`/groups/${grouptag}/products/${productId}/purchase`);
  }
  async cancelProductSubscription(grouptag, productId) {
    return this.$post(`/groups/${grouptag}/products/${productId}/cancel`);
  }
  async productOwnership(grouptag, productId, username) {
    return this.$get(
      `/groups/${grouptag}/products/${productId}/owners/${username}`,
      void 0,
      false
    );
  }
  async myProductSubscriptions() {
    return this.$get("/groups/products/subscriptions/mine");
  }
  async roles(grouptag) {
    return this.$get(`/groups/${grouptag}/roles`);
  }
  async members(grouptag, options) {
    return this.$get(`/groups/${grouptag}/members`, {
      page: options?.page,
      per_page: options?.perPage,
      search: options?.search
    });
  }
  async createRole(grouptag, role) {
    return this.$post(`/groups/${grouptag}/roles`, role);
  }
  async updateRole(grouptag, roleId, updates) {
    return this.$patch(`/groups/${grouptag}/roles/${roleId}`, updates);
  }
  async deleteRole(grouptag, roleId) {
    return this.$del(`/groups/${grouptag}/roles/${roleId}`);
  }
  async userRoles(grouptag, userId) {
    return this.$get(`/groups/${grouptag}/members/${userId}/roles`);
  }
  async userPermissions(grouptag, userId) {
    return this.$get(`/groups/${grouptag}/members/${userId}/permissions`);
  }
  async userBenefits(grouptag, userId) {
    return this.$get(`/groups/${grouptag}/members/${userId}/benefits`);
  }
  async assignRole(grouptag, userId, roleId) {
    return this.$post(`/groups/${grouptag}/members/${userId}/roles/${roleId}`);
  }
  async removeRole(grouptag, userId, roleId) {
    return this.$del(`/groups/${grouptag}/members/${userId}/roles/${roleId}`);
  }
  async invites(grouptag) {
    return this.$get(`/groups/${grouptag}/invites`);
  }
  async invite(grouptag, username) {
    return this.$postQuery(`/groups/${grouptag}/invites`, { username });
  }
  async revokeInvite(grouptag, inviteId) {
    return this.$del(`/groups/${grouptag}/invites/${inviteId}`);
  }
  async myInvites() {
    return this.$get("/groups/invites/mine");
  }
  async acceptInvite(grouptag, inviteId) {
    return this.$post(`/groups/${grouptag}/invites/${inviteId}/accept`);
  }
  async declineInvite(grouptag, inviteId) {
    return this.$post(`/groups/${grouptag}/invites/${inviteId}/decline`);
  }
  async joinRequests(grouptag) {
    return this.$get(`/groups/${grouptag}/join_requests`);
  }
  async acceptJoinRequest(grouptag, requestId) {
    return this.$post(`/groups/${grouptag}/join_requests/${requestId}/accept`);
  }
  async declineJoinRequest(grouptag, requestId) {
    return this.$post(`/groups/${grouptag}/join_requests/${requestId}/decline`);
  }
  async kick(grouptag, userId) {
    return this.$del(`/groups/${grouptag}/members/${userId}`);
  }
  async ban(grouptag, userId, reason) {
    return this.$postQuery(`/groups/${grouptag}/members/${userId}/ban`, {
      reason
    });
  }
  async unban(grouptag, userId) {
    return this.$del(`/groups/${grouptag}/members/${userId}/ban`);
  }
  async bans(grouptag) {
    return this.$get(`/groups/${grouptag}/bans`);
  }
  async transferOwnership(grouptag, userId) {
    return this.$post(`/groups/${grouptag}/transfer/${userId}`);
  }
};

// src/client/systems.ts
var SystemsNamespace = class extends Namespace {
  async list() {
    return this.$get("/systems", void 0, false);
  }
  async users(system) {
    return this.$get("/system/users", { system });
  }
  async update(system, key, value) {
    return this.$post("/update_system", { system, key, value });
  }
  async reload() {
    return this.$get("/reload_systems");
  }
};

// src/client/stats.ts
var StatsNamespace = class extends Namespace {
  async economy() {
    return this.$get("/stats/economy", void 0, false);
  }
  async users() {
    return this.$get("/stats/users", void 0, false);
  }
  async mostGained(max = 10) {
    return this.$get("/stats/most_gained", { max: String(max) }, false);
  }
  async systems() {
    return this.$get("/stats/systems", void 0, false);
  }
  async followers(max = 10) {
    return this.$get("/stats/followers", { max: String(max) }, false);
  }
};

// src/client/status.ts
var StatusNamespace = class extends Namespace {
  async get(username) {
    return this.$get("/status/get", { name: username }, false);
  }
};

// src/client/validators.ts
var ValidatorsNamespace = class extends Namespace {
  async generate(key) {
    return this.$get("/generate_validator", { key });
  }
  async validate(validator, key) {
    return this.$get("/validate", { v: validator, key }, false);
  }
};

// src/client/link.ts
var LinkNamespace = class extends Namespace {
  async getCode() {
    return this.$get("/link/code", void 0, false);
  }
  async status(code) {
    return this.$get("/link/status", { code }, false);
  }
  async linkedUser(code) {
    return this.$get("/link/user", { code }, false);
  }
  async linkCode(code) {
    return this.$post("/link/code", { code });
  }
  async pollUntilLinked(code, intervalMs = 1500, timeoutMs = 12e4) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const res = await this.$get("/link/user", { code }, false);
      if (res.linked && res.token) {
        this.r.setToken(res.token);
        return res.token;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error("Link polling timed out");
  }
};

// src/client/cosmetics.ts
var CosmeticsNamespace = class extends Namespace {
  async shop(options) {
    const params = {};
    if (options?.type) params.type = options.type;
    if (options?.featured) params.featured = "true";
    if (options?.search) params.search = options.search;
    if (options?.sort) params.sort = options.sort;
    if (options?.limit !== void 0) params.limit = String(options.limit);
    if (options?.offset !== void 0) params.offset = String(options.offset);
    return this.$get("/cosmetics/shop", params, false);
  }
  async get(id) {
    return this.$get(`/cosmetics/items/${id}`, void 0, false);
  }
  async mine() {
    return this.$get("/cosmetics/mine");
  }
  async purchase(id) {
    return this.$post(`/cosmetics/purchase/${id}`);
  }
  async equip(id) {
    return this.$post(`/cosmetics/equip/${id}`);
  }
  async unequip(type) {
    return this.$post(`/cosmetics/unequip?type=${encodeURIComponent(type)}`);
  }
  async forUser(username) {
    return this.$get(
      `/profile/${encodeURIComponent(username)}/cosmetics`,
      void 0,
      false
    );
  }
  async forUsers(usernames) {
    return this.$post(
      "/profile/cosmetics",
      { usernames },
      false
    );
  }
};

// src/client/push.ts
var PushNamespace = class extends Namespace {
  async vapidKeys() {
    return this.$get("/notify/vapid", void 0, false);
  }
  async register(endpoint, p256dh, auth, source, fingerprint) {
    return this.$post("/notify/register", {
      endpoint,
      p256dh,
      auth,
      source,
      fingerprint
    });
  }
  async check(source, fingerprint) {
    return this.$get("/notify/check", { source, fingerprint });
  }
  async endpoints() {
    return this.$get("/notify/endpoints");
  }
  async deleteDevice(deviceId) {
    return this.$del(`/notify/device/${deviceId}`);
  }
  async allowedSenders() {
    return this.$get("/notify/allowed");
  }
  async allowSender(username, source) {
    return this.$post(`/notify/allowed/${username}`, { source });
  }
  async removeSender(username, source) {
    return this.$del(`/notify/allowed/${username}`, { source });
  }
  async log() {
    return this.$get("/notify/log");
  }
  async send(username, source, options) {
    return this.$post(`/notify/${username}`, {
      source,
      title: options?.title,
      body: options?.body,
      data: options?.data
    });
  }
  async sendMany(users, source, options) {
    return this.$post("/notify/", {
      source,
      title: options?.title,
      body: options?.body,
      data: options?.data,
      users
    });
  }
  async notifiableUsers(source) {
    return this.$get(`/notify/${source}/users`);
  }
};

// src/client/files.ts
var FilesNamespace = class extends Namespace {
  async index() {
    return this.$get("/files/index");
  }
  async all() {
    return this.$get("/files/entries");
  }
  async getByUUID(uuid) {
    return this.$get("/files", { uuid });
  }
  async getByPath(path) {
    return this.$get(`/files/by-path/${path}`);
  }
  async usage() {
    return this.$get("/files/usage");
  }
  async stats(uuids) {
    return this.$post("/files/stats", { uuids });
  }
  async byUUIDs(uuids) {
    return this.$post("/files/by-uuid", { uuids });
  }
  async pathIndex() {
    return this.$get("/files/path-index");
  }
  async upload(files) {
    return this.$post("/files", files);
  }
  async deleteAll() {
    return this.$del("/files");
  }
};

// src/client/standing.ts
var StandingNamespace = class extends Namespace {
  async get(username) {
    return this.$get("/get_standing", { username }, false);
  }
};

// src/client/profiles.ts
var AVATARS_BASE = "https://avatars.accounts.bilup.org";
var ProfilesNamespace = class extends Namespace {
  async get(username, includePosts = true) {
    return this.$get(
      `/profile/${encodeURIComponent(username)}`,
      { include_posts: includePosts ? "1" : "0" },
      false
    );
  }
  async exists(username) {
    return this.$get("/exists", { username }, false);
  }
  async supporters() {
    return this.$get("/supporters", void 0, false);
  }
  getAvatarUrl(username, cache = "") {
    return `${AVATARS_BASE}/${username}?v=${cache}`;
  }
  getOverlayUrl(username, cache = "") {
    return `${AVATARS_BASE}/.overlay/${username}?v=${cache}`;
  }
  getBannerUrl(username, cache = "") {
    return `${AVATARS_BASE}/.banners/${username}?v=${cache}`;
  }
};

// src/client/devfund.ts
var DevFundNamespace = class extends Namespace {
  async escrowTransfer(amount, petitionId, note) {
    return this.$post("/devfund/escrow_transfer", {
      amount,
      petition_id: petitionId,
      note
    });
  }
  async escrowRelease(amount, toUsername, petitionId, note) {
    return this.$post("/devfund/escrow_release", {
      amount,
      to_username: toUsername,
      petition_id: petitionId,
      note
    });
  }
};

// src/client/check.ts
var CheckNamespace = class extends Namespace {
  async banned(usernames) {
    return this.$post("/check/banned", usernames.join(","));
  }
};

// src/client/rotur.ts
var Rotur = class {
  _http;
  socket;
  _token = null;
  _socketReady = null;
  me = new MeNamespace(this);
  posts = new PostsNamespace(this);
  friends = new FriendsNamespace(this);
  following = new FollowingNamespace(this);
  notifications = new NotificationsNamespace(this);
  keys = new KeysNamespace(this);
  items = new ItemsNamespace(this);
  gifts = new GiftsNamespace(this);
  tokens = new TokensNamespace(this);
  groups = new GroupsNamespace(this);
  systems = new SystemsNamespace(this);
  stats = new StatsNamespace(this);
  status = new StatusNamespace(this);
  validators = new ValidatorsNamespace(this);
  link = new LinkNamespace(this);
  cosmetics = new CosmeticsNamespace(this);
  push = new PushNamespace(this);
  files = new FilesNamespace(this);
  standing = new StandingNamespace(this);
  profiles = new ProfilesNamespace(this);
  devfund = new DevFundNamespace(this);
  check = new CheckNamespace(this);
  constructor(options) {
    this._token = options?.token ?? null;
    this._http = new Http(() => this._token);
    this.socket = new RoturSocket(options?.wsUrl);
    if (this._token) this._openSocket(this._token);
  }
  get token() {
    return this._token;
  }
  get loggedIn() {
    return this._token !== null;
  }
  setToken(token) {
    this._token = token;
    if (!this.socket.connected) this._openSocket(token);
  }
  async login(options) {
    const { token } = await performAuth(options);
    this._token = token;
    this._openSocket(token);
    return this;
  }
  async connectSocket() {
    if (!this._token) throw new ApiError(401, { error: "Login first" });
    const result = await this.socket.connect(this._token);
    this._socketReady = Promise.resolve(result);
    return result;
  }
  logout() {
    this._token = null;
    this._socketReady = null;
    this.socket.disconnect();
  }
  _openSocket(token) {
    this._socketReady = this.socket.connect(token).catch(() => null);
  }
};

// src/icon.ts
function dp(n2) {
  return (Math.round(n2 * 1e4) / 1e4).toString();
}
var n = (v) => +v || 0;
function rotateVec(x, y, angleDeg) {
  const rad = angleDeg * Math.PI / 180;
  return [
    x * Math.cos(rad) - y * Math.sin(rad),
    x * Math.sin(rad) + y * Math.cos(rad)
  ];
}
function tokenise(src) {
  if (Array.isArray(src)) return src.map(String);
  return String(src).trim().split(/[ \n\t]+/g).filter(Boolean);
}
function renderTokens(tokens, ox, oy, boldness, state, resolver, out) {
  let i = 0;
  const next = () => tokens[++i] ?? "0";
  const toSVG = (lx, ly) => {
    const wx = state.offx + lx;
    const wy = state.offy + ly;
    return [ox + wx * state.size, oy - wy * state.size];
  };
  while (i < tokens.length) {
    const op = tokens[i];
    switch (op) {
      case "c":
        state.color = next();
        break;
      case "w": {
        const wArg = n(next());
        state.strokeWidth = Math.abs(wArg * state.size) * (boldness + 1);
        break;
      }
      case "line": {
        const [ax, ay] = toSVG(n(next()), n(next()));
        const [bx, by] = toSVG(n(next()), n(next()));
        out.push(
          `<line x1="${dp(ax)}" y1="${dp(ay)}" x2="${dp(bx)}" y2="${dp(by)}" stroke="${state.color}" stroke-width="${dp(state.strokeWidth)}" stroke-linecap="round"/>`
        );
        state.penX = bx;
        state.penY = by;
        break;
      }
      case "cont": {
        const [bx, by] = toSVG(n(next()), n(next()));
        out.push(
          `<line x1="${dp(state.penX)}" y1="${dp(state.penY)}" x2="${dp(bx)}" y2="${dp(by)}" stroke="${state.color}" stroke-width="${dp(state.strokeWidth)}" stroke-linecap="round"/>`
        );
        state.penX = bx;
        state.penY = by;
        break;
      }
      case "dot": {
        const [cx, cy] = toSVG(n(next()), n(next()));
        out.push(
          `<circle cx="${dp(cx)}" cy="${dp(cy)}" r="${dp(state.strokeWidth / 2)}" fill="${state.color}"/>`
        );
        break;
      }
      case "move":
        state.offx += n(next());
        state.offy += n(next());
        break;
      case "back":
        state.offx = 0;
        state.offy = 0;
        break;
      case "scale":
        state.size *= n(next());
        break;
      case "rect": {
        const cx = n(next()), cy = n(next());
        const hw = n(next()), hh = n(next());
        const [lx, ty] = toSVG(cx - hw, cy + hh);
        const [rx, by] = toSVG(cx + hw, cy - hh);
        const w = Math.abs(rx - lx), h = Math.abs(by - ty);
        const x = Math.min(lx, rx), y = Math.min(ty, by);
        out.push(`<rect x="${dp(x)}" y="${dp(y)}" width="${dp(w)}" height="${dp(h)}" fill="${state.color}"/>`);
        break;
      }
      case "square": {
        const cx = n(next()), cy = n(next());
        const hw = n(next()), hh = n(next());
        const corners = [
          toSVG(cx + hw, cy + hh),
          toSVG(cx - hw, cy + hh),
          toSVG(cx - hw, cy - hh),
          toSVG(cx + hw, cy - hh)
        ];
        const pts = [...corners, corners[0]].map((vals) => `${dp(vals[0])},${dp(vals[1])}`).join(" ");
        out.push(
          `<polyline points="${pts}" stroke="${state.color}" stroke-width="${dp(state.strokeWidth)}" stroke-linejoin="round" stroke-linecap="round" fill="none"/>`
        );
        break;
      }
      case "tri": {
        const [x1, y1] = toSVG(n(next()), n(next()));
        const [x2, y2] = toSVG(n(next()), n(next()));
        const [x3, y3] = toSVG(n(next()), n(next()));
        out.push(
          `<polygon points="${dp(x1)},${dp(y1)} ${dp(x2)},${dp(y2)} ${dp(x3)},${dp(y3)}" fill="${state.color}"/>`
        );
        break;
      }
      case "cutcircle": {
        const cx = n(next()), cy = n(next());
        const radius = n(next());
        const dir = n(next());
        const arcDeg = n(next());
        let angleDeg = dir * 10 - arcDeg;
        const steps = Math.floor(arcDeg / 3);
        const pts = [];
        {
          const px = cx + Math.round(Math.sin(Math.PI * angleDeg / 180) * 1e10) / 1e10 * radius;
          const py = cy + Math.round(Math.cos(Math.PI * angleDeg / 180) * 1e10) / 1e10 * radius;
          const [sx, sy] = toSVG(px, py);
          pts.push(`M${dp(sx)},${dp(sy)}`);
        }
        for (let a = steps; a >= 0.5; a--) {
          angleDeg += 6;
          const px = cx + Math.round(Math.sin(Math.PI * angleDeg / 180) * 1e10) / 1e10 * radius;
          const py = cy + Math.round(Math.cos(Math.PI * angleDeg / 180) * 1e10) / 1e10 * radius;
          const [sx, sy] = toSVG(px, py);
          pts.push(`L${dp(sx)},${dp(sy)}`);
        }
        out.push(
          `<path d="${pts.join("")}" stroke="${state.color}" stroke-width="${dp(state.strokeWidth)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
        );
        break;
      }
      case "ellipse": {
        const elCx = n(next()), elCy = n(next());
        const rx = n(next());
        const mult = n(next());
        const rot = n(next());
        const ry = rx * mult;
        const [ccx, ccy] = toSVG(elCx, elCy);
        const ellipseRotDeg = 90 - rot;
        const pts = [];
        let eli = 0;
        {
          const lx = Math.round(Math.sin(Math.PI * eli / 180) * 1e10) / 1e10 * rx;
          const ly = Math.round(Math.cos(Math.PI * eli / 180) * 1e10) / 1e10 * rx * mult;
          const [rx2, ry2] = rotateVec(lx * state.size, ly * state.size, ellipseRotDeg);
          pts.push(`M${dp(ccx + rx2)},${dp(ccy - ry2)}`);
        }
        for (let a = 180; a >= 0.5; a--) {
          eli += 4;
          const lx = Math.round(Math.sin(Math.PI * eli / 180) * 1e10) / 1e10 * rx;
          const ly = Math.round(Math.cos(Math.PI * eli / 180) * 1e10) / 1e10 * rx * mult;
          const [drx, dry] = rotateVec(lx * state.size, ly * state.size, ellipseRotDeg);
          pts.push(`L${dp(ccx + drx)},${dp(ccy - dry)}`);
        }
        pts.push("Z");
        out.push(
          `<path d="${pts.join("")}" stroke="${state.color}" stroke-width="${dp(state.strokeWidth)}" fill="none"/>`
        );
        break;
      }
      case "curve": {
        const rawX1 = next();
        if (rawX1 === "res") break;
        let x1 = n(rawX1), y1 = n(next());
        let x2 = n(next()), y2 = n(next());
        const cpx = n(next()), cpy = n(next());
        let cx1 = cpx - x1, cy1 = cpy - y1;
        let cx2 = cpx - x2, cy2 = cpy - y2;
        x2 = cpx;
        y2 = cpy;
        const res = Math.min(1e4, Math.round(state.size * 50));
        const [startX, startY] = toSVG(x1, y1);
        const pts = [`M${dp(startX)},${dp(startY)}`];
        for (let step = 1; step <= res; step++) {
          x1 += cx1 / res;
          y1 += cy1 / res;
          x2 -= cx2 / res;
          y2 -= cy2 / res;
          const per = step / res;
          const midX = (x2 - x1) * per + x1;
          const midY = (y2 - y1) * per + y1;
          const [sx, sy] = toSVG(midX, midY);
          pts.push(`L${dp(sx)},${dp(sy)}`);
        }
        out.push(
          `<path d="${pts.join("")}" stroke="${state.color}" stroke-width="${dp(state.strokeWidth)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
        );
        break;
      }
      case "icn": {
        if (!resolver) {
          next();
          next();
          next();
          next();
          break;
        }
        const name = next();
        const subScale = n(next()) * state.size;
        const subOx = n(next()), subOy = n(next());
        const resolved = resolver(name);
        if (resolved !== void 0) {
          const [sox, soy] = toSVG(subOx, subOy);
          renderTokens(
            tokenise(resolved),
            sox,
            soy,
            boldness,
            { ...state, size: subScale, offx: 0, offy: 0 },
            resolver,
            out
          );
        }
        break;
      }
      case "ricn": {
        const inlineStr = next();
        const subScale = n(next()) * state.size;
        const subOx = n(next()), subOy = n(next());
        const [sox, soy] = toSVG(subOx, subOy);
        renderTokens(
          tokenise(inlineStr),
          sox,
          soy,
          boldness,
          { ...state, size: subScale, offx: 0, offy: 0 },
          resolver,
          out
        );
        break;
      }
    }
    i++;
  }
}
function iconToSvg(iconString, options = {}) {
  const {
    size = 1,
    color = "#ffffff",
    strokeWidth = 1,
    boldness = 0,
    resolver,
    svgAttrs = {}
  } = options;
  const viewSize = options.viewSize ?? size * 20;
  const state = {
    penX: 0,
    penY: 0,
    penDown: false,
    color,
    strokeWidth,
    offx: 0,
    offy: 0,
    size
  };
  const elements = [];
  renderTokens(tokenise(iconString), 0, 0, boldness, state, resolver, elements);
  const vb = `${-viewSize} ${-viewSize} ${viewSize * 2} ${viewSize * 2}`;
  const attrs = Object.entries(svgAttrs).map(([k, v]) => ` ${k}="${v}"`).join("");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"${attrs}>`,
    ...elements,
    `</svg>`
  ].join("\n");
}

// src/permissions.ts
var METHOD_PERMISSIONS = {
  "check.banned": null,
  "cosmetics.equip": "cosmetics:equip",
  "cosmetics.forUser": null,
  "cosmetics.forUsers": null,
  "cosmetics.get": null,
  "cosmetics.mine": "cosmetics:view",
  "cosmetics.purchase": "cosmetics:buy",
  "cosmetics.shop": null,
  "cosmetics.unequip": "cosmetics:equip",
  "devfund.escrowRelease": "credits:manage",
  "devfund.escrowTransfer": "credits:transfer",
  "files.all": "files:view",
  "files.byUUIDs": "files:view",
  "files.deleteAll": "files:delete",
  "files.getByPath": "files:view",
  "files.getByUUID": "files:view",
  "files.index": "files:view",
  "files.pathIndex": "files:view",
  "files.stats": "files:view",
  "files.upload": "files:manage",
  "files.usage": "files:view",
  "following.follow": "following:follow",
  "following.followers": null,
  "following.following": null,
  "following.unfollow": "following:unfollow",
  "friends.accept": "friends:accept",
  "friends.cancel": "friends:cancel",
  "friends.list": "friends:view",
  "friends.reject": "friends:accept",
  "friends.remove": "friends:remove",
  "friends.request": "friends:request",
  "gifts.cancel": "gifts:cancel",
  "gifts.claim": "gifts:claim",
  "gifts.create": "gifts:create",
  "gifts.get": null,
  "gifts.mine": "gifts:view",
  "groups.acceptInvite": "groups:join",
  "groups.acceptJoinRequest": "groups:invite",
  "groups.announcements": null,
  "groups.assignRole": "groups:manage",
  "groups.ban": "groups:manage",
  "groups.bans": "groups:manage",
  "groups.cancelProductSubscription": "credits:manage",
  "groups.create": "groups:manage",
  "groups.createAnnouncement": "groups:manage",
  "groups.createEvent": "groups:manage",
  "groups.createProduct": "groups:manage",
  "groups.createRole": "groups:manage",
  "groups.declineInvite": "groups:join",
  "groups.declineJoinRequest": "groups:invite",
  "groups.delete": "groups:manage",
  "groups.deleteAnnouncement": "groups:manage",
  "groups.deleteEvent": "groups:manage",
  "groups.deleteProduct": "groups:manage",
  "groups.deleteRole": "groups:manage",
  "groups.disrepresent": "account:settings",
  "groups.events": "groups:view",
  "groups.get": null,
  "groups.invite": "groups:invite",
  "groups.invites": "groups:invite",
  "groups.join": "groups:join",
  "groups.joinRequests": "groups:invite",
  "groups.kick": "groups:manage",
  "groups.leave": "groups:leave",
  "groups.members": "groups:members.view",
  "groups.mine": "groups:view",
  "groups.muteAnnouncements": "groups:manage",
  "groups.myInvites": "groups:view",
  "groups.myProductSubscriptions": "groups:view",
  "groups.productOwnership": null,
  "groups.products": "groups:view",
  "groups.purchaseProduct": "credits:manage",
  "groups.removeRole": "groups:manage",
  "groups.report": "groups:view",
  "groups.represent": "account:settings",
  "groups.requestJoin": "groups:join",
  "groups.revokeInvite": "groups:invite",
  "groups.roles": "groups:view",
  "groups.search": "groups:view",
  "groups.sendTip": "credits:manage",
  "groups.tips": "groups:view",
  "groups.transferOwnership": "groups:manage",
  "groups.unban": "groups:manage",
  "groups.update": "groups:manage",
  "groups.updateEvent": "groups:manage",
  "groups.updateRole": "groups:manage",
  "groups.userBenefits": "groups:view",
  "groups.userPermissions": "groups:view",
  "groups.userRoles": "groups:view",
  "items.buy": "items:buy",
  "items.create": "items:manage",
  "items.delete": "items:manage",
  "items.get": null,
  "items.list": null,
  "items.sell": "items:sell",
  "items.selling": null,
  "items.setPrice": "items:manage",
  "items.stopSelling": "items:sell",
  "items.transfer": "items:manage",
  "items.update": "items:manage",
  "keys.addUser": "keys:manage",
  "keys.buy": "keys:manage",
  "keys.cancel": "keys:manage",
  "keys.check": null,
  "keys.create": "keys:manage",
  "keys.delete": "keys:manage",
  "keys.get": null,
  "keys.mine": "keys:view",
  "keys.removeUser": "keys:manage",
  "keys.rename": "keys:manage",
  "keys.revoke": "keys:manage",
  "keys.update": "keys:manage",
  "link.getCode": null,
  "link.linkCode": "account:settings",
  "link.linkedUser": null,
  "link.pollUntilLinked": null,
  "link.status": null,
  "me.abilities": null,
  "me.badges": "account:view",
  "me.block": "blocked:manage",
  "me.blocked": "blocked:view",
  "me.checkAuth": "account:view",
  "me.claimDaily": "credits:daily",
  "me.claimTime": "credits:daily",
  "me.deleteAccount": null,
  "me.deleteKey": "account:delete",
  "me.deleteNote": "account:profile",
  "me.get": null,
  "me.note": "account:profile",
  "me.outgoing": null,
  "me.refreshToken": "full",
  "me.requests": null,
  "me.subscription": null,
  "me.transactions": null,
  "me.transfer": "credits:transfer",
  "me.unblock": "blocked:manage",
  "me.update": null,
  "notifications.list": "notifications:view",
  "posts.create": "posts:create",
  "posts.delete": "posts:delete",
  "posts.feed": null,
  "posts.followingFeed": "posts:view",
  "posts.like": "posts:like",
  "posts.limits": null,
  "posts.pin": "posts:manage",
  "posts.reply": "posts:reply",
  "posts.repost": "posts:repost",
  "posts.search": null,
  "posts.top": null,
  "posts.unlike": "posts:like",
  "posts.unpin": "posts:manage",
  "profiles.exists": null,
  "profiles.get": null,
  "profiles.supporters": null,
  "push.allowSender": "account:settings",
  "push.allowedSenders": "notifications:view",
  "push.check": "notifications:view",
  "push.deleteDevice": "account:settings",
  "push.endpoints": "notifications:view",
  "push.log": "notifications:view",
  "push.notifiableUsers": "notifications:view",
  "push.register": "account:settings",
  "push.removeSender": "account:settings",
  "push.send": "notifications:send",
  "push.sendMany": "notifications:send",
  "push.vapidKeys": null,
  "standing.get": null,
  "stats.economy": null,
  "stats.followers": null,
  "stats.mostGained": null,
  "stats.systems": null,
  "stats.users": null,
  "status.get": null,
  "systems.list": null,
  "systems.reload": "account:settings",
  "systems.update": "account:settings",
  "systems.users": "groups:view",
  "tokens.active": "tokens:manage",
  "tokens.activity": "tokens:manage",
  "tokens.create": "full",
  "tokens.delete": "full",
  "tokens.get": null,
  "tokens.list": "tokens:manage",
  "tokens.permissions": null,
  "tokens.rename": "full",
  "tokens.revoke": "full",
  "tokens.update": "full",
  "validators.generate": "validators:generate",
  "validators.validate": null
};
var NAMESPACE_BY_CLASS = {
  "CheckNamespace": "check",
  "CosmeticsNamespace": "cosmetics",
  "DevFundNamespace": "devfund",
  "FilesNamespace": "files",
  "FollowingNamespace": "following",
  "FriendsNamespace": "friends",
  "GiftsNamespace": "gifts",
  "GroupsNamespace": "groups",
  "ItemsNamespace": "items",
  "KeysNamespace": "keys",
  "LinkNamespace": "link",
  "MeNamespace": "me",
  "NotificationsNamespace": "notifications",
  "PostsNamespace": "posts",
  "ProfilesNamespace": "profiles",
  "PushNamespace": "push",
  "StandingNamespace": "standing",
  "StatsNamespace": "stats",
  "StatusNamespace": "status",
  "SystemsNamespace": "systems",
  "TokensNamespace": "tokens",
  "ValidatorsNamespace": "validators"
};
function resolvePermissions(usedMethods) {
  const set = /* @__PURE__ */ new Set();
  for (const m of usedMethods) {
    const p = METHOD_PERMISSIONS[m];
    if (p) set.add(p);
  }
  if (set.has("full")) return ["full"];
  return [...set].sort();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApiError,
  AuthError,
  METHOD_PERMISSIONS,
  NAMESPACE_BY_CLASS,
  Rotur,
  RoturSocket,
  iconToSvg,
  performAuth,
  resolvePermissions
});
