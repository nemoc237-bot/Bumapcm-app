"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import { ErrorNote } from "@/components/Shared";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const role = snap.exists() ? snap.data().role : "buyer";
      router.push(role === "seller" ? "/seller" : role === "driver" ? "/driver" : role === "admin" ? "/admin" : "/buyer");
    } catch (err: any) {
      setError(err.message?.replace("Firebase: ", "") || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-sm px-4 py-12">
        <h1 className="text-2xl font-bold text-brand-800">Log in to BUMAP.co</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <ErrorNote message={error} />
          <button className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Signing in…" : "Log in"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-neutral-600">
          No account? <Link href="/register" className="font-semibold text-brand-700">Sign up</Link>
        </p>
      </main>
    </>
  );
}
