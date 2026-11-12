export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
          COKO Jewellery — Wholesale
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Scaffold is live.
        </h1>
      </div>

      <p className="text-neutral-600">
        This is the initial skeleton of the B2B wholesale portal — catalog, dealer
        accounts, and ordering are not built yet. See{" "}
        <code className="rounded bg-neutral-200 px-1.5 py-0.5 text-sm">
          CLAUDE.md
        </code>{" "}
        and{" "}
        <code className="rounded bg-neutral-200 px-1.5 py-0.5 text-sm">
          README.md
        </code>{" "}
        for what&apos;s built so far and what&apos;s still open.
      </p>
    </main>
  );
}
