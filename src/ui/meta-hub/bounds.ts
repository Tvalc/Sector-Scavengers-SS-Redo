import { VIEWPORT, START_BTN, NAV, NAV_BTN_W, NAV_BTN_H, NAV_START_X } from './core/constants';

export function getMetaHubBounds(): Record<string, { x: number; y: number; w: number; h: number }> {
  return {
    'start-dive-btn': { x: START_BTN.x, y: START_BTN.y, w: START_BTN.w, h: START_BTN.h },
    'card-collection-btn': { x: NAV_START_X, y: NAV.cardCollection, w: NAV_BTN_W, h: NAV_BTN_H },
    'research-btn': { x: NAV_START_X, y: NAV.research, w: NAV_BTN_W, h: NAV_BTN_H },
    'modules-btn': { x: NAV_START_X, y: NAV.stationModules, w: NAV_BTN_W, h: NAV_BTN_H },
    'crew-mgmt-btn': { x: NAV_START_X, y: NAV.crew, w: NAV_BTN_W, h: NAV_BTN_H },
    'ships-mgmt-btn': { x: NAV_START_X, y: NAV.ships, w: NAV_BTN_W, h: NAV_BTN_H },
    'void-shop-btn': { x: NAV_START_X, y: NAV.voidShop, w: NAV_BTN_W, h: NAV_BTN_H },
    'void-communion-btn': { x: NAV_START_X, y: NAV.voidCommunion, w: NAV_BTN_W, h: NAV_BTN_H },
    'ships-viewport': { x: VIEWPORT.ship.x, y: VIEWPORT.ship.y, w: VIEWPORT.ship.w, h: VIEWPORT.ship.h },
    'crew-viewport': { x: VIEWPORT.crew.x, y: VIEWPORT.crew.y, w: VIEWPORT.crew.w, h: VIEWPORT.crew.h },
    'hardware-viewport': { x: VIEWPORT.hardware.x, y: VIEWPORT.hardware.y, w: VIEWPORT.hardware.w, h: VIEWPORT.hardware.h },
  };
}
