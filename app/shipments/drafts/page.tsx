import Link from "next/link";
import { createCaller } from "@/server/routers/_app";

// Queries the database at request time — must not be statically prerendered
// at build time, since pnpm build must succeed without a live DATABASE_URL.
export const dynamic = "force-dynamic";

export default async function DraftsPage() {
  const caller = createCaller({});
  const drafts = await caller.shipment.listDrafts();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Draft shipments</h1>
        <Link href="/shipments/new" className="text-sm text-primary hover:underline">
          New shipment
        </Link>
      </div>

      {drafts.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No drafts yet. Save a shipment as a draft to see it here.
        </p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {drafts.map((draft) => (
            <li key={draft.id}>
              <Link
                href={`/shipments/new?draftId=${draft.id}`}
                className="block rounded-lg border p-3 hover:bg-muted"
              >
                <div className="font-medium">
                  {draft.origin && draft.destination
                    ? `${draft.origin.label} → ${draft.destination.label}`
                    : "Unnamed draft"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Updated {draft.updatedAt.toLocaleString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
