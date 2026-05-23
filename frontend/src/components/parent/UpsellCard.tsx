import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function UpsellCard() {
  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary to-secondary p-6 text-white">
      <div className="relative z-10 max-w-md">
        <p className="text-sm font-medium text-white/80">AI remediation</p>
        <h3 className="mt-2 text-xl font-bold">
          Unlock Personalized Practice Sets for ₹99
        </h3>
        <p className="mt-2 text-sm text-white/90">
          Deep AI-generated remediation sets tailored to your child&apos;s weak topics — Cells,
          Fractions, and more.
        </p>
        <Button
          variant="outline"
          className="mt-4 border-white/40 bg-white/10 text-white hover:bg-white/20"
        >
          <Sparkles className="h-4 w-4" /> Upgrade now
        </Button>
      </div>
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
    </Card>
  );
}
