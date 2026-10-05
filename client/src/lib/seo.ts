// ============================================================
// Site SEO constants — Margaritas Tacos (Island Park, NY)
// ============================================================

export const SITE_ORIGIN = "https://margaritastacos.com";
export const SITE_NAME = "Margaritas Tacos";
export const SITE_PHONE_DISPLAY = "(516) 432-2119";
export const SITE_PHONE_E164 = "+15164322119";
export const SITE_STREET = "4549 Austin Boulevard";
export const SITE_CITY = "Island Park";
export const SITE_REGION = "NY";
export const SITE_POSTAL = "11558";
export const SITE_COUNTRY = "US";
/** Approximate pin for 4549 Austin Blvd, Island Park, NY — refine via Google Maps if needed */
export const SITE_LAT = 40.6064;
export const SITE_LNG = -73.6536;
export const OG_IMAGE_PATH = "/images/og-margaritas-tacos.jpg";
export const OG_IMAGE_URL = `${SITE_ORIGIN}${OG_IMAGE_PATH}`;
export const MENU_URL = `${SITE_ORIGIN}/order`;
export const UBER_EATS_URL =
  "https://www.ubereats.com/store/margaritas-tacoss/hMKOxS3gQ-KJ2vtTZcXFTg?diningMode=DELIVERY&ps=1";

export type PageSeo = {
  path: string;
  title: string;
  description: string;
  /** og:type — home uses restaurant, others website */
  ogType?: "restaurant" | "website";
  noindex?: boolean;
};

export const PAGE_SEO: Record<string, PageSeo> = {
  "/": {
    path: "/",
    title: "Margaritas Tacos | Mexican Restaurant in Island Park, NY",
    description:
      "Authentic Mexican street food in Island Park, NY. Tacos, burritos, nachos, quesadillas & more. Dine-in, takeout & delivery. Call (516) 432-2119.",
    ogType: "restaurant",
  },
  "/order": {
    path: "/order",
    title: "Order Online | Margaritas Tacos Menu — Island Park, NY",
    description:
      "Order Mexican street tacos, burritos, taquitos, nachos, quesadillas & more online for pickup at Margaritas Tacos in Island Park, NY.",
    ogType: "website",
  },
  "/checkout": {
    path: "/checkout",
    title: "Checkout | Margaritas Tacos — Island Park, NY",
    description:
      "Complete your Margaritas Tacos pickup order. Authentic Mexican street food in Island Park, NY.",
    ogType: "website",
    noindex: true,
  },
  "/404": {
    path: "/404",
    title: "Page Not Found | Margaritas Tacos",
    description: "The page you requested was not found. Visit Margaritas Tacos in Island Park, NY.",
    ogType: "website",
    noindex: true,
  },
  "/admin": {
    path: "/admin",
    title: "Admin | Margaritas Tacos",
    description: "Restaurant admin dashboard.",
    ogType: "website",
    noindex: true,
  },
  "/test-order": {
    path: "/test-order",
    title: "Test Order | Margaritas Tacos",
    description: "Internal test order tool.",
    ogType: "website",
    noindex: true,
  },
  "/receipt-preview": {
    path: "/receipt-preview",
    title: "Receipt Preview | Margaritas Tacos",
    description: "Internal receipt layout preview.",
    ogType: "website",
    noindex: true,
  },
};

export function absoluteUrl(path: string): string {
  if (!path || path === "/") return `${SITE_ORIGIN}/`;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${p}`;
}

export function getPageSeo(pathname: string): PageSeo {
  if (pathname.startsWith("/admin")) return PAGE_SEO["/admin"];
  return PAGE_SEO[pathname] ?? PAGE_SEO["/404"];
}

/** LocalBusiness / Restaurant JSON-LD for schema.org */
export function buildRestaurantJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${SITE_ORIGIN}/#restaurant`,
    name: SITE_NAME,
    url: SITE_ORIGIN,
    telephone: SITE_PHONE_E164,
    image: [OG_IMAGE_URL, `${SITE_ORIGIN}/images/quesadilla.png`],
    servesCuisine: "Mexican",
    priceRange: "$$",
    acceptsReservations: false,
    menu: MENU_URL,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_STREET,
      addressLocality: SITE_CITY,
      addressRegion: SITE_REGION,
      postalCode: SITE_POSTAL,
      addressCountry: SITE_COUNTRY,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: SITE_LAT,
      longitude: SITE_LNG,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Sunday"],
        opens: "14:00",
        closes: "21:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Friday", "Saturday"],
        opens: "14:00",
        closes: "22:00",
      },
    ],
    sameAs: [UBER_EATS_URL],
  };
}
