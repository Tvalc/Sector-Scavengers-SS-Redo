// Card Collection Panel - Pagination State Management

// Pagination state (module-level to persist across renders)
let currentPage = 0;
let pageTransitionProgress = 0;
let targetPage = 0;

/** Reset pagination state when opening panel */
export function resetCardCollectionPage(): void {
  currentPage = 0;
  targetPage = 0;
  pageTransitionProgress = 0;
}

/** Get current page number */
export function getCurrentPage(): number {
  return currentPage;
}

/** Get target page for transitions */
export function getTargetPage(): number {
  return targetPage;
}

/** Get transition progress (0-1) */
export function getTransitionProgress(): number {
  return pageTransitionProgress;
}

/** Set target page for transition */
export function setTargetPage(page: number): void {
  targetPage = page;
}

/** Update transition progress */
export function updateTransitionProgress(delta: number): void {
  pageTransitionProgress += delta;
  if (pageTransitionProgress >= 1) {
    currentPage = targetPage;
    pageTransitionProgress = 0;
  }
}

/** Reset transition to start */
export function startTransition(): void {
  pageTransitionProgress = 0.05;
}
