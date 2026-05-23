import { Bell, BookOpen, Star, Trophy } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import type { ActivityEvent } from '@/types/dashboard';

const ICONS = {
  quiz: BookOpen,
  badge: Star,
  score: Trophy,
  alert: Bell,
};

interface ActivityTimelineProps {
  events: ActivityEvent[];
}

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  return (
    <Card>
      <CardTitle>Alerts & activity</CardTitle>
      <ul className="mt-4 space-y-4">
        {events.map((event) => {
          const Icon = ICONS[event.type];
          return (
            <li key={event.id} className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 border-b border-gray-100 pb-4">
                <p className="font-medium text-ink">{event.title}</p>
                <p className="text-sm text-muted">{event.description}</p>
                <p className="mt-1 text-xs text-muted">{event.timestamp}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
