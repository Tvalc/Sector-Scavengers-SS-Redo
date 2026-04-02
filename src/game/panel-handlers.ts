/**
 * Panel Screen Handlers
 *
 * Handles all panel screens: salvage market, void communion,
 * hardware, cryo, and modules.
 */

import { GameStore } from '../app/game-store';
import { GameState } from './game-state';
import { MetaState } from '../types/state';
import { renderSalvageMarket, PanelContext, resetSalvagePage } from '../ui/salvage-market-panel';
import { renderHardwarePanel, resetHardwarePage } from '../ui/hardware-panel';
import { renderCryoPanel, resetCryoPage } from '../ui/cryo-panel';
import { renderModulesPanel } from '../ui/modules-panel';
import { renderCrewPanel, resetCrewPage } from '../ui/crew-panel';
import { renderShipsPanel, resetShipsPage } from '../ui/ships-full-panel';
import { renderVoidCommunion, resetVoidPage } from '../ui/void-communion-panel';
import { renderVoidShopPanel, resetVoidShopPage } from '../ui/void-shop-panel';
import { renderResearchPanel, resetResearchPage } from '../ui/research-full-panel';
import { feedbackLayer } from '../ui/feedback-layer';
import {
  renderShipSelectPanel,
  renderCrewSelectPanel,
  renderHardwareSelectPanel,
  resetShipSelect,
  resetHardwareSelect,
} from '../ui/dive-prep-select';

export function handleSalvageMarket(
  state: GameState,
  store: GameStore,
  meta: MetaState,
  mx: number,
  my: number,
  now: number,
  context: PanelContext = 'meta',
): void {
  // Reset page when first entering (check if coming from hub)
  if (state.lastPanelAction === null) {
    resetSalvagePage();
  }
  const marketAction = renderSalvageMarket(meta, mx, my, state.salvageAnimator, context);

  if (marketAction !== null) {
    state.lastPanelAction = marketAction.type;

    switch (marketAction.type) {
      case 'CLOSE_MARKET':
        state.setScreen('hub');
        break;
      case 'BUY_MARKET_ITEM':
        store.dispatch({ type: 'BUY_MARKET_ITEM', hardwareId: marketAction.hardwareId });
        break;
    }
  }

  feedbackLayer.update(now);
}

export function handleHardwarePanel(
  state: GameState,
  store: GameStore,
  meta: MetaState,
  mx: number,
  my: number,
  now: number,
  _context: PanelContext = 'meta',
): void {
  // Reset page when first entering (check if coming from hub)
  if (state.lastPanelAction === null) {
    resetHardwarePage();
  }
  const hwAction = renderHardwarePanel(meta, mx, my, now);

  if (hwAction !== null) {
    state.lastPanelAction = hwAction.type;

    switch (hwAction.type) {
      case 'CLOSE_HARDWARE':
        state.setScreen('hub');
        break;
      case 'EQUIP_ITEM':
        store.dispatch({ type: 'EQUIP_ITEM', slot: hwAction.slot, itemId: hwAction.itemId });
        break;
      case 'UNEQUIP_ITEM':
        store.dispatch({ type: 'UNEQUIP_ITEM', slot: hwAction.slot });
        break;
    }
  }

  feedbackLayer.update(now);
}

export function handleCryoPanel(
  state: GameState,
  store: GameStore,
  meta: MetaState,
  mx: number,
  my: number,
  now: number,
  _context: PanelContext = 'meta',
): void {
  // Reset page when first entering (check if coming from hub)
  if (state.lastPanelAction === null) {
    resetCryoPage();
  }
  const cryoAction = renderCryoPanel(meta, mx, my, now);

  if (cryoAction !== null) {
    state.lastPanelAction = cryoAction.type;

    switch (cryoAction.type) {
      case 'CLOSE_CRYO':
        state.setScreen('hub');
        break;
      case 'WAKE_CREW':
        store.dispatch({ type: 'WAKE_CREW', crewId: cryoAction.crewId });
        break;
      case 'SEND_TO_CRYO':
        store.dispatch({ type: 'SEND_TO_CRYO', crewId: cryoAction.crewId });
        break;
      case 'ASSIGN_CREW':
        store.dispatch({ type: 'ASSIGN_CREW', crewId: cryoAction.crewId, slot: cryoAction.slot });
        break;
    }
  }

  feedbackLayer.update(now);
}

