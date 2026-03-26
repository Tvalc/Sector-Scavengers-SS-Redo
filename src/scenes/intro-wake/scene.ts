/**
 * Intro Wake Scene — Branching Narrative State Machine
 *
 * First-time players: full meteor impact opening with VALU/JAX dialogue,
 * two choice nodes, terminal outcome, and recap card.
 * Returning players: "Previously" summary card then hub.
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
} from '../../content/intro-narrative';
import { Stage, AlarmFlashState } from './types';
import { TYPEWRITER_CHARS_PER_MS } from './layout';
import { createAlarmFlash, updateAlarmFlash, renderAlarmFlash } from './alarm-flash';
import { renderPreviouslyPanel } from './previously-panel';
import { renderSpeakerBadge, renderDialogueBox } from './dialogue-renderer';
import { getChoiceCardRects, renderChoicesPanel } from './choices-renderer';
import { renderRecapPanel } from './recap-panel';

export class IntroWakeScene extends BaseScene {
  readonly id = 'intro_wake_scene';

  private store: GameStore;

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

  // Visual effects
  private alarmFlash: AlarmFlashState = {
    active: false,
    flashCount: 0,
    elapsedMs: 0,
  };

  constructor(store: GameStore) {
    super();
    this.store = store;
  }

  init(): void {}

  enter(previousScene?: string): void {
    MakkoEngine.input.capture(['Space', 'Enter']);

    const meta = this.store.getState().meta;
    if (meta.openingPathChosen !== false) {
      this.stage = 'previously';
    } else {
      this.stage = 'opening';
      this.loadNode('opening');
      this.alarmFlash = createAlarmFlash();
    }
  }

  exit(nextScene?: string): void {
    MakkoEngine.input.releaseCapture(['Space', 'Enter']);
  }

  update(dt: number): void {
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
        this.switchTo('game_scene');
        break;
    }
  }

  render(): void {
    const display = MakkoEngine.display;

    display.beginFrame();
    display.clear('#0a0d14');

    switch (this.stage) {
      case 'previously':
        renderPreviouslyPanel(display, this.store);
        break;
      case 'opening':
      case 'terminal_lines':
        this.renderDialogue();
        break;
      case 'choice_1':
      case 'bridge':
        if (this.awaitingChoice) {
          renderChoicesPanel(display, this.currentNode!.choices, this.hoveredChoice, this.mouseDownOnChoice);
        } else {
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

  // ── Stage Updates ────────────────────────────────────────────────────────────

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

  // ── Node Management ──────────────────────────────────────────────────────────

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
  }

  private advanceLine(): void {
    if (!this.currentNode) return;

    const lines = this.currentNode.lines;
    this.currentLineIndex++;

    if (this.currentLineIndex >= lines.length) {
      if (this.currentNode.choices.length > 0) {
        this.awaitingChoice = true;
      } else if (TERMINAL_NODES.has(this.currentNodeId)) {
        this.pendingOutcome = INTRO_OUTCOMES[this.currentNodeId] ?? null;
        this.stage = 'recap';
      } else if (this.currentNode.nextNodeId) {
        const nextId = this.currentNode.nextNodeId;
        this.loadNode(nextId);
        const nextNode = INTRO_NODES[nextId];
        if (nextNode && nextNode.lines.length === 0 && nextNode.choices.length > 0) {
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
      this.stage = 'terminal_lines';
      this.pendingOutcome = INTRO_OUTCOMES[nextNodeId] ?? null;
    } else {
      this.stage = 'bridge';
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
}
