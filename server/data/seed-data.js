export const mercenariesData = [
  { id: "1", name: "Wolf", image: "https://files.catbox.moe/6npa73.jpeg", role: "Assault", description: "Aggressive assault specialist" },
  { id: "2", name: "Vipers", image: "https://files.catbox.moe/4il6hi.jpeg", role: "Sniper", description: "Precision sniper expert" },
  { id: "3", name: "Sisterhood", image: "https://files.catbox.moe/3o58nb.jpeg", role: "Medic", description: "Support and healing specialist" },
  { id: "4", name: "Black Mamba", image: "https://files.catbox.moe/r26ox6.jpeg", role: "Scout", description: "Fast reconnaissance scout" },
  { id: "5", name: "Arch Honorary", image: "https://files.catbox.moe/ctwnqz.jpeg", role: "Guardian", description: "Protective guardian role" },
  { id: "6", name: "Desperado", image: "https://files.catbox.moe/hh7h5u.jpeg", role: "Engineer", description: "Technical engineer specialist" },
  { id: "7", name: "Ronin", image: "https://files.catbox.moe/eck3jc.jpeg", role: "Samurai", description: "Melee combat warrior" },
  { id: "8", name: "Dean", image: "https://files.catbox.moe/t78mvu.jpeg", role: "Specialist", description: "Specialized tactics expert" },
  { id: "9", name: "Thoth", image: "https://files.catbox.moe/g4zfzn.jpeg", role: "Guardian", description: "Protective guardian role" },
  { id: "10", name: "SFG", image: "https://files.catbox.moe/3bba2g.jpeg", role: "Special Forces", description: "Special forces operative" },
];

