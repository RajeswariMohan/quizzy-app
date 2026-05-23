import { Card, CardTitle } from '@/components/ui/Card';
import { ClassBarChart } from '@/components/charts/ClassBarChart';
import { PerformanceLineChart } from '@/components/charts/PerformanceLineChart';
import { ActivityTimeline } from '@/components/parent/ActivityTimeline';
import { UpsellCard } from '@/components/parent/UpsellCard';
import { useNotificationStore } from '@/store/notificationStore';
import { useEffect } from 'react';
import type { ActivityEvent, ChartPoint } from '@/types/dashboard';

const SUBJECT_SCORES: ChartPoint[] = [
  { label: 'Science', value: 82 },
  { label: 'Maths', value: 74 },
  { label: 'English', value: 88 },
  { label: 'SST', value: 70 },
];

const ACCURACY_TREND: ChartPoint[] = [
  { label: 'W1', value: 65 },
  { label: 'W2', value: 70 },
  { label: 'W3', value: 74 },
  { label: 'W4', value: 78 },
];

const DEFAULT_ACTIVITY: ActivityEvent[] = [
  {
    id: '1',
    title: 'Aarav scored 18/20',
    description: 'Photosynthesis quiz — above class average',
    timestamp: 'Today · 09:15 AM',
    type: 'score',
  },
  {
    id: '2',
    title: 'Completed quiz on Cells',
    description: 'Finished in 12 minutes with 85% accuracy',
    timestamp: 'Yesterday · 4:30 PM',
    type: 'quiz',
  },
  {
    id: '3',
    title: 'Earned badge: Science Star',
    description: 'Maintained 90%+ in Science for 3 quizzes',
    timestamp: 'Mon · 6:00 PM',
    type: 'badge',
  },
  {
    id: '4',
    title: 'Teacher note',
    description: 'Great improvement in Life Processes — keep practicing Fractions',
    timestamp: 'Sun · 11:00 AM',
    type: 'alert',
  },
];

export function ParentDashboard() {
  const { activityFeed, setActivityFeed } = useNotificationStore();

  useEffect(() => {
    if (activityFeed.length === 0) {
      setActivityFeed(DEFAULT_ACTIVITY);
    }
  }, [activityFeed.length, setActivityFeed]);

  const events = activityFeed.length > 0 ? activityFeed : DEFAULT_ACTIVITY;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Parent insights</h1>
        <p className="text-muted">Aarav&apos;s learning journey · This week</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="!p-4">
          <p className="text-sm text-muted">Overall accuracy</p>
          <p className="text-2xl font-bold text-primary">78%</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-muted">Quizzes this week</p>
          <p className="text-2xl font-bold">4</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-muted">Active streak</p>
          <p className="text-2xl font-bold text-warning">6 days</p>
        </Card>
      </div>

      <UpsellCard />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Subject comparison</CardTitle>
          <ClassBarChart data={SUBJECT_SCORES} />
        </Card>
        <Card>
          <CardTitle>Accuracy trend (Science)</CardTitle>
          <PerformanceLineChart data={ACCURACY_TREND} />
          <div className="mt-4 space-y-2">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Cells</span>
                <span>85%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div className="h-full w-[85%] rounded-full bg-success" />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Fractions</span>
                <span>54%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div className="h-full w-[54%] rounded-full bg-warning" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <ActivityTimeline events={events} />
    </div>
  );
}
