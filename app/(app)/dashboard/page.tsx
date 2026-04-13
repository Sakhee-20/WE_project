import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatBytes } from "@/lib/format-bytes";
import { estimateUserStorageBytes } from "@/lib/dashboard/storage-estimate";
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
import {
  IllustrationEmptyInbox,
  IllustrationEmptyNotes,
} from "@/components/ui/notion-empty-illustrations";

function quotaBytesFromEnv(): number {
  const mb = Number(process.env.NEXT_PUBLIC_STORAGE_QUOTA_MB || "100");
  if (!Number.isFinite(mb) || mb <= 0) return 100 * 1024 * 1024;
  return Math.round(mb * 1024 * 1024);
}

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
    prisma.subject.count({ where: { userId } }),
    prisma.chapter.count({ where: { subject: { userId } } }),
    prisma.note.count({
      where: { chapter: { subject: { userId } } },
    }),
    prisma.noteShare.count({
      where: { note: { chapter: { subject: { userId } } } },
    }),
    estimateUserStorageBytes(userId),
    prisma.subject.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { _count: { select: { chapters: true } } },
    }),
    prisma.noteOpen.findMany({
      where: { userId },
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
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
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
        className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm transition-[box-shadow,border-color] duration-200 ease-out hover:border-zinc-300/80 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700/90 dark:hover:shadow-lg dark:hover:shadow-black/20"
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
                className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
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
            <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
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

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recently opened */}
        <section aria-labelledby="recent-open-heading">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-400" aria-hidden />
            <h2
              id="recent-open-heading"
              className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Recently opened
            </h2>
          </div>
          {recentOpens.length === 0 ? (
            <EmptyState
              illustration={
                <IllustrationEmptyInbox className="mx-auto h-28 w-auto max-w-[200px]" />
              }
              title="No recent notes"
              description="Open any note you own and it will show up here. We remember your last opens on the server."
            />
          ) : (
            <ul className="space-y-1">
              {recentOpens.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/notes/${row.note.id}`}
                    className="block rounded-xl border border-zinc-200/90 bg-white px-4 py-3 text-sm shadow-sm transition-[border-color,background-color,box-shadow] duration-200 ease-out hover:border-zinc-300/90 hover:bg-zinc-50/90 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-600/80 dark:hover:bg-zinc-800/50 dark:hover:shadow-lg dark:hover:shadow-black/20"
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {row.note.title || "Untitled"}
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                      {row.note.chapter.subject.name} · {row.note.chapter.title}
                    </span>
                    <span className="mt-1 block text-[10px] text-zinc-400 dark:text-zinc-500">
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
                className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
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
                <IllustrationEmptyNotes className="mx-auto h-28 w-auto max-w-[200px]" />
              }
              title="Start with a subject"
              description="Subjects group your chapters and notes. Add one from the sidebar in any notebook view."
            />
          ) : (
            <ul className="space-y-2">
              {recentSubjects.map((s) => (
                <li
                  key={s.id}
                  className="rounded-xl border border-zinc-200/90 bg-white px-4 py-3 shadow-sm transition-[border-color,box-shadow] duration-200 ease-out hover:border-zinc-300/80 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700 dark:hover:shadow-lg dark:hover:shadow-black/20"
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
                    <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                      {s._count.chapters}{" "}
                      {s._count.chapters === 1 ? "chapter" : "chapters"}
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
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm transition-[border-color,box-shadow] duration-200 ease-out hover:border-zinc-300/90 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700 dark:hover:shadow-lg dark:hover:shadow-black/20">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 transition-colors duration-200 dark:bg-zinc-800 dark:text-zinc-300">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
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
          bold ? "font-semibold text-zinc-700 dark:text-zinc-300" : "",
        ].join(" ")}
      >
        {label}
      </dt>
      <dd
        className={[
          "tabular-nums text-zinc-800 dark:text-zinc-200",
          bold ? "font-semibold" : "",
        ].join(" ")}
      >
        {formatBytes(bytes)}
      </dd>
    </div>
  );
}
