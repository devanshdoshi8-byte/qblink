/**
 * Standalone, 100% in-browser Local Storage client for q-blink.vercel.app.
 * Disconnected completely from any external Supabase instance or database.
 * Uses localStorage and BroadcastChannel so multiple tabs (doctor desk, waiting room TV, patient phone)
 * synchronize in real time with zero network requests.
 */

const STORAGE_PREFIX = "qb_standalone_";

interface StoredData {
  queues: any[];
  businesses: any[];
  queue_visitors: any[];
  user_roles: any[];
  appointments: any[];
  notifications: any[];
}

const DEFAULT_DATA: StoredData = {
  businesses: [
    {
      id: "demo-clinic-business",
      owner_id: "standalone-doctor-1",
      name: "Sterling Care Clinic",
      category: "clinic",
      address: "Malad West, Mumbai",
      phone: "+91 98200 11223",
      created_at: new Date().toISOString(),
      settings: {
        daily_reset_time: "00:00",
        daily_reset_enabled: true,
        industry: "clinic",
        require_customer_details: true,
      },
    },
  ],
  queues: [
    {
      id: "demo-queue-dr-patange",
      business_id: "demo-clinic-business",
      name: "OPD Consultation Queue (Dr. Ambrish Patange)",
      status: "active",
      current_token: 14,
      next_token: 18,
      estimated_service_time: 12,
      note: "OPD active · Dr. Ambrish Patange in cabin",
      require_customer_details: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  queue_visitors: [
    {
      id: "vis-14",
      queue_id: "demo-queue-dr-patange",
      token_number: 14,
      visitor_name: "Kavita Rao",
      phone: "+91 98200 11223",
      status: "called",
      joined_at: new Date(Date.now() - 25 * 60000).toISOString(),
      called_at: new Date(Date.now() - 5 * 60000).toISOString(),
      served_at: null,
      session_id: "sess-14",
    },
    {
      id: "vis-15",
      queue_id: "demo-queue-dr-patange",
      token_number: 15,
      visitor_name: "Rahul Sharma",
      phone: "+91 98200 54321",
      status: "waiting",
      joined_at: new Date(Date.now() - 18 * 60000).toISOString(),
      called_at: null,
      served_at: null,
      session_id: "sess-15",
    },
    {
      id: "vis-16",
      queue_id: "demo-queue-dr-patange",
      token_number: 16,
      visitor_name: "Amit Deshmukh",
      phone: "+91 98200 77889",
      status: "waiting",
      joined_at: new Date(Date.now() - 12 * 60000).toISOString(),
      called_at: null,
      served_at: null,
      session_id: "sess-16",
    },
    {
      id: "vis-17",
      queue_id: "demo-queue-dr-patange",
      token_number: 17,
      visitor_name: "Pooja Verma",
      phone: "+91 98200 99001",
      status: "waiting",
      joined_at: new Date(Date.now() - 5 * 60000).toISOString(),
      called_at: null,
      served_at: null,
      session_id: "sess-17",
    },
  ],
  user_roles: [
    {
      user_id: "standalone-doctor-1",
      role: "business",
    },
    {
      user_id: "standalone-doctor-1",
      role: "customer",
    },
  ],
  appointments: [],
  notifications: [],
};

function getStorage<K extends keyof StoredData>(key: K): StoredData[K] {
  if (typeof window === "undefined") return DEFAULT_DATA[key];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(DEFAULT_DATA[key]));
      return DEFAULT_DATA[key];
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DATA[key];
  }
}

function setStorage<K extends keyof StoredData>(key: K, data: StoredData[K]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
    broadcastSync(key);
  } catch (err) {
    console.error("[Standalone Storage Error]", err);
  }
}

// Multi-tab BroadcastChannel
const broadcastChannel = typeof window !== "undefined" && "BroadcastChannel" in window
  ? new BroadcastChannel("qblink_standalone_sync")
  : null;

function broadcastSync(table: string) {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: "table_update", table, timestamp: Date.now() });
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("qb:standalone-sync", { detail: { table } }));
  }
}

