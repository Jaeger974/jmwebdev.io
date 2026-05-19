import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let poemsCache = null; // <-- Cached poems

export async function getRandomPoem() {
  // Load poems only once
  if (!poemsCache) {
    const filePath = path.join(__dirname, "../DIYPoemList/poem.json");
    const data = await readFile(filePath, "utf-8");
    poemsCache = JSON.parse(data);
  }

  // Return a random poem
  return poemsCache[Math.floor(Math.random() * poemsCache.length)];
}

export default getRandomPoem;