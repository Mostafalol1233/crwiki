const DEFAULT_IMAGE = '/assets/feature-weap.jpg.jpeg';"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

const weaponsData = [exports.weaponsData = void 0;

  // Assault Riflesvar DEFAULT_IMAGE = '/assets/feature-weap.jpg.jpeg';

  {exports.weaponsData = [

    name: 'M4A1',    // Assault Rifles

    image: DEFAULT_IMAGE,    {

    category: 'Assault Rifle',        name: 'M4A1',

    description: 'A versatile automatic rifle with balanced stats.',        image: DEFAULT_IMAGE,

    stats: {        category: 'Assault Rifle',

      damage: 28,        description: 'A versatile automatic rifle with balanced stats.',

      accuracy: 85,        stats: {

      recoil: 'Medium',            damage: 28,

      fireRate: 'High',            accuracy: 85,

      mobility: 'Medium'            recoil: 'Medium',

    }            fireRate: 'High',

  },            mobility: 'Medium'

  {        }

    name: 'AK-47',    },

    image: DEFAULT_IMAGE,    {

    category: 'Assault Rifle',        name: 'AK-47',

    description: 'High-damage rifle with strong recoil.',        image: DEFAULT_IMAGE,

    stats: {        category: 'Assault Rifle',

      damage: 34,        description: 'High-damage rifle with strong recoil.',

      accuracy: 80,        stats: {

      recoil: 'High',            damage: 34,

      fireRate: 'Medium',            accuracy: 80,

      mobility: 'Medium'            recoil: 'High',

    }            fireRate: 'Medium',

  },            mobility: 'Medium'

  {        }

    name: 'FAMAS',    },

    image: DEFAULT_IMAGE,    {

    category: 'Assault Rifle',        name: 'FAMAS',

    description: 'Burst-fire rifle with high accuracy.',        image: DEFAULT_IMAGE,

    stats: {        category: 'Assault Rifle',

      damage: 30,        description: 'Burst-fire rifle with high accuracy.',

      accuracy: 90,        stats: {

      recoil: 'Low',            damage: 30,

      fireRate: 'High',            accuracy: 90,

      mobility: 'Medium'            recoil: 'Low',

    }            fireRate: 'High',

  },            mobility: 'Medium'

        }

  // SMGs    },

  {    // SMGs

    name: 'P90',    {

    image: DEFAULT_IMAGE,        name: 'P90',

    category: 'SMG',        image: DEFAULT_IMAGE,

    description: 'High rate of fire SMG with large magazine.',        category: 'SMG',

    stats: {        description: 'High rate of fire SMG with large magazine.',

      damage: 25,        stats: {

      accuracy: 75,            damage: 25,

      recoil: 'Low',            accuracy: 75,

      fireRate: 'Very High',            recoil: 'Low',

      mobility: 'High'            fireRate: 'Very High',

    }            mobility: 'High'

  },        }

  {    },

    name: 'MP5',    {

    image: DEFAULT_IMAGE,        name: 'MP5',

    category: 'SMG',        image: DEFAULT_IMAGE,

    description: 'Well-balanced SMG effective at close range.',        category: 'SMG',

    stats: {        description: 'Well-balanced SMG effective at close range.',

      damage: 28,        stats: {

      accuracy: 80,            damage: 28,

      recoil: 'Low',            accuracy: 80,

      fireRate: 'High',            recoil: 'Low',

      mobility: 'High'            fireRate: 'High',

    }            mobility: 'High'

  }        }

];    },

    {

module.exports = { weaponsData };        name: 'UMP45',
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
module.exports = { weaponsData: exports.weaponsData };
