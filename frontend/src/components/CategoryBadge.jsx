export default function CategoryBadge({ category }) {
  return (
    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-clay/10 text-clay-soft border border-clay/20">
      {category}
    </span>
  );
}
