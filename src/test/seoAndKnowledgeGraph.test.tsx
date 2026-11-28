import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import fs from "fs";
import path from "path";
import SEO from "@/components/SEO";
import AboutSection from "@/components/AboutSection";
import AboutUs from "@/pages/AboutUs";
import { ThemeProvider } from "@/hooks/useTheme";

describe("Static SEO & Knowledge Graph Validation", () => {
  it("validates index.html contains full metadata, alternate tags and schema.org graph", () => {
    const indexPath = path.resolve(process.cwd(), "index.html");
    const html = fs.readFileSync(indexPath, "utf-8");

    // Title & Core Meta
    expect(html).toContain("<title>QBlink — Hardware-Free Virtual Queue Management</title>");
    expect(html).not.toContain("<title>Qblink (QBlink)");
    expect(html).not.toContain('"name": "About & Founders"');
    expect(html).toContain('https://in.linkedin.com/in/qblink-tech-a479563b3');
    expect(html).toContain('rel="canonical" href="https://qblink.tech/"');
    expect(html).toContain('hreflang="en"');
    expect(html).toContain('hreflang="x-default"');
    expect(html).toContain('name="keywords"');
    expect(html).toContain("Devansh");
    expect(html).toContain("Mithil");
    expect(html).toContain("Aarav");
    expect(html).toContain("Vihan Patange");
    expect(html).toContain("Inventure · IIT Gandhinagar");

    // Social Graph Meta
    expect(html).toContain('property="og:site_name" content="Qblink"');
    expect(html).toContain('property="og:image" content="https://qblink.tech/og-image.png"');
    expect(html).toContain('property="og:image:secure_url" content="https://qblink.tech/og-image.png"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');

    // JSON-LD Knowledge Graph
    expect(html).toContain('"@type": "Organization"');
    expect(html).toContain('"alternateName": ["QBlink", "Q-blink", "Qblink Tech", "Qblink Technologies", "qblink.tech"]');
    expect(html).toContain('"founder"');
    expect(html).toContain('"Devansh"');
    expect(html).toContain('"Founder & Creator"');
    expect(html).toContain('"Mithil"');
    expect(html).toContain('"Aarav"');
    expect(html).toContain('"Vihan Patange"');
    expect(html).toContain('"Inventure, IIT Gandhinagar"');

    // Standalone top-level Person entities in static @graph
    expect(html).toContain('"@id": "https://qblink.tech/#founder-devansh"');
    expect(html).toContain('"@id": "https://qblink.tech/#cofounder-mithil"');
    expect(html).toContain('"@id": "https://qblink.tech/#cofounder-aarav"');
    expect(html).toContain('"@id": "https://qblink.tech/#cofounder-vihan"');

    // Static FAQPage schema for rich SERP snippets
    expect(html).toContain('"@type": "FAQPage"');
    expect(html).toContain('Who founded Qblink and who are the founders?');
    expect(html).toContain('Who started QBlink?');

    // Semantic noscript crawler fallback
    expect(html).toContain("<noscript>");
    expect(html).toContain("Started by Devansh with co-founders Mithil, Aarav, and Vihan Patange");
    expect(html).toContain("Inventure · IIT Gandhinagar");
  });

  it("validates public/robots.txt allows all major search and AI crawlers with sitemap pointer", () => {
    const robotsPath = path.resolve(process.cwd(), "public/robots.txt");
    const robots = fs.readFileSync(robotsPath, "utf-8");

    expect(robots).toContain("User-agent: Googlebot");
    expect(robots).toContain("User-agent: Bingbot");
    expect(robots).toContain("User-agent: GPTBot");
    expect(robots).toContain("User-agent: PerplexityBot");
    expect(robots).toContain("User-agent: ClaudeBot");
    expect(robots).toContain("Sitemap: https://qblink.tech/sitemap.xml");
    expect(robots).toContain("Host: https://qblink.tech");
  });

  it("validates public/sitemap.xml lists canonical URLs including /about and /pitch", () => {
    const sitemapPath = path.resolve(process.cwd(), "public/sitemap.xml");
    const sitemap = fs.readFileSync(sitemapPath, "utf-8");

    expect(sitemap).toContain("<loc>https://qblink.tech/</loc>");
    expect(sitemap).toContain("<loc>https://qblink.tech/about</loc>");
    expect(sitemap).toContain("<loc>https://qblink.tech/industries</loc>");
    expect(sitemap).toContain("<loc>https://qblink.tech/roi</loc>");
    expect(sitemap).toContain("<loc>https://qblink.tech/chaos-to-clarity</loc>");
    expect(sitemap).toContain("<loc>https://qblink.tech/pitch</loc>");
    expect(sitemap).toContain("<loc>https://qblink.tech/affiliate</loc>");
    expect(sitemap).toContain("<loc>https://qblink.tech/install</loc>");
    expect(sitemap).toContain("<loc>https://qblink.tech/privacy</loc>");
    expect(sitemap).toContain("<loc>https://qblink.tech/terms</loc>");
    expect(sitemap).toContain("xmlns:image=");
    expect(sitemap).toContain("<image:loc>https://qblink.tech/og-image.png</image:loc>");
  });

  it("validates public/llms.txt documents founders, origin story and achievements", () => {
    const llmsPath = path.resolve(process.cwd(), "public/llms.txt");
    const llms = fs.readFileSync(llmsPath, "utf-8");

    expect(llms).toContain("Devansh");
    expect(llms).toContain("Devansh started Qblink");
    expect(llms).toContain("Mithil");
    expect(llms).toContain("Aarav");
    expect(llms).toContain("Vihan Patange");
    expect(llms).toContain("Inventure, IIT Gandhinagar");
    expect(llms).toContain("https://qblink.tech/about");
  });

  it("validates public/manifest.json contains updated brand and founders description", () => {
    const manifestPath = path.resolve(process.cwd(), "public/manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    expect(manifest.name).toContain("QBlink — Hardware-Free Virtual Queue Management");
    expect(manifest.description).toContain("Inventure · IIT Gandhinagar");
    expect(manifest.description).toContain("Started by Devansh with co-founders Mithil, Aarav, and Vihan Patange");
  });
});

describe("SEO Component & About Views Rendering", () => {
  it("renders SEO component with structured props without crashing", () => {
    const helmetContext = {};
    const { container } = render(
      <HelmetProvider context={helmetContext}>
        <SEO
          title="Test Title — Qblink"
          description="Test Description"
          path="/test"
          keywords="test, qblink"
          jsonLd={{ "@context": "https://schema.org", "@type": "Thing", name: "Test" }}
        />
      </HelmetProvider>
    );

    expect(container).toBeDefined();
  });

  it("renders AboutSection with all 4 founders and Inventure IIT Gandhinagar", () => {
    render(
      <BrowserRouter>
        <AboutSection />
      </BrowserRouter>
    );

    // Founder who started Qblink
    expect(screen.getAllByText("Devansh").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Started Qblink").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Devansh started Qblink/i)).toBeInTheDocument();

    // Co-founders
    expect(screen.getAllByText("Mithil").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Aarav").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Vihan Patange").length).toBeGreaterThanOrEqual(1);

    // Key Achievement
    expect(screen.getByText(/Incubated at Inventure · IIT Gandhinagar/i)).toBeInTheDocument();
  });

  it("renders AboutUs page with full founder story and achievements", () => {
    const helmetContext = {};
    render(
      <HelmetProvider context={helmetContext}>
        <ThemeProvider>
          <BrowserRouter>
            <AboutUs />
          </BrowserRouter>
        </ThemeProvider>
      </HelmetProvider>
    );

    // Primary Headings
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/The Story Behind Qblink/i);
    expect(screen.getByText(/How Devansh Started Qblink/i)).toBeInTheDocument();

    // Founders Listed
    expect(screen.getByRole("heading", { name: "Devansh", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mithil", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Aarav", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Vihan Patange", level: 3 })).toBeInTheDocument();

    // Recognition
    expect(screen.getAllByText(/Incubated at Inventure · IIT Gandhinagar/i).length).toBeGreaterThan(0);
  });
});
