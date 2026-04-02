/**
 * Intro Wake Scene — Branching Narrative State Machine
 *
 * First-time players: full meteor impact opening with VALU/JAX dialogue,
 * two choice nodes, terminal outcome, and recap card.
 * Returning players: "Previously" summary card then hub.
 *
 * Renders a random cryo chamber background with character sprites
 * (Narrator for VALU, Software Developer for PLAYER) positioned
 * above a bottom-anchored dialogue box.
 */

import { MakkoEngine } from '@makko/engine';
import { BaseScene } from '../../scene/base-scene';
import { GameStore } from '../../app/game-store';
import {
  INTRO_NODES,
  INTRO_BRANCH_MAP,
  TERMINAL_NODES,
  INTRO_OUTCOMES,
  IntroNode,
  IntroTerminalOutcome,
  IntroSpeaker,
} from '../../content/intro-narrative';
import { rollOutcome } from '../../content/intro-outcome-roller';
import { Stage, AlarmFlashState } from './types';
import {
  CHAR_ANCHOR_Y,
  NARRATOR_CHAR_X,
  SDE_CHAR_X,
  CHAR_SCALE,
  NARRATOR_CHAR_SCALE,
  TYPEWRITER_CHARS_PER_MS,
  DIALOGUE_FADE_MS,
} from './layout';
import { createAlarmFlash, updateAlarmFlash, renderAlarmFlash } from './alarm-flash';
import { renderPreviouslyPanel } from './previously-panel';
import { renderSpeakerBadge, renderDialogueBox } from './dialogue-renderer';
import { getChoiceCardRects, renderChoicesPanel, triggerIntroCardBeams } from './choices-renderer';
import { updateCardAlphas } from '../../ui/dive-renderer/state';
import { renderRecapPanel } from './recap-panel';


/** Final series cryo chamber background asset keys (9 variants). */
const CRYO_BACKGROUNDS = [
  'ss-background-cryochamber-final',
  'ss-background-cryochamber-final-2',
  'ss-background-cryochamber-final-3',
  'ss-background-cryochamber-final-4',
  'ss-background-cryochamber-final-5',
  'ss-background-cryochamber-final-6',
  'ss-background-cryochamber-final-7',
  'ss-background-cryochamber-final-8',
  'ss-background-cryochamber-final-9',
];

function pickRandomCryoBg(): string {
  return CRYO_BACKGROUNDS[Math.floor(Math.random() * CRYO_BACKGROUNDS.length)];
}

/** Escape bridge node that delivers the void echo line before fading. */
const ESCAPE_BRIDGE_ID = 'escape_bridge';
const REPAIR_BRIDGE_ID = 'repair_bridge';

export class IntroWakeScene extends BaseScene {
  readonly id = 'intro_wake_scene';

  private store: GameStore;

  // Background
  private cryoBgKey = '';

  // Character sprites
  private narratorChar: ReturnType<typeof MakkoEngine.sprite> | null = null;
  private sdeChar: ReturnType<typeof MakkoEngine.sprite> | null = null;
  private currentSpeaker: IntroSpeaker = 'VALU';

  // Stage state
  private stage: Stage = 'opening';
  private currentNodeId: string = '';
  private currentNode: IntroNode | null = null;
  private currentLineIndex: number = 0;

  // Typewriter state
  private typewriterElapsed: number = 0;
  private typewriterComplete: boolean = false;
  private displayedText: string = '';

  // Choice state
  private awaitingChoice: boolean = false;
  private hoveredChoice: number = -1;
  private mouseDownOnChoice: number = -1;

  // Outcome state
  private pendingOutcome: IntroTerminalOutcome | null = null;
  private rollSeed: number = 0;

  // Visual effects
  private alarmFlash: AlarmFlashState = {
    active: false,
    flashCount: 0,
    elapsedMs: 0,
  };

  // Fade state — used to fade dialogue box out before showing choice cards
  private fadeElapsed: number = 0;

  constructor(store: GameStore) {
    super();
    this.store = store;
  }

  init(): void {}

