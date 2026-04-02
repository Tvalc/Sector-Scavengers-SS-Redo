import type { IntroBonus } from './intro-narrative';

// ===== TYPES =====

export interface CrewVoiceLine {
  speaker: string;   // Display name e.g. "IMANI", "VALU"
  line: string;
}

// ===== CREW RESCUED LINES =====

const CREW_RESCUED_LINES: Record<string, CrewVoiceLine> = {
  jax: {
    speaker: 'JAX',
    line: "Cryo hangover's worse than I remembered. What are we stripping?",
  },
  del: {
    speaker: 'DEL',
    line: "Smart move. My contacts are worth more than the debt you just absorbed.",
  },
  imani: {
    speaker: 'IMANI',
    line: "Still breathing. That's more than I expected. I'll make sure your margins hold.",
  },
  sera: {
    speaker: 'SERA',
    line: "You didn't have to come back for me. I'll make sure that costs you nothing.",
  },
  rook: {
    speaker: 'ROOK',
    line: "Solid call. I'll earn my place.",
  },
  max: {
    speaker: 'MAX',
    line: "Systems are holding. I'll keep them that way.",
  },
};

// ===== VALU SOLO FALLBACK =====

export const VALU_SOLO: CrewVoiceLine = {
  speaker: 'VALU',
  line: 'No crew recovered. Manifested cargo event logged. Dock clearance granted.',
};

// ===== GET LINE FOR CREW =====

export function getRescuedLine(crewId: string): CrewVoiceLine {
  return CREW_RESCUED_LINES[crewId] ?? VALU_SOLO;
}

// ===== GET PRIMARY SPEAKER FROM BONUSES =====

export function getPrimaryRescuedSpeaker(bonuses: IntroBonus[]): CrewVoiceLine {
  const crewBonus = bonuses.find((b): b is { type: 'crew'; crewId: string } => b.type === 'crew');

  if (crewBonus) {
    return getRescuedLine(crewBonus.crewId);
  }

  return VALU_SOLO;
}

// ===== GET SPEAKER FOR OPENING PATH =====

export function getPathRescuedSpeaker(pathId: string): CrewVoiceLine {
  switch (pathId) {
    case 'cut_and_run':
      return getRescuedLine('jax');
    case 'duty_claim':
      return getRescuedLine('max');
    case 'cold_extract':
    default:
      return VALU_SOLO;
  }
}

// ===== CREW LORE FRAGMENTS =====
// Three fragments per crew: [before cryo, the freezing, what they want now]

import type { CrewMemberId } from './crew';

// ===== CREW EXTRACTION REACTIONS =====
// Reactions based on player's declare vs smuggle ratio during extraction.

export interface ExtractionReactions {
  /** Player declared most salvage (high compliance) */
  mostlyDeclared: string;
  /** Mixed approach — pragmatic, balanced */
  balanced: string;
  /** Player smuggled most salvage (defiant) */
  mostlySmuggled: string;
}

