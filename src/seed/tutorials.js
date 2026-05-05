import dataset from "../../data.json";
import { normalizeTutorial } from "../utils/normalizeTutorial.js";

export const tutorials = dataset.tutorials.map((tutorial, index) => normalizeTutorial(tutorial, index));