  enter(previousScene?: string): void {
    MakkoEngine.input.capture(['Space', 'Enter']);

    // Pick random cryo background
    this.cryoBgKey = pickRandomCryoBg();

    // Load character sprites
    if (MakkoEngine.isCharacterLoaded('sci_fi_narrator_narratorcore')) {
      this.narratorChar = MakkoEngine.sprite('sci_fi_narrator_narratorcore');
    }
    if (MakkoEngine.isCharacterLoaded('software_developer_devcore')) {
      this.sdeChar = MakkoEngine.sprite('software_developer_devcore');
    }

    const meta = this.store.getState().meta;
    if (meta.openingPathChosen !== false) {
      this.stage = 'previously';
    } else {
      this.stage = 'opening';
      this.rollSeed = 0;
      this.loadNode('opening_combined');
      this.alarmFlash = createAlarmFlash();
    }
  }

  exit(nextScene?: string): void {
    MakkoEngine.input.releaseCapture(['Space', 'Enter']);
  }

  update(dt: number): void {
    // Update card alpha animations (for intro choice cards)
    updateCardAlphas(dt);

    // Update character sprites
    if (this.narratorChar) this.narratorChar.update(dt);
    if (this.sdeChar) this.sdeChar.update(dt);

    if (this.alarmFlash.active) {
      updateAlarmFlash(this.alarmFlash, dt);
    }

    switch (this.stage) {
      case 'previously':
        this.updatePreviously();
        break;
      case 'opening':
      case 'terminal_lines':
        this.updateDialogue(dt);
        break;
      case 'fading_to_choice':
        this.updateFade(dt);
        break;
      case 'choice_1':
      case 'bridge':
        if (this.awaitingChoice) {
          this.updateChoiceInput();
        } else {
          this.updateDialogue(dt);
        }
        break;
      case 'recap':
        this.updateRecap();
        break;

      case 'done':
        this.switchTo('station_scene');
        break;
    }
  }

  render(): void {
    const display = MakkoEngine.display;
    const now = Date.now();

    display.beginFrame();
    display.clear('#0a0d14');

    switch (this.stage) {
      case 'previously':
        renderPreviouslyPanel(display, this.store);
        break;
      case 'opening':
      case 'terminal_lines':
        this.renderBackground();
        this.renderCharacterSprites(1);
        this.renderDialogue();
        break;
      case 'fading_to_choice': {
        const fadeAlpha = Math.max(0, 1 - this.fadeElapsed / DIALOGUE_FADE_MS);
        const charAlpha = Math.max(0.1, 1 - this.fadeElapsed / DIALOGUE_FADE_MS);
        this.renderBackground();
        this.renderCharacterSprites(charAlpha);
        this.renderDialogueWithAlpha(fadeAlpha);
        // Don't render cards during fade - wait for choice_1/bridge stage
        break;
      }
      case 'choice_1':
      case 'bridge':
        this.renderBackground();
        if (this.awaitingChoice) {
          this.renderCharacterSprites(0.1);
          renderChoicesPanel(display, this.currentNode!.choices, this.hoveredChoice, this.mouseDownOnChoice, now);
        } else {
          this.renderCharacterSprites(1);
          this.renderDialogue();
        }
        break;
      case 'recap':
        if (this.pendingOutcome) {
          renderRecapPanel(display, this.pendingOutcome);
        }
        break;

    }

    if (this.alarmFlash.active) {
      renderAlarmFlash(this.alarmFlash);
    }

    display.endFrame();
  }

  // ── Rendering Helpers ──────────────────────────────────────────────────────

  private renderBackground(): void {
    const display = MakkoEngine.display;
    const bg = MakkoEngine.staticAsset(this.cryoBgKey);
    if (bg) {
      // Scale to fill 1920x1080 canvas regardless of source image dimensions
      display.drawImage(bg.image, 0, 0, 1920, 1080);
    } else {
      display.clear('#0a0d14');
    }
  }

  private renderCharacterSprites(alpha: number): void {
    const display = MakkoEngine.display;

    if (this.currentSpeaker === 'VALU' && this.narratorChar) {
      this.narratorChar.draw(display, NARRATOR_CHAR_X, CHAR_ANCHOR_Y, {
        scale: NARRATOR_CHAR_SCALE,
        alpha,
      });
    } else if (this.currentSpeaker === 'PLAYER' && this.sdeChar) {
      this.sdeChar.draw(display, SDE_CHAR_X, CHAR_ANCHOR_Y, {
        scale: CHAR_SCALE,
        alpha,
      });
    }
  }

