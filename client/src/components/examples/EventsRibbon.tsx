import { EventsRibbon } from "../EventsRibbon";

export default function EventsRibbonExample() {
  const events = [
    { id: "1", title: "New React 19 Features Released", date: "Jan 20", type: "upcoming" as const },
    { id: "2", title: "TypeScript 5.4 Beta Available", date: "Jan 18", type: "trending" as const },
    { id: "3", title: "Web Dev Conference 2025", date: "Feb 5", type: "upcoming" as const },
    { id: "4", title: "AI Tools for Developers", date: "Trending", type: "trending" as const },
  ];

  return <EventsRibbon events={events} />;
}
