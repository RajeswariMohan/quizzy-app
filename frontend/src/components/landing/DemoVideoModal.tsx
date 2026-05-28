import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Play, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PUBLIC_SITE } from '@/config/publicSite';
import {
  clearDemoVideoBlob,
  loadDemoVideoBlob,
  saveDemoVideoBlob,
} from '@/utils/demoVideoStorage';

interface DemoVideoModalProps {
  open: boolean;
  onClose: () => void;
}

const ACCEPTED_TYPES = 'video/mp4,video/webm,video/ogg';

export function DemoVideoModal({ open, onClose }: DemoVideoModalProps) {
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [sourceLabel, setSourceLabel] = useState<'hosted' | 'uploaded' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const revokeIfBlob = useCallback((src: string | null) => {
    if (src?.startsWith('blob:')) {
      URL.revokeObjectURL(src);
    }
  }, []);

  const applyBlobSource = useCallback(
    (blob: Blob, label: 'hosted' | 'uploaded') => {
      setVideoSrc((prev) => {
        revokeIfBlob(prev);
        return URL.createObjectURL(blob);
      });
      setSourceLabel(label);
    },
    [revokeIfBlob],
  );

  const applyUrlSource = useCallback(
    (url: string) => {
      setVideoSrc((prev) => {
        revokeIfBlob(prev);
        return url;
      });
      setSourceLabel('hosted');
    },
    [revokeIfBlob],
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const load = async () => {
      try {
        const uploaded = await loadDemoVideoBlob();
        if (cancelled) return;
        if (uploaded) {
          applyBlobSource(uploaded, 'uploaded');
          return;
        }
        if (PUBLIC_SITE.demoVideoUrl) {
          applyUrlSource(PUBLIC_SITE.demoVideoUrl);
        }
      } catch {
        if (!cancelled && PUBLIC_SITE.demoVideoUrl) {
          applyUrlSource(PUBLIC_SITE.demoVideoUrl);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [open, applyBlobSource, applyUrlSource]);

  useEffect(() => {
    if (open) return;
    setVideoSrc((prev) => {
      revokeIfBlob(prev);
      return null;
    });
    setSourceLabel(null);
    setUploadError(null);
  }, [open, revokeIfBlob]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setUploadError('Please choose a video file (MP4, WebM, or OGG).');
      return;
    }

    const maxMb = 80;
    if (file.size > maxMb * 1024 * 1024) {
      setUploadError(`Video must be ${maxMb} MB or smaller for browser storage.`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      await saveDemoVideoBlob(file);
      applyBlobSource(file, 'uploaded');
    } catch {
      setUploadError('Could not save the video. Try a smaller file or use a hosted URL in settings.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveUpload = async () => {
    setIsUploading(true);
    setUploadError(null);
    try {
      await clearDemoVideoBlob();
      revokeIfBlob(videoSrc);
      if (PUBLIC_SITE.demoVideoUrl) {
        applyUrlSource(PUBLIC_SITE.demoVideoUrl);
      } else {
        setVideoSrc(null);
        setSourceLabel(null);
      }
    } catch {
      setUploadError('Could not remove the uploaded video.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-ink">
              How to use {PUBLIC_SITE.productName}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Watch a short walkthrough on signing in, taking quizzes, and reviewing progress.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted transition hover:bg-gray-100 hover:text-ink"
            aria-label="Close demo"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 sm:px-6">
          <div className="aspect-video overflow-hidden rounded-xl bg-ink/5">
            {videoSrc ? (
              <video
                key={videoSrc}
                src={videoSrc}
                controls
                playsInline
                className="h-full w-full bg-black object-contain"
              >
                <track kind="captions" />
              </video>
            ) : (
              <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 p-6 text-center">
                <Play className="h-10 w-10 text-primary/40" aria-hidden />
                <p className="text-sm text-muted">
                  No demo video is available yet. Upload one below, or set{' '}
                  <code className="rounded bg-gray-100 px-1 text-xs">VITE_DEMO_VIDEO_URL</code> in
                  your deployment environment.
                </p>
              </div>
            )}
          </div>

          {sourceLabel === 'uploaded' && (
            <p className="mt-2 text-xs text-muted">
              Showing your uploaded demo (saved in this browser only).
            </p>
          )}

          <div className="mt-5 rounded-xl border border-dashed border-gray-200 bg-surface/80 p-4">
            <p className="text-sm font-medium text-ink">Upload product demo</p>
            <p className="mt-1 text-xs text-muted">
              MP4 or WebM, up to 80 MB. The video is stored in this browser only and is visible on
              this device.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                className="sr-only"
                onChange={(e) => void handleFileChange(e)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" aria-hidden />
                {isUploading ? 'Saving…' : 'Choose video file'}
              </Button>
              {sourceLabel === 'uploaded' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => void handleRemoveUpload()}
                >
                  Remove upload
                </Button>
              )}
            </div>
            {uploadError && (
              <p className="mt-2 text-sm text-danger" role="alert">
                {uploadError}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <Button type="button" className="w-full sm:w-auto" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
