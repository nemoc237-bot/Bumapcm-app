// Shared card shell used by subcategory tiles and listing cards.
// If BUMAP already has a Card component with its own classes, swap the
// className strings below for the existing ones so everything matches —
// these are sensible defaults, not a hard requirement.

export function Card({ children, onClick, className = "" }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-stone-100 active:scale-[0.98] transition-transform ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
