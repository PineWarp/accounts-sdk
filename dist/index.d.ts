declare class ApiError extends Error {
    status: number;
    data: unknown;
    constructor(status: number, data: unknown);
}
declare class Http {
    private baseUrl;
    private getToken;
    constructor(getToken: () => string | null);
    private buildUrl;
    get<T>(path: string, params?: Record<string, unknown>, auth?: boolean): Promise<T>;
    post<T>(path: string, body?: unknown, auth?: boolean): Promise<T>;
    patch<T>(path: string, body?: unknown): Promise<T>;
    del<T>(path: string, body?: unknown): Promise<T>;
    private handle;
}

type UserId = string;
type Username = string;
type Presence = "online" | "idle" | "dnd" | "invisible";
type StandingLevel = "good" | "warning" | "suspended" | "banned";
type JoinPolicy = "OPEN" | "REQUEST" | "INVITE";
type TokenPermission = "account:delete" | "account:profile" | "account:settings" | "account:view" | "credits:view" | "credits:manage" | "credits:transfer" | "credits:daily" | "friends:view" | "friends:manage" | "friends:request" | "friends:accept" | "friends:remove" | "posts:view" | "posts:create" | "posts:delete" | "posts:manage" | "posts:like" | "posts:reply" | "posts:repost" | "following:view" | "following:follow" | "following:unfollow" | "files:view" | "files:manage" | "files:delete" | "keys:view" | "keys:manage" | "groups:view" | "groups:manage" | "groups:join" | "groups:leave" | "notifications:view" | "notifications:send" | "gifts:view" | "gifts:create" | "gifts:claim" | "gifts:cancel" | "items:view" | "items:buy" | "items:sell" | "items:manage" | "validators:generate" | "blocked:view" | "blocked:manage" | "tokens:manage" | "cosmetics:view" | "cosmetics:buy" | "cosmetics:equip";
interface ErrorResponse {
    error: string;
}
interface UserProfile {
    username: Username;
    pfp: string;
    banner?: string;
    bio?: string;
    pronouns?: string;
    system: string;
    created: number;
    followers: number;
    following: number;
    currency: number;
    subscription: string;
    max_size: string;
    badges: Badge[];
    theme?: Record<string, unknown>;
    private: boolean;
    banned: boolean;
    status?: RoomMember;
    posts?: NetPost[];
    followed?: boolean;
    follows_me?: boolean;
    id: UserId;
    index: number;
}
interface Badge {
    name: string;
    icon: string;
    description: string;
}
type Transaction = {
    type: string;
    user: Username;
    amount: number;
    note: string;
    time: number;
    new_total: number;
    petition_id?: string;
    key_name?: string;
    key_id?: string;
};
interface NetPost {
    id: string;
    content: string;
    user: Username;
    timestamp: number;
    attachment?: string;
    profile_only: boolean;
    os?: string;
    replies?: NetReply[];
    likes?: Username[];
    pinned?: boolean;
    is_repost: boolean;
    original_post?: NetPost;
}
interface NetReply {
    id: string;
    content: string;
    user: Username;
    timestamp: number;
}
interface NetKey {
    key: string;
    name: string;
    price: number;
    type: string;
    total_income?: number;
    webhook?: string;
    subscription?: KeySubscription;
    users: Record<Username, KeyUserData>;
    creator: Username;
    data?: string;
}
interface KeySubscription {
    active: boolean;
    frequency: number;
    period: string;
    next_billing: number;
}
interface KeyUserData {
    time: number;
    price?: number;
    next_billing?: number;
    cancel_at?: number;
}
interface KeyPublic {
    key: string;
    name: string;
    price: number;
    type: string;
}
interface NetItem {
    name: string;
    description: string;
    price: number;
    selling: boolean;
    author: Username;
    owner: Username;
    private_data?: unknown;
    created: number;
    transfer_history: NetTransferHistory[];
    total_income: number;
}
interface NetTransferHistory {
    from?: Username;
    to: Username;
    timestamp: number;
    type: string;
    price?: number;
}
interface GiftPublic {
    code: string;
    amount: number;
    note: string;
    creator_id: Username;
    expires_at: number;
}
interface GiftNet {
    id: string;
    code: string;
    amount: number;
    note: string;
    creator_id: Username;
    created_at: number;
    expires_at: number;
    claimed_at?: number;
    claimed_by?: Username;
}
interface SubTokenPublic {
    id: string;
    name: string;
    permissions: TokenPermission[];
    created_at: number;
    last_used_at?: number;
    expires_at?: number;
    revoked: boolean;
    revoked_at?: number;
    origin?: string;
    description?: string;
    websites?: string[];
}
interface SubTokenCreate {
    id: string;
    name: string;
    token: string;
    permissions: TokenPermission[];
    created_at: number;
    expires_at?: number;
    origin?: string;
    description?: string;
    websites?: string[];
}
interface TokenAbilities {
    token_type: "main" | "sub";
    permissions: TokenPermission[];
    name?: string;
    id?: string;
}
interface PermissionGroup {
    name: string;
    description: string;
    permissions: TokenPermission[];
}
interface GroupPublic {
    id?: string;
    tag: string;
    name: string;
    description: string;
    icon_url: string;
    banner_url: string;
    owner_user_id: Username;
    public: boolean;
    join_policy: JoinPolicy;
    created_at: number;
    credits_balance: number;
    member_count: number;
}
interface GroupAnnouncement {
    id: string;
    group_tag: string;
    title: string;
    body: string;
    author_user_id: UserId;
    created_at: number;
    ping_members: boolean;
}
interface GroupEvent {
    id: string;
    group_tag: string;
    title: string;
    description: string;
    start_time: number;
    end_time: number;
    location: string;
    visibility: "MEMBERS" | "PUBLIC";
    created_by: UserId;
    published: boolean;
}
interface GroupRole {
    id: string;
    group_tag: string;
    name: string;
    description: string;
    assign_on_join: boolean;
    self_assignable: boolean;
    benefits: string[];
    permissions: string[];
}
interface GroupMember {
    id: string;
    group_tag: string;
    user_id: UserId;
    username: Username;
    role_ids: string[];
    joined_at: number;
    muted_announcements: boolean;
}
interface GroupMembersResponse {
    members: GroupMember[];
    page: number;
    per_page: number;
    total: number;
    pages: number;
}
interface GroupInvite {
    id: string;
    group_tag: string;
    from_user_id: UserId;
    from_username: Username;
    to_user_id: UserId;
    to_username: Username;
    status: "PENDING" | "ACCEPTED" | "DECLINED" | "REVOKED";
    created_at: number;
}
interface GroupJoinRequest {
    id: string;
    group_tag: string;
    user_id: UserId;
    username: Username;
    message: string;
    status: "PENDING" | "ACCEPTED" | "DECLINED";
    created_at: number;
}
interface GroupBan {
    id: string;
    group_tag: string;
    user_id: UserId;
    username: Username;
    banned_by_id: UserId;
    banned_by: Username;
    reason: string;
    created_at: number;
}
interface GroupTip {
    id: string;
    group_tag: string;
    from_user_id: UserId;
    from_username?: Username;
    amount_credits: number;
    note?: string;
    created_at: number;
}
interface GroupProduct {
    id: string;
    group_tag: string;
    name: string;
    description: string;
    price_credits: number;
    role_granted_id?: string;
    role_name?: string;
    benefit_granted?: string;
    subscription: boolean;
    frequency?: number;
    period?: "day" | "week" | "month" | "year";
}
interface GroupProductSubscription {
    id: string;
    group_tag: string;
    product_id: string;
    product_name: string;
    username: Username;
    role_id: string;
    role_name: string;
    started_at: number;
    next_billing: number;
    cancel_at?: number;
    active: boolean;
}
interface GroupProductOwnership {
    owned: boolean;
    username: Username;
    group_tag: string;
    product: GroupProduct;
    subscription?: GroupProductSubscription | null;
}
interface RoomMember {
    user_id: UserId;
    username: Username;
    status: string;
    presence: Presence;
    activities: Activity[];
}
interface Activity {
    id: string;
    title: string;
    application?: ActivityApplication;
    image?: string;
    url?: string;
    status?: string;
    start_time?: number;
    media?: ActivityMedia;
}
interface ActivityApplication {
    name: string;
    url?: string;
}
interface ActivityMedia {
    title: string;
    artist?: string;
    album?: string;
    start: number;
    end: number;
}
interface UserStatusResponse {
    username: Username;
    status: string;
    presence: string;
    activities: Record<string, Activity>;
}
interface NotificationEntry {
    type: string;
    id: string;
    timestamp: number;
    [key: string]: unknown;
}
interface NotifyEndpoint {
    device_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    source: string;
    created_at: number;
}
interface NotifyAllowedSender {
    username: Username;
    count: number;
}
interface NotifyLogEntry {
    from: Username;
    source: string;
    title?: string;
    body?: string;
    at: number;
}
interface FileEntry {
    uuid: string;
    name: string;
    path: string;
    size: number;
    created: number;
    modified: number;
}
interface System {
    name: string;
    owner: {
        name: Username;
        discord_id: string;
    };
    wallpaper: string;
    designation: string;
    icon: string;
}
interface EconomyStats {
    average: number;
    total: number;
    variance: number;
    currency_comparison: {
        pence: string;
        cents: string;
    };
}
interface UserStats {
    total_users: number;
    banned_users: number;
    active_users: number;
}
interface CosmeticItem {
    id: string;
    name: string;
    description: string;
    type: string;
    price: number;
    available: boolean;
}
interface ValidatorResult {
    valid: boolean;
    username?: Username;
    id?: UserId;
    error?: string;
}
interface ValidatorGenerateResult {
    validator: string;
}
interface StandingInfo {
    username: Username;
    standing: StandingLevel;
    recover_at: number;
    history: StandingHistoryEntry[];
}
interface StandingHistoryEntry {
    level: StandingLevel;
    reason: string;
    set_by: string;
    set_at: number;
}
interface ExistsResponse {
    exists: boolean;
}
interface LimitsResponse {
    content_length: number;
    content_length_premium: number;
    attachment_length: number;
}
interface CheckAuthResponse {
    auth: boolean;
    username: string;
    token_type: "main" | "sub";
    permissions?: TokenPermission[];
}
interface CheckBannedResponse {
    banned: string[];
}
interface EscrowTransferResult {
    message: string;
    from: Username;
    amount: number;
    petition_id: string;
    new_balance: number;
}
interface EscrowReleaseResult {
    message: string;
    to: Username;
    amount: number;
    petition_id: string;
    new_balance: number;
}
interface CosmeticCatalogEntryPublic {
    id: string;
    cosmetic_type: string;
    name: string;
    description: string;
    image_url: string;
    pricing_type: "free" | "paid";
    price: number;
    creator: Username;
    creator_pct: number;
    featured: boolean;
    purchases: number;
    created_at: number;
}
interface ShopResponse {
    items: CosmeticCatalogEntryPublic[];
    total: number;
    offset: number;
    limit: number;
}
interface MyCosmeticsResponse {
    active_cosmetics: Record<string, CosmeticCatalogEntryPublic>;
    owned_cosmetics: CosmeticCatalogEntryPublic[];
}
interface UserCosmeticsResponse {
    active_cosmetics: Record<string, CosmeticCatalogEntryPublic>;
    id: string;
    username: Username;
}
type BatchCosmeticsResponse = Record<Username, UserCosmeticsResponse>;
interface CosmeticPurchaseResult {
    message: string;
    cosmetic: CosmeticCatalogEntryPublic;
    price: number;
    creator_share?: number;
    platform_share?: number;
    new_total?: number;
}
interface AdminCosmeticCreate {
    id: string;
    cosmetic_type: string;
    name: string;
    description: string;
    image_url: string;
    pricing_type: "free" | "paid";
    price: number;
    creator: string;
    creator_pct: number;
    featured: boolean;
}
interface AdminCosmeticUpdate {
    name?: string;
    description?: string;
    image_url?: string;
    pricing_type?: "free" | "paid";
    price?: number;
    creator?: string;
    creator_pct?: number;
    featured?: boolean;
    cosmetic_type?: string;
}
interface KeyCreateResponse {
    status: string;
    key: string;
    type: string;
    price: number;
    subscription?: KeySubscription;
}
interface KeyStatusResponse {
    status: string;
}
interface KeyCheckResponse {
    owned: boolean;
    username: Username;
    key: string;
}
interface KeyBuyResponse {
    message: string;
}
interface KeyCancelSubscriptionResponse {
    status: string;
    cancel_at?: number;
}
interface PostDeleteResponse {
    message: string;
}
interface PostRateResponse {
    message: string;
    likes: string[];
}
interface PostPinResponse {
    message: string;
}
interface GiftCreateResponse {
    message: string;
    id: string;
    code: string;
    amount: number;
    tax: number;
    total_paid: number;
    expires_at: number;
    claim_url: string;
}
interface GiftClaimResponse {
    message: string;
    amount: number;
    new_balance: number;
}
interface GiftCancelResponse {
    message: string;
    refunded: number;
    new_balance: number;
}
interface TokenActivityResponse {
    id: string;
    name: string;
    status: "active" | "revoked" | "expired";
    permissions: TokenPermission[];
    created_at: number;
    last_used_at?: number;
    expires_at?: number;
    revoked_at?: number;
    origin?: string;
    description?: string;
    websites?: string[];
}
interface TokenRevokeResponse {
    message: string;
    id: string;
}
interface TokenDeleteResponse {
    message: string;
    id: string;
}
interface TokenRenameResponse {
    message: string;
    id: string;
    name: string;
}
interface ItemTransferResponse {
    message: string;
}
interface ItemBuyResponse {
    message: string;
}
interface ItemSellResponse {
    message: string;
}
interface ItemStopSellingResponse {
    message: string;
}
interface ItemSetPriceResponse {
    message: string;
}
interface ItemDeleteResponse {
    message: string;
}
interface FriendActionResponse {
    message: string;
}
interface FollowResponse {
    message: string;
}
interface GroupMessageResponse {
    message: string;
}
interface GroupRepresentResponse {
    message: string;
}
interface SystemUpdateResponse {
    message: string;
}
interface PushRegisterResponse {
    message: string;
    device_id: string;
    source: string;
    updated: boolean;
}
interface PushCheckResponse {
    registered: boolean;
    device_id?: string;
    endpoint?: string;
    source?: string;
    created_at?: number;
}
interface PushDeleteDeviceResponse {
    message: string;
    device_id: string;
}
interface PushAllowSenderResponse {
    message: string;
    username: Username;
    source: string;
}
interface PushSendResponse {
    success: boolean;
    message: string;
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
}
interface PushSendManyResponse {
    success: boolean;
    results: Array<{
        username: Username;
        code: number;
        result: PushSendResponse | ErrorResponse;
    }>;
}
interface FileUsageResponse {
    used: number;
    max: number;
}
interface MeUpdateResponse<T = unknown> {
    message: string;
    username: string;
    key: string;
    value: T;
}
interface MeDeleteKeyResponse {
    message: string;
    username: string;
    key: string;
}
interface MeTransferResponse {
    message: string;
    from: Username;
    to: Username;
    amount: number;
    debited: number;
}
interface MeDeleteAccountResponse {
    message: string;
}
interface CheckAuthResponseFull {
    auth: boolean;
    username: string;
    token_type?: "main" | "sub";
    permissions?: TokenPermission[];
}
type WSMessage$1 = {
    cmd: "ready";
    user_id: UserId;
    username: Username;
    user: Record<string, unknown>;
} | {
    cmd: "join_ok";
    room: string;
} | {
    cmd: "room_state";
    room: string;
    members: RoomMember[];
} | {
    cmd: "member_join";
    room: string;
    user_id: UserId;
    username: Username;
    status: string;
    presence: Presence;
    activities?: Record<string, Activity>;
} | {
    cmd: "member_leave";
    room: string;
    user_id: UserId;
} | {
    cmd: "status_update";
    room?: string;
    user_id: UserId;
    username?: Username;
    status?: string;
    presence?: Presence;
    activities?: Record<string, Activity>;
} | {
    cmd: "profile_update";
    user_id: UserId;
    username: Username;
    key: string;
    value: unknown;
} | {
    cmd: "key_update";
    key: string;
    value: unknown;
} | {
    cmd: "error";
    message: string;
} | {
    cmd: "leave_ok";
    room: string;
} | {
    cmd: "rooms";
    rooms: string[];
};

