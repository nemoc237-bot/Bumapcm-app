import { useNavigate } from "react-router-dom";
import { Card } from "./Card";

// Drop this into the existing Home page in place of (or alongside) the
// current 3 tiles. It only needs `type` to match a key in CATEGORIES.
const TILES = [
  { type: "house", label: "Houses", icon: "🏠", blurb: "Rooms, apartments & studios" },
  { type: "item", label: "Items", icon: "🛋️", blurb: "Phones, furniture & more" },
  { type: "service", label: "Services", icon: "🛠️", blurb: "Tailors, tutors & artisans" },
];

export default function HomeTiles() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-3 px-4">
      {TILES.map((tile) => (
        <Card
          key={tile.type}
          onClick={() => navigate(`/subcategories?type=${tile.type}`)}
          className="p-4 flex flex-col items-center text-center gap-1"
        >
          <span className="text-3xl">{tile.icon}</span>
          <span className="font-semibold text-sm text-stone-800">{tile.label}</span>
          <span className="text-[11px] text-stone-500 leading-tight hidden sm:block">
            {tile.blurb}
          </span>
        </Card>
      ))}
    </div>
  );
}
