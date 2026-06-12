import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BookOpenCheck,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';

export interface LandingFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const LANDING_FEATURES: LandingFeature[] = [
  {
    icon: BookOpenCheck,
    title: 'Curriculum-aligned quizzes',
    description:
      'Teachers publish quizzes by grade and subject. Students receive immediate feedback, so misconceptions can be addressed early.',
  },
  {
    icon: Trophy,
    title: 'Motivation that stays healthy',
    description:
      'XP, streaks, and school-scoped leaderboards reward consistent practice while keeping competition within your school community.',
  },
  {
    icon: BarChart3,
    title: 'Analytics you can act on',
    description:
      'Review accuracy, participation, and trends by grade, subject, and quiz creator. Use the results to plan your next lesson with confidence.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure multi-tenant design',
    description:
      'Each school operates in its own space. Roles and permissions are enforced on every request to protect student data.',
  },
];

export const LANDING_STEPS = [
  {
    step: '1',
    title: 'Connect with your school',
    body: 'Students and parents select their school at signup. Students enter a parent email; parents register with that same email to connect automatically. Teachers join with their school email.',
  },
  {
    step: '2',
    title: 'Learn through quizzes',
    body: 'Students complete assigned quizzes, earn XP, and build streaks. Teachers can add AI-assisted questions when they need more content.',
  },
  {
    step: '3',
    title: 'Measure progress together',
    body: 'Students track their growth. Teachers and administrators review results by grade. Parents follow progress for linked children.',
  },
] as const;

export const LANDING_AUDIENCES = [
  {
    icon: Sparkles,
    title: 'Students',
    description:
      'Practice with clear feedback, build confidence, and see improvement over time.',
  },
  {
    icon: Users,
    title: 'Teachers',
    description:
      'Create and assign quizzes, monitor accuracy by grade, and focus reteaching where it matters most.',
  },
  {
    icon: GraduationCap,
    title: 'Parents',
    description:
      'Follow linked children at home with progress views you can discuss as a family.',
  },
  {
    icon: ShieldCheck,
    title: 'School administrators',
    description:
      'Manage users, grades, and academics from one secure, school-scoped portal.',
  },
] as const;

export const LANDING_HERO_HIGHLIGHTS = [
  'Immediate feedback on every question',
  'School-wide leaderboards and progress tracking',
  'Dashboards for students, teachers, parents, and school administrators',
] as const;

export const LANDING_COMMUNITY_SUMMARY =
  'Students stay engaged with structured practice. Teachers spend less time guessing which students need support. Parents see progress they can discuss at home. School administrators manage users, grades, and academics from one secure portal.';
