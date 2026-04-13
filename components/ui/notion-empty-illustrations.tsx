import type { SVGProps } from "react";

/** Soft inline SVGs for empty states (no external assets). */

export function IllustrationEmptyNotes(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 200 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect
        x="24"
        y="20"
        width="152"
        height="100"
        rx="12"
        className="fill-zinc-100 dark:fill-zinc-800/80"
      />
      <rect
        x="40"
        y="38"
        width="88"
        height="6"
        rx="3"
        className="fill-zinc-200 dark:fill-zinc-700"
      />
      <rect
        x="40"
        y="52"
        width="120"
        height="6"
        rx="3"
        className="fill-zinc-200/80 dark:fill-zinc-700/70"
      />
      <rect
        x="40"
        y="66"
        width="72"
        height="6"
        rx="3"
        className="fill-zinc-200/60 dark:fill-zinc-700/50"
      />
      <circle cx="160" cy="48" r="22" className="fill-blue-100 dark:fill-blue-950/80" />
      <path
        d="M152 48l6 6 12-14"
        className="stroke-blue-500 dark:stroke-blue-400"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IllustrationEmptyInbox(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 200 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        d="M40 48h120l-8 64H48L40 48z"
        className="fill-zinc-100 stroke-zinc-200 dark:fill-zinc-800/60 dark:stroke-zinc-700"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M40 48l16-20h88l16 20"
        className="stroke-zinc-300 dark:stroke-zinc-600"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="100" cy="72" r="18" className="fill-violet-100 dark:fill-violet-950/60" />
      <path
        d="M94 72h12M100 66v12"
        className="stroke-violet-500 dark:stroke-violet-400"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IllustrationEmptyWorkspace(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 200 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect
        x="32"
        y="28"
        width="56"
        height="72"
        rx="8"
        className="fill-zinc-100 dark:fill-zinc-800/70"
      />
      <rect
        x="96"
        y="36"
        width="72"
        height="56"
        rx="8"
        className="fill-zinc-100 dark:fill-zinc-800/70"
      />
      <rect
        x="44"
        y="44"
        width="32"
        height="4"
        rx="2"
        className="fill-zinc-200 dark:fill-zinc-700"
      />
      <rect
        x="44"
        y="54"
        width="24"
        height="4"
        rx="2"
        className="fill-zinc-200/70 dark:fill-zinc-700/60"
      />
      <rect
        x="108"
        y="52"
        width="48"
        height="4"
        rx="2"
        className="fill-zinc-200 dark:fill-zinc-700"
      />
      <rect
        x="108"
        y="64"
        width="36"
        height="4"
        rx="2"
        className="fill-zinc-200/70 dark:fill-zinc-700/60"
      />
      <circle cx="100" cy="108" r="14" className="fill-amber-100 dark:fill-amber-950/50" />
      <path
        d="M96 108l4 4 8-10"
        className="stroke-amber-600 dark:stroke-amber-500"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