  private setSpeaker(speaker: IntroSpeaker, force = false): void {
    if (!force && this.currentSpeaker === speaker) return;
    this.currentSpeaker = speaker;

    if (speaker === 'VALU') {
      if (this.narratorChar && this.narratorChar.hasAnimation('sci_fi_narrator_zoomnarrate_default')) {
        this.narratorChar.play('sci_fi_narrator_zoomnarrate_default', true);
      }
      if (this.sdeChar) this.sdeChar.stop();
    } else {
      if (this.sdeChar && this.sdeChar.hasAnimation('software_developer_headshottalking_default')) {
        this.sdeChar.play('software_developer_headshottalking_default', true);
      }
      if (this.narratorChar) this.narratorChar.stop();
    }
  }

  // ── Stage Updates ──────────────────────────────────────────────────────────

  private updatePreviously(): void {
    const input = MakkoEngine.input;
    if (input.isKeyPressed('Space') || input.isKeyPressed('Enter') || input.isMousePressed(0)) {
      this.stage = 'done';
    }
  }

  private updateDialogue(dt: number): void {
    const input = MakkoEngine.input;
    if (!this.currentNode) return;

    const lines = this.currentNode.lines;
    if (lines.length === 0) return;

    const currentLine = lines[this.currentLineIndex];
    if (!currentLine) return;

    this.setSpeaker(currentLine.speaker);

    // Typewriter effect
    if (!this.typewriterComplete) {
      this.typewriterElapsed += dt;
      const charCount = Math.floor(this.typewriterElapsed * TYPEWRITER_CHARS_PER_MS * 1000);
      this.displayedText = currentLine.text.substring(0, charCount);
      this.typewriterComplete = charCount >= currentLine.text.length;
    }

    // Advance input
    if (input.isKeyPressed('Space') || input.isKeyPressed('Enter')) {
      if (!this.typewriterComplete) {
        this.displayedText = currentLine.text;
        this.typewriterComplete = true;
      } else {
        this.advanceLine();
      }
    }
  }

  private updateFade(dt: number): void {
    this.fadeElapsed += dt;
    if (this.fadeElapsed >= DIALOGUE_FADE_MS) {
      // Trigger beam-in animations BEFORE making cards visible
      if (this.currentNode) {
        triggerIntroCardBeams(this.currentNode.choices);
      }
      this.awaitingChoice = true;
      // Stay in bridge stage for escape_bridge / repair_bridge
      if (this.currentNodeId === ESCAPE_BRIDGE_ID || this.currentNodeId === REPAIR_BRIDGE_ID) {
        this.stage = 'bridge';
      } else {
        this.stage = 'choice_1';
      }
    }
  }

