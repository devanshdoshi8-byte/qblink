import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, QrCode, Search, Play } from "lucide-react";
import SEO from "@/components/SEO";
import { QBlinkWordmark } from "@/components/qb/QBlinkWordmark";

const CustomerJoinEntry = () => {
  const [queueCode, setQueueCode] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = queueCode.trim();
    if (!cleaned) return;
    navigate(`/join/${encodeURIComponent(cleaned)}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Join a Queue — QBlink"
        description="Enter a venue code, scan a QR, or try a live sample queue in your browser with no app download."
        path="/join"
      />
      <header className="border-b border-border/60 bg-background/90 px-5 sm:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" aria-label="QBlink home">
            <QBlinkWordmark textClassName="text-xl text-foreground" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl border border-border bg-card transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to QBlink</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <QrCode className="w-3.5 h-3.5" />
              <span>Zero-App Customer Entry</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Join a live queue
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter the venue or queue code from the front desk standee, or try a live sample clinic queue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
            <div>
              <label htmlFor="queue-code" className="block text-sm font-medium text-foreground mb-1.5">
                Venue or queue code
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="queue-code"
                  type="text"
                  value={queueCode}
                  onChange={(e) => setQueueCode(e.target.value)}
                  placeholder="e.g. sterling-opd or queue ID"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!queueCode.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold py-3 text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <span>Check live wait &amp; join</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="rounded-2xl border border-border bg-card/60 p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-foreground">Just exploring?</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Try the live sample clinic queue without an account.
              </div>
            </div>
            <Link
              to="/pitch"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Live Sample</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerJoinEntry;
