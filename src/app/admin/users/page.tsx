"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import RoleGuard from "@/components/RoleGuard";
import { EmptyState, Spinner } from "@/components/Shared";
import type { BumapUser, UserRole } from "@/types";

const ROLE_FILTERS: ("all" | UserRole)[] = ["all", "buyer", "seller", "driver", "admin"];

function UsersContent() {
  const [users, setUsers] = useState<BumapUser[]>([]);
  const [filter, setFilter] = useState<"all" | UserRole>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BumapUser)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function toggleBan(u: BumapUser) {
    if (u.banned) {
      await updateDoc(doc(db, "users", u.id), { banned: false, banReason: "" });
      return;
    }
    const reason = prompt(`Reason for banning ${u.name}?`);
    if (!reason) return;
    await updateDoc(doc(db, "users", u.id), { banned: true, banReason: reason });
  }

  const filtered = filter === "all" ? users : users.filter((u) => u.role === filter);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">
        {ROLE_FILTERS.map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm capitalize ${
              filter === r ? "border-brand-600 bg-brand-600 text-white" : "border-neutral-300"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState text="No users in this category." />
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <div key={u.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  {u.name} <span className="badge bg-neutral-100 text-neutral-600 capitalize">{u.role}</span>
                  {u.verified && <span className="badge ml-1 bg-brand-100 text-brand-800">Verified</span>}
                  {u.banned && <span className="badge ml-1 bg-red-100 text-red-700">Banned</span>}
                </p>
                <p className="text-xs text-neutral-500">{u.phone} · {u.email} · {u.location}</p>
                {u.banned && u.banReason && <p className="text-xs text-red-600">Reason: {u.banReason}</p>}
              </div>
              <button
                onClick={() => toggleBan(u)}
                className={`badge ${u.banned ? "bg-brand-100 text-brand-800" : "bg-red-100 text-red-700"}`}
              >
                {u.banned ? "Unban" : "Ban"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">All Users</h1>
        <RoleGuard allow={["admin"]}>
          <UsersContent />
        </RoleGuard>
      </main>
    </>
  );
}
