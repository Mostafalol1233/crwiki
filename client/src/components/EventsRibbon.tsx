import { Calendar, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export interface Event {
  id: string;
  title: string;
  date: string;
  type: "upcoming" | "trending";
}

interface EventsRibbonProps {
  events: Event[];
}

export function EventsRibbon({ events }: EventsRibbonProps) {
  return (
    <div className="w-full bg-card border-y py-4 md:py-6">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center min-h-20 md:min-h-24 overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-6">
          {events.map((event) => (
            <Link 
              key={event.id} 
              href={`/events/${event.id}`}
              className="flex items-center gap-4 flex-shrink-0 snap-start hover-elevate active-elevate-2 px-6 py-4 rounded-lg transition-all bg-muted/50 hover:bg-muted border border-border"
              data-testid={`link-event-${event.id}`}
            >
              <div className="flex-shrink-0">
                {event.type === "upcoming" ? (
                  <Calendar className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                ) : (
                  <TrendingUp className="h-6 w-6 md:h-7 md:w-7 text-destructive" />
                )}
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <span className="text-base md:text-lg font-semibold whitespace-nowrap">
                  {event.title}
                </span>
                <Badge variant="outline" className="text-sm whitespace-nowrap w-fit">
                  {event.date}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
