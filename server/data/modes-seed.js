const DEFAULT_IMAGE = '/assets/feature-coop.jpg.jpeg';

const modesData = [
  // Team-based Modes
  {
    name: 'Team Deathmatch',
    image: DEFAULT_IMAGE,
    description: 'Classic team vs team combat. The team with the most kills wins.',
    type: 'team'
  },
  {
    name: 'Search & Destroy',
    image: DEFAULT_IMAGE,
    description: 'One team plants the bomb while the other defends. No respawns.',
    type: 'team'
  },
  {
    name: 'Capture the Flag',
    image: DEFAULT_IMAGE,
    description: 'Teams compete to capture the enemy flag while defending their own.',
    type: 'team'
  },
  {
    name: 'Domination',
    image: DEFAULT_IMAGE,
    description: 'Teams fight to control multiple points on the map.',
    type: 'team'
  },
  {
    name: 'Ghost Mode',
    image: DEFAULT_IMAGE,
    description: 'One team is invisible until they attack. Stealth vs awareness.',
    type: 'special'
  }
];

module.exports = { modesData };