/**
 * Centralised site configuration.
 * Update values here — Footer, Contact, About and any other page
 * import from this single source of truth.
 */

export const SITE_CONFIG = {
  name: "CrossFire Wiki",
  url: "https://crossfire.wiki",
  contactEmail: "contact@crossfire.wiki",

  socials: {
    whatsapp:  "https://whatsapp.com/channel/0029Vb6jrI44yltQQfvkg41o",
    facebook:  "https://www.facebook.com/crossfireonline",
    twitter:   "https://x.com/CrossFireOnline",
    youtube:   "https://www.youtube.com/c/CrossFireWest",
    discord:   "https://discord.gg/7AbuDrNNJM",
    instagram: "https://www.instagram.com/crossfirewest/",
    twitch:    "https://www.twitch.tv/cfonline/",
  },
} as const;

export type SiteConfig = typeof SITE_CONFIG;