  private updateChoiceInput(): void {
    const input = MakkoEngine.input;
    if (!this.currentNode) return;

    const choices = this.currentNode.choices;
    const mx = input.mouseX;
    const my = input.mouseY;
    const rects = getChoiceCardRects(choices.length);

    this.hoveredChoice = -1;
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
        this.hoveredChoice = i;
        break;
      }
    }

    if (input.isMousePressed(0)) {
      this.mouseDownOnChoice = this.hoveredChoice;
    }
    if (input.isMouseReleased(0)) {
      if (this.mouseDownOnChoice !== -1 && this.mouseDownOnChoice === this.hoveredChoice) {
        this.selectChoice(choices[this.mouseDownOnChoice].id);
      }
      this.mouseDownOnChoice = -1;
    }
  }

  private updateRecap(): void {
    const input = MakkoEngine.input;
    if (input.isKeyPressed('Space') || input.isKeyPressed('Enter') || input.isMousePressed(0)) {
      if (this.pendingOutcome) {
        this.store.dispatch({ type: 'APPLY_INTRO_OUTCOME', outcome: this.pendingOutcome });
      }
      
      this.stage = 'done';
    }
  }



  // ── Node Management ────────────────────────────────────────────────────────

  private loadNode(nodeId: string): void {
    this.currentNodeId = nodeId;
    this.currentNode = INTRO_NODES[nodeId] ?? null;
    this.currentLineIndex = 0;
    this.typewriterElapsed = 0;
    this.typewriterComplete = false;
    this.displayedText = '';

    if (this.currentNode && this.currentNode.lines.length === 0) {
      this.awaitingChoice = this.currentNode.choices.length > 0;
    } else {
      this.awaitingChoice = false;
    }

    if (this.currentNode && this.currentNode.lines.length > 0) {
      this.setSpeaker(this.currentNode.lines[0].speaker, true);
    }
  }

  /**
   * Check if the current node is a bridge node (has one line of dialogue
   * followed by choices) that should fade the dialogue box before revealing cards.
   */
  private isBridgeWithFade(): boolean {
    if (!this.currentNode) return false;
    return (this.currentNodeId === ESCAPE_BRIDGE_ID || this.currentNodeId === REPAIR_BRIDGE_ID);
  }

  private advanceLine(): void {
    if (!this.currentNode) return;

    const lines = this.currentNode.lines;
    this.currentLineIndex++;

    if (this.currentLineIndex >= lines.length) {
      if (this.currentNode.choices.length > 0) {
        // If this is a bridge node with dialogue before choices, fade first
        if (this.isBridgeWithFade()) {
          this.fadeElapsed = 0;
          this.stage = 'fading_to_choice';
        } else {
          // Trigger beam-in for non-fade choice transitions too
          triggerIntroCardBeams(this.currentNode.choices);
          this.awaitingChoice = true;
          this.stage = 'choice_1';
        }
      } else if (TERMINAL_NODES.has(this.currentNodeId)) {
        this.pendingOutcome = INTRO_OUTCOMES[this.currentNodeId] ?? null;
        this.stage = 'recap';
      } else if (this.currentNode.nextNodeId) {
        const nextId = this.currentNode.nextNodeId;
        this.loadNode(nextId);
        const nextNode = INTRO_NODES[nextId];
        if (nextNode && nextNode.lines.length === 0 && nextNode.choices.length > 0) {
          // Trigger beam-in animations BEFORE making cards visible
          triggerIntroCardBeams(nextNode.choices);
          this.awaitingChoice = true;
          this.stage = 'choice_1';
        } else {
          this.stage = 'opening';
        }
      } else {
        this.stage = 'done';
      }
    } else {
      this.typewriterElapsed = 0;
      this.typewriterComplete = false;
      this.displayedText = '';
    }
  }

  private selectChoice(choiceId: string): void {
    const nextNodeId = INTRO_BRANCH_MAP[choiceId];
    if (!nextNodeId) {
      console.warn(`[IntroWakeScene] No branch mapping for choice: ${choiceId}`);
      return;
    }

    this.loadNode(nextNodeId);

    if (TERMINAL_NODES.has(nextNodeId)) {
      const nextNode = this.currentNode;

      if (nextNode && nextNode.lines.length === 0) {
        this.rollSeed = (Date.now() ^ (Math.random() * 0xffffffff)) | 0;
        const rolled = rollOutcome(nextNodeId, this.rollSeed);

        if (rolled) {
          this.pendingOutcome = {
            ...INTRO_OUTCOMES[nextNodeId],
            rolledCredits: rolled.credits,
            rolledVoidEcho: rolled.voidEcho,
            shipStateStart: rolled.shipState,
            bonuses: rolled.bonuses,
          };
        } else {
          this.pendingOutcome = INTRO_OUTCOMES[nextNodeId] ?? null;
        }

        this.stage = 'recap';
      } else {
        this.stage = 'terminal_lines';
        this.pendingOutcome = INTRO_OUTCOMES[nextNodeId] ?? null;
      }
    } else {
      this.stage = 'bridge';
      this.awaitingChoice = true;
      // Trigger beam-in animations for bridge node choices
      if (this.currentNode && this.currentNode.choices.length > 0) {
        triggerIntroCardBeams(this.currentNode.choices);
      }
    }
  }

  private renderDialogue(): void {
    const display = MakkoEngine.display;
    if (!this.currentNode) return;

    const lines = this.currentNode.lines;
    if (lines.length === 0) return;

    const currentLine = lines[this.currentLineIndex];
    if (!currentLine) return;

    renderSpeakerBadge(display, currentLine.speaker);
    renderDialogueBox(display, this.displayedText, this.typewriterComplete, this.awaitingChoice);
  }

  private renderDialogueWithAlpha(alpha: number): void {
    const display = MakkoEngine.display;
    if (!this.currentNode) return;

    const lines = this.currentNode.lines;
    if (lines.length === 0) return;

    // Use last line for the fading display
    const lastLine = lines[lines.length - 1];
    if (!lastLine) return;

    renderSpeakerBadge(display, lastLine.speaker, alpha);
    renderDialogueBox(display, lastLine.text, true, false, alpha);
  }

}
