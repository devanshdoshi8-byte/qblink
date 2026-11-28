import { Helmet } from "react-helmet-async";

const BASE = "https://qblink.tech";
const DEFAULT_IMAGE = "https://qblink.tech/og-image.png";
const DEFAULT_KEYWORDS =
  "QBlink, Qblink, Q-blink, Qblink Tech, qblink.tech, Devansh, Devansh Doshi, Mithil, Aarav, Vihan Patange, Inventure IIT Gandhinagar, customer flow intelligence, virtual queue management, queue system, waitlist management, token system, wait time tracker";
const DEFAULT_AUTHOR = "Devansh (Founder & Creator), Mithil, Aarav, Vihan Patange — Qblink";

export interface SEOProps {
  title: string;
  description?: string;
  path?: string;
  type?: "website" | "article" | "profile";
  keywords?: string;
  image?: string;
  author?: string;
  noindex?: boolean;
  jsonLd?: object | object[];
}

const SEO = ({
  title,
  description,
  path = "/",
  type = "website",
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_IMAGE,
  author = DEFAULT_AUTHOR,
  noindex = false,
  jsonLd,
}: SEOProps) => {
  const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const resolvedImage = image.startsWith("http") ? image : `${BASE}${image}`;

  return (
    <Helmet>
      {/* Title & Core Meta */}
      <title>{title}</title>
      <meta name="title" content={title} />
      {description && <meta name="description" content={description} />}
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta
        name="robots"
        content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"}
      />

      {/* Canonical & Alternates */}
      <link rel="canonical" href={url} />
      <link rel="alternate" hrefLang="en" href={url} />
      <link rel="alternate" hrefLang="x-default" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:site_name" content="Qblink" />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={resolvedImage} />
      <meta property="og:image:secure_url" content={resolvedImage} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1216" />
      <meta property="og:image:height" content="640" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="en_IN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@qblinktech" />
      <meta name="twitter:creator" content="@qblinktech" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={resolvedImage} />

      {/* Structured Data (Schema.org) */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};

export default SEO;