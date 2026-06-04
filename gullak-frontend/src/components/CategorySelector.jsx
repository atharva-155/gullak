import { categories } from "../utils/helpers.js";

export default function CategorySelector({ value, onChange }) {
  return (
    <div className="category-grid">
      {categories.map((category) => (
        <button
          type="button"
          className={`category-tile ${value === category.name ? "selected" : ""}`}
          key={category.name}
          onClick={() => onChange(category.name)}
        >
          <span>{category.emoji}</span>
          {category.name}
        </button>
      ))}
    </div>
  );
}