export const weaponsData = [
  // Assault Rifles
  {
    name: 'M4A1',
    image: '/assets/weapons/C4410.png',
    category: 'Assault Rifle',
    description: 'A versatile automatic rifle with balanced stats, ideal for medium-range combat.',
    stats: {
      damage: 28,
      accuracy: 85,
      recoil: 'Medium',
      fireRate: 'High',
      mobility: 'Medium',
      magazine: 30,
      range: 'Medium'
    }
  },
  {
    name: 'AK-47',
    image: '/assets/weapons/C4742.png',
    category: 'Assault Rifle',
    description: 'High-damage rifle with strong recoil, perfect for close-quarters combat.',
    stats: {
      damage: 34,
      accuracy: 80,
      recoil: 'High',
      fireRate: 'Medium',
      mobility: 'Medium',
      magazine: 30,
      range: 'Medium'
    }
  },
  {
    name: 'SCAR-L',
    image: '/assets/weapons/C4936.png',
    category: 'Assault Rifle',
    description: 'Modern assault rifle with excellent accuracy and controlled recoil.',
    stats: {
      damage: 30,
      accuracy: 90,
      recoil: 'Low',
      fireRate: 'High',
      mobility: 'Medium',
      magazine: 30,
      range: 'Medium'
    }
  },
  {
    name: 'M16A4',
    image: '/assets/weapons/C4953.png',
    category: 'Assault Rifle',
    description: 'Burst-fire assault rifle with high accuracy and moderate damage.',
    stats: {
      damage: 32,
      accuracy: 88,
      recoil: 'Medium',
      fireRate: 'Medium',
      mobility: 'Medium',
      magazine: 30,
      range: 'Medium'
    }
  },
  // Sniper Rifles
  {
    name: 'AWM',
    image: '/assets/weapons/C5154.png',
    category: 'Sniper Rifle',
    description: 'Bolt-action sniper rifle with devastating one-shot kill potential.',
    stats: {
      damage: 100,
      accuracy: 100,
      recoil: 'Low',
      fireRate: 'Very Low',
      mobility: 'Low',
      magazine: 5,
      range: 'Long'
    }
  },
  {
    name: 'CheyTac M200',
    image: '/assets/weapons/C5155.png',
    category: 'Sniper Rifle',
    description: 'Anti-materiel sniper rifle with extreme range and penetration.',
    stats: {
      damage: 120,
      accuracy: 100,
      recoil: 'High',
      fireRate: 'Very Low',
      mobility: 'Very Low',
      magazine: 5,
      range: 'Very Long'
    }
  },
  // Submachine Guns
  {
    name: 'MP5',
    image: '/assets/weapons/C5156.png',
    category: 'Submachine Gun',
    description: 'Compact SMG with high fire rate, excellent for close-range engagements.',
    stats: {
      damage: 22,
      accuracy: 75,
      recoil: 'Medium',
      fireRate: 'Very High',
      mobility: 'High',
      magazine: 30,
      range: 'Short'
    }
  },
  {
    name: 'UMP45',
    image: '/assets/weapons/C5157.png',
    category: 'Submachine Gun',
    description: 'Balanced SMG with good damage and controllable recoil.',
    stats: {
      damage: 25,
      accuracy: 78,
      recoil: 'Medium',
      fireRate: 'High',
      mobility: 'Medium',
      magazine: 25,
      range: 'Short'
    }
  },
  // Shotguns
  {
    name: 'Remington 870',
    image: '/assets/weapons/C5303.png',
    category: 'Shotgun',
    description: 'Pump-action shotgun with devastating close-range damage.',
    stats: {
      damage: 80,
      accuracy: 60,
      recoil: 'High',
      fireRate: 'Low',
      mobility: 'Medium',
      magazine: 8,
      range: 'Very Short'
    }
  },
  // Pistols
  {
    name: 'Desert Eagle',
    image: '/assets/weapons/C5362.png',
    category: 'Pistol',
    description: 'High-caliber pistol with powerful stopping power.',
    stats: {
      damage: 50,
      accuracy: 85,
      recoil: 'High',
      fireRate: 'Low',
      mobility: 'High',
      magazine: 7,
      range: 'Short'
    }
  },
  // Add more weapons as needed, mapping to available images
  {
    name: 'M249 SAW',
    image: '/assets/weapons/C5390.png',
    category: 'Machine Gun',
    description: 'Light machine gun with high capacity and sustained fire.',
    stats: {
      damage: 26,
      accuracy: 70,
      recoil: 'High',
      fireRate: 'High',
      mobility: 'Low',
      magazine: 100,
      range: 'Medium'
    }
  },
  {
    name: 'M60E4',
    image: '/assets/weapons/C5473.png',
    category: 'Machine Gun',
    description: 'Heavy machine gun with massive damage output.',
    stats: {
      damage: 35,
      accuracy: 65,
      recoil: 'Very High',
      fireRate: 'Medium',
      mobility: 'Very Low',
      magazine: 100,
      range: 'Medium'
    }
  },
  // Continue mapping remaining images to weapons
  {
    name: 'FN F2000',
    image: '/assets/weapons/C6411.png',
    category: 'Assault Rifle',
    description: 'Bullpup assault rifle with good accuracy and mobility.',
    stats: {
      damage: 29,
      accuracy: 87,
      recoil: 'Medium',
      fireRate: 'High',
      mobility: 'High',
      magazine: 30,
      range: 'Medium'
    }
  },
  {
    name: 'G36C',
    image: '/assets/weapons/C6547.png',
    category: 'Assault Rifle',
    description: 'Compact assault rifle with balanced performance.',
    stats: {
      damage: 27,
      accuracy: 86,
      recoil: 'Medium',
      fireRate: 'High',
      mobility: 'Medium',
      magazine: 30,
      range: 'Medium'
    }
  },
  {
    name: 'P90',
    image: '/assets/weapons/C6777.png',
    category: 'Submachine Gun',
    description: 'Bullpup SMG with high capacity and fire rate.',
    stats: {
      damage: 21,
      accuracy: 76,
      recoil: 'Medium',
      fireRate: 'Very High',
      mobility: 'High',
      magazine: 50,
      range: 'Short'
    }
  },
  {
    name: 'SPAS-12',
    image: '/assets/weapons/C7325.png',
    category: 'Shotgun',
    description: 'Semi-automatic shotgun with fast reload and high damage.',
    stats: {
      damage: 75,
      accuracy: 65,
      recoil: 'High',
      fireRate: 'Medium',
      mobility: 'Medium',
      magazine: 8,
      range: 'Very Short'
    }
  },
  {
    name: 'M14 EBR',
    image: '/assets/weapons/C7411.png',
    category: 'Designated Marksman Rifle',
    description: 'Semi-automatic DMR with excellent accuracy.',
    stats: {
      damage: 45,
      accuracy: 95,
      recoil: 'Low',
      fireRate: 'Medium',
      mobility: 'Medium',
      magazine: 20,
      range: 'Long'
    }
  },
  {
    name: 'M24',
    image: '/assets/weapons/C8017.png',
    category: 'Sniper Rifle',
    description: 'Bolt-action sniper with good balance of damage and mobility.',
    stats: {
      damage: 90,
      accuracy: 98,
      recoil: 'Medium',
      fireRate: 'Very Low',
      mobility: 'Medium',
      magazine: 5,
      range: 'Long'
    }
  },
  {
    name: 'M82A1',
    image: '/assets/weapons/C8020.png',
    category: 'Anti-Materiel Rifle',
    description: 'Heavy anti-materiel rifle for long-range precision.',
    stats: {
      damage: 110,
      accuracy: 100,
      recoil: 'Very High',
      fireRate: 'Very Low',
      mobility: 'Very Low',
      magazine: 5,
      range: 'Very Long'
    }
  },
  {
    name: 'M95',
    image: '/assets/weapons/C8053.png',
    category: 'Sniper Rifle',
    description: 'Modern sniper rifle with excellent ergonomics.',
    stats: {
      damage: 95,
      accuracy: 99,
      recoil: 'Low',
      fireRate: 'Very Low',
      mobility: 'Medium',
      magazine: 5,
      range: 'Long'
    }
  },
  {
    name: 'M107',
    image: '/assets/weapons/C8663.png',
    category: 'Anti-Materiel Rifle',
    description: 'Powerful AMR with penetration capabilities.',
    stats: {
      damage: 115,
      accuracy: 100,
      recoil: 'Very High',
      fireRate: 'Very Low',
      mobility: 'Very Low',
      magazine: 5,
      range: 'Very Long'
    }
  },
  {
    name: 'M110',
    image: '/assets/weapons/C8665.png',
    category: 'Sniper Rifle',
    description: 'Semi-automatic sniper rifle with high capacity.',
    stats: {
      damage: 85,
      accuracy: 97,
      recoil: 'Medium',
      fireRate: 'Medium',
      mobility: 'Medium',
      magazine: 10,
      range: 'Long'
    }
  },
  {
    name: 'M200',
    image: '/assets/weapons/C9288.png',
    category: 'Anti-Materiel Rifle',
    description: 'Extreme range sniper with massive damage.',
    stats: {
      damage: 125,
      accuracy: 100,
      recoil: 'Very High',
      fireRate: 'Very Low',
      mobility: 'Very Low',
      magazine: 5,
      range: 'Extreme'
    }
  },
  {
    name: 'M400',
    image: '/assets/weapons/C9482.png',
    category: 'Anti-Materiel Rifle',
    description: 'Heavy caliber AMR for vehicle destruction.',
    stats: {
      damage: 150,
      accuracy: 100,
      recoil: 'Extreme',
      fireRate: 'Very Low',
      mobility: 'Very Low',
      magazine: 5,
      range: 'Extreme'
    }
  }
];