type WSMessage = Record<string, unknown>;
type Handler = (msg: WSMessage) => void;
type KeyChangeCallback = (key: string, value: unknown, oldValue: unknown) => void;
declare class RoturSocket extends EventTarget {
    private url;
    private ws;
    private token;
    private reconnectTimer;
    private heartbeat;
    private _connected;
    private _userId;
    private _username;
    private handlers;
    private rooms;
    private keyCache;
    private keyChangeCallbacks;
    constructor(url?: string);
    get connected(): boolean;
    get userId(): string | null;
    get username(): string | null;
    get joinedRooms(): string[];
    getKey(key: string): unknown;
    getAllKeys(): Record<string, unknown>;
    onKeyChange(callback: KeyChangeCallback): () => void;
    offKeyChange(callback: KeyChangeCallback): void;
    private notifyKeyChange;
    connect(token: string): Promise<{
        user_id: UserId;
        username: Username;
        user: Record<string, unknown>;
    }>;
    private startHeartbeat;
    private scheduleReconnect;
    private cleanup;
    private emit;
    private send;
    on(cmd: string, handler: Handler): () => void;
    off(cmd: string, handler: Handler): void;
    once(cmd: string): Promise<WSMessage>;
    join(rooms: string | string[]): void;
    leave(rooms: string | string[]): void;
    listRooms(): Promise<string[]>;
    roomState(room: string): void;
    setStatus(status: string, presence?: Presence): void;
    addActivity(activity: Activity & {
        id: string;
    }): void;
    removeActivity(id: string): void;
    setMusic(application: string, media: ActivityMedia, title?: string): void;
    setPlaying(application: string, options?: {
        url?: string;
        title?: string;
        status?: string;
        image?: string;
    }): void;
    clearActivity(id: string): void;
    disconnect(): void;
}

