import { parseSparkCacheData } from "./sparkData";

const SPARK_CACHE_PREFIX = "spark:v1";

function getSparkCacheKey(card) {
  return card?.id === undefined || card?.id === null
    ? null
    : `${SPARK_CACHE_PREFIX}:${card.id}`;
}

function removeSparkCacheEntry(cacheKey) {
  try {
    window.sessionStorage.removeItem(cacheKey);
  } catch (cacheError) {
    console.warn("Could not remove the Spark AI question cache:", cacheError);
  }
}

export function readSparkCache(card) {
  const cacheKey = getSparkCacheKey(card);
  if (!cacheKey || typeof window === "undefined") return null;

  try {
    const cached = JSON.parse(window.sessionStorage.getItem(cacheKey));
    const parsedCache = parseSparkCacheData(cached);

    if (cached?.originalQuestion !== card.question || !parsedCache) {
      removeSparkCacheEntry(cacheKey);
      return null;
    }

    return parsedCache;
  } catch (cacheError) {
    console.warn("Could not read the Spark AI question cache:", cacheError);
    removeSparkCacheEntry(cacheKey);
    return null;
  }
}

export function writeSparkCache(card, cacheData) {
  const cacheKey = getSparkCacheKey(card);
  if (!cacheKey || typeof window === "undefined") return;

  const parsedCache = parseSparkCacheData(cacheData);
  if (!parsedCache) {
    console.warn("Refused to save invalid Spark AI question data.");
    return;
  }

  try {
    window.sessionStorage.setItem(
      cacheKey,
      JSON.stringify({
        originalQuestion: card.question,
        ...parsedCache,
        cachedAt: Date.now(),
      }),
    );
  } catch (cacheError) {
    console.warn("Could not save the Spark AI question cache:", cacheError);
  }
}
