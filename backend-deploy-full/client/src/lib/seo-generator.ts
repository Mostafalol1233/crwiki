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
  // Pattern: [Event Name] - [Event Type] | CrossFire Wiki
  const title = `${eventName} - ${eventType} | CrossFire Wiki`;

  // 3. Generate meta description (max 160 chars)
  // Pattern: [Event Name] is live! Join from [Start] to [End] to earn [Rewards]. [Short Snippet]
  let meta_description = `${eventName} is live! Earn ${rewards} from ${startDate} to ${endDate}. ${description}`;
  if (meta_description.length > 157) {
    meta_description = meta_description.substring(0, 157) + "...";
  }

  // 4. Open Graph Tags
  const og = {
    title: title,
    description: meta_description,
    image: imageUrl || "https://crossfire.wiki/favicon.png",
    url: `https://crossfire.wiki/events/${slug}`
  };

  // 5. Twitter Card
  const twitter = {
    card: "summary_large_image",
    title: title,
    description: meta_description,
    image: imageUrl || "https://crossfire.wiki/favicon.png"
  };

  // 6. Hero Description
  // A punchy, exciting description for the hero section
  const hero_description = `Get ready for ${eventName}! Dive into CrossFire between ${startDate} and ${endDate} to claim exclusive rewards like ${rewards}. Don't miss out on this limited-time ${eventType.toLowerCase()}!`;

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
    data.rewards || "exclusive items",
    data.description || "",
    data.image || ""
  );
}