export const modesData = [
  {
    name: 'Team Deathmatch',
    image: '/assets/modes/TDM_AirForceOne_01.jpg.jpeg',
    description: 'Classic team vs team combat. The team with the most kills wins.',
    type: 'team'
  },
  {
    name: 'Search & Destroy',
    image: '/assets/modes/SND_Ankara3_01.jpg.jpeg',
    description: 'One team plants the bomb while the other defends. No respawns.',
    type: 'team'
  },
  {
    name: 'Capture the Flag',
    image: '/assets/modes/FFA_Farm.jpg.jpeg',
    description: 'Teams compete to capture the enemy flag while defending their own.',
    type: 'team'
  },
  {
    name: 'Domination',
    image: '/assets/modes/EM_Christmas_01.jpg.jpeg',
    description: 'Teams fight to control multiple points on the map.',
    type: 'team'
  },
  {
    name: 'Ghost Mode',
    image: '/assets/modes/GUESS_DanceParty_01.jpg.jpeg',
    description: 'One team is invisible until they attack. Stealth vs awareness.',
    type: 'special'
  },
  {
    name: 'Free for All',
    image: '/assets/modes/FFA_Farm.jpg.jpeg',
    description: 'Every player for themselves in a battle royale style.',
    type: 'solo'
  },
  {
    name: 'Knife Mode',
    image: '/assets/modes/MESC_Desktop.jpg.jpeg',
    description: 'Only knives allowed. Pure skill-based combat.',
    type: 'special'
  },
  {
    name: 'Sniper Mode',
    image: '/assets/modes/SND_EagleEye2_06.jpg.jpeg',
    description: 'Only sniper rifles. Long-range precision battles.',
    type: 'special'
  },
  {
    name: 'Shotgun Mode',
    image: '/assets/modes/STDM_Fort_01.jpg.jpeg',
    description: 'Shotguns only. Close-quarters carnage.',
    type: 'special'
  },
  {
    name: 'Bomb Defusal',
    image: '/assets/modes/SND_CentralStation01.jpg.jpeg',
    description: 'Defend or defuse the bomb in strategic locations.',
    type: 'team'
  }
];

