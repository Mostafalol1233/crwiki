import { type Event } from "../../../shared/mongodb-schema";

interface EventSEO {
  slug: string;
  title: string;
  meta_description: string;
  og: {
    title: string;
    description: string;
    image: string;
    url: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image: string;
  };
  hero_description: string;
}

/**
 * Generates SEO metadata for a CrossFire event.
 * @param eventName The name of the event.
 * @param eventType The type of event (e.g., "Login Event", "Playtime Event").
 * @param startDate Start date string.
 * @param endDate End date string.
 * @param rewards List of rewards or description of rewards.
 * @param description Short description of the event.
 * @param imageUrl URL of the event image.
 * @returns Formatted JSON object with SEO metadata.
 */
export function generateEventSEO(
  eventName: string,
  eventType: string,
  startDate: string,
  endDate: string,
  rewards: string,
  description: string,
  imageUrl: string
): EventSEO {
  // 1. Generate SEO-friendly URL slug
  const slug = eventName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

  // 2. Generate optimized title
  // Pattern: [Event Name] | [Event Type] | CrossFire Wiki
  const title = `${eventName} | ${eventType} | CrossFire Wiki`;

  // 3. Generate a neutral meta description (max 160 chars)
  // Dates and reward information are presented as recorded event data; the page itself determines whether the event is currently active.
  const detail = description.trim();
  let meta_description = `${eventName} was listed as a ${eventType.toLowerCase()} from ${startDate} to ${endDate}. Rewards: ${rewards}.${detail ? ` ${detail}` : ""}`;
  if (meta_description.length > 157) {
    meta_description = meta_description.substring(0, 157).replace(/\s+\S*$/, "") + "...";
  }

  // 4. Open Graph Tags
  const og = {
    title: title,
    description: meta_description,
    image: imageUrl || "https://crossfire.wiki/logo-new.png",
    url: `https://crossfire.wiki/events/${slug}`
  };

  // 5. Twitter Card
  const twitter = {
    card: "summary_large_image",
    title: title,
    description: meta_description,
    image: imageUrl || "https://crossfire.wiki/logo-new.png"
  };

  // 6. Hero Description
  // Keep the hero useful for readers and accurate for both live and archived events.
  const hero_description = `${eventName} is recorded as a ${eventType.toLowerCase()} running from ${startDate} to ${endDate}. Listed rewards: ${rewards}.`;

  return {
    slug,
    title,
    meta_description,
    og,
    twitter,
    hero_description
  };
}

// Example usage helper
export function generateEventSEOFromData(data: Partial<Event> & { eventName?: string; eventType?: string; rewards?: string }) {
  return generateEventSEO(
    data.title || data.eventName || "Untitled Event",
    data.type || data.eventType || "Event",
    data.startDate ? new Date(data.startDate).toLocaleDateString() : "TBA",
    data.endDate ? new Date(data.endDate).toLocaleDateString() : "TBA",
    data.rewards || "not specified",
    data.description || "",
    data.image || ""
  );
}