declare abstract class Namespace {
    protected readonly r: Rotur;
    constructor(r: Rotur);
    protected $get<T>(path: string, params?: Record<string, unknown>, auth?: boolean): Promise<T>;
    protected $post<T>(path: string, body?: unknown, auth?: boolean): Promise<T>;
    protected $patch<T>(path: string, body?: unknown): Promise<T>;
    protected $del<T>(path: string, body?: unknown): Promise<T>;
    protected $postQuery<T>(path: string, params?: Record<string, unknown>, auth?: boolean): Promise<T>;
    protected $delQuery<T>(path: string, params?: Record<string, unknown>): Promise<T>;
}
type MessageResult = {
    ok: true;
    message: string;
} | {
    ok: false;
    error: string;
};

declare class MeNamespace extends Namespace {
    get(): Promise<Record<string, unknown> | ErrorResponse>;
    update<T>(key: string, value: T): Promise<MeUpdateResponse<T> | ErrorResponse>;
    deleteKey(key: string): Promise<MeDeleteKeyResponse | ErrorResponse>;
    deleteAccount(): Promise<MeDeleteAccountResponse | ErrorResponse>;
    refreshToken(): Promise<{
        token: string;
    } | ErrorResponse>;
    getKey(key: string): unknown;
    getAllKeys(): Record<string, unknown>;
    onKeyChange(callback: (key: string, value: unknown, oldValue: unknown) => void): () => void;
    transfer(to: Username, amount: number, note?: string): Promise<MeTransferResponse | ErrorResponse>;
    claimDaily(): Promise<{
        error: "Daily claim already made";
        wait_time: number;
        wait_hours: string;
    } | {
        response: "Daily claim successful";
    } | ErrorResponse>;
    claimTime(): Promise<{
        wait_time: number;
    } | ErrorResponse>;
    badges(): Promise<{
        badge_names: string[];
    } | ErrorResponse>;
    abilities(): Promise<TokenAbilities | ErrorResponse>;
    blocked(): Promise<{
        blocked: Username[];
    } | ErrorResponse>;
    block(username: Username): Promise<{
        message: "User blocked";
    } | ErrorResponse>;
    unblock(username: Username): Promise<{
        message: "User unblocked";
    } | ErrorResponse>;
    note(username: Username, content: string): Promise<{
        success: true;
    } | ErrorResponse>;
    deleteNote(username: Username): Promise<{
        success: true;
    } | ErrorResponse>;
    checkAuth(): Promise<CheckAuthResponse>;
    requests(): Promise<{
        requests: Username[];
    }>;
    outgoing(): Promise<{
        outgoing: Username[];
    }>;
    transactions(): Promise<Transaction[]>;
    subscription(): Promise<{
        active: boolean;
        tier: string;
        next_billing: number;
    }>;
}

