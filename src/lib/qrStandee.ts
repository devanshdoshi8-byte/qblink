/**
 * HTML escaping and URL sanitization helpers for the printable QR standee.
 * Prevents HTML/XSS injection when interpolating business/queue metadata into
 * a standalone print document.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch] || ch);
}

export function sanitizeHttpUrl(rawUrl: string): string {
  const trimmed = String(rawUrl || "").trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
    return "";
  } catch {
    return "";
  }
}

export interface QRStandeeHtmlOptions {
  bizName: string;
  queueName: string;
  url: string;
  svgDataUri?: string;
  isClinic?: boolean;
}

export function buildQRStandeeHtml({
  bizName,
  queueName,
  url,
  svgDataUri = "",
  isClinic = false,
}: QRStandeeHtmlOptions): string {
  const safeBizName = escapeHtml(bizName);
  const safeQueueName = escapeHtml(queueName);
  const validatedUrl = sanitizeHttpUrl(url);
  const safeUrl = escapeHtml(validatedUrl);
  const safeSvgUri = svgDataUri.startsWith("data:image/svg+xml;")
    ? escapeHtml(svgDataUri)
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Qblink QR Standee - ${safeBizName}</title>
        <style>
          @page { size: A5 portrait; margin: 10mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            text-align: center;
            color: #0f172a;
            margin: 0;
            padding: 24px;
            background: #fff;
          }
          .card {
            border: 2px solid #0f766e;
            border-radius: 24px;
            padding: 32px 24px;
            max-width: 420px;
            margin: 0 auto;
          }
          .badge {
            display: inline-block;
            background: #0f766e;
            color: #ffffff;
            font-size: 13px;
            font-weight: 700;
            padding: 6px 16px;
            border-radius: 999px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            margin-bottom: 20px;
          }
          h1 {
            font-size: 26px;
            font-weight: 800;
            margin: 0 0 6px 0;
            color: #0f172a;
          }
          h2 {
            font-size: 17px;
            font-weight: 600;
            color: #475569;
            margin: 0 0 24px 0;
          }
          .qr-box {
            padding: 16px;
            display: inline-block;
            background: #ffffff;
            border: 2px dashed #cbd5e1;
            border-radius: 20px;
            margin-bottom: 20px;
          }
          .scan-cue {
            font-size: 20px;
            font-weight: 800;
            color: #0f766e;
            margin-bottom: 6px;
          }
          .subtext {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 20px;
          }
          .url {
            font-size: 11px;
            font-family: monospace;
            color: #94a3b8;
            word-break: break-all;
            padding: 8px;
            background: #f8fafc;
            border-radius: 8px;
            margin-bottom: 24px;
          }
          .footer {
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">${isClinic ? "Digital Live OPD Queue" : "Digital Live Queue"}</div>
          <h1>${safeBizName}</h1>
          <h2>${safeQueueName}</h2>
          <div class="qr-box">
            ${safeSvgUri ? `<img src="${safeSvgUri}" width="220" height="220" alt="QR Code" />` : ""}
          </div>
          <div class="scan-cue">Scan to Join Queue</div>
          <div class="subtext">Zero App Download Needed · Live Turn Alerts on Phone</div>
          ${safeUrl ? `<div class="url">${safeUrl}</div>` : ""}
          <div class="footer">${isClinic ? "Qblink · Incubated at Inventure, IIT Gandhinagar · Social Healthcare Initiative" : "Qblink Smart Queue Platform · Incubated at Inventure, IIT Gandhinagar"}</div>
        </div>
        <script>
          window.onload = function() {
            window.onafterprint = function() {
              window.close();
            };
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;
}
