/**
 * High-Resolution Standee Generator
 * Generates print-ready (300 DPI) PNG files for acrylic stands, sunboards, and desk displays.
 */

export interface StandeeOptions {
  bizName: string;
  queueName: string;
  url: string;
  isClinic?: boolean;
}

/**
 * Generates and downloads a high-resolution (1800 x 2400) print-ready Standee PNG.
 */
export async function downloadStandeePNG(options: StandeeOptions): Promise<void> {
  const { bizName, queueName, url, isClinic = false } = options;

  // 1. Get QR code SVG element
  const svgEl = document.querySelector<SVGSVGElement>("#qr-standee-svg");
  if (!svgEl) {
    throw new Error("QR Code SVG element not found");
  }

  const svgXml = new XMLSerializer().serializeToString(svgEl);
  const svgDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgXml)}`;

  // 2. Load SVG into Image
  const qrImage = new Image();
  await new Promise<void>((resolve, reject) => {
    qrImage.onload = () => resolve();
    qrImage.onerror = () => reject(new Error("Failed to load QR image"));
    qrImage.src = svgDataUri;
  });

  // 3. Create High-Resolution Canvas (1800 x 2550 - roughly 300 DPI A5)
  const canvas = document.createElement("canvas");
  const width = 1800;
  const height = 2550;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas 2d context");

  // Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Outer Border & Card Shadow
  const pad = 90;
  const cardW = width - pad * 2;
  const cardH = height - pad * 2;
  const radius = 60;

  ctx.strokeStyle = "#0F766E"; // Teal primary
  ctx.lineWidth = 14;
  roundRect(ctx, pad, pad, cardW, cardH, radius);
  ctx.stroke();

  // Subtle inner accent line
  ctx.strokeStyle = "rgba(15, 118, 110, 0.15)";
  ctx.lineWidth = 4;
  roundRect(ctx, pad + 24, pad + 24, cardW - 48, cardH - 48, radius - 16);
  ctx.stroke();

  // Top Pill Badge
  const badgeY = pad + 120;
  const badgeText = isClinic ? "DIGITAL LIVE OPD QUEUE" : "DIGITAL LIVE QUEUE";
  ctx.font = "bold 44px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const badgeMetrics = ctx.measureText(badgeText);
  const badgeW = badgeMetrics.width + 100;
  const badgeH = 80;
  const badgeX = (width - badgeW) / 2;

  ctx.fillStyle = "#0F766E";
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 40);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, width / 2, badgeY + badgeH / 2);

  // Business / Clinic Name
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 90px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(truncateText(ctx, bizName, cardW - 160), width / 2, badgeY + 220);

  // Queue / Doctor Name
  ctx.fillStyle = "#475569";
  ctx.font = "600 58px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(truncateText(ctx, queueName, cardW - 160), width / 2, badgeY + 310);

  // QR Box
  const qrBoxSize = 980;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = badgeY + 410;

  ctx.fillStyle = "#F8FAFC";
  roundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 40);
  ctx.fill();

  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 6;
  ctx.setLineDash([20, 14]);
  roundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 40);
  ctx.stroke();
  ctx.setLineDash([]); // Reset dash

  // Draw QR Code centered inside QR Box
  const qrInnerSize = 820;
  const qrInnerPad = (qrBoxSize - qrInnerSize) / 2;
  ctx.drawImage(qrImage, qrBoxX + qrInnerPad, qrBoxY + qrInnerPad, qrInnerSize, qrInnerSize);

  // Scan Call-to-Action
  const ctaY = qrBoxY + qrBoxSize + 110;
  ctx.fillStyle = "#0F766E";
  ctx.font = "800 72px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Scan to Join Queue", width / 2, ctaY);

  // Subtitle
  ctx.fillStyle = "#64748B";
  ctx.font = "500 46px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Zero App Download Needed · Live Turn Alerts on Phone", width / 2, ctaY + 70);

  // Short URL Box
  const urlBoxY = ctaY + 140;
  const urlBoxW = cardW - 240;
  const urlBoxH = 90;
  const urlBoxX = (width - urlBoxW) / 2;

  ctx.fillStyle = "#F1F5F9";
  roundRect(ctx, urlBoxX, urlBoxY, urlBoxW, urlBoxH, 20);
  ctx.fill();

  ctx.fillStyle = "#334155";
  ctx.font = "bold 38px monospace";
  ctx.fillText(truncateText(ctx, url, urlBoxW - 60), width / 2, urlBoxY + urlBoxH / 2);

  // Footer Attribution
  const footerY = height - pad - 80;
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(pad + 80, footerY - 50);
  ctx.lineTo(width - pad - 80, footerY - 50);
  ctx.stroke();

  ctx.fillStyle = "#94A3B8";
  ctx.font = "600 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const footerText = isClinic
    ? "Qblink · Incubated at Inventure, IIT Gandhinagar · Social Healthcare Initiative"
    : "Qblink Smart Queue Platform · Incubated at Inventure, IIT Gandhinagar";
  ctx.fillText(footerText, width / 2, footerY);

  // 4. Download file
  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  const safeName = (bizName || "Qblink").replace(/[^a-zA-Z0-9_-]/g, "_");
  a.download = `${safeName}_QR_Standee.png`;
  a.href = dataUrl;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let str = text;
  while (str.length > 0 && ctx.measureText(str + "...").width > maxW) {
    str = str.slice(0, -1);
  }
  return str + "...";
}