declare class PostsNamespace extends Namespace {
    create(content: string, options?: {
        attachment?: string;
        profileOnly?: boolean;
        os?: string;
    }): Promise<NetPost>;
    delete(id: string): Promise<PostDeleteResponse | ErrorResponse>;
    like(id: string): Promise<PostRateResponse | ErrorResponse>;
    unlike(id: string): Promise<PostRateResponse | ErrorResponse>;
    reply(id: string, content: string): Promise<NetReply>;
    repost(id: string): Promise<NetPost>;
    pin(id: string): Promise<PostPinResponse | ErrorResponse>;
    unpin(id: string): Promise<PostPinResponse | ErrorResponse>;
    feed(limit?: number, offset?: number): Promise<NetPost[]>;
    followingFeed(limit?: number): Promise<NetPost[]>;
    top(limit?: number, timePeriod?: number): Promise<NetPost[]>;
    search(query: string, limit?: number): Promise<NetPost[]>;
    limits(): Promise<LimitsResponse>;
}

declare class FriendsNamespace extends Namespace {
    list(): Promise<{
        friends: Username[];
    }>;
    request(username: Username): Promise<MessageResult>;
    accept(username: Username): Promise<MessageResult>;
    reject(username: Username): Promise<MessageResult>;
    remove(username: Username): Promise<MessageResult>;
    cancel(username: Username): Promise<MessageResult>;
}

declare class FollowingNamespace extends Namespace {
    follow(username: Username): Promise<MessageResult>;
    unfollow(username: Username): Promise<MessageResult>;
    followers(username: Username): Promise<{
        followers: Username[];
    }>;
    following(username: Username): Promise<{
        following: Username[];
    }>;
}

declare class NotificationsNamespace extends Namespace {
    list(afterDays?: number): Promise<NotificationEntry[]>;
}

declare class KeysNamespace extends Namespace {
    create(name: string, options?: {
        description?: string;
        price?: number;
        subscription?: boolean;
        frequency?: number;
        period?: string;
    }): Promise<KeyCreateResponse | ErrorResponse>;
    mine(): Promise<NetKey[]>;
    get(id: string): Promise<KeyPublic>;
    check(username: Username, key: string): Promise<KeyCheckResponse>;
    rename(id: string, name: string): Promise<KeyStatusResponse | ErrorResponse>;
    update(id: string, key: string, data: string): Promise<KeyStatusResponse | ErrorResponse>;
    revoke(id: string, user: Username): Promise<KeyStatusResponse | ErrorResponse>;
    delete(id: string): Promise<KeyStatusResponse | ErrorResponse>;
    addUser(id: string, user: Username): Promise<KeyStatusResponse | ErrorResponse>;
    removeUser(id: string, user: Username): Promise<KeyStatusResponse | ErrorResponse>;
    buy(id: string): Promise<KeyBuyResponse | ErrorResponse>;
    cancel(id: string): Promise<KeyCancelSubscriptionResponse | ErrorResponse>;
}

declare class ItemsNamespace extends Namespace {
    create(item: {
        name: string;
        description?: string;
        price?: number;
        selling?: boolean;
        data?: unknown;
    }): Promise<NetItem>;
    get(name: string): Promise<NetItem>;
    list(username: Username): Promise<NetItem[]>;
    selling(limit?: number): Promise<NetItem[]>;
    buy(name: string): Promise<ItemBuyResponse | ErrorResponse>;
    transfer(name: string, username: Username): Promise<ItemTransferResponse | ErrorResponse>;
    sell(name: string): Promise<ItemSellResponse | ErrorResponse>;
    stopSelling(name: string): Promise<ItemStopSellingResponse | ErrorResponse>;
    setPrice(name: string, price: number): Promise<ItemSetPriceResponse | ErrorResponse>;
    update(name: string, data: Record<string, unknown>): Promise<NetItem>;
    delete(name: string): Promise<ItemDeleteResponse | ErrorResponse>;
}

declare class GiftsNamespace extends Namespace {
    create(amount: number, options?: {
        note?: string;
        expiresInHrs?: number;
    }): Promise<GiftCreateResponse | ErrorResponse>;
    get(code: string): Promise<{
        gift: GiftPublic;
    }>;
    claim(code: string): Promise<GiftClaimResponse | ErrorResponse>;
    cancel(id: string): Promise<GiftCancelResponse | ErrorResponse>;
    mine(): Promise<{
        gifts: GiftNet[];
        count: number;
    }>;
}

declare class TokensNamespace extends Namespace {
    permissions(): Promise<{
        permissions: TokenPermission[];
        groups: PermissionGroup[];
    }>;
    list(): Promise<{
        tokens: SubTokenPublic[];
        total: number;
    }>;
    active(): Promise<{
        tokens: SubTokenPublic[];
        total: number;
    }>;
    create(name: string, permissions: TokenPermission[], options?: {
        expiresInHrs?: number;
        origin?: string;
        description?: string;
        websites?: string[];
    }): Promise<SubTokenCreate>;
    get(id: string): Promise<SubTokenPublic>;
    activity(id: string): Promise<TokenActivityResponse | ErrorResponse>;
    update(id: string, options: {
        name?: string;
        permissions?: TokenPermission[];
        description?: string;
        websites?: string[];
    }): Promise<SubTokenPublic | ErrorResponse>;
    rename(id: string, name: string): Promise<TokenRenameResponse | ErrorResponse>;
    revoke(id: string): Promise<TokenRevokeResponse | ErrorResponse>;
    delete(id: string): Promise<TokenDeleteResponse | ErrorResponse>;
}

