import { LeaderboardPanel } from '@/components/student/LeaderboardPanel';

export function StudentLeaderboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Leaderboard</h1>
        <p className="text-muted">See how you rank against classmates at your school</p>
      </div>
      <LeaderboardPanel fullPage />
    </div>
  );
}
