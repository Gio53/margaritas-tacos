import { Helmet } from "react-helmet-async";
import {
  OG_IMAGE_URL,
  SITE_NAME,
  absoluteUrl,
  buildRestaurantJsonLd,
  getPageSeo,
} from "@/lib/seo";

type SeoHeadProps = {
  /** Pathname e.g. "/" or "/order" */
  path: string;
  /** Optional overrides */
  title?: string;
  description?: string;
};

/**
 * Per-route title, description, canonical, Open Graph, Twitter, and Restaurant JSON-LD.
 */
export default function SeoHead({ path, title, description }: SeoHeadProps) {
  const page = getPageSeo(path);
  const pageTitle = title ?? page.title;
  const pageDescription = description ?? page.description;
  const canonical = absoluteUrl(page.path === "/404" ? "/404" : path.startsWith("/admin") ? "/admin" : page.path);
  const ogType = page.ogType ?? "website";
  const jsonLd = buildRestaurantJsonLd();

  return (
    <Helmet>
      <html lang="en" />
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={canonical} />
      {page.noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={OG_IMAGE_URL} />
      <meta property="og:image:alt" content={`${SITE_NAME} — Mexican street food in Island Park, NY`} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={OG_IMAGE_URL} />

      <script type="application/ld+json">{`
        ${JSON.stringify(jsonLd)}
      `}</script>
    </Helmet>
  );
}
