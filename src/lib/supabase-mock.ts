import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;

interface MockStore {
  users: Row[];
  priorities: Row[];
  tags: Row[];
  tasks: Row[];
  task_tags: Row[];
  task_history: Row[];
  task_attachments: Row[];
  locations: Row[];
  location_pings: Row[];
  location_visits: Row[];
  notifications: Row[];
  prospect_statuses: Row[];
  prospects: Row[];
  prospect_history: Row[];
  tower_sites: Row[];
  visit_logs: Row[];
  attendance: Row[];
  attendance_todos: Row[];
  attendance_reminder_settings: Row[];
  attendance_reminder_logs: Row[];
  user_sessions: Row[];
  pending_photo_uploads: Row[];
  error_log: Row[];
  storage: Map<string, Uint8Array>;
}

function createInitialStore(): MockStore {
  const now = new Date().toISOString();
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

  return {
    users: [
      {
        id: "11111111-1111-1111-1111-111111111111",
        pin: "1234",
        name: "Admin Tunet",
        role: "admin",
        phone: "+628123456789",
        telegram_id: null,
        telegram_chat_id: null,
        is_active: true,
        created_at: now,
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        pin: "1234",
        name: "Budi Santoso",
        role: "noc",
        phone: "+628123456790",
        telegram_id: null,
        telegram_chat_id: null,
        is_active: true,
        created_at: now,
      },
      {
        id: "33333333-3333-3333-3333-333333333333",
        pin: "1234",
        name: "Ahmad Fauzi",
        role: "foc",
        phone: "+628123456791",
        telegram_id: "@ahmadfauzi",
        telegram_chat_id: null,
        is_active: true,
        created_at: now,
      },
      {
        id: "44444444-4444-4444-4444-444444444444",
        pin: "1234",
        name: "Ali Rahman",
        role: "foc",
        phone: "+628123456792",
        telegram_id: "@alirahman",
        telegram_chat_id: null,
        is_active: true,
        created_at: now,
      },
      {
        id: "55555555-5555-5555-5555-555555555555",
        pin: "1234",
        name: "Siti Nurhaliza",
        role: "foc",
        phone: "+628123456793",
        telegram_id: null,
        telegram_chat_id: null,
        is_active: true,
        created_at: now,
      },
      {
        id: "66666666-6666-6666-6666-666666666666",
        pin: "1234",
        name: "Rizky Pratama",
        role: "noc",
        phone: "+628123456794",
        telegram_id: null,
        telegram_chat_id: null,
        is_active: true,
        created_at: now,
      },
      {
        id: "77777777-7777-7777-7777-777777777777",
        pin: "1234",
        name: "Dewi Lestari",
        role: "marketing",
        phone: "+628123456795",
        telegram_id: null,
        telegram_chat_id: null,
        is_active: true,
        created_at: now,
      },
      {
        id: "88888888-8888-8888-8888-888888888888",
        pin: "1234",
        name: "Rina Wulandari",
        role: "finance",
        phone: "+628123456796",
        telegram_id: null,
        telegram_chat_id: null,
        is_active: true,
        created_at: now,
      },
    ],
    priorities: [
      { id: "p-critical", name: "Critical", color: "#EF4444", level: 1, sla_hours: 4 },
      { id: "p-high", name: "High", color: "#F97316", level: 2, sla_hours: 24 },
      { id: "p-medium", name: "Medium", color: "#EAB308", level: 3, sla_hours: 72 },
      { id: "p-low", name: "Low", color: "#6B7280", level: 4, sla_hours: 168 },
    ],
    tags: [
      { id: "tag-1", name: "Perbaikan", color: "#EF4444", created_at: now },
      { id: "tag-2", name: "Instalasi", color: "#3B82F6", created_at: now },
      { id: "tag-3", name: "Pemeliharaan", color: "#F59E0B", created_at: now },
      { id: "tag-4", name: "Pemeriksaan", color: "#8B5CF6", created_at: now },
      { id: "tag-5", name: "Upgrade", color: "#10B981", created_at: now },
    ],
    tasks: [
      {
        id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        title: "Perbaikan Menara - Jl. Merdeka",
        description: "Kabel rusak setelah badai. Perlu mengganti kabel utama dan memeriksa stabilitas koneksi.",
        status: "in_progress",
        priority_id: "p-critical",
        created_by: "22222222-2222-2222-2222-222222222222",
        assigned_to: "33333333-3333-3333-3333-333333333333",
        location_name: "Jl. Merdeka No. 45, Kota Bandung",
        location_lat: -6.9175,
        location_lng: 107.6191,
        deadline: new Date(Date.now() + 3600 * 1000 * 4).toISOString(),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: "aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        title: "Instalasi Fiber - Perumahan Griya",
        description: "Instalasi fiber optik baru untuk kompleks perumahan. 50 rumah tangga akan terhubung.",
        status: "assigned",
        priority_id: "p-high",
        created_by: "22222222-2222-2222-2222-222222222222",
        assigned_to: "44444444-4444-4444-4444-444444444444",
        location_name: "Perumahan Griya Asri, Bandung Utara",
        location_lat: -6.8853,
        location_lng: 107.6132,
        deadline: new Date(Date.now() + 3600 * 1000 * 24).toISOString(),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: "aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        title: "Pemeriksaan Jaringan - Kantor Pusat",
        description: "Pemeriksaan stabilitas jaringan rutin di kantor pusat. Periksa semua access point dan switch.",
        status: "assigned",
        priority_id: "p-medium",
        created_by: "22222222-2222-2222-2222-222222222222",
        assigned_to: null,
        location_name: "Jl. Gatot Subroto No. 28, Bandung",
        location_lat: -6.9059,
        location_lng: 107.6131,
        deadline: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: "aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        title: "Pemeriksaan Kabel - Gang Sari",
        description: "Pelanggan melaporkan koneksi yang tidak stabil. Periksa integritas kabel dan kekuatan sinyal.",
        status: "review",
        priority_id: "p-medium",
        created_by: "22222222-2222-2222-2222-222222222222",
        assigned_to: "55555555-5555-5555-5555-555555555555",
        location_name: "Gang Sari No. 12, Kota Bandung",
        location_lat: -6.9214,
        location_lng: 107.6089,
        deadline: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: "aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        title: "Upgrade Router - Cafe Kopi",
        description: "Upgrade router untuk mendukung bandwidth lebih tinggi untuk sistem POS cafe.",
        status: "done",
        priority_id: "p-low",
        created_by: "66666666-6666-6666-6666-666666666666",
        assigned_to: "33333333-3333-3333-3333-333333333333",
        location_name: "Jl. Dago No. 55, Bandung",
        location_lat: -6.8821,
        location_lng: 107.6172,
        deadline: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ],
    task_tags: [
      { task_id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa", tag_id: "tag-1" },
      { task_id: "aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa", tag_id: "tag-2" },
      { task_id: "aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa", tag_id: "tag-4" },
      { task_id: "aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa", tag_id: "tag-1" },
      { task_id: "aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa", tag_id: "tag-5" },
    ],
    task_history: [],
    task_attachments: [],
    locations: [
      {
        id: "loc-1",
        user_id: "33333333-3333-3333-3333-333333333333",
        lat: -6.9185,
        lng: 107.6195,
        accuracy: 10,
        updated_at: now,
      },
      {
        id: "loc-2",
        user_id: "44444444-4444-4444-4444-444444444444",
        lat: -6.886,
        lng: 107.614,
        accuracy: 15,
        updated_at: now,
      },
      {
        id: "loc-3",
        user_id: "55555555-5555-5555-5555-555555555555",
        lat: -6.922,
        lng: 107.6095,
        accuracy: 8,
        updated_at: now,
      },
    ],
    location_pings: [],
    location_visits: [],
    notifications: [],
    prospect_statuses: [
      { id: "ps-1", key: "belum_diproses", label: "Belum Diproses", color: "#6B7280", sort_order: 10, is_deletable: false },
      { id: "ps-2", key: "sudah_followup", label: "Sudah di Followup", color: "#3B82F6", sort_order: 20, is_deletable: false },
      { id: "ps-3", key: "acc", label: "Acc", color: "#10B981", sort_order: 30, is_deletable: false },
      { id: "ps-4", key: "tidak", label: "Tidak", color: "#EF4444", sort_order: 40, is_deletable: false },
    ],
    prospects: [],
    prospect_history: [],
    tower_sites: [],
    visit_logs: [],
    attendance: [
      {
        id: "att-1",
        user_id: "33333333-3333-3333-3333-333333333333",
        type: "berangkat",
        timestamp: now,
        attendance_date: today,
        location_lat: -6.9185,
        location_lng: 107.6195,
        notes: null,
        photo_file_id: null,
        created_at: now,
      },
    ],
    attendance_todos: [],
    attendance_reminder_settings: [
      {
        id: "default",
        enabled: true,
        berangkat_time: "08:00",
        pulang_time: "17:00",
        grace_minutes: 0,
        active_days: [1, 2, 3, 4, 5, 6],
        sound_enabled: true,
        telegram_enabled: true,
        updated_at: now,
      },
    ],
    attendance_reminder_logs: [],
    user_sessions: [],
    pending_photo_uploads: [],
    error_log: [],
    storage: new Map(),
  };
}

const globalKey = "__tutrackMockSupabaseStore";

function getStore(): MockStore {
  const g = globalThis as unknown as Record<string, MockStore | undefined>;
  if (!g[globalKey]) {
    g[globalKey] = createInitialStore();
  }
  return g[globalKey]!;
}

function getTable(store: MockStore, name: string): Row[] {
  const table = (store as unknown as Record<string, unknown>)[name];
  if (Array.isArray(table)) return table as Row[];
  const created: Row[] = [];
  (store as unknown as Record<string, unknown>)[name] = created;
  return created;
}

function enrichRow(store: MockStore, tableName: string, row: Row): Row {
  const copy: Row = { ...row };
  const users = store.users;

  if (tableName === "tasks") {
    const priority = store.priorities.find((p) => p.id === copy.priority_id);
    copy.priority = priority ? { name: priority.name } : { name: "Medium" };
    copy.assignee = users.find((u) => u.id === copy.assigned_to) ?? null;
    copy.creator = users.find((u) => u.id === copy.created_by) ?? null;
    const links = store.task_tags.filter((tt) => tt.task_id === copy.id);
    copy.tags = links
      .map((l) => ({ tag: store.tags.find((t) => t.id === l.tag_id) }))
      .filter((t) => Boolean(t.tag));
    copy.attachments = store.task_attachments.filter((a) => a.task_id === copy.id);
  } else if (tableName === "locations") {
    copy.user = users.find((u) => u.id === copy.user_id) ?? null;
  } else if (tableName === "prospects") {
    copy.assignee = users.find((u) => u.id === copy.assigned_to) ?? null;
    copy.deleter = users.find((u) => u.id === copy.deleted_by) ?? null;
  } else if (tableName === "tower_sites") {
    copy.assignee = users.find((u) => u.id === copy.assigned_to) ?? null;
    copy.deleter = users.find((u) => u.id === copy.deleted_by) ?? null;
  } else if (tableName === "visit_logs") {
    copy.visitor = users.find((u) => u.id === copy.visited_by) ?? null;
    copy.prospect = store.prospects.find((p) => p.id === copy.prospect_id) ?? null;
    copy.tower = store.tower_sites.find((t) => t.id === copy.tower_id) ?? null;
  } else if (tableName === "prospect_history") {
    copy.changer = users.find((u) => u.id === copy.changed_by) ?? null;
  } else if (tableName === "task_history") {
    copy.performer = users.find((u) => u.id === copy.performed_by) ?? null;
  } else if (tableName === "attendance") {
    copy.user = users.find((u) => u.id === copy.user_id) ?? null;
  }

  return copy;
}

type FilterFn = (row: Row) => boolean;

class MockQueryBuilder {
  private store: MockStore;
  private tableName: string;
  private op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: Row | Row[] | null = null;
  private filters: FilterFn[] = [];
  private orders: Array<{ column: string; ascending: boolean }> = [];
  private limitCount: number | null = null;
  private rangeBounds: [number, number] | null = null;
  private singleMode: "none" | "single" | "maybeSingle" = "none";
  private wantSelectAfterWrite = false;
  private headOnly = false;
  private wantCount = false;

  constructor(store: MockStore, tableName: string) {
    this.store = store;
    this.tableName = tableName;
  }

  select(_columns?: string, options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }) {
    if (this.op === "select") {
      this.wantCount = Boolean(options?.count);
      this.headOnly = Boolean(options?.head);
    } else {
      this.wantSelectAfterWrite = true;
    }
    return this;
  }

  insert(data: Row | Row[]) {
    this.op = "insert";
    this.payload = data;
    return this;
  }

  update(data: Row) {
    this.op = "update";
    this.payload = data;
    return this;
  }

  upsert(data: Row | Row[]) {
    this.op = "upsert";
    this.payload = data;
    return this;
  }

  delete() {
    this.op = "delete";
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push((r) => r[col] === val);
    return this;
  }

  neq(col: string, val: unknown) {
    this.filters.push((r) => r[col] !== val);
    return this;
  }

  is(col: string, val: unknown) {
    this.filters.push((r) => (r[col] ?? null) === val);
    return this;
  }

  in(col: string, vals: unknown[]) {
    const set = new Set(vals);
    this.filters.push((r) => set.has(r[col]));
    return this;
  }

  ilike(col: string, pattern: string) {
    const clean = pattern.replace(/%/g, "").toLowerCase();
    this.filters.push((r) => String(r[col] ?? "").toLowerCase().includes(clean));
    return this;
  }

  gte(col: string, val: unknown) {
    this.filters.push((r) => String(r[col] ?? "") >= String(val));
    return this;
  }

  lte(col: string, val: unknown) {
    this.filters.push((r) => String(r[col] ?? "") <= String(val));
    return this;
  }

  gt(col: string, val: unknown) {
    this.filters.push((r) => String(r[col] ?? "") > String(val));
    return this;
  }

  lt(col: string, val: unknown) {
    this.filters.push((r) => String(r[col] ?? "") < String(val));
    return this;
  }

  contains(col: string, val: unknown) {
    this.filters.push((r) => {
      const target = r[col];
      if (target && typeof target === "object" && val && typeof val === "object") {
        return Object.entries(val as Row).every(
          ([k, v]) => (target as Row)[k] === v
        );
      }
      return false;
    });
    return this;
  }

  or() {
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  range(from: number, to: number) {
    this.rangeBounds = [from, to];
    return this;
  }

  single() {
    this.singleMode = "single";
    return this;
  }

  maybeSingle() {
    this.singleMode = "maybeSingle";
    return this;
  }

  private execute(): { data: unknown; error: null | { message: string; code?: string }; count?: number } {
    const table = getTable(this.store, this.tableName);
    const now = new Date().toISOString();

    if (this.op === "insert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload!];
      const inserted: Row[] = [];
      for (const item of items) {
        const row: Row = {
          id: item.id ?? crypto.randomUUID(),
          created_at: item.created_at ?? now,
          updated_at: item.updated_at ?? now,
          ...item,
        };
        if (this.tableName === "attendance") {
          const dup = table.find(
            (r) =>
              r.user_id === row.user_id &&
              r.attendance_date === row.attendance_date &&
              r.type === row.type
          );
          if (dup) {
            return { data: null, error: { message: "Duplicate attendance", code: "23505" } };
          }
          row.timestamp = row.timestamp ?? now;
        }
        table.push(row);
        inserted.push(enrichRow(this.store, this.tableName, row));
      }
      if (!this.wantSelectAfterWrite) {
        return { data: null, error: null };
      }
      if (this.singleMode === "single" || this.singleMode === "maybeSingle") {
        return { data: inserted[0] ?? null, error: null };
      }
      return { data: inserted, error: null };
    }

    if (this.op === "upsert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload!];
      const upserted: Row[] = [];
      for (const item of items) {
        const key = item.user_id ? "user_id" : item.chat_id ? "chat_id" : "id";
        const idx = table.findIndex((r) => item[key] !== undefined && r[key] === item[key]);
        if (idx >= 0) {
          table[idx] = { ...table[idx], ...item, updated_at: now };
          upserted.push(enrichRow(this.store, this.tableName, table[idx]));
        } else {
          const row: Row = {
            id: item.id ?? crypto.randomUUID(),
            created_at: now,
            updated_at: now,
            ...item,
          };
          table.push(row);
          upserted.push(enrichRow(this.store, this.tableName, row));
        }
      }
      if (!this.wantSelectAfterWrite) {
        return { data: null, error: null };
      }
      if (this.singleMode === "single" || this.singleMode === "maybeSingle") {
        return { data: upserted[0] ?? null, error: null };
      }
      return { data: upserted, error: null };
    }

    if (this.op === "update") {
      const updated: Row[] = [];
      for (let i = 0; i < table.length; i++) {
        if (this.filters.every((fn) => fn(table[i]))) {
          table[i] = { ...table[i], ...(this.payload as Row), updated_at: now };
          updated.push(enrichRow(this.store, this.tableName, table[i]));
        }
      }
      if (!this.wantSelectAfterWrite) {
        return { data: null, error: null };
      }
      if (this.singleMode === "single" || this.singleMode === "maybeSingle") {
        return { data: updated[0] ?? null, error: null };
      }
      return { data: updated, error: null };
    }

    if (this.op === "delete") {
      for (let i = table.length - 1; i >= 0; i--) {
        if (this.filters.every((fn) => fn(table[i]))) {
          table.splice(i, 1);
        }
      }
      return { data: null, error: null };
    }

    // SELECT
    let rows = table
      .filter((r) => this.filters.every((fn) => fn(r)))
      .map((r) => enrichRow(this.store, this.tableName, r));

    if (this.orders.length > 0) {
      rows = [...rows].sort((a, b) => {
        for (const o of this.orders) {
          const av = a[o.column] ?? "";
          const bv = b[o.column] ?? "";
          if (av < bv) return o.ascending ? -1 : 1;
          if (av > bv) return o.ascending ? 1 : -1;
        }
        return 0;
      });
    }

    const totalCount = rows.length;

    if (this.rangeBounds) {
      rows = rows.slice(this.rangeBounds[0], this.rangeBounds[1] + 1);
    } else if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount);
    }

    if (this.headOnly) {
      return { data: null, error: null, count: totalCount };
    }

    if (this.singleMode === "single") {
      if (rows.length === 0) {
        return { data: null, error: { message: "No rows found" } };
      }
      return { data: rows[0], error: null, count: this.wantCount ? totalCount : undefined };
    }

    if (this.singleMode === "maybeSingle") {
      return { data: rows[0] ?? null, error: null, count: this.wantCount ? totalCount : undefined };
    }

    return { data: rows, error: null, count: this.wantCount ? totalCount : undefined };
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: null | { message: string; code?: string }; count?: number }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled ?? undefined, onrejected ?? undefined);
  }
}

