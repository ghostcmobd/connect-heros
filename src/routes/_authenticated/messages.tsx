import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyMessages } from "@/lib/me.functions";
import { Loader2, Inbox } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Messages — THE KNOT" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const fetchFn = useServerFn(listMyMessages);
  const q = useQuery({ queryKey: ["my-messages"], queryFn: () => fetchFn() });

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Messages</h1>
      <p className="mt-1 text-sm text-muted-foreground">Conversations between you and students or alumni.</p>

      {q.isLoading && <div className="mt-12 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>}
      {q.data && q.data.length === 0 && (
        <div className="soft-card mt-8 flex flex-col items-center gap-2 p-12 text-center">
          <Inbox className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Your inbox is quiet — for now.</p>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {(q.data ?? []).map((m: any) => {
          const other = m.direction === "in" ? m.sender : m.recipient;
          return (
            <div key={m.id} className="soft-card p-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {m.direction === "in" ? "From" : "To"} {other?.full_name ?? "Unknown"}
                </span>
                <span>{new Date(m.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed">{m.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
