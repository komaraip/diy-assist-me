import { ArrowUpRight, ChefHat, Clock, Leaf, Wrench } from "lucide-react";
import { ImageWithFallback } from "../common/ImageWithFallback.jsx";

const categoryIcons = {
  Cooking: ChefHat,
  Cleaning: Wrench,
  Organizing: Leaf,
};

export function TutorialCard({ tutorial, onOpen }) {
  const CategoryIcon = categoryIcons[tutorial.category] || ChefHat;
  const image = tutorial.thumbnailUrl || tutorial.image;
  const time = tutorial.time || `${tutorial.estimatedMinutes || 0} min`;

  return (
    <button className="tutorial-card" type="button" onClick={onOpen} aria-label={`Open tutorial ${tutorial.title}`}>
      <span className="tutorial-card-image-wrap">
        <ImageWithFallback src={image} alt={tutorial.title} className="tutorial-card-image" />
        <span className="category-pill">
          <CategoryIcon aria-hidden="true" />
          {tutorial.category}
        </span>
        <span className="time-pill">
          <Clock aria-hidden="true" />
          {time}
        </span>
        <span className="open-indicator" aria-hidden="true">
          <ArrowUpRight />
        </span>
      </span>
      <span className="tutorial-card-body">
        <span>
          <span className="tutorial-title">{tutorial.title}</span>
          <span className="tutorial-description">{tutorial.description}</span>
        </span>
        <span className="tutorial-card-meta">
          <span className="difficulty-pill">{tutorial.difficulty}</span>
          <span>{(tutorial.materials || []).length} materials</span>
          <span>{(tutorial.steps || []).length} steps</span>
        </span>
      </span>
    </button>
  );
}