declare class GroupsNamespace extends Namespace {
    mine(): Promise<GroupPublic[]>;
    search(query: string): Promise<GroupPublic[]>;
    create(tag: string, name: string, options?: {
        description?: string;
        iconUrl?: string;
        bannerUrl?: string;
        public?: boolean;
        joinPolicy?: JoinPolicy;
    }): Promise<GroupPublic>;
    get(grouptag: string): Promise<GroupPublic>;
    update(grouptag: string, updates: Record<string, unknown>): Promise<GroupPublic | ErrorResponse>;
    delete(grouptag: string): Promise<GroupMessageResponse | ErrorResponse>;
    join(grouptag: string): Promise<GroupPublic | ErrorResponse>;
    requestJoin(grouptag: string, message?: string): Promise<GroupJoinRequest | ErrorResponse>;
    leave(grouptag: string): Promise<GroupPublic | ErrorResponse>;
    represent(grouptag: string): Promise<GroupRepresentResponse | ErrorResponse>;
    disrepresent(grouptag: string): Promise<GroupRepresentResponse | ErrorResponse>;
    report(grouptag: string): Promise<GroupMessageResponse | ErrorResponse>;
    announcements(grouptag: string): Promise<GroupAnnouncement[]>;
    createAnnouncement(grouptag: string, title: string, body: string, options?: {
        pingMembers?: boolean;
    }): Promise<GroupAnnouncement>;
    deleteAnnouncement(grouptag: string, id: string): Promise<GroupMessageResponse | ErrorResponse>;
    muteAnnouncements(grouptag: string): Promise<GroupMessageResponse | ErrorResponse>;
    events(grouptag: string): Promise<GroupEvent[]>;
    createEvent(grouptag: string, event: Partial<GroupEvent>): Promise<GroupEvent>;
    updateEvent(grouptag: string, eventId: string, updates: Partial<GroupEvent>): Promise<GroupEvent>;
    deleteEvent(grouptag: string, eventId: string): Promise<GroupMessageResponse | ErrorResponse>;
    tips(grouptag: string): Promise<GroupTip[]>;
    sendTip(grouptag: string, amount: number, note?: string): Promise<GroupTip | ErrorResponse>;
    products(grouptag: string): Promise<GroupProduct[]>;
    createProduct(grouptag: string, product: {
        name: string;
        priceCredits: number;
        roleId: string;
        description?: string;
        subscription?: boolean;
        frequency?: number;
        period?: "day" | "week" | "month" | "year";
    }): Promise<GroupProduct>;
    deleteProduct(grouptag: string, productId: string): Promise<GroupMessageResponse | ErrorResponse>;
    purchaseProduct(grouptag: string, productId: string): Promise<{
        message: string;
        product: GroupProduct;
        subscription?: GroupProductSubscription | null;
        group: GroupPublic;
    } | ErrorResponse>;
    cancelProductSubscription(grouptag: string, productId: string): Promise<{
        status: string;
        cancel_at: number;
        subscription: GroupProductSubscription;
    } | ErrorResponse>;
    productOwnership(grouptag: string, productId: string, username: Username): Promise<GroupProductOwnership>;
    myProductSubscriptions(): Promise<GroupProductSubscription[]>;
    roles(grouptag: string): Promise<GroupRole[]>;
    members(grouptag: string, options?: {
        page?: number;
        perPage?: number;
        search?: string;
    }): Promise<GroupMembersResponse>;
    createRole(grouptag: string, role: Partial<GroupRole>): Promise<GroupRole>;
    updateRole(grouptag: string, roleId: string, updates: Partial<GroupRole>): Promise<GroupRole>;
    deleteRole(grouptag: string, roleId: string): Promise<GroupMessageResponse | ErrorResponse>;
    userRoles(grouptag: string, userId: UserId): Promise<GroupRole[]>;
    userPermissions(grouptag: string, userId: UserId): Promise<string[]>;
    userBenefits(grouptag: string, userId: UserId): Promise<string[]>;
    assignRole(grouptag: string, userId: UserId, roleId: string): Promise<GroupMessageResponse | ErrorResponse>;
    removeRole(grouptag: string, userId: UserId, roleId: string): Promise<GroupMessageResponse | ErrorResponse>;
    invites(grouptag: string): Promise<GroupInvite[]>;
    invite(grouptag: string, username: Username): Promise<GroupInvite | ErrorResponse>;
    revokeInvite(grouptag: string, inviteId: string): Promise<GroupMessageResponse | ErrorResponse>;
    myInvites(): Promise<GroupInvite[]>;
    acceptInvite(grouptag: string, inviteId: string): Promise<GroupMessageResponse | ErrorResponse>;
    declineInvite(grouptag: string, inviteId: string): Promise<GroupMessageResponse | ErrorResponse>;
    joinRequests(grouptag: string): Promise<GroupJoinRequest[]>;
    acceptJoinRequest(grouptag: string, requestId: string): Promise<GroupMessageResponse | ErrorResponse>;
    declineJoinRequest(grouptag: string, requestId: string): Promise<GroupMessageResponse | ErrorResponse>;
    kick(grouptag: string, userId: UserId): Promise<GroupMessageResponse | ErrorResponse>;
    ban(grouptag: string, userId: UserId, reason?: string): Promise<{
        message: string;
        ban: GroupBan;
    } | ErrorResponse>;
    unban(grouptag: string, userId: UserId): Promise<GroupMessageResponse | ErrorResponse>;
    bans(grouptag: string): Promise<GroupBan[]>;
    transferOwnership(grouptag: string, userId: UserId): Promise<GroupMessageResponse | ErrorResponse>;
}

declare class SystemsNamespace extends Namespace {
    list(): Promise<Record<string, System>>;
    users(system: string): Promise<Username[]>;
    update(system: string, key: string, value: unknown): Promise<SystemUpdateResponse | ErrorResponse>;
    reload(): Promise<SystemUpdateResponse | ErrorResponse>;
}

declare class StatsNamespace extends Namespace {
    economy(): Promise<EconomyStats>;
    users(): Promise<UserStats>;
    mostGained(max?: number): Promise<Array<{
        user: Username;
        earned: number;
    }>>;
    systems(): Promise<Record<string, number>>;
    followers(max?: number): Promise<Array<{
        username: Username;
        follower_count: number;
    }>>;
}

declare class StatusNamespace extends Namespace {
    get(username: Username): Promise<UserStatusResponse>;
}

