import { useCallback, useEffect, useRef, useState } from 'react';
import { getAiGenerationTask } from '@/api/ai-generation.api';
import { logApiError } from '@/api/client';
import type { AiGenerationStatus, AiGenerationTaskStatus } from '@/types/quiz';

interface UseAiGenerationPollOptions {
  intervalMs?: number;
  maxAttempts?: number;
  onCompleted?: (task: AiGenerationTaskStatus) => void;
  onFailed?: (task: AiGenerationTaskStatus) => void;
}

export function useAiGenerationPoll({
  intervalMs = 1500,
  maxAttempts = 60,
  onCompleted,
  onFailed,
}: UseAiGenerationPollOptions = {}) {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<AiGenerationStatus | 'idle'>('idle');
  const [task, setTask] = useState<AiGenerationTaskStatus | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const attemptsRef = useRef(0);

  const startPolling = useCallback((id: string) => {
    setTaskId(id);
    setStatus('PENDING');
    setProgress(5);
    setError(null);
    attemptsRef.current = 0;
  }, []);

  const reset = useCallback(() => {
    setTaskId(null);
    setStatus('idle');
    setTask(null);
    setProgress(0);
    setError(null);
    attemptsRef.current = 0;
  }, []);

  useEffect(() => {
    if (!taskId || status === 'COMPLETED' || status === 'FAILED' || status === 'idle') {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (cancelled) return;
      attemptsRef.current += 1;

      try {
        const result = await getAiGenerationTask(taskId);
        if (cancelled) return;

        setTask(result);
        setStatus(result.status);

        const pct = Math.min(
          95,
          Math.round((result.completedCount / Math.max(result.requestedCount, 1)) * 100),
        );
        setProgress(
          result.status === 'PROCESSING' ? Math.max(pct, 15) : result.status === 'PENDING' ? 10 : 100,
        );

        if (result.status === 'COMPLETED') {
          setProgress(100);
          onCompleted?.(result);
          return;
        }
        if (result.status === 'FAILED') {
          setError(result.errorMessage ?? 'AI generation failed');
          onFailed?.(result);
          return;
        }
        if (attemptsRef.current >= maxAttempts) {
          setError('Generation timed out. Please try again.');
          setStatus('FAILED');
          return;
        }

        timer = setTimeout(poll, intervalMs);
      } catch (err) {
        logApiError('AI generation poll failed', err);
        if (!cancelled) {
          setError('Could not reach status endpoint.');
          setStatus('FAILED');
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [taskId, status, intervalMs, maxAttempts, onCompleted, onFailed]);

  return {
    taskId,
    status,
    task,
    progress,
    error,
    isPolling: status === 'PENDING' || status === 'PROCESSING',
    startPolling,
    reset,
  };
}