export const CREW_EXTRACTION_REACTIONS: Record<CrewMemberId, ExtractionReactions> = {
  // Imani — corporate, values compliance and order
  imani: {
    mostlyDeclared: "The Company notes your compliance. I note that you understand which side of this equation actually feeds you.",
    balanced: "Pragmatic. The books balance, the cargo moves, and everyone survives another cycle. That's sustainability.",
    mostlySmuggled: "Every hidden crate is a liability we all share. When the audit comes—when, not if—that weight falls on all of us.",
  },
  // Max — cooperative, practical, appreciates playing it safe
  max: {
    mostlyDeclared: "Good. Less trouble at the dock, less time explaining ourselves to inspectors. I can work with this.",
    balanced: "Some risks, some caution. That's the math that keeps a ship flying. I don't love it, but I respect it.",
    mostlySmuggled: "You're betting against the house. The house usually wins. But if you're going to bet, at least hide it well.",
  },
  // Jax — smuggler, encourages resistance to the system
  jax: {
    mostlyDeclared: "You're paying them to own you faster. I've seen that movie. It doesn't have a happy ending.",
    balanced: "Hedge your bets if you need to. Just remember: every credit you give them is a credit they use to tighten the collar.",
    mostlySmuggled: "Good. Nexus doesn't need to know everything. The best crews operate in the spaces between the manifest lines.",
  },
  // Sera — cooperative, protective, worried about crew safety
  sera: {
    mostlyDeclared: "The safest path through a minefield is the one everyone else walked first. I can live with safe.",
    balanced: "Some risks can't be avoided. I just want you to know exactly what you're risking before you roll the dice.",
    mostlySmuggled: "I don't care about their audits. I care about what happens to us if they catch you. Please—be careful.",
  },
  // Rook — corporate, security-minded, warns about consequences
  rook: {
    mostlyDeclared: "Clean manifest, clear conscience. The system rewards predictability, and you're playing the right game.",
    balanced: "You can't be all one thing. I get it. Just keep your paperwork straight and your eyes open.",
    mostlySmuggled: "I've seen what happens to crews who get too clever. The audit room has no windows. Think about that.",
  },
  // Del — smuggler, pragmatic, focused on long-term profit
  del: {
    mostlyDeclared: "There's conservative, and there's leaving money on the table. You're trending toward the second one.",
    balanced: "Smart. Diversify your risk profile. Some declared, some... deferred. That's portfolio management.",
    mostlySmuggled: "The best deals are the ones they don't know to tax. Just make sure your buyer is as quiet as you are.",
  },
  // Vex — corporate, efficiency-focused, tech-oriented
  vex: {
    mostlyDeclared: "Streamlined. Efficient. No loose ends to tangle in the machinery later. This is how systems survive.",
    balanced: "Some visible, some hidden. Redundancy in your accounting. I appreciate the engineering of it.",
    mostlySmuggled: "Unlogged inventory. Ghost assets. I've built things from less. Just don't let the auditors trace the circuitry.",
  },
  // Nyx — smuggler, philosophical, views the system as the real enemy
  nyx: {
    mostlyDeclared: "You can't shield yourself from a system you keep feeding. Eventually it grows teeth big enough to bite.",
    balanced: "Protection comes in layers. Some visible, some buried deep. I understand building walls within walls.",
    mostlySmuggled: "What they don't catalog, they can't take. The void taught me that. Keep your true valuables invisible.",
  },
};

/**
 * Get a crew member's reaction to extraction decisions.
 *
 * @param crewId — The crew member ID
 * @param declaredRatio — Ratio of salvage declared (0.0 to 1.0)
 * @returns The appropriate voice line for their reaction
 */
export function getExtractionReaction(crewId: string, declaredRatio: number): CrewVoiceLine {
  const reactions = CREW_EXTRACTION_REACTIONS[crewId as CrewMemberId];
  if (!reactions) {
    return { speaker: 'UNKNOWN', line: '...' };
  }

  let reactionType: keyof ExtractionReactions;
  if (declaredRatio >= 0.7) {
    reactionType = 'mostlyDeclared';
  } else if (declaredRatio <= 0.3) {
    reactionType = 'mostlySmuggled';
  } else {
    reactionType = 'balanced';
  }

  const speaker = crewId.toUpperCase();
  return { speaker, line: reactions[reactionType] };
}

// ===== CREW LORE FRAGMENTS =====
// Three fragments per crew: [before cryo, the freezing, what they want now]

