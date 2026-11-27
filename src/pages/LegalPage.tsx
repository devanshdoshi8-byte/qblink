import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SEO from "@/components/SEO";
import { QBlinkWordmark } from "@/components/qb/QBlinkWordmark";

interface LegalPageProps {
  type: "privacy" | "terms";
}

const LegalPage = ({ type }: LegalPageProps) => {
  const isPrivacy = type === "privacy";
  const title = isPrivacy ? "Privacy Policy" : "Terms of Service";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title={`${title} — QBlink`}
        description={`QBlink ${title.toLowerCase()} for walk-in businesses and queue participants.`}
        path={isPrivacy ? "/privacy" : "/terms"}
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

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-14 space-y-8">
        <div>
          <p className="font-mono-caps text-xs text-primary uppercase tracking-wider mb-2">
            Legal
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Effective 2026 · QBlink Customer Flow Intelligence Platform
          </p>
        </div>

        {isPrivacy ? (
          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">1. Information We Collect</h2>
              <p>
                When a visitor joins a queue via QR code or link, QBlink stores only the token number,
                optional display name or contact number needed for turn notifications, and queue timestamps.
                Business operators provide account credentials and counter configuration details.
              </p>
            </section>
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">2. How Data Is Used</h2>
              <p>
                Queue data is used strictly to calculate live wait estimates, deliver turn alerts, and
                provide operational flow analytics to the business managing that queue. We do not sell
                visitor data to third parties.
              </p>
            </section>
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">3. Contact</h2>
              <p>
                For privacy questions or data deletion requests, reach the team at qblinkteam@gmail.com.
              </p>
            </section>
          </div>
        ) : (
          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">1. Service Scope</h2>
              <p>
                QBlink provides browser-based queue management, live position tracking, and flow analytics
                for walk-in businesses. Wait-time estimates are dynamic projections based on recent
                service velocity.
              </p>
            </section>
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">2. Acceptable Use</h2>
              <p>
                Operators are responsible for accurate counter management and respectful handling of
                visitor contact details. Automated abuse, spam token creation, or unauthorized access
                attempts are prohibited.
              </p>
            </section>
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">3. Contact</h2>
              <p>
                Questions about these terms can be sent to qblinkteam@gmail.com.
              </p>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default LegalPage;