export function createMockSupabaseClient(): SupabaseClient {
  const store = getStore();

  const mock = {
    from(table: string) {
      return new MockQueryBuilder(store, table);
    },
    async rpc(fnName: string, params: Row = {}) {
      const now = new Date().toISOString();
      if (fnName === "attendance_today_jakarta") {
        return {
          data: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }),
          error: null,
        };
      }
      if (fnName === "update_task_status") {
        const task = store.tasks.find((t) => t.id === params.p_task_id);
        if (task) {
          const oldStatus = task.status;
          task.status = params.p_new_status;
          task.updated_at = now;
          store.task_history.push({
            id: crypto.randomUUID(),
            task_id: task.id,
            action: "status_changed",
            old_value: { status: oldStatus },
            new_value: { status: params.p_new_status },
            performed_by: params.p_performed_by,
            created_at: now,
          });
        }
        return { data: null, error: null };
      }
      if (fnName === "soft_delete_task") {
        const task = store.tasks.find((t) => t.id === params.p_task_id);
        if (task) {
          task.deleted_at = now;
          task.updated_at = now;
        }
        return { data: null, error: null };
      }
      if (fnName === "record_ping") {
        store.location_pings.push({
          id: crypto.randomUUID(),
          user_id: params.p_user_id,
          session_date: params.p_session_date,
          ping_number: store.location_pings.length + 1,
          lat: params.p_lat,
          lng: params.p_lng,
          accuracy: params.p_accuracy ?? null,
          source: params.p_source ?? "web_app",
          created_at: now,
        });
        return { data: null, error: null };
      }
      if (fnName === "record_location_update") {
        const existing = store.locations.find((l) => l.user_id === params.p_user_id);
        if (existing) {
          existing.lat = params.p_lat;
          existing.lng = params.p_lng;
          existing.accuracy = params.p_accuracy ?? null;
          existing.updated_at = now;
        } else {
          store.locations.push({
            id: crypto.randomUUID(),
            user_id: params.p_user_id,
            lat: params.p_lat,
            lng: params.p_lng,
            accuracy: params.p_accuracy ?? null,
            updated_at: now,
          });
        }
        return { data: { ok: true }, error: null };
      }
      if (fnName === "claim_pending_notifications") {
        return { data: [], error: null };
      }
      if (fnName === "get_storage_stats") {
        return { data: {}, error: null };
      }
      return { data: null, error: null };
    },
    channel() {
      const ch = {
        on() {
          return ch;
        },
        subscribe() {
          return ch;
        },
      };
      return ch;
    },
    removeChannel() {
      return Promise.resolve("ok");
    },
    storage: {
      from() {
        return {
          async upload(path: string, fileBody: Blob | Uint8Array) {
            const bytes =
              fileBody instanceof Blob
                ? new Uint8Array(await fileBody.arrayBuffer())
                : fileBody;
            store.storage.set(path, bytes);
            return { data: { path }, error: null };
          },
          async remove(paths: string[]) {
            for (const p of paths) store.storage.delete(p);
            return { data: null, error: null };
          },
          async createSignedUrl(path: string) {
            return {
              data: { signedUrl: `/api/mock-storage/${encodeURIComponent(path)}` },
              error: null,
            };
          },
        };
      },
    },
  };

  return mock as unknown as SupabaseClient;
}
