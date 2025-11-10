const DEFAULT_IMAGE = '/assets/feature-weap.jpg.jpeg';

const weaponsData = [
  // Assault Rifles
  {
    name: 'M4A1',
    image: DEFAULT_IMAGE,
    category: 'Assault Rifle',
    description: 'A versatile automatic rifle with balanced stats.',
    stats: {
      damage: 28,
      accuracy: 85,
      recoil: 'Medium',
      fireRate: 'High',
      mobility: 'Medium'
    }
  },
  {
    name: 'AK-47',
    image: DEFAULT_IMAGE,
    category: 'Assault Rifle',
    description: 'High-damage rifle with strong recoil.',
    stats: {
      damage: 34,
      accuracy: 80,
      recoil: 'High',
      fireRate: 'Medium',
      mobility: 'Medium'
    }
  },
  {
    name: 'FAMAS',
    image: DEFAULT_IMAGE,
    category: 'Assault Rifle',
    description: 'Burst-fire rifle with high accuracy.',
    stats: {
      damage: 30,
      accuracy: 90,
      recoil: 'Low',
      fireRate: 'High',
      mobility: 'Medium'
    }
  },
  // SMGs
  {
    name: 'P90',
    image: DEFAULT_IMAGE,
    category: 'SMG',
    description: 'High rate of fire SMG with large magazine.',
    stats: {
      damage: 25,
      accuracy: 75,
      recoil: 'Low',
      fireRate: 'Very High',
      mobility: 'High'
    }
  },
  {
    name: 'MP5',
    image: DEFAULT_IMAGE,
    category: 'SMG',
    description: 'Well-balanced SMG effective at close range.',
    stats: {
      damage: 28,
      accuracy: 80,
      recoil: 'Low',
      fireRate: 'High',
      mobility: 'High'
    }
  },
  {
    name: 'UMP45',
    image: DEFAULT_IMAGE,
    category: 'SMG',
    description: 'Hard-hitting SMG with controllable recoil.',
    stats: {
      damage: 32,
      accuracy: 78,
      recoil: 'Medium',
      fireRate: 'Medium',
      mobility: 'High'
    }
  },
  // Sniper Rifles
  {
    name: 'AWM',
    image: DEFAULT_IMAGE,
    category: 'Sniper Rifle',
    description: 'High-powered bolt-action sniper rifle.',
    stats: {
      damage: 100,
      accuracy: 95,
      recoil: 'High',
      fireRate: 'Low',
      mobility: 'Low'
    }
  },
  {
    name: 'M4 SPR',
    image: DEFAULT_IMAGE,
    category: 'Sniper Rifle',
    description: 'Semi-automatic sniper rifle with good mobility.',
    stats: {
      damage: 85,
      accuracy: 90,
      recoil: 'Medium',
      fireRate: 'Medium',
      mobility: 'Medium'
    }
  },
  {
    name: 'Barrett M82A1',
    image: DEFAULT_IMAGE,
    category: 'Sniper Rifle',
    description: 'Anti-materiel sniper rifle with extreme power.',
    stats: {
      damage: 120,
      accuracy: 85,
      recoil: 'Very High',
      fireRate: 'Low',
      mobility: 'Very Low'
    }
  },
  // Shotguns
  {
    name: 'M1014',
    image: DEFAULT_IMAGE,
    category: 'Shotgun',
    description: 'Semi-automatic shotgun with good rate of fire.',
    stats: {
      damage: 90,
      accuracy: 60,
      recoil: 'High',
      fireRate: 'Medium',
      mobility: 'Medium'
    }
  },
  {
    name: 'SPAS-12',
    image: DEFAULT_IMAGE,
    category: 'Shotgun',
    description: 'Pump-action shotgun with high damage.',
    stats: {
      damage: 95,
      accuracy: 65,
      recoil: 'High',
      fireRate: 'Low',
      mobility: 'Medium'
    }
  },
  // Pistols
  {
    name: 'Desert Eagle',
    image: DEFAULT_IMAGE,
    category: 'Pistol',
    description: 'High-caliber pistol with massive stopping power.',
    stats: {
      damage: 50,
      accuracy: 75,
      recoil: 'High',
      fireRate: 'Low',
      mobility: 'High'
    }
  },
  {
    name: 'M1911',
    image: DEFAULT_IMAGE,
    category: 'Pistol',
    description: 'Classic sidearm with balanced performance.',
    stats: {
      damage: 40,
      accuracy: 80,
      recoil: 'Medium',
      fireRate: 'Medium',
      mobility: 'High'
    }
  },
  // LMGs
  {
    name: 'M249',
    image: DEFAULT_IMAGE,
    category: 'LMG',
    description: 'Belt-fed machine gun with large ammo capacity.',
    stats: {
      damage: 32,
      accuracy: 70,
      recoil: 'High',
      fireRate: 'High',
      mobility: 'Low'
    }
  },
  {
    name: 'RPK',
    image: DEFAULT_IMAGE,
    category: 'LMG',
    description: 'Light machine gun with good accuracy.',
    stats: {
      damage: 35,
      accuracy: 75,
      recoil: 'Medium',
      fireRate: 'Medium',
      mobility: 'Low'
    }
  },
  // Melee
  {
    name: 'Knife',
    image: DEFAULT_IMAGE,
    category: 'Melee',
    description: 'Standard combat knife for close-quarters combat.',
    stats: {
      damage: 100,
      accuracy: 90,
      recoil: 'None',
      fireRate: 'Medium',
      mobility: 'Very High'
    }
  }
];

module.exports = { weaponsData };
