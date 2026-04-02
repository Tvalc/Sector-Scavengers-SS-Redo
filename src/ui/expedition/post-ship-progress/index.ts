/**
 * Post-Ship Progress Screen
 *
 * Displays after completing each ship in an expedition (except final).
 * Shows: ship summary, expedition progress, and next ship preview.
 * Three-panel layout (left/center/right) with continue button.
 */

import { MakkoEngine } from '@makko/engine';
import type { PostShipProgressState, PostShipProgressAction } from './types';
import { getExpeditionOutcome, renderOutcomePanel, renderOutcomeButton } from './outcome';
import type { ExpeditionOutcome } from './types';
import { renderLeftPanel } from './panels/left';
import { renderCenterPanel } from './panels/center';
import { renderRightPanel } from './panels/right';
import { renderContinueButton } from './button';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './constants';
import { COLORS } from '../constants';

// Re-export types for consumers
export type { PostShipProgressState, PostShipProgressAction } from './types';

// Module-level input state
let pressedContinue = false;

/**
 * Render post-ship progress screen.
 * @returns Action when player interacts, null otherwise.
 */
export function renderPostShipProgress(
  display: typeof MakkoEngine.display,
  state: PostShipProgressState,
  mx: number,
  my: number,
): PostShipProgressAction | null {
  const input = MakkoEngine.input;
  const outcome = getExpeditionOutcome(state.runPath);

  // Full-screen background
  display.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, { fill: COLORS.background });

  // Title based on outcome
  renderTitle(display, outcome);

  // Three panels (skip for terminal outcomes)
  if (outcome === 'ongoing') {
    renderLeftPanel(display, state);
    const centerAction = renderCenterPanel(display, state, mx, my);
    if (centerAction) return centerAction;
    renderRightPanel(display, state);
  } else {
    renderOutcomePanel(display, state, outcome);
  }

  // Continue/outcome button
  const buttonResult = outcome === 'ongoing'
    ? renderContinueButton(display, mx, my)
    : renderOutcomeButton(display, mx, my, outcome);

  // Handle input
  return handleInput(input, buttonResult, outcome);
}

function renderTitle(
  display: typeof MakkoEngine.display,
  outcome: ExpeditionOutcome,
): void {
  let titleText = 'SHIP COMPLETE — EXPEDITION PROGRESS';
  let titleColor = COLORS.title;

  if (outcome === 'victory') {
    titleText = '★ EXPEDITION VICTORY ★';
    titleColor = COLORS.victory;
  } else if (outcome === 'ceiling_death') {
    titleText = '✗ EXPEDITION FAILED — DEBT CEILING BREACHED';
    titleColor = COLORS.danger;
  } else if (outcome === 'strike_out') {
    titleText = '✗ EXPEDITION FAILED — TOO MANY MISSED PAYMENTS';
    titleColor = COLORS.danger;
  }

  display.drawText(titleText, SCREEN_WIDTH / 2, 50, {
    font: 'bold 32px monospace',
    fill: titleColor,
    align: 'center',
    baseline: 'top',
  });
}

function handleInput(
  input: import('@makko/engine').InputHandler,
  buttonResult: { hover: boolean },
  outcome: ExpeditionOutcome,
): PostShipProgressAction | null {
  // Track key presses
  if (input.isKeyPressed('Space') || input.isKeyPressed('Enter')) {
    pressedContinue = true;
  }

  if (input.isMousePressed(0) && buttonResult.hover) {
    pressedContinue = true;
  }

  // Check for release/confirmation
  if (input.isMouseReleased(0) || input.isKeyReleased('Space') || input.isKeyReleased('Enter')) {
    if (buttonResult.hover && pressedContinue) {
      pressedContinue = false;
      return createAction(outcome);
    }
    pressedContinue = false;
  }

  return null;
}

function createAction(outcome: ExpeditionOutcome): PostShipProgressAction {
  if (outcome === 'victory') {
    return { type: 'EXPEDITION_VICTORY' };
  }
  if (outcome === 'ceiling_death' || outcome === 'strike_out') {
    return { type: 'EXPEDITION_FAILED' };
  }
  return { type: 'CONTINUE' };
}
