import { useState } from "react";
import { CheckCircle2, Circle, Lock, ChevronDown, ChevronRight, BookOpen, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { CURRICULUM, MOCK_PROGRESS, type ProgressStatus, type CurriculumTrack, type Segment, type Course } from "./curriculumData";

// ─── BACKEND INTEGRATION POINT ────────────────────────────────────────────────
// Replace the props below with real data from your API:
//
//   interface RoadmapProps {
//     trackId?: string;                               // from user profile / onboarding selection
//     progress?: Record<string, ProgressStatus>;     // from GET /users/me/curriculum-progress
//     onSegmentClick?: (segmentId: string) => void;  // navigate to learning content
//   }
//
// Example wiring (TanStack Query):
//   const { data } = useQuery(['curriculum-progress'], fetchCurriculumProgress);
//   <CurriculumRoadmap progress={data?.progress} trackId={data?.trackId} />
// ──────────────────────────────────────────────────────────────────────────────

interface RoadmapProps {
  /** Active track id from user profile — pass from backend */
  trackId?: string;
  /** Per-segment progress from backend: Record<segmentId, ProgressStatus> */
  progress?: Record<string, ProgressStatus>;
  /** Called when user clicks an unlocked segment — use to navigate to content */
  onSegmentClick?: (segmentId: string) => void;
}

const statusIcon = (s: ProgressStatus) => {
  if (s === 'completed') return <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />;
  if (s === 'current')   return <Circle className="h-5 w-5 text-secondary flex-shrink-0 animate-pulse" />;
  return <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
};

const statusLabel = (s: ProgressStatus) => ({
  completed: 'Completed',
  current:   'In Progress',
  locked:    'Locked',
}[s]);

const statusBadge = (s: ProgressStatus) =>
  cn('text-[10px] font-mono px-2 py-0.5 border', {
    'bg-primary/10 text-primary border-primary/30':     s === 'completed',
    'bg-secondary/10 text-secondary border-secondary/30 animate-pulse': s === 'current',
    'bg-muted/40 text-muted-foreground border-border':  s === 'locked',
  });

const lineColor = (s: ProgressStatus) => ({
  completed: 'bg-primary',
  current:   'bg-secondary',
  locked:    'bg-border',
}[s]);

// ── Course expand/collapse ────────────────────────────────────────────────────
function CourseRow({ course, status }: { course: Course; status: ProgressStatus }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border bg-muted/20 overflow-hidden" style={{ borderRadius: '2px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium truncate">{course.title}</span>
          <span className="text-[10px] text-muted-foreground ml-1 flex-shrink-0">
            {course.topics.length} topics
          </span>
        </div>
        {open
          ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        }
      </button>

      {open && (
        <div className="px-4 pb-3 space-y-1 border-t border-border">
          {course.topics.map((topic, i) => (
            <div key={topic.id} className="flex items-start gap-3 py-1.5">
              <span className="font-mono text-[10px] text-muted-foreground mt-0.5 w-5 flex-shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={cn('text-xs leading-snug', status === 'locked' ? 'text-muted-foreground' : 'text-foreground')}>
                {topic.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Segment card ──────────────────────────────────────────────────────────────
function SegmentCard({
  segment,
  status,
  isLast,
  onSegmentClick,
}: {
  segment: Segment;
  status: ProgressStatus;
  isLast: boolean;
  onSegmentClick?: (id: string) => void;
}) {
  const [open, setOpen] = useState(status === 'current');
  const clickable = status !== 'locked';

  return (
    <div className="flex gap-4">
      {/* Timeline spine */}
      <div className="flex flex-col items-center flex-shrink-0 w-6">
        <div className={cn('h-5 w-5 rounded-full border-2 flex items-center justify-center mt-1', {
          'border-primary bg-primary/20':   status === 'completed',
          'border-secondary bg-secondary/20': status === 'current',
          'border-border bg-muted':         status === 'locked',
        })}>
          {status === 'completed' && <div className="h-2 w-2 rounded-full bg-primary" />}
          {status === 'current'   && <div className="h-2 w-2 rounded-full bg-secondary animate-pulse" />}
          {status === 'locked'    && <div className="h-1.5 w-1.5 rounded-full bg-border" />}
        </div>
        {!isLast && <div className={cn('w-0.5 flex-1 mt-1', lineColor(status))} />}
      </div>

      {/* Card */}
      <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
        <div className={cn(
          'glass-panel overflow-hidden transition-all',
          clickable ? 'cursor-pointer hover:border-primary/40' : 'opacity-60',
        )}>
          {/* Header */}
          <button
            className="w-full flex items-start justify-between p-4 text-left"
            onClick={() => clickable && setOpen(o => !o)}
            disabled={!clickable}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5">{statusIcon(status)}</div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className={cn('text-[10px] font-mono px-2 py-0.5 border', statusBadge(status))}>
                    {statusLabel(status)}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">{segment.weeks}</span>
                </div>
                <h3 className="font-mono text-sm font-semibold leading-snug">{segment.label}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {segment.courses.length} {segment.courses.length === 1 ? 'course' : 'courses'} ·{' '}
                  {segment.courses.reduce((n, c) => n + c.topics.length, 0)} topics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {status === 'current' && onSegmentClick && (
                <button
                  onClick={(e) => { e.stopPropagation(); onSegmentClick(segment.id); }}
                  className="text-[11px] font-mono px-3 py-1 bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity"
                  style={{ borderRadius: '2px' }}
                >
                  Continue →
                </button>
              )}
              {clickable && (
                open
                  ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  : <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {/* Courses */}
          {open && clickable && (
            <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
              {segment.courses.map(course => (
                <CourseRow key={course.id} course={course} status={status} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Track view ────────────────────────────────────────────────────────────────
function TrackView({
  track,
  progress,
  onSegmentClick,
}: {
  track: CurriculumTrack;
  progress: Record<string, ProgressStatus>;
  onSegmentClick?: (id: string) => void;
}) {
  const completedCount = track.segments.filter(s => progress[s.id] === 'completed').length;
  const pct = Math.round((completedCount / track.segments.length) * 100);

  return (
    <div>
      {/* Track progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs text-muted-foreground font-mono">Prerequisite: </span>
            <span className="text-xs text-foreground font-mono">{track.prereq}</span>
          </div>
          <span className="text-xs font-mono text-primary">{pct}% complete</span>
        </div>
        <div className="h-1 bg-muted w-full" style={{ borderRadius: '1px' }}>
          <div
            className="h-full bg-primary transition-all duration-700"
            style={{ width: `${pct}%`, borderRadius: '1px' }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-muted-foreground font-mono">{completedCount}/{track.segments.length} segments</span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {track.segments.reduce((n, s) => n + s.courses.reduce((m, c) => m + c.topics.length, 0), 0)} total topics
          </span>
        </div>
      </div>

      {/* Segment timeline */}
      <div>
        {track.segments.map((seg, i) => (
          <SegmentCard
            key={seg.id}
            segment={seg}
            status={progress[seg.id] ?? 'locked'}
            isLast={i === track.segments.length - 1}
            onSegmentClick={onSegmentClick}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function CurriculumRoadmap({
  trackId,
  progress = MOCK_PROGRESS,
  onSegmentClick,
}: RoadmapProps) {
  const defaultTrack = CURRICULUM.find(t => t.id === trackId) ?? CURRICULUM[0];
  const [activeTrack, setActiveTrack] = useState<CurriculumTrack>(defaultTrack);

  return (
    <div className="glass-panel p-6" style={{ borderRadius: '2px' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-8 bg-primary/15 text-primary grid place-items-center" style={{ borderRadius: '2px' }}>
          <Layers className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-mono text-base font-semibold">AI Engineering Curriculum</h2>
          <p className="text-xs text-muted-foreground font-mono">Your personalised learning roadmap</p>
        </div>
      </div>

      {/* Track tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-border pb-4">
        {CURRICULUM.map(track => (
          <button
            key={track.id}
            onClick={() => setActiveTrack(track)}
            className={cn(
              'px-3 py-1.5 text-xs font-mono border transition-all',
              activeTrack.id === track.id
                ? 'bg-primary/15 text-primary border-primary/50'
                : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/30 hover:text-foreground',
            )}
            style={{ borderRadius: '2px' }}
          >
            {track.label}
          </button>
        ))}
      </div>

      {/* Track content */}
      <TrackView
        key={activeTrack.id}
        track={activeTrack}
        progress={progress}
        onSegmentClick={onSegmentClick}
      />

      {/* Backend note for devs */}
      <div className="mt-6 p-3 border border-border bg-muted/20 text-[10px] font-mono text-muted-foreground" style={{ borderRadius: '2px' }}>
        <span className="text-primary">// BACKEND:</span> wire progress via{' '}
        <span className="text-secondary">GET /users/me/curriculum-progress</span> →{' '}
        <span className="text-accent">{'{ trackId, progress: Record<segmentId, ProgressStatus> }'}</span>
      </div>
    </div>
  );
}
