"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadFile } from "@/lib/upload";
import Navbar from "@/components/Navbar";
import { Spinner } from "@/components/Shared";
import { CATEGORIES, SUBCATEGORIES } from "@/data/categories";

const emptyForm = {
  type: "",
  subcategory: "",
  title: "",
  price: "",
  description: "",
  location: "",
  contact: "",
};

function PostFormInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [form, setForm] = useState({
    ...emptyForm,
    type: searchParams.get("type") ?? "",
    subcategory: searchParams.get("sub") ?? "",
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const subOptions = SUBCATEGORIES[form.type] ?? [];

  function updateField(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "type" ? { subcategory: "" } : {}),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.type || !form.subcategory || !form.title || !form.price) {
      setErrorMsg("Please fill in category, subcategory, title and price.");
      return;
    }

    setSubmitting(true);
    try {
      const imageUrls = await Promise.all(
        imageFiles.map((file) => uploadFile(file, `listings`))
      );

      await addDoc(collection(db, "listings"), {
        type: form.type,
        subcategory: form.subcategory,
        title: form.title.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        location: form.location.trim(),
        contact: form.contact.trim(),
        images: imageUrls,
        createdAt: serverTimestamp(),
      });

      router.push(`/listings?type=${form.type}&sub=${form.subcategory}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong posting your listing.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="sticky top-[57px] z-20 bg-white border-b border-neutral-200 px-4 pt-4 pb-3">
        <button onClick={() => router.back()} className="text-sm text-neutral-500 mb-1">
          ← Back
        </button>
        <h1 className="text-lg font-bold text-neutral-900">Post a Listing</h1>
      </div>

      <main className="mx-auto max-w-lg px-4 pt-4 pb-10">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <Field label="Category">
            <select
              className="input"
              value={form.type}
              onChange={(e) => updateField("type", e.target.value)}
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c.type} value={c.type}>{c.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Subcategory">
            <select
              className="input"
              value={form.subcategory}
              onChange={(e) => updateField("subcategory", e.target.value)}
              disabled={!form.type}
            >
              <option value="">
                {form.type ? "Select subcategory" : "Choose a category first"}
              </option>
              {subOptions.map((s) => (
                <option key={s.slug} value={s.slug}>{s.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Title">
            <input
              className="input"
              placeholder="e.g. Clean Studio near Molyko"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
            />
          </Field>

          <Field label="Price (FCFA)">
            <input
              className="input"
              type="number"
              min="0"
              placeholder="e.g. 25000"
              value={form.price}
              onChange={(e) => updateField("price", e.target.value)}
            />
          </Field>

          <Field label="Description">
            <textarea
              className="input min-h-24"
              placeholder="Describe the listing..."
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </Field>

          <Field label="Location">
            <input
              className="input"
              placeholder="e.g. Molyko, Buea"
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
            />
          </Field>

          <Field label="Photos (optional)">
            <input
              className="input"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))}
            />
          </Field>

          <Field label="Contact (phone / WhatsApp)">
            <input
              className="input"
              placeholder="e.g. 6XX XXX XXX"
              value={form.contact}
              onChange={(e) => updateField("contact", e.target.value)}
            />
          </Field>

          {errorMsg && (
            <p className="text-red-600 text-sm">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? "Posting…" : "Post Listing"}
          </button>
        </form>
      </main>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export default function PostPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <PostFormInner />
    </Suspense>
  );
}
