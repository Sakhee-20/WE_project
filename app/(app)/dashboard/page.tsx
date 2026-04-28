import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/prisma/active-filters";
import { formatBytes } from "@/lib/format-bytes";
import {
  CARD_PADDING_BLOCK,
  CARD_PADDING_ROW,
} from "@/lib/card-classes";
import { estimateUserStorageBytes } from "@/lib/dashboard/storage-estimate";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  BookMarked,
  Clock,
  FolderOpen,
  HardDrive,
  Layers,
  StickyNote,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { SubjectEmptyCta } from "@/components/ui/subject-empty-cta";
import {
  IllustrationEmptyNotes,
} from "@/components/ui/notion-empty-illustrations";

function quotaBytesFromEnv(): number {
  const mb = Number(process.env.NEXT_PUBLIC_STORAGE_QUOTA_MB || "100");
  if (!Number.isFinite(mb) || mb <= 0) return 100 * 1024 * 1024;
  return Math.round(mb * 1024 * 1024);
}

const DASHBOARD_CARD_SURFACE =
  "rounded-2xl border border-zinc-200/80 bg-white/90 backdrop-blur-sm shadow-[0_18px_40px_-24px_rgba(30,60,140,0.35)] transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:border-zinc-300/85 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 motion-safe:hover:-translate-y-[2px] motion-safe:hover:shadow-[0_24px_48px_-26px_rgba(120,90,255,0.35)] motion-reduce:hover:translate-y-0";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const quotaBytes = quotaBytesFromEnv();

  const [
    subjectCount,
    chapterCount,
    noteCount,
    shareLinkCount,
    storage,
    recentSubjects,
    recentOpens,
  ] = await Promise.all([
    prisma.subject.count({ where: { userId, ...notDeleted } }),
    prisma.chapter.count({
      where: { ...notDeleted, subject: { userId, ...notDeleted } },
    }),
    prisma.note.count({
      where: {
        ...notDeleted,
        chapter: {
          ...notDeleted,
          subject: { userId, ...notDeleted },
        },
      },
    }),
    prisma.noteShare.count({
      where: {
        note: {
          ...notDeleted,
          chapter: {
            ...notDeleted,
            subject: { userId, ...notDeleted },
          },
        },
      },
    }),
    estimateUserStorageBytes(userId),
    prisma.subject.findMany({
      where: { userId, ...notDeleted },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        description: true,
        chapters: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
    }),
    prisma.noteOpen.findMany({
      where: {
        userId,
        note: {
          ...notDeleted,
          chapter: {
            ...notDeleted,
            subject: { userId, ...notDeleted },
          },
        },
      },
      orderBy: { openedAt: "desc" },
      take: 12,
      include: {
        note: {
          select: {
            id: true,
            title: true,
            chapter: {
              select: {
                title: true,
                subject: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const used = storage.totalBytes;
  const pct = Math.min(100, Math.round((used / quotaBytes) * 100));
  const isHigh = pct >= 85;

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden sm:space-y-8 md:space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Welcome back
          {session!.user.name ? (
            <span className="text-zinc-600 dark:text-zinc-400">
              , {session!.user.name}
            </span>
          ) : null}
        </h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          Overview of your workspace, storage, and quick entry points.
        </p>
      </div>

      {/* Stats */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Statistics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={StickyNote}
            label="Notes"
            value={noteCount}
            hint="Across all chapters"
          />
          <StatCard
            icon={FolderOpen}
            label="Subjects"
            value={subjectCount}
            hint="Top-level courses"
          />
          <StatCard
            icon={Layers}
            label="Chapters"
            value={chapterCount}
            hint="Inside your subjects"
          />
          <StatCard
            icon={BookMarked}
            label="Share links"
            value={shareLinkCount}
            hint="Active note links"
          />
        </div>
      </section>

      {/* Storage */}
      <section
        className={cn(DASHBOARD_CARD_SURFACE, CARD_PADDING_BLOCK)}
        aria-labelledby="storage-heading"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              <HardDrive className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2
                id="storage-heading"
                className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
              >
                Storage usage
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Estimated from note JSON, version history, and whiteboard data
                (UTF-8 size). Quota is a soft guide (
                {formatBytes(quotaBytes)} cap).
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatBytes(used)}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              of {formatBytes(quotaBytes)}
            </p>
          </div>
        </div>

        <div
          className="mt-4 h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Storage used percent"
        >
          <div
            className={[
              "h-full rounded-full transition-all duration-500",
              isHigh ? "bg-amber-500" : "bg-violet-600",
            ].join(" ")}
            style={{ width: `${pct}%` }}
          />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <StorageRow
            label="Notes"
            bytes={storage.noteBodiesBytes}
          />
          <StorageRow
            label="Versions"
            bytes={storage.versionsBytes}
          />
          <StorageRow
            label="Whiteboard"
            bytes={storage.whiteboardBytes}
          />
          <StorageRow label="Total" bytes={used} bold />
        </dl>
      </section>

      <div className="grid gap-4 sm:gap-6 md:gap-8 lg:grid-cols-2">
        {/* Recently opened */}
        <section aria-labelledby="recent-open-heading">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-400" aria-hidden />
            <h2
              id="recent-open-heading"
              className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Recently opened
            </h2>
          </div>
          {recentOpens.length === 0 ? (
            <EmptyState
              icon={<StickyNote className="h-7 w-7" strokeWidth={1.35} />}
              title="No recent notes yet"
              description="Open any note from your workspace and it will show up here."
            />
          ) : (
            <ul className="space-y-1">
              {recentOpens.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/notes/${row.note.id}`}
                    className={cn(
                      DASHBOARD_CARD_SURFACE,
                      CARD_PADDING_ROW,
                      "block text-sm hover:bg-zinc-50/90 dark:hover:bg-zinc-800/90"
                    )}
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {row.note.title || "Untitled"}
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                      {row.note.chapter.subject.name} · {row.note.chapter.title}
                    </span>
                    <span className="mt-1 block text-[10px] text-zinc-400 dark:text-zinc-400">
                      Opened{" "}
                      {row.openedAt.toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Subjects */}
        <section aria-labelledby="subjects-heading">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-zinc-400" aria-hidden />
              <h2
                id="subjects-heading"
                className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
              >
                Subjects
              </h2>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {subjectCount} total
            </span>
          </div>
          {recentSubjects.length === 0 ? (
            <EmptyState
              illustration={
                <IllustrationEmptyNotes className="mx-auto h-24 w-auto max-w-[180px]" />
              }
              title="Start by creating your first subject"
              description="Subjects group chapters and notes. Create one here or from the workspace sidebar."
              action={<SubjectEmptyCta />}
            />
          ) : (
            <ul className="space-y-2">
              {recentSubjects.map((s) => (
                <li
                  key={s.id}
                  className={cn(DASHBOARD_CARD_SURFACE, CARD_PADDING_ROW)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {s.name}
                      </p>
                      {s.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {s.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-400">
                      {s.chapters.length}{" "}
                      {s.chapters.length === 1 ? "chapter" : "chapters"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className={cn(DASHBOARD_CARD_SURFACE, CARD_PADDING_BLOCK)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 transition-colors duration-200 dark:bg-zinc-800 dark:text-zinc-400">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-400">
        {hint}
      </p>
    </div>
  );
}

function StorageRow({
  label,
  bytes,
  bold,
}: {
  label: string;
  bytes: number;
  bold?: boolean;
}) {
  return (
    <div>
      <dt
        className={[
          "text-zinc-500 dark:text-zinc-400",
          bold ? "font-semibold text-zinc-700 dark:text-zinc-100" : "",
        ].join(" ")}
      >
        {label}
      </dt>
      <dd
        className={[
          "tabular-nums text-zinc-800 dark:text-zinc-400",
          bold ? "font-semibold dark:text-zinc-100" : "",
        ].join(" ")}
      >
        {formatBytes(bytes)}
      </dd>
    </div>
  );
}