export const ranksData = [
  // Generate ranks 1-104 with images and requirements
  ...Array.from({ length: 104 }, (_, i) => {
    const rankNum = i + 1;
    const image = `/assets/ranks/rank_${rankNum}.jpg.jpeg`;
    let name = '';
    let description = '';
    let requirements = '';

    if (rankNum === 1) {
      name = 'Trainee';
      description = 'Starting rank for all new players.';
      requirements = 'New account creation';
    } else if (rankNum <= 5) {
      name = `Private ${rankNum - 1}`;
      description = 'Basic soldier showing initial combat skills.';
      requirements = `Reach Level ${rankNum * 2} and win ${rankNum * 3} matches`;
    } else if (rankNum <= 10) {
      name = `Corporal ${rankNum - 5}`;
      description = 'Shows basic understanding of game mechanics.';
      requirements = `Reach Level ${rankNum * 3} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
    } else if (rankNum <= 20) {
      name = `Sergeant ${rankNum - 10}`;
      description = 'Demonstrates growing combat expertise.';
      requirements = `Reach Level ${rankNum * 4} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
    } else if (rankNum <= 30) {
      name = `Staff Sergeant ${rankNum - 20}`;
      description = 'Experienced soldier with proven skills.';
      requirements = `Reach Level ${rankNum * 5} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
    } else if (rankNum <= 40) {
      name = `Warrant Officer ${rankNum - 30}`;
      description = 'Elite player with exceptional performance.';
      requirements = `Reach Level ${rankNum * 6} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
    } else if (rankNum <= 50) {
      name = `Second Lieutenant ${rankNum - 40}`;
      description = 'Officer rank for tactical commanders.';
      requirements = `Reach Level ${rankNum * 7} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
    } else if (rankNum <= 60) {
      name = `First Lieutenant ${rankNum - 50}`;
      description = 'Senior officer with leadership qualities.';
      requirements = `Reach Level ${rankNum * 8} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
    } else if (rankNum <= 70) {
      name = `Captain ${rankNum - 60}`;
      description = 'Commanding officer with strategic vision.';
      requirements = `Reach Level ${rankNum * 9} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
    } else if (rankNum <= 80) {
      name = `Major ${rankNum - 70}`;
      description = 'High-ranking officer with extensive experience.';
      requirements = `Reach Level ${rankNum * 10} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
    } else if (rankNum <= 90) {
      name = `Lieutenant Colonel ${rankNum - 80}`;
      description = 'Elite commander with mastery of tactics.';
      requirements = `Reach Level ${rankNum * 11} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
    } else if (rankNum <= 100) {
      name = `Colonel ${rankNum - 90}`;
      description = 'Supreme commander with legendary status.';
      requirements = `Reach Level ${rankNum * 12} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
    } else {
      name = `General ${rankNum - 100}`;
      description = 'Ultimate rank for the most skilled players.';
      requirements = `Reach Level ${rankNum * 13} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
    }

    return {
      name,
      image,
      description,
      requirements
    };
  })
];