export const CREW_LORE_FRAGMENTS: Record<CrewMemberId, [string, string, string]> = {
  max: [
    "I was a structural engineer on the Meridian orbital platform. Good work. Honest work. When the Nexus contract came through I said no three times. The fourth time they restructured the platform's debt and I was collateral. I don't hold a grudge. I just fix things now.",
    "The last thing I felt was cold that started in my feet and moved up. The technician said 'this will feel like falling asleep.' It didn't. It felt like the building you're standing in slowly going dark, floor by floor.",
    "I want to fix something that stays fixed. Everything I've repaired out here just gets broken again. I'd like to fix one thing, one time, and have it stay that way. That's the whole ambition. Don't tell the others.",
  ],
  imani: [
    "I ran risk models for a living. Specifically, I modeled the risk of corporate debt restructuring events and sold the analysis to people who needed to make decisions. The irony of ending up as a line item in one of those events is not lost on me.",
    "I ran the probability of the cryo package working as advertised. Eighty-three percent chance of revival within fifty years. I didn't model for centuries. The dataset didn't have centuries. That was my mistake. I think about that.",
    "Accurate information. That's what I want. I have been lied to by contracts, by fine print, by probability distributions without proper time horizons. I want one true piece of information about what's actually happening out here. Everything else is secondary.",
  ],
  jax: [
    "I ran a salvage collective on Meridian Station. Eight people, three ships, zero debt. We turned down the Nexus contract twice. Third time they restructured our operating licenses. I went into cryo owing nothing to anyone. I woke up owing everything to a company that didn't exist when I fell asleep.",
    "I wasn't scared. I was angry. I was still angry when I went under. I think that's why I woke up fast. Anger keeps.",
    "I want my collective back. Different people, same idea. Eight of us, our ships, our call. Nobody files a manifest we didn't approve. That's not a dream. That's just a plan that hasn't happened yet.",
  ],
  sera: [
    "I was a trauma medic on a station with an industrial accident rate that made my skills necessary every single day. When the station was decommissioned I was listed as 'non-essential infrastructure.' I'd like whoever wrote that assessment to meet me in person.",
    "I spent the last six hours before cryo making sure everyone in my pod bay had what they needed. Medications logged. Emergency contacts filed. I was the last one under. The technician said 'we'll see you on the other side.' There wasn't another side. There was just more of this.",
    "Everybody gets home. That's the rule. I don't negotiate on it, I don't make exceptions, and I don't accept that some losses are acceptable. Acceptable losses is something people say when they've decided in advance who gets to be the loss.",
  ],
  rook: [
    "Security contractor. Fifteen years, twelve stations, three corporate restructurings. I've seen this play out before. The only difference this time is I didn't get out fast enough. My fault. I knew better.",
    "Cold. Then nothing. Then here. That's all I have. I don't dream in cryo. Some people do. I woke up and it was like no time had passed except everything was different and everyone I knew was dead. That part wasn't fast.",
    "I don't want much. I want everyone on this ship to still be alive when this is over. All of them. That's the whole plan. Don't laugh. Small plans are the only ones that work.",
  ],
  del: [
    "I brokered contracts for a living. Resource acquisition, debt instruments, logistics deals. I was very good at it. Good enough that when Nexus decided to liquidate my firm they did it quietly and quickly and I didn't see it coming. That still bothers me. I should have seen it coming.",
    "I negotiated my cryo terms down to a reasonable rate. Premium revival window, guaranteed debt ceiling. I have the contract. I have reviewed it several hundred times since waking up. The debt ceiling clause has seventeen sub-clauses. One of them says 'subject to restructuring events.' I missed that one.",
    "I want a deal I wrote. Not a deal someone else handed me. Not terms I accepted because the alternative was worse. One contract, my terms, signed by someone who actually read it. I'll know when I find it.",
  ],
  vex: [
    "I built things out of other things that people said couldn't be built. Salvage tech, jury-rigged systems, solutions that technically shouldn't work but did because nobody told them they weren't supposed to. I was very annoying to work for large corporations because I kept solving problems they preferred to keep unsolved.",
    "The cryo unit they put me in had three warning labels and a sticky note that said 'DO NOT USE — PENDING INSPECTION.' I didn't have options. It worked fine. Mostly fine. Some memory gaps. Nothing critical.",
    "I want to build something they can't take apart. Something that doesn't have a sub-clause. I've been thinking about what that looks like. I have some ideas. Some of them are probably illegal. That's fine.",
  ],
  nyx: [
    "I designed defensive systems. Shields, barriers, protective architecture. Everything I made was designed to keep things out. I was very good at it. The one system I couldn't shield was the contract I signed when I was twenty-two and didn't read carefully enough.",
    "The shield came down in layers. That's the metaphor. I kept the outside out as long as I could. Then I was inside the cryo unit and the outside was everything that had happened and I couldn't shield any of it anymore. I let it go. I've been letting it go since.",
    "I want to build something worth protecting. Not just protect what exists. Build something new that deserves a shield around it. I've been protecting other people's things my whole career. I want to protect something of my own.",
  ],
};
