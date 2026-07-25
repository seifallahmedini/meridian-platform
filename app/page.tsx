export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Meridian Logistics Platform</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Foundation scaffold for MLP-45. See{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
          docs/adr/0001-tech-stack.md
        </code>{" "}
        for the technology decision.
      </p>
    </main>
  );
}
