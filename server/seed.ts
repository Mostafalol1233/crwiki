import { db } from './db';
import { posts, news, events, users, admins } from '@shared/schema';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('admin123', 10);
  await db.insert(users).values({
    username: 'admin',
    password: hashedPassword
  }).onConflictDoNothing();

  console.log('Creating super admin accounts...');
  const mostafaPassword = await bcrypt.hash('mos1382007', 10);
  const bavlyPassword = await bcrypt.hash('bavly2025x1', 10);
  const highwayPassword = await bcrypt.hash('highway2025', 10);

  await db.insert(admins).values([
    {
      username: 'mostafa',
      password: mostafaPassword,
      role: 'super_admin'
    },
    {
      username: 'bavly',
      password: bavlyPassword,
      role: 'admin'
    },
    {
      username: 'highway',
      password: highwayPassword,
      role: 'admin'
    }
  ]).onConflictDoNothing();

  console.log('✅ Super admin accounts created successfully!');

  await db.insert(posts).values([
    {
      id: "crossfire-2025-roadmap",
      title: "CrossFire 2025 Roadmap: Everything Coming This Year",
      content: `# CrossFire 2025: The Ultimate Gaming Experience Awaits

The iconic first-person shooter CrossFire is experiencing a massive revival in 2025, with Smilegate Entertainment rolling out an ambitious roadmap packed with new content, features, and global expansion initiatives.

## New Maps Coming to CrossFire

CrossFire is expanding its battlefield roster with five exciting new maps designed for different playstyles:

### Mid Line Map (Search & Destroy)
A tactical masterpiece featuring narrow corridors and strategic chokepoints, perfect for coordinated team play. Expect intense close-quarters combat with multiple bombsite approaches.

### Forest Map (Team Deathmatch)
Set in a lush wilderness environment, this map offers a mix of open sightlines and dense foliage for stealth gameplay. Natural cover and elevation changes create dynamic engagements.

### Battle Zone (Mass Brawl)
An all-out warfare map designed for large-scale battles, featuring multiple capture points and vehicle spawn locations.

### Cross Zone (Event & Random Buff)
A unique event map with randomly spawning power-ups and special abilities, keeping every match unpredictable and exciting.

### Museum 13 (Novice Mode)
A beginner-friendly map designed to help new players learn the fundamentals of CrossFire in a controlled environment.

## New Weapons & Weapon Skins

2025 brings an arsenal of new weapons and stunning skin collections:

### Classic Series
- **M4A1-S Born Beast**: A legendary variant with enhanced stats
- **AWM-Infinite Dragon**: The ultimate sniper rifle with dragon-themed aesthetics
- **FAMAS G2-Nova Lance**: A futuristic assault rifle design

### Esports 2025 Collection
Celebrate competitive CrossFire with tournament-themed weapons:
- AK47-K T. Esports
- AN94-S Esports
- SR-25-D.K. Esports
- Outlaw T. Axe-Esports

### Special Edition Weapons
- **QBZ-03-Unicorn Beast**: Features a unique leveling progression system
- **M82A1-Prestige Glow**: A premium sniper with glowing effects
- **AA-12-T. Gunpowder Awaken**: An explosive shotgun design

## Conclusion

CrossFire's 2025 roadmap demonstrates Smilegate's commitment to revitalizing this legendary FPS franchise. With new maps, weapons, characters, mobile expansion, and a strong esports push, CrossFire is positioned for a major comeback.

Stay tuned to official channels for the latest updates, and prepare for the most action-packed year in CrossFire history!`,
      summary: "Discover everything coming to CrossFire in 2025: new maps, weapons, characters, CF Pass Season 9, mobile game return, Esports World Cup debut, and the development of CrossFire 2.",
      image: "/assets/feature-crossfire.jpg",
      category: "News",
      tags: ["CrossFire", "2025", "Roadmap", "Updates", "Esports", "Mobile"],
      author: "Bimora Team",
      featured: true,
      readingTime: 8,
      views: 15420
    }
  ]).onConflictDoNothing();

  await db.insert(news).values([
    {
      id: "mystic-moonlight-market",
      title: "Mystic Moonlight Market",
      dateRange: "October 29th - November 11th",
      image: "/assets/news-sapphire.jpg",
      category: "Event",
      content: "Explore the enchanting Mystic Moonlight Market event!",
      author: "[GM]Xenon",
      featured: true
    },
    {
      id: "halloween-creative-contest",
      title: "Halloween Creative Contest",
      dateRange: "October 15th - November 1st",
      image: "/assets/news-halloween.jpg",
      category: "Contest",
      content: "Show us your spooky side in our Halloween Creative Contest!",
      author: "[GM]Xenon",
      featured: false
    },
    {
      id: "grave-games-event",
      title: "Grave Games Event",
      dateRange: "October 20th - November 3rd",
      image: "/assets/news-gravegames.jpg",
      category: "Event",
      content: "Join the Grave Games event for exclusive rewards!",
      author: "[GM]Xenon",
      featured: false
    },
    {
      id: "weekend-party-event",
      title: "Weekend Party Event",
      dateRange: "Every Weekend",
      image: "/assets/news-weekend.jpg",
      category: "Event",
      content: "Celebrate every weekend with exclusive bonuses!",
      author: "[GM]Xenon",
      featured: false
    },
    {
      id: "cf-shop-sale",
      title: "CF Shop Special Sale",
      dateRange: "October 8th - October 22nd",
      image: "/assets/news-shop.jpg",
      category: "Sale",
      content: "Don't miss our biggest CF Shop sale of the year!",
      author: "[GM]Xenon",
      featured: false
    },
    {
      id: "cfs-superfans",
      title: "CFS Super Fans",
      dateRange: "October 22nd - November 4th",
      image: "/assets/news-superfans.jpg",
      category: "Event",
      content: "Become a CFS Super Fan and earn exclusive rewards!",
      author: "[GM]Xenon",
      featured: false
    }
  ]).onConflictDoNothing();

  console.log('✅ Database seeded successfully!');
}

seed()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