// Standalone Doctor/Business User Session
const STANDALONE_USER = {
  id: "standalone-doctor-1",
  email: "doctor@q-blink.com",
  app_metadata: {},
  user_metadata: { role: "business", name: "Dr. Ambrish Patange" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

const STANDALONE_SESSION = {
  access_token: "standalone-token-mock",
  token_type: "bearer",
  expires_in: 3600,
  refresh_token: "standalone-refresh-mock",
  user: STANDALONE_USER,
};

class StandaloneQueryBuilder {
  private table: string;
  private filters: Array<(row: any) => boolean> = [];
  private orderField: string | null = null;
  private orderAsc = true;
  private limitCount: number | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(fields?: string) {
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push((row) => String(row[field]) === String(value));
    return this;
  }

  neq(field: string, value: any) {
    this.filters.push((row) => String(row[field]) !== String(value));
    return this;
  }

  in(field: string, values: any[]) {
    const set = new Set(values.map(String));
    this.filters.push((row) => set.has(String(row[field])));
    return this;
  }

  or(filterStr: string) {
    // Basic or parsing for e.g. "id.eq.X,parent_queue_id.eq.X"
    const parts = filterStr.split(",");
    this.filters.push((row) => {
      return parts.some((p) => {
        const [field, op, val] = p.split(".");
        if (op === "eq") return String(row[field]) === String(val);
        return false;
      });
    });
    return this;
  }

  is(field: string, value: any) {
    this.filters.push((row) => row[field] === value);
    return this;
  }

  gte(field: string, value: any) {
    this.filters.push((row) => row[field] >= value);
    return this;
  }

  lte(field: string, value: any) {
    this.filters.push((row) => row[field] <= value);
    return this;
  }

  order(field: string, { ascending = true }: { ascending?: boolean } = {}) {
    this.orderField = field;
    this.orderAsc = ascending;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  private getRows(): any[] {
    let rows = (getStorage(this.table as any) || []) as any[];
    for (const f of this.filters) {
      rows = rows.filter(f);
    }
    if (this.orderField) {
      rows.sort((a, b) => {
        const av = a[this.orderField!];
        const bv = b[this.orderField!];
        if (av == null) return 1;
        if (bv == null) return -1;
        return this.orderAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      });
    }
    if (this.limitCount != null) {
      rows = rows.slice(0, this.limitCount);
    }
    return rows;
  }

  async then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    const data = this.getRows();
    const res = { data, error: null, count: data.length };
    return Promise.resolve(onfulfilled ? onfulfilled(res) : (res as any));
  }

  async maybeSingle() {
    const rows = this.getRows();
    return { data: rows.length > 0 ? rows[0] : null, error: null };
  }

  async single() {
    const rows = this.getRows();
    return { data: rows.length > 0 ? rows[0] : null, error: rows.length > 0 ? null : { message: "Row not found" } };
  }

  async insert(payload: any | any[]) {
    const items = Array.isArray(payload) ? payload : [payload];
    const current = (getStorage(this.table as any) || []) as any[];
    const inserted = items.map((item, idx) => ({
      id: item.id || `gen-${Date.now()}-${idx}`,
      created_at: new Date().toISOString(),
      ...item,
    }));
    setStorage(this.table as any, [...current, ...inserted]);
    return { data: inserted, error: null };
  }

  async update(patch: any) {
    const current = (getStorage(this.table as any) || []) as any[];
    let updatedRows: any[] = [];
    const next = current.map((row) => {
      const match = this.filters.every((f) => f(row));
      if (match) {
        const updated = { ...row, ...patch, updated_at: new Date().toISOString() };
        updatedRows.push(updated);
        return updated;
      }
      return row;
    });
    setStorage(this.table as any, next);
    return { data: updatedRows, error: null };
  }

  async delete() {
    const current = (getStorage(this.table as any) || []) as any[];
    const next = current.filter((row) => !this.filters.every((f) => f(row)));
    setStorage(this.table as any, next);
    return { data: null, error: null };
  }
}

class StandaloneRealtimeChannel {
  private topic: string;
  private listeners: Array<() => void> = [];

  constructor(topic: string) {
    this.topic = topic;
  }

  on(_event: string, _filter: any, callback: (payload: any) => void) {
    const handler = () => {
      callback({ new: {}, old: {}, eventType: "UPDATE" });
    };
    if (broadcastChannel) {
      broadcastChannel.addEventListener("message", handler);
      this.listeners.push(() => broadcastChannel.removeEventListener("message", handler));
    }
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handler);
      window.addEventListener("qb:standalone-sync", handler);
      this.listeners.push(() => {
        window.removeEventListener("storage", handler);
        window.removeEventListener("qb:standalone-sync", handler);
      });
    }
    return this;
  }

  subscribe(callback?: (status: string) => void) {
    if (callback) {
      setTimeout(() => callback("SUBSCRIBED"), 10);
    }
    return this;
  }

  unsubscribe() {
    this.listeners.forEach((fn) => fn());
    this.listeners = [];
  }
}

