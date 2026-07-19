import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { CATEGORIES, SUBCATEGORIES } from "../data/categories";
import "./postform.css";

const emptyForm = {
  type: "",
  subcategory: "",
  title: "",
  price: "",
  description: "",
  location: "",
  contact: "",
};

export default function PostForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Allow arriving pre-filled, e.g. from the "Be the first to post" button
  // on the empty Listings page (/post?type=house&sub=studio).
  const [form, setForm] = useState({
    ...emptyForm,
    type: searchParams.get("type") || "",
    subcategory: searchParams.get("sub") || "",
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const subOptions = SUBCATEGORIES[form.type] || [];

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      // Changing category invalidates whatever subcategory was picked before.
      ...(field === "type" ? { subcategory: "" } : {}),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.type || !form.subcategory || !form.title || !form.price) {
      setErrorMsg("Please fill in category, subcategory, title and price.");
      return;
    }

    setSubmitting(true);
    try {
      // Upload images to Storage first, then save their URLs on the doc.
      const imageUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const path = `listings/${Date.now()}-${file.name}`;
          const storageRef = ref(storage, path);
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        })
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

      navigate(`/listings?type=${form.type}&sub=${form.subcategory}`);
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong posting your listing.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-10">
      <header className="px-4 pt-5 pb-4 bg-white border-b border-stone-100 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-stone-900">Post a Listing</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-4 pt-4 flex flex-col gap-4">
        <Field label="Category">
          <select
            className="input"
            value={form.type}
            onChange={(e) => updateField("type", e.target.value)}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c.type} value={c.type}>
                {c.label}
              </option>
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
              <option key={s.slug} value={s.slug}>
                {s.label}
              </option>
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

        <Field label="Images">
          <input
            className="input"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
          />
        </Field>

        <Field label="Contact (phone/WhatsApp)">
          <input
            className="input"
            placeholder="e.g. 6XX XXX XXX"
            value={form.contact}
            onChange={(e) => updateField("contact", e.target.value)}
          />
        </Field>

        {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 py-3 rounded-xl bg-emerald-700 text-white font-semibold disabled:opacity-60"
        >
          {submitting ? "Posting..." : "Post Listing"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}
