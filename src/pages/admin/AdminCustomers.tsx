import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { Search, Download, Eye, Ban, X, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { csvCell } from "@/lib/csv";
import { collectSupabaseErrors } from "@/lib/adminAnalytics";

interface CustRow {
  id: string;
  name: string;
  phone: string;
  lastActive: string;
  joined: number;
  visits: number;
  status: string;
}

const STATUS_CLS: Record<string, string> = {
  active: "bg-success-soft text-success",
  inactive: "bg-muted text-muted-foreground",
  banned: "bg-danger-soft text-danger",
};

const AdminCustomers = () => {
  const [rows, setRows] = useState<CustRow[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [selected, setSelected] = useState<CustRow | null>(null);
  const [queryErrors, setQueryErrors] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
    const ch = supabase.channel("admin-customers")
      .on("postgres_changes", { event: "*", schema: "public", table: "customer_profiles" }, fetchData)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "queue_live_signals" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const fetchData = async () => {
    const [profRes, visRes] = await Promise.all([
      supabase.from("customer_profiles").select("id, full_name, user_id, phone, created_at"),
      supabase.from("queue_visitors").select("customer_user_id, phone, visitor_name, joined_at, queue_id, status"),
    ]);
    setQueryErrors(
      collectSupabaseErrors([
        { source: "customer_profiles", error: profRes.error },
        { source: "queue_visitors", error: visRes.error },
      ]),
    );

    const profiles = profRes.data;
    const v = visRes.data || [];
    const normPhone = (p?: string | null) => (p || "").replace(/\D/g, "").slice(-10);

    const rowsFromProfiles: CustRow[] = (profiles || []).map(c => {
      const cPhone = normPhone(c.phone);
      const myVisits = v.filter(x =>
        (c.user_id && x.customer_user_id === c.user_id) ||
        (cPhone.length >= 7 && normPhone(x.phone) === cPhone),
      );
      const lastVisit = myVisits.reduce((max, x) => Math.max(max, new Date(x.joined_at).getTime()), 0);
      const queuesJoined = new Set(myVisits.map(x => x.queue_id)).size;
      return {
        id: c.id,
        name: c.full_name || "Customer",
        phone: c.phone || "—",
        lastActive: lastVisit ? formatDistanceToNow(new Date(lastVisit), { addSuffix: true }) : new Date(c.created_at).toLocaleDateString(),
        joined: queuesJoined,
        visits: myVisits.length,
        status: "active",
      };
    });
    setRows(rowsFromProfiles);
  };

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q);
    const matchFilter = filter === "All" || r.status === filter;
    return matchSearch && matchFilter;
  });

  const exportCSV = () => {
    const head = ["Name", "Phone / Contact", "Last Active", "Queues Joined", "Visits", "Status"];
    const csv = [head, ...filtered.map(r => [r.name, r.phone, r.lastActive, r.joined, r.visits, r.status])]
      .map(row => row.map(c => csvCell(c)).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `qblink-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <AdminLayout>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">All customers on Qblink — {rows.length} total</p>
        </div>
        <button onClick={exportCSV} className="bg-card border border-border text-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {queryErrors.length > 0 && (
        <div className="bg-danger-soft border border-danger/30 rounded-2xl p-4 mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 text-sm">
            <AlertTriangle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">Database query issue: {queryErrors.join(" · ")}</p>
          </div>
          <button onClick={fetchData} className="px-3 py-1 rounded-lg bg-card text-xs font-semibold border border-border">Retry</button>
        </div>
      )}

      <div className="bg-card rounded-2xl p-4 card-shadow mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone…"
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-1.5">
          {["All", "active", "inactive", "banned"].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
              filter === s ? "gradient-bg text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Phone / Contact</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Last Active</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3 text-left">Visits</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-primary-foreground text-xs font-bold">{r.name[0]}</span>
                      {r.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{r.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{r.lastActive}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">{r.joined}</td>
                  <td className="px-4 py-3">{r.visits}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_CLS[r.status] || "bg-muted"}`}>{r.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button title="View" aria-label="View" onClick={() => setSelected(r)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Eye className="w-3.5 h-3.5" /></button>
                      <button title="Ban" aria-label="Ban" onClick={() => toast.success(`${r.name} ban toggled`)} className="p-1.5 rounded-lg hover:bg-danger-soft text-danger"><Ban className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">No customers match.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card rounded-2xl p-6 max-w-md w-full card-shadow" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{selected.name}</h2>
                <p className="text-xs text-muted-foreground">{selected.phone}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Mini label="Queues joined" value={selected.joined} />
              <Mini label="Total visits" value={selected.visits} />
              <Mini label="Last active" value={selected.lastActive} />
              <Mini label="Status" value={selected.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-4">{selected.visits > 0 ? `${selected.visits} visit${selected.visits === 1 ? "" : "s"} across ${selected.joined} queue${selected.joined === 1 ? "" : "s"}` : "No queue visits yet"}</p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

const Mini = ({ label, value }: { label: string; value: any }) => (
  <div className="bg-muted/40 rounded-xl p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-lg font-bold text-foreground capitalize">{value}</p>
  </div>
);

export default AdminCustomers;