declare class ValidatorsNamespace extends Namespace {
    generate(key: string): Promise<ValidatorGenerateResult>;
    validate(validator: string, key: string): Promise<ValidatorResult>;
}

interface LinkedUser {
    linked: boolean;
    token?: string;
}
declare class LinkNamespace extends Namespace {
    getCode(): Promise<{
        code: string;
    }>;
    status(code: string): Promise<{
        status: string;
    }>;
    linkedUser(code: string): Promise<LinkedUser>;
    linkCode(code: string): Promise<string>;
    pollUntilLinked(code: string, intervalMs?: number, timeoutMs?: number): Promise<string>;
}

declare class CosmeticsNamespace extends Namespace {
    shop(options?: {
        type?: string;
        featured?: boolean;
        search?: string;
        sort?: "newest" | "price_low" | "price_high" | "popular";
        limit?: number;
        offset?: number;
    }): Promise<ShopResponse>;
    get(id: string): Promise<CosmeticCatalogEntryPublic | ErrorResponse>;
    mine(): Promise<MyCosmeticsResponse | ErrorResponse>;
    purchase(id: string): Promise<CosmeticPurchaseResult | ErrorResponse>;
    equip(id: string): Promise<{
        message: string;
    } | ErrorResponse>;
    unequip(type: string): Promise<{
        message: string;
    } | ErrorResponse>;
    forUser(username: Username): Promise<UserCosmeticsResponse>;
    forUsers(usernames: Username[]): Promise<BatchCosmeticsResponse>;
}

type PushContent = {
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
};
declare class PushNamespace extends Namespace {
    vapidKeys(): Promise<{
        public_key: string;
        subject: string;
    }>;
    register(endpoint: string, p256dh: string, auth: string, source: string, fingerprint: string): Promise<PushRegisterResponse | ErrorResponse>;
    check(source: string, fingerprint: string): Promise<PushCheckResponse>;
    endpoints(): Promise<{
        endpoints: NotifyEndpoint[];
        count: number;
    }>;
    deleteDevice(deviceId: string): Promise<PushDeleteDeviceResponse | ErrorResponse>;
    allowedSenders(): Promise<Record<string, {
        senders: NotifyAllowedSender[];
    }>>;
    allowSender(username: Username, source: string): Promise<PushAllowSenderResponse | ErrorResponse>;
    removeSender(username: Username, source: string): Promise<PushAllowSenderResponse | ErrorResponse>;
    log(): Promise<{
        log: NotifyLogEntry[];
        count: number;
    }>;
    send(username: Username, source: string, options?: PushContent): Promise<PushSendResponse | ErrorResponse>;
    sendMany(users: string[], source: string, options?: PushContent): Promise<PushSendManyResponse | ErrorResponse>;
    notifiableUsers(source: string): Promise<{
        source: string;
        users: Array<{
            username: Username;
            id: UserId;
        }>;
    }>;
}

declare class FilesNamespace extends Namespace {
    index(): Promise<FileEntry[]>;
    all(): Promise<FileEntry[]>;
    getByUUID(uuid: string): Promise<FileEntry>;
    getByPath(path: string): Promise<FileEntry>;
    usage(): Promise<FileUsageResponse>;
    stats(uuids: string[]): Promise<Record<string, unknown>>;
    byUUIDs(uuids: string[]): Promise<FileEntry[]>;
    pathIndex(): Promise<Record<string, unknown>>;
    upload(files: Record<string, unknown>): Promise<Record<string, unknown>>;
    deleteAll(): Promise<GroupMessageResponse | ErrorResponse>;
}

declare class StandingNamespace extends Namespace {
    get(username: Username): Promise<StandingInfo>;
}

declare class ProfilesNamespace extends Namespace {
    get(username: Username, includePosts?: boolean): Promise<UserProfile>;
    exists(username: Username): Promise<ExistsResponse>;
    supporters(): Promise<Array<{
        username: Username;
        subscription: string;
    }>>;
    getAvatarUrl(username: Username, cache?: string): string;
    getOverlayUrl(username: Username, cache?: string): string;
    getBannerUrl(username: Username, cache?: string): string;
}

declare class DevFundNamespace extends Namespace {
    escrowTransfer(amount: number, petitionId: string, note?: string): Promise<EscrowTransferResult>;
    escrowRelease(amount: number, toUsername: Username, petitionId: string, note?: string): Promise<EscrowReleaseResult>;
}

declare class CheckNamespace extends Namespace {
    banned(usernames: Username[]): Promise<CheckBannedResponse>;
}

interface RoturOptions {
    token?: string;
    wsUrl?: string;
}
interface SocketConnection {
    user_id: string;
    username: string;
    user: Record<string, unknown>;
}
declare class Rotur {
    readonly _http: Http;
    socket: RoturSocket;
    private _token;
    private _socketReady;
    readonly me: MeNamespace;
    readonly posts: PostsNamespace;
    readonly friends: FriendsNamespace;
    readonly following: FollowingNamespace;
    readonly notifications: NotificationsNamespace;
    readonly keys: KeysNamespace;
    readonly items: ItemsNamespace;
    readonly gifts: GiftsNamespace;
    readonly tokens: TokensNamespace;
    readonly groups: GroupsNamespace;
    readonly systems: SystemsNamespace;
    readonly stats: StatsNamespace;
    readonly status: StatusNamespace;
    readonly validators: ValidatorsNamespace;
    readonly link: LinkNamespace;
    readonly cosmetics: CosmeticsNamespace;
    readonly push: PushNamespace;
    readonly files: FilesNamespace;
    readonly standing: StandingNamespace;
    readonly profiles: ProfilesNamespace;
    readonly devfund: DevFundNamespace;
    readonly check: CheckNamespace;
    constructor(options?: RoturOptions);
    get token(): string | null;
    get loggedIn(): boolean;
    setToken(token: string): void;
    login(options?: {
        system?: string;
        timeout?: number;
        signal?: AbortSignal;
        requires?: string[];
    }): Promise<this>;
    connectSocket(): Promise<SocketConnection>;
    logout(): void;
    private _openSocket;
}

