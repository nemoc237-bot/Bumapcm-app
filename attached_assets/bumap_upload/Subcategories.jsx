import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card } from "../components/Card";
import { CATEGORIES, SUBCATEGORIES, getCategoryLabel } from "../data/categories";

export default function Subcategories() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get("type");

  const subcategories = SUBCATEGORIES[type];
  const categoryLabel = getCategoryLabel(type);

  // Unknown or missing ?type — guide the user back instead of a blank page.
  if (!subcategories) {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-10 text-center">
        <p className="text-stone-700 font-medium mb-1">
          {type ? `"${type}" isn't a category we know.` : "No category selected."}
        </p>
        <p className="text-stone-500 text-sm mb-4">
          Pick one of {CATEGORIES.map((c) => c.label).join(", ")} from the home page.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-sm font-semibold"
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-8">
      <header className="px-4 pt-5 pb-4 bg-white border-b border-stone-100 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-stone-500 mb-1"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold text-stone-900">{categoryLabel}</h1>
        <p className="text-sm text-stone-500">Choose a category to browse</p>
      </header>

      <div className="grid grid-cols-2 gap-3 px-4 pt-4">
        {subcategories.map((sub) => (
          <Link key={sub.slug} to={`/listings?type=${type}&sub=${sub.slug}`}>
            <Card className="p-4 h-24 flex items-center justify-center text-center">
              <span className="font-semibold text-stone-800 text-sm">
                {sub.label}
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