export const standaloneSupabase: any = {
  auth: {
    getSession: async () => ({ data: { session: STANDALONE_SESSION }, error: null }),
    getUser: async () => ({ data: { user: STANDALONE_USER }, error: null }),
    onAuthStateChange: (callback: any) => {
      setTimeout(() => callback("SIGNED_IN", STANDALONE_SESSION), 10);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signInWithPassword: async () => ({ data: { session: STANDALONE_SESSION, user: STANDALONE_USER }, error: null }),
    signInWithOAuth: async () => ({ data: { provider: "google", url: null }, error: null }),
    signUp: async () => ({ data: { session: STANDALONE_SESSION, user: STANDALONE_USER }, error: null }),
    signOut: async () => ({ error: null }),
    updateUser: async (_patch: any) => ({ data: { user: STANDALONE_USER }, error: null }),
    resetPasswordForEmail: async () => ({ data: null, error: null }),
  },

  from: (table: string) => new StandaloneQueryBuilder(table),

  rpc: async (fn: string, args: any = {}) => {
    if (fn === "is_admin") {
      return { data: false, error: null };
    }

    if (fn === "join_customer_queue" || fn === "join_queue" || fn === "join_restaurant_queue") {
      const qid = args.p_queue_id || args.queue_id || "demo-queue-dr-patange";
      const queues = getStorage("queues");
      const targetQueue = queues.find((q: any) => q.id === qid) || queues[0];
      const nextToken = targetQueue ? targetQueue.next_token || 15 : 15;

      const newVisitor = {
        id: `vis-${Date.now()}`,
        queue_id: qid,
        token_number: nextToken,
        visitor_name: args.p_visitor_name || args.visitor_name || "Patient Walk-in",
        phone: args.p_phone || args.phone || "",
        status: "waiting",
        joined_at: new Date().toISOString(),
        called_at: null,
        served_at: null,
        session_id: `sess-${Date.now()}`,
      };

      const visitors = getStorage("queue_visitors");
      visitors.push(newVisitor);
      setStorage("queue_visitors", visitors);

      if (targetQueue) {
        targetQueue.next_token = nextToken + 1;
        setStorage("queues", [...queues]);
      }

      return {
        data: {
          id: newVisitor.id,
          visitor_id: newVisitor.id,
          token_number: newVisitor.token_number,
          queue_id: qid,
          status: "waiting",
        },
        error: null,
      };
    }

    if (fn === "get_my_queue_visits") {
      const visitors = getStorage("queue_visitors");
      return {
        data: visitors.map((v: any) => ({
          visitor_id: v.id,
          queue_id: v.queue_id,
          token_number: v.token_number,
          status: v.status,
          joined_at: v.joined_at,
          called_at: v.called_at,
          queue_name: "OPD Consultation Queue (Dr. Ambrish Patange)",
          business_name: "Sterling Care Clinic",
          category: "clinic",
          current_token: 14,
        })),
        error: null,
      };
    }

    if (fn === "get_business_health" || fn === "get_queue_health") {
      return {
        data: {
          score: 96,
          status: "healthy",
          avg_wait_minutes: 12,
          retention_rate: 98,
        },
        error: null,
      };
    }

    if (fn === "get_owner_health_branches") {
      return { data: [], error: null };
    }

    if (fn === "snapshot_queue_health") {
      return { data: null, error: null };
    }

    if (fn === "daily_reset_queue") {
      const queues = getStorage("queues");
      const target = queues.find((q: any) => q.id === args.p_queue_id);
      if (target) {
        target.current_token = 0;
        target.next_token = 1;
        setStorage("queues", [...queues]);
      }
      return { data: true, error: null };
    }

    if (fn === "customer_leave_queue" || fn === "leave_queue") {
      const visitors = getStorage("queue_visitors");
      const target = visitors.find((v: any) => v.id === args.p_visitor_id);
      if (target) {
        target.status = "removed";
        setStorage("queue_visitors", [...visitors]);
      }
      return { data: true, error: null };
    }

    return { data: null, error: null };
  },

  channel: (topic: string) => new StandaloneRealtimeChannel(topic),

  removeChannel: (ch: any) => {
    if (ch && typeof ch.unsubscribe === "function") {
      ch.unsubscribe();
    }
  },

  functions: {
    invoke: async () => ({ data: { ok: true }, error: null }),
  },
};