export function handleModulesPanel(
  state: GameState,
  store: GameStore,
  meta: MetaState,
  mx: number,
  my: number,
  now: number,
  context: PanelContext = 'meta',
): void {
  const modAction = renderModulesPanel(meta, mx, my, state.modulesAnimator, context);

  if (modAction !== null) {
    state.lastPanelAction = modAction.type;

    switch (modAction.type) {
      case 'CLOSE_MODULES':
        state.setScreen('hub');
        break;
      case 'UPGRADE_MODULE':
        store.dispatch({ type: 'UPGRADE_MODULE', moduleId: modAction.moduleId });
        break;
    }
  }

  feedbackLayer.update(now);
}

export function handleCrewPanel(
  state: GameState,
  store: GameStore,
  meta: MetaState,
  mx: number,
  my: number,
  dt: number,
  _context: PanelContext = 'meta',
): void {
  const crewAction = renderCrewPanel(meta, mx, my, dt);

  if (crewAction !== null) {
    state.lastPanelAction = crewAction.type;

    switch (crewAction.type) {
      case 'CLOSE_CREW':
        resetCrewPage();
        state.setScreen('hub');
        break;
      case 'WAKE_CREW':
        store.dispatch({ type: 'WAKE_CREW', crewId: crewAction.crewId });
        break;
      case 'SEND_TO_CRYO':
        store.dispatch({ type: 'SEND_TO_CRYO', crewId: crewAction.crewId });
        break;
      case 'ASSIGN_CREW':
        store.dispatch({ type: 'ASSIGN_CREW', crewId: crewAction.crewId, slot: crewAction.slot });
        break;
    }
  }

  feedbackLayer.update(dt);
}

export function handleShipsPanel(
  state: GameState,
  store: GameStore,
  meta: MetaState,
  mx: number,
  my: number,
  dt: number,
  _context: PanelContext = 'meta',
): void {
  const shipsAction = renderShipsPanel(meta, mx, my, dt);

  if (shipsAction !== null) {
    state.lastPanelAction = shipsAction.type;

    switch (shipsAction.type) {
      case 'CLOSE_SHIPS':
        resetShipsPage();
        state.setScreen('hub');
        break;
      case 'SET_ACTIVE_REPAIR':
        store.dispatch({ type: 'SET_ACTIVE_REPAIR', shipId: shipsAction.shipId });
        break;
      case 'ASSIGN_CAPTAIN':
        store.dispatch({ type: 'ASSIGN_CAPTAIN', shipId: shipsAction.shipId, crewId: shipsAction.crewId });
        break;
      case 'UNASSIGN_CAPTAIN':
        store.dispatch({ type: 'UNASSIGN_CAPTAIN', shipId: shipsAction.shipId });
        break;
    }
  }

  feedbackLayer.update(dt);
}

export function handleVoidCommunion(
  state: GameState,
  store: GameStore,
  meta: MetaState,
  mx: number,
  my: number,
  now: number,
  _context: PanelContext = 'meta',
): void {
  const vcAction = renderVoidCommunion(meta, mx, my, now);

  if (vcAction !== null) {
    state.lastPanelAction = vcAction.type;

    switch (vcAction.type) {
      case 'BUY_VOID_TIER':
        store.dispatch({ type: 'BUY_VOID_TIER', tierId: vcAction.tierId });
        break;
      case 'CLOSE_VOID':
        state.setScreen('hub');
        break;
    }
  }

  feedbackLayer.update(now);
}