interface AuthOptions {
    system?: string;
    returnTo?: string;
    timeout?: number;
    signal?: AbortSignal;
    requires?: string[];
    /**
     * When true, never fall back to an embedded iframe if the popup/tab is
     * blocked — throw `AuthError("popup_blocked")` instead.  Useful for web
     * clients that always want a real popup/tab (e.g. originChats) while
     * embedded clients (e.g. Electron) keep the iframe fallback.
     */
    popupOnly?: boolean;
}
interface AuthResult {
    token: string;
}
declare class AuthError extends Error {
    code: "timeout" | "aborted" | "popup_blocked" | "no_token";
    constructor(code: "timeout" | "aborted" | "popup_blocked" | "no_token", message: string);
}
declare function performAuth(options?: AuthOptions): Promise<AuthResult>;

type IconResolver = (name: string) => string | undefined;
interface IconToSvgOptions {
    /** Overall scale factor applied to all coordinates (default: 1). */
    size?: number;
    /**
     * Half-extent of the SVG viewBox — the icon is centred at 0,0.
     * Defaults to `size * 20`.
     */
    viewSize?: number;
    /** Initial stroke colour (default: "#ffffff"). */
    color?: string;
    /** Initial stroke width in unscaled icon units (default: 1). */
    strokeWidth?: number;
    /**
     * Boldness multiplier applied to every `w` command: `w_final = |w_arg × size| × (boldness + 1)`.
     * Matches the `p6` parameter from the original renderer (default: 0 → no extra boldness).
     */
    boldness?: number;
    /**
     * Overall rotation of the icon in degrees, measured clockwise from up (north).
     * Matches Scratch's direction convention: 90° = right (default: 90, i.e. no rotation).
     */
    direction?: number;
    /** Resolve named sub-icons for the `icn` command. */
    resolver?: IconResolver;
    /** Extra attributes written onto the root `<svg>` element. */
    svgAttrs?: Record<string, string>;
}
declare function iconToSvg(iconString: string, options?: IconToSvgOptions): string;

declare const METHOD_PERMISSIONS: Record<string, string | null>;
declare const NAMESPACE_BY_CLASS: Record<string, string>;
declare function resolvePermissions(usedMethods: Iterable<string>): string[];

export { type Activity, type ActivityApplication, type ActivityMedia, type AdminCosmeticCreate, type AdminCosmeticUpdate, ApiError, AuthError, type AuthOptions, type AuthResult, type Badge, type BatchCosmeticsResponse, type CheckAuthResponse, type CheckAuthResponseFull, type CheckBannedResponse, type CosmeticCatalogEntryPublic, type CosmeticItem, type CosmeticPurchaseResult, type EconomyStats, type ErrorResponse, type EscrowReleaseResult, type EscrowTransferResult, type ExistsResponse, type FileEntry, type FileUsageResponse, type FollowResponse, type FriendActionResponse, type GiftCancelResponse, type GiftClaimResponse, type GiftCreateResponse, type GiftNet, type GiftPublic, type GroupAnnouncement, type GroupBan, type GroupEvent, type GroupInvite, type GroupJoinRequest, type GroupMember, type GroupMembersResponse, type GroupMessageResponse, type GroupProduct, type GroupProductOwnership, type GroupProductSubscription, type GroupPublic, type GroupRepresentResponse, type GroupRole, type GroupTip, type ItemBuyResponse, type ItemDeleteResponse, type ItemSellResponse, type ItemSetPriceResponse, type ItemStopSellingResponse, type ItemTransferResponse, type JoinPolicy, type KeyBuyResponse, type KeyCancelSubscriptionResponse, type KeyCheckResponse, type KeyCreateResponse, type KeyPublic, type KeyStatusResponse, type KeySubscription, type KeyUserData, type LimitsResponse, METHOD_PERMISSIONS, type MeDeleteAccountResponse, type MeDeleteKeyResponse, type MeTransferResponse, type MeUpdateResponse, type MyCosmeticsResponse, NAMESPACE_BY_CLASS, type NetItem, type NetKey, type NetPost, type NetReply, type NetTransferHistory, type NotificationEntry, type NotifyAllowedSender, type NotifyEndpoint, type NotifyLogEntry, type PermissionGroup, type PostDeleteResponse, type PostPinResponse, type PostRateResponse, type Presence, type PushAllowSenderResponse, type PushCheckResponse, type PushDeleteDeviceResponse, type PushRegisterResponse, type PushSendManyResponse, type PushSendResponse, type RoomMember, Rotur, RoturSocket, type ShopResponse, type StandingHistoryEntry, type StandingInfo, type StandingLevel, type SubTokenCreate, type SubTokenPublic, type System, type SystemUpdateResponse, type TokenAbilities, type TokenActivityResponse, type TokenDeleteResponse, type TokenPermission, type TokenRenameResponse, type TokenRevokeResponse, type Transaction, type UserCosmeticsResponse, type UserId, type UserProfile, type UserStats, type UserStatusResponse, type Username, type ValidatorGenerateResult, type ValidatorResult, type WSMessage$1 as WSMessage, iconToSvg, performAuth, resolvePermissions };
