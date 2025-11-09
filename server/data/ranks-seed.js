const DEFAULT_IMAGE = '/assets/feature-comp.jpg.jpeg';

const ranksData = [
  {
    name: 'Trainee',
    image: DEFAULT_IMAGE,
    description: 'Starting rank for all new players.',
    requirements: 'New account creation'
  },
  {
    name: 'Private',
    image: DEFAULT_IMAGE,
    description: 'First rank after completing basic training.',
    requirements: 'Complete tutorial and win 3 matches'
  },
  {
    name: 'Corporal',
    image: DEFAULT_IMAGE,
    description: 'Shows basic understanding of game mechanics.',
    requirements: 'Reach Level 5 and win 10 matches'
  },
  {
    name: 'Sergeant',
    image: DEFAULT_IMAGE,
    description: 'Demonstrates growing combat expertise.',
    requirements: 'Reach Level 10 and maintain 1.0 K/D ratio'
  },
  {
    name: 'Master Sergeant',
    image: DEFAULT_IMAGE,
    description: 'Experienced soldier with proven skills.',
    requirements: 'Reach Level 20 and maintain 1.5 K/D ratio'
  }
];

module.exports = { ranksData };