// Dive Preparation Pagination State

import { EXPANDED_TOTAL_PAGES } from './constants';

// ── Pagination State ─────────────────────────────────────────────────────────
export let crewPage = 0;
export let shipPage = 0;
export let hardwarePage = 0;
export let expandedPage = 0;

// ── State Reset Functions ───────────────────────────────────────────────────
export function resetDivePrepPagination(): void {
  crewPage = 0;
  shipPage = 0;
  hardwarePage = 0;
}

export function resetDivePrepExpandedPage(): void {
  expandedPage = 0;
}

// ── State Mutators ───────────────────────────────────────────────────────────
export function setCrewPage(page: number): void {
  crewPage = page;
}

export function setShipPage(page: number): void {
  shipPage = page;
}

export function setHardwarePage(page: number): void {
  hardwarePage = page;
}

export function setExpandedPage(page: number): void {
  expandedPage = Math.max(0, Math.min(page, EXPANDED_TOTAL_PAGES - 1));
}

export function decrementExpandedPage(): void {
  if (expandedPage > 0) expandedPage--;
}

export function incrementExpandedPage(): void {
  if (expandedPage < EXPANDED_TOTAL_PAGES - 1) expandedPage++;
}

// ── State Getters ───────────────────────────────────────────────────────────
export function getExpandedPage(): number {
  return Math.max(0, Math.min(expandedPage, EXPANDED_TOTAL_PAGES - 1));
}