export function handleVoidShopPanel(
  state: GameState,
  store: GameStore,
  meta: MetaState,
  mx: number,
  my: number,
  now: number,
  _context: PanelContext = 'meta',
): void {
  const shopAction = renderVoidShopPanel(meta, mx, my, now);

  if (shopAction !== null) {
    state.lastPanelAction = shopAction.type;

    switch (shopAction.type) {
      case 'BUY_VOID_SHOP_CARD':
        store.dispatch({ type: 'BUY_VOID_SHOP_CARD', shopCardId: shopAction.shopCardId });
        break;
      case 'CLOSE_VOID_SHOP':
        state.setScreen('hub');
        break;
    }
  }

  feedbackLayer.update(now);
}

export function handleResearchPanel(
  state: GameState,
  store: GameStore,
  meta: MetaState,
  mx: number,
  my: number,
  now: number,
  _context: PanelContext = 'meta',
): void {
  // Reset page when first entering (check if coming from hub)
  if (state.lastPanelAction === null) {
    resetResearchPage();
  }
  const researchAction = renderResearchPanel(meta, mx, my, now);

  if (researchAction !== null) {
    state.lastPanelAction = researchAction.type;

    switch (researchAction.type) {
      case 'CLOSE_RESEARCH':
        state.setScreen('hub');
        break;
    }
  }

  feedbackLayer.update(now);
}

// ═══════════════════════════════════════════════════════════════════════════
// DIVE-PREP SELECTION PANELS (distinct from progression panels)
// ═══════════════════════════════════════════════════════════════════════════

export function handleShipSelectPanel(
  state: GameState,
  store: GameStore,
  meta: MetaState,
  mx: number,
  my: number,
  dt: number,
): void {
  if (state.lastPanelAction === null) {
    resetShipSelect();
  }
  const selectAction = renderShipSelectPanel(meta, meta.divePrep, mx, my, dt);

  if (selectAction !== null) {
    state.lastPanelAction = selectAction.type;

    switch (selectAction.type) {
      case 'CLOSE_SHIP_SELECT':
        state.setScreen('hub');
        break;
      case 'SELECT_SHIP_FOR_DIVE':
        store.dispatch({ type: 'DIVE_PREP_SELECT_SHIP', shipId: selectAction.shipId });
        state.setScreen('hub');
        break;
    }
  }

  feedbackLayer.update(dt);
}

export function handleCrewSelectPanel(
  state: GameState,
  store: GameStore,
  meta: MetaState,
  mx: number,
  my: number,
  dt: number,
): void {
  const selectAction = renderCrewSelectPanel(meta, meta.divePrep, mx, my, dt);

  if (selectAction !== null) {
    state.lastPanelAction = selectAction.type;

    switch (selectAction.type) {
      case 'CLOSE_CREW_SELECT':
        state.setScreen('hub');
        break;
      case 'SELECT_CREW_FOR_DIVE':
        store.dispatch({ type: 'DIVE_PREP_SELECT_CREW', crewId: selectAction.crewId });
        state.setScreen('hub');
        break;
      case 'CLEAR_CREW_SELECTION':
        store.dispatch({ type: 'DIVE_PREP_SELECT_CREW', crewId: null });
        break;
    }
  }

  feedbackLayer.update(dt);
}

export function handleHardwareSelectPanel(
  state: GameState,
  store: GameStore,
  meta: MetaState,
  mx: number,
  my: number,
  dt: number,
): void {
  if (state.lastPanelAction === null) {
    resetHardwareSelect();
  }
  const selectAction = renderHardwareSelectPanel(meta, meta.divePrep, mx, my, dt);

  if (selectAction !== null) {
    state.lastPanelAction = selectAction.type;

    switch (selectAction.type) {
      case 'CLOSE_HARDWARE_SELECT':
        state.setScreen('hub');
        break;
      case 'EQUIP_HARDWARE_FOR_DIVE':
        store.dispatch({ type: 'DIVE_PREP_EQUIP_HARDWARE', slot: selectAction.slot, itemId: selectAction.itemId });
        break;
    }
  }

  feedbackLayer.update(dt);
}
