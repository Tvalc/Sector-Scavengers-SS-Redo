import type { DoctrineId } from './doctrine';

export type SignalChoiceEffect =
  | { type: 'credits'; amount: number }
  | { type: 'hull'; amount: number }
  | { type: 'debt'; amount: number }
  | { type: 'void_echo'; amount: number }
  | { type: 'add_card_to_deck'; cardId: string }
  | { type: 'hardware_find' }
  | { type: 'doctrine'; alignment: DoctrineId; points: number }
  | { type: 'lore_fragment'; tag: string }
  | { type: 'audit_reduction'; amount: number }
  | { type: 'salvage'; tier: 'scrap' | 'components' | 'relic' | 'medtech'; amount: number };

export interface SignalChoice {
  label: string;
  description: string;
  effects: SignalChoiceEffect[];
  requiresHull?: number;
  requiresCredits?: number;
}

export interface Signal {
  id: string;
  title: string;
  transmission: string;
  choices: SignalChoice[];
}

export const SIGNALS: Signal[] = [
  {
    id: 'distress_beacon',
    title: 'Distress Beacon',
    transmission: "SC-PILGRIM, this is pod cluster 7-Bravo. Life support at 4%. If anyone is receiving this — we were told the rescue contract was filed. We were told someone was coming. We paid for the premium package. It said someone would come.",
    choices: [
      {
        label: 'Investigate',
        description: 'Send a probe to the source.',
        effects: [
          { type: 'hull', amount: -10 },
          { type: 'credits', amount: 6000 },
          { type: 'lore_fragment', tag: 'beacon_01' },
        ],
      },
      {
        label: 'Ignore',
        description: 'Maintain course.',
        effects: [],
      },
    ],
  },
  {
    id: 'corporate_drone',
    title: 'Corporate Drone',
    transmission: "Attention salvage unit. You are operating in a Nexus Logistics manifest zone. Failure to submit Form 7-Delta within this transmission window will result in automatic debt escalation. This is your second notice. Your first notice was sent 340 years ago. Have a compliant day.",
    choices: [
      {
        label: 'Comply',
        description: 'Submit the forms.',
        effects: [
          { type: 'debt', amount: -10000 },
          { type: 'add_card_to_deck', cardId: 'analyze' },
        ],
      },
      {
        label: 'Jam',
        description: 'Interfere with the signal.',
        effects: [
          { type: 'hull', amount: -10 },
          { type: 'doctrine', alignment: 'smuggler', points: 1 },
        ],
      },
    ],
  },
  {
    id: 'ghost_frequency',
    title: 'Ghost Frequency',
    transmission: "Broadcast date: cycle 3,847. If you're hearing this, the decommission order didn't take. I hid the frequency in the cooling array. They said the ship was empty when they filed the salvage claim. The ship was not empty. I want that on the record. Somewhere. The ship was not empty.",
    choices: [
      {
        label: 'Tune in',
        description: 'Listen to the broadcast.',
        effects: [
          { type: 'void_echo', amount: 2 },
          { type: 'add_card_to_deck', cardId: 'ancestor_memory' },
          { type: 'lore_fragment', tag: 'ghost_01' },
        ],
      },
      {
        label: 'Maintain silence',
        description: 'Ignore the signal.',
        effects: [],
      },
    ],
  },
  {
    id: 'salvage_claim',
    title: 'Salvage Claim',
    transmission: "AUTOMATED BOUNDARY ASSERTION — Sector 7-F is under active salvage claim by crew designation ECHO-9. Yield or contest. Note: ECHO-9 has not responded to hailing on any channel in 14 cycles. Yield or contest. The claim is still valid. Yield or contest.",
    choices: [
      {
        label: 'Contest',
        description: 'Assert your claim.',
        effects: [
          { type: 'credits', amount: 7000 },
          { type: 'hull', amount: -15 },
        ],
      },
      {
        label: 'Yield',
        description: 'Let them have it.',
        effects: [
          { type: 'credits', amount: 3000 },
        ],
      },
    ],
  },
  {
    id: 'black_market_relay',
    title: 'Black Market Relay',
    transmission: "No origin stamp. No manifest trail. The goods are real, the price is debt, and everything out here is debt anyway so what's the difference. Waypoint 7 if you want it. Don't come if you don't. We don't follow up.",
    choices: [
      {
        label: 'Accept',
        description: 'Make the deal.',
        effects: [
          { type: 'hardware_find' },
          { type: 'debt', amount: 10000 },
        ],
      },
      {
        label: 'Decline',
        description: 'Too risky.',
        effects: [],
      },
    ],
  },
  {
    id: 'crew_transmission',
    title: 'Crew Transmission',
    transmission: "Hello? Is — I don't know where I am. The pod interface says I've been in cryo for ten thousand and four years. That's not — that number can't be right. I paid for the standard package. Twenty years maximum. It said twenty years. Can someone tell me what year it is. Please. Someone please tell me what year it is.",
    choices: [
      {
        label: 'Reply',
        description: 'Try to communicate.',
        effects: [
          { type: 'doctrine', alignment: 'cooperative', points: 1 },
          { type: 'hull', amount: 12 },
          { type: 'lore_fragment', tag: 'cryo_voice_01' },
        ],
      },
      {
        label: 'Ignore',
        description: "It's just interference.",
        effects: [],
      },
    ],
  },
  {
    id: 'corporate_offer',
    title: 'Corporate Offer',
    transmission: "This is Nexus Collections, Debt Restructuring Division. We are pleased to offer renegotiation at preferential rates in exchange for a modest alignment agreement. The terms are generous. We find compliant operators significantly easier to process than contested estates. Your cooperation is, as always, optional. So is your continued operation.",
    choices: [
      {
        label: 'Accept',
        description: 'Sign the agreement.',
        effects: [
          { type: 'debt', amount: -20000 },
          { type: 'doctrine', alignment: 'corporate', points: 2 },
        ],
      },
      {
        label: 'Refuse',
        description: "You don't trust them.",
        effects: [
          { type: 'doctrine', alignment: 'smuggler', points: 1 },
          { type: 'lore_fragment', tag: 'refuse_01' },
        ],
      },
    ],
  },
  {
    id: 'derelict_log',
    title: 'Derelict Log',
    transmission: "Day 40. Kestrel is gone. I told her to take the last ration. She said she wasn't hungry. She was lying. I'm recording this because someone should know we were here. We had names. We had a plan. The plan had a flaw we didn't find until day 12. I want someone to know we were here and we tried and the plan almost worked.",
    choices: [
      {
        label: 'Recover log',
        description: 'Take the data.',
        effects: [
          { type: 'credits', amount: 3000 },
          { type: 'lore_fragment', tag: 'derelict_log_01' },
        ],
      },
      {
        label: 'Salvage only',
        description: 'Take what you can carry.',
        effects: [
          { type: 'credits', amount: 5500 },
        ],
      },
    ],
  },
  {
    id: 'void_anomaly',
    title: 'Void Anomaly',
    transmission: "[ORIGIN: UNRESOLVED] [TYPE: UNCLASSIFIED] you are not the first crew to find this coordinate and you will not be the last and the thing you are looking for is not here but you already suspected that didn't you come back when you know what you're actually looking for",
    choices: [
      {
        label: 'Approach',
        description: 'Investigate.',
        effects: [
          { type: 'void_echo', amount: 3 },
          { type: 'hull', amount: -15 },
          { type: 'lore_fragment', tag: 'anomaly_01' },
        ],
      },
      {
        label: 'Retreat',
        description: 'Stay safe.',
        effects: [],
      },
    ],
  },
  {
    id: 'union_frequency',
    title: 'Union Frequency',
    transmission: "Brothers and sisters in debt. You are not equipment. You are not a liability entry on a corporate ledger. They froze you because you were inconvenient and they thawed you because you were useful and the distance between those two things is the only leverage you will ever have. They are counting on you not to notice it. Notice it.",
    choices: [
      {
        label: 'Listen',
        description: 'Hear them out.',
        effects: [
          { type: 'doctrine', alignment: 'smuggler', points: 2 },
          { type: 'doctrine', alignment: 'cooperative', points: 1 },
          { type: 'lore_fragment', tag: 'union_01' },
        ],
      },
      {
        label: 'Report',
        description: 'Tell the corporation.',
        effects: [
          { type: 'debt', amount: -5000 },
          { type: 'doctrine', alignment: 'corporate', points: 1 },
        ],
      },
    ],
  },
  // ===== MID-RUN ASSESSMENT SIGNALS =====
  // These force players to consider their growing haul before extraction
  {
    id: 'assessment_nexus_drone',
    title: 'Assessment Drone',
    transmission: "Nexus Logistics automated assessment drone requesting manifest synchronization. Current scan estimates your unlogged cargo at moderate volume. Compliance option: transmit partial inventory now for reduced scrutiny rating. Non-compliance: full audit risk applies at extraction. Your call, SC-PILGRIM. The drone will not ask twice.",
    choices: [
      {
        label: 'Transmit Partial',
        description: 'Declare some cargo now for reduced audit risk.',
        effects: [
          { type: 'credits', amount: -3000 },
          { type: 'audit_reduction', amount: 10 },
          { type: 'doctrine', alignment: 'corporate', points: 1 },
        ],
      },
      {
        label: 'Stay Silent',
        description: 'Keep everything hidden, accept full audit risk.',
        effects: [
          { type: 'doctrine', alignment: 'smuggler', points: 1 },
        ],
      },
    ],
  },
  {
    id: 'assessment_black_market_ping',
    title: 'Shadow Trader Ping',
    transmission: "Encrypted burst from unidentified vessel. Message reads: \"We see your haul, SC-PILGRIM. The big items are hard to hide. Offer: one significant piece comes to us now, we vouch your manifest looks lighter than it is. Our word carries weight in certain dock circles. -S\"",
    choices: [
      {
        label: 'Pay the Trader',
        description: 'Give 1 Relic for -15% audit risk and smuggler doctrine.',
        effects: [
          { type: 'salvage', tier: 'relic', amount: -1 },
          { type: 'audit_reduction', amount: 15 },
          { type: 'doctrine', alignment: 'smuggler', points: 1 },
        ],
      },
      {
        label: 'Decline',
        description: 'Keep your haul, handle the risk yourself.',
        effects: [
          { type: 'doctrine', alignment: 'corporate', points: 1 },
        ],
      },
    ],
  },
  {
    id: 'assessment_crew_tension',
    title: 'Crew Argument',
    transmission: "Internal comms spike detected. Rook: \"The manifest is too heavy. We should declare more, reduce the heat.\" Jax: \"Every credit we give them is a credit they use to buy the next ship like ours.\" The argument stalls when they realize you are listening. Both want your call.",
    choices: [
      {
        label: 'Side with Rook',
        description: 'Declare more for safety, gain audit reduction.',
        effects: [
          { type: 'credits', amount: -2500 },
          { type: 'audit_reduction', amount: 8 },
          { type: 'doctrine', alignment: 'corporate', points: 1 },
        ],
      },
      {
        label: 'Side with Jax',
        description: 'Smuggle more, gain smuggler doctrine and salvage.',
        effects: [
          { type: 'salvage', tier: 'components', amount: 2 },
          { type: 'doctrine', alignment: 'smuggler', points: 1 },
        ],
      },
      {
        label: 'Stay Out of It',
        description: 'Let them resolve it themselves.',
        effects: [
          { type: 'hull', amount: -5 },
          { type: 'doctrine', alignment: 'cooperative', points: 1 },
        ],
      },
    ],
  },
  {
    id: 'assessment_manifest_glitch',
    title: 'Manifest Glitch',
    transmission: "Your ship's inventory system just hiccuped. For seventeen seconds, the automated manifest showed your haul as significantly lighter than reality. The log is already correcting itself, but that window existed. Someone with fast hands and loose ethics could have transmitted the wrong numbers.",
    choices: [
      {
        label: 'Exploit the Glitch',
        description: 'Transmit the false light manifest for audit reduction.',
        effects: [
          { type: 'audit_reduction', amount: 12 },
          { type: 'doctrine', alignment: 'smuggler', points: 2 },
          { type: 'lore_fragment', tag: 'glitch_01' },
        ],
      },
      {
        label: 'Report the Error',
        description: 'Flag the system bug to corporate.',
        effects: [
          { type: 'credits', amount: 2000 },
          { type: 'doctrine', alignment: 'corporate', points: 1 },
        ],
      },
    ],
  },
  {
    id: 'assessment_dock_inspector',
    title: 'Dock Inspector Tip',
    transmission: "Personal message, encrypted and not logged: \"Your haul has been flagged in the queue. Inspector Chen will be processing your dock slot. Chen can be... reasonable. For the right consideration, certain items simply never made it onto the official scan. This is not a bribe. This is a professional courtesy arrangement.\" - Anonymous",
    choices: [
      {
        label: 'Pay for Discretion',
        description: 'Spend credits to reduce audit risk.',
        effects: [
          { type: 'credits', amount: -4000 },
          { type: 'audit_reduction', amount: 15 },
        ],
      },
      {
        label: 'Refuse the Offer',
        description: 'Take your chances with standard processing.',
        effects: [
          { type: 'doctrine', alignment: 'cooperative', points: 1 },
        ],
      },
    ],
  },
  {
    id: 'assessment_salvage_bay_sweep',
    title: 'Salvage Bay Sweep',
    transmission: "Your internal sensors detect anomalous readings in the salvage bay. The automated classification system is flagging one of your recovered items as \"potentially hazardous — report to Corporate Safety.\" The item is valuable. Reporting it means losing it. Not reporting it means carrying undocumented high-risk cargo.",
    choices: [
      {
        label: 'Report the Item',
        description: 'Surrender the relic for safety and corporate favor.',
        effects: [
          { type: 'salvage', tier: 'relic', amount: -1 },
          { type: 'audit_reduction', amount: 10 },
          { type: 'doctrine', alignment: 'corporate', points: 1 },
        ],
      },
      {
        label: 'Reclassify It Yourself',
        description: 'Hide the item, keep the value, take the risk.',
        effects: [
          { type: 'doctrine', alignment: 'smuggler', points: 1 },
          { type: 'lore_fragment', tag: 'reclassified_01' },
        ],
      },
    ],
  },
];

export function getSignalById(id: string): Signal | undefined {
  return SIGNALS.find((s) => s.id === id);
}

/**
 * Pick a signal for the given round using a seeded RNG.
 * Returns the signal id.
 */
export function pickSignalForRound(round: number, seededRng: () => number): string {
  // Use round to select from different subsets for variety
  const offset = (round * 7) % SIGNALS.length;
  const index = Math.floor(seededRng() * SIGNALS.length);
  const adjustedIndex = (index + offset) % SIGNALS.length;
  return SIGNALS[adjustedIndex].id;
}
