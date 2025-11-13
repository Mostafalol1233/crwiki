import { connectMongoDB, disconnectMongoDB } from './mongodb';
import { NewsModel, EventModel, AdminModel, MercenaryModel, TutorialModel } from '@shared/mongodb-schema';
import bcrypt from 'bcryptjs';
import { weaponsData, modesData, ranksData, mercenariesData } from './data/seed-data';
import { WeaponModel, ModeModel, RankModel } from '@shared/mongodb-schema';

async function seedMongoDB() {
  try {
    console.log('🌱 Starting MongoDB seed...');
    
    await connectMongoDB();

    // Create super admin accounts
    console.log('Creating admin accounts...');
    const admins = [
      {
        username: 'mostafa',
        password: await bcrypt.hash('mos1382007', 10),
        role: 'super_admin'
      },
      {
        username: 'bavly',
        password: await bcrypt.hash('bavly2025x1', 10),
        role: 'admin'
      },
      {
        username: 'highway',
        password: await bcrypt.hash('highway2025', 10),
        role: 'admin'
      }
    ];

    for (const admin of admins) {
      const existing = await AdminModel.findOne({ username: admin.username });
      if (!existing) {
        await AdminModel.create(admin);
        console.log(`✅ Created admin: ${admin.username}`);
      } else {
        console.log(`⏭️  Admin already exists: ${admin.username}`);
      }
    }

    // Seed News
    console.log('\n📰 Seeding news...');
    const newsData = [
      {
        title: "Mystic Moonlight Market",
        titleAr: "سوق ضوء القمر الغامض",
        dateRange: "October 29th - November 11th",
        image: "/assets/news-sapphire.jpg",
        category: "Event",
        content: "Explore the enchanting Mystic Moonlight Market event! Discover rare items, exclusive weapons, and special rewards during this limited-time celebration.",
        contentAr: "استكشف حدث سوق ضوء القمر الغامض الساحر! اكتشف العناصر النادرة والأسلحة الحصرية والمكافآت الخاصة خلال هذا الاحتفال المحدود.",
        htmlContent: "<h2>Mystic Moonlight Market</h2><p>Explore the enchanting Mystic Moonlight Market event!</p>",
        author: "[GM]Xenon",
        featured: true
      },
      {
        title: "Halloween Creative Contest",
        titleAr: "مسابقة الهالوين الإبداعية",
        dateRange: "October 15th - November 1st",
        image: "/assets/news-halloween.jpg",
        category: "Contest",
        content: "Show us your spooky side in our Halloween Creative Contest! Submit your best CrossFire-themed Halloween artwork for a chance to win exclusive prizes.",
        contentAr: "أظهر لنا جانبك المخيف في مسابقة الهالوين الإبداعية! قدم أفضل أعمالك الفنية بموضوع كروس فاير للهالوين للحصول على فرصة للفوز بجوائز حصرية.",
        htmlContent: "<h2>Halloween Creative Contest</h2><p>Show us your spooky side!</p>",
        author: "[GM]Xenon",
        featured: false
      },
      {
        title: "Grave Games Event",
        titleAr: "حدث ألعاب القبور",
        dateRange: "October 20th - November 3rd",
        image: "/assets/news-gravegames.jpg",
        category: "Event",
        content: "Join the Grave Games event for exclusive rewards! Battle through special missions and earn unique weapon skins and character items.",
        contentAr: "انضم إلى حدث ألعاب القبور للحصول على مكافآت حصرية! اخض المعارك من خلال المهام الخاصة واربح أشكال الأسلحة الفريدة وعناصر الشخصيات.",
        htmlContent: "<h2>Grave Games Event</h2><p>Exclusive rewards await!</p>",
        author: "[GM]Xenon",
        featured: false
      },
      {
        title: "Weekend Party Event",
        titleAr: "حدث حفلة عطلة نهاية الأسبوع",
        dateRange: "Every Weekend",
        image: "/assets/news-weekend.jpg",
        category: "Event",
        content: "Celebrate every weekend with exclusive bonuses! Double XP, special drops, and limited-time offers await you every Friday through Sunday.",
        contentAr: "احتفل كل عطلة نهاية أسبوع بمكافآت حصرية! تجربة مضاعفة وإسقاطات خاصة وعروض محدودة الوقت في انتظارك من الجمعة إلى الأحد.",
        htmlContent: "<h2>Weekend Party</h2><p>Double XP every weekend!</p>",
        author: "[GM]Xenon",
        featured: false
      },
      {
        title: "CF Shop Special Sale",
        titleAr: "تخفيضات خاصة في متجر CF",
        dateRange: "October 8th - October 22nd",
        image: "/assets/news-shop.jpg",
        category: "Sale",
        content: "Don't miss our biggest CF Shop sale of the year! Get up to 50% off on premium weapons, character skins, and special bundles.",
        contentAr: "لا تفوت أكبر تخفيضات متجر CF لهذا العام! احصل على خصم يصل إلى 50٪ على الأسلحة المميزة وأشكال الشخصيات والحزم الخاصة.",
        htmlContent: "<h2>Special Sale</h2><p>Up to 50% off!</p>",
        author: "[GM]Xenon",
        featured: false
      },
      {
        title: "CFS Super Fans",
        titleAr: "معجبو CFS المتميزون",
        dateRange: "October 22nd - November 4th",
        image: "/assets/news-superfans.jpg",
        category: "Event",
        content: "Become a CFS Super Fan and earn exclusive rewards! Complete special challenges and show your support for your favorite teams.",
        contentAr: "كن من معجبي CFS المتميزين واربح مكافآت حصرية! أكمل التحديات الخاصة وأظهر دعمك لفرقك المفضلة.",
        htmlContent: "<h2>CFS Super Fans</h2><p>Show your team spirit!</p>",
        author: "[GM]Xenon",
        featured: false
      }
    ];

    for (const news of newsData) {
      const existing = await NewsModel.findOne({ title: news.title });
      if (!existing) {
        await NewsModel.create(news);
        console.log(`✅ Created news: ${news.title}`);
      } else {
        console.log(`⏭️  News already exists: ${news.title}`);
      }
    }

    // Seed Events
    console.log('\n📅 Seeding events...');
    const eventsData = [
      {
        title: "Grave Games Tournament",
        titleAr: "بطولة ألعاب القبور",
        description: "Join the ultimate CrossFire tournament! Compete with the best players and win exclusive prizes.",
        descriptionAr: "انضم إلى بطولة كروس فاير النهائية! تنافس مع أفضل اللاعبين واربح جوائز حصرية.",
        date: "November 15-17, 2024",
        type: "Tournament",
        image: "/assets/event-tournament.jpg"
      },
      {
        title: "Halloween Special Event",
        titleAr: "حدث الهالوين الخاص",
        description: "Spooky challenges and exclusive Halloween-themed rewards await you!",
        descriptionAr: "تحديات مخيفة ومكافآت حصرية بموضوع الهالوين في انتظارك!",
        date: "October 28-31, 2024",
        type: "Special Event",
        image: "/assets/event-halloween.jpg"
      },
      {
        title: "Weekend Warrior Challenge",
        titleAr: "تحدي محارب عطلة نهاية الأسبوع",
        description: "Double XP and special rewards every weekend! Don't miss out on this recurring event.",
        descriptionAr: "تجربة مضاعفة ومكافآت خاصة كل عطلة نهاية أسبوع! لا تفوت هذا الحدث المتكرر.",
        date: "Every Weekend",
        type: "Recurring",
        image: "/assets/event-weekend.jpg"
      },
      {
        title: "Mystic Market Opening",
        titleAr: "افتتاح السوق الغامض",
        description: "Rare items and exclusive weapons available for a limited time. Visit the Mystic Market now!",
        descriptionAr: "عناصر نادرة وأسلحة حصرية متاحة لفترة محدودة. قم بزيارة السوق الغامض الآن!",
        date: "November 1-14, 2024",
        type: "Market Event",
        image: "/assets/event-market.jpg"
      }
    ];

    for (const event of eventsData) {
      const existing = await EventModel.findOne({ title: event.title });
      if (!existing) {
        await EventModel.create(event);
        console.log(`✅ Created event: ${event.title}`);
      } else {
        console.log(`⏭️  Event already exists: ${event.title}`);
      }
    }

      // Seed Weapons
      console.log('\n🔫 Seeding weapons...');
      for (const weapon of weaponsData) {
        const existing = await WeaponModel.findOne({ name: weapon.name });
        if (!existing) {
          // Ensure all weapons have the cfweapon pg-vip background
          const weaponData = {
            ...weapon,
            background: '/assets/cfweapon-pg-vip.jpg'
          };
          await WeaponModel.create(weaponData);
          console.log(`✅ Created weapon: ${weapon.name}`);
        } else {
          console.log(`⏭️  Weapon already exists: ${weapon.name}`);
        }
      }

        // Seed Game Modes
        console.log('\n🎮 Seeding game modes...');
        for (const mode of modesData) {
          const existing = await ModeModel.findOne({ name: mode.name });
          if (!existing) {
            await ModeModel.create(mode);
            console.log(`✅ Created game mode: ${mode.name}`);
          } else {
            console.log(`⏭️  Game mode already exists: ${mode.name}`);
          }
        }

          // Seed Ranks
          console.log('\n🎖️ Seeding ranks...');
          for (const rank of ranksData) {
            const existing = await RankModel.findOne({ name: rank.name });
            if (!existing) {
              await RankModel.create(rank);
              console.log(`✅ Created rank: ${rank.name}`);
            } else {
              console.log(`⏭️  Rank already exists: ${rank.name}`);
            }
          }

          // Seed Tutorials
          console.log('\n🎥 Seeding tutorials...');
          const tutorialsData = [
            {
              title: "CrossFire Beginner Guide - Getting Started",
              description: "Complete beginner's guide to CrossFire. Learn the basics, controls, and essential tips to start your journey in the game.",
              youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              youtubeId: "dQw4w9WgXcQ",
              likes: 1250
            },
            {
              title: "Top 10 Best Weapons in CrossFire 2024",
              description: "Comprehensive review of the best weapons currently available in CrossFire. Performance analysis and recommendations.",
              youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              youtubeId: "dQw4w9WgXcQ",
              likes: 2100
            },
            {
              title: "Advanced Aiming Techniques - Pro Tips",
              description: "Master advanced aiming techniques used by professional CrossFire players. Improve your accuracy and gameplay.",
              youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              youtubeId: "dQw4w9WgXcQ",
              likes: 890
            },
            {
              title: "CrossFire Game Modes Explained",
              description: "Detailed explanation of all game modes in CrossFire. Learn strategies for each mode to improve your performance.",
              youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              youtubeId: "dQw4w9WgXcQ",
              likes: 675
            },
            {
              title: "Rank Progression Guide - From Rookie to Legend",
              description: "Complete guide to ranking up in CrossFire. Tips, strategies, and requirements for each rank level.",
              youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              youtubeId: "dQw4w9WgXcQ",
              likes: 1450
            },
            {
              title: "CrossFire Map Strategies - Dust 2 Domination",
              description: "Master Dust 2 with these proven strategies. Learn spawn points, common routes, and tactical plays.",
              youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              youtubeId: "dQw4w9WgXcQ",
              likes: 780
            },
            {
              title: "Weapon Customization Guide - Skins & Attachments",
              description: "Complete guide to weapon customization in CrossFire. Learn about skins, attachments, and performance impacts.",
              youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              youtubeId: "dQw4w9WgXcQ",
              likes: 920
            },
            {
              title: "Team Communication & Coordination Tips",
              description: "Essential communication and coordination strategies for team-based gameplay in CrossFire.",
              youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              youtubeId: "dQw4w9WgXcQ",
              likes: 560
            }
          ];

          for (const tutorial of tutorialsData) {
            const existing = await TutorialModel.findOne({ title: tutorial.title });
            if (!existing) {
              await TutorialModel.create(tutorial);
              console.log(`✅ Created tutorial: ${tutorial.title}`);
            } else {
              console.log(`⏭️  Tutorial already exists: ${tutorial.title}`);
            }
          }

          // Seed Mercenaries
          console.log('\n🛡️ Seeding mercenaries...');
          for (const mercenary of mercenariesData) {
            const existing = await MercenaryModel.findOne({ name: mercenary.name });
            if (!existing) {
              await MercenaryModel.create(mercenary);
              console.log(`✅ Created mercenary: ${mercenary.name}`);
            } else {
              console.log(`⏭️  Mercenary already exists: ${mercenary.name}`);
            }
          }

    console.log('\n✅ MongoDB seed completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    disconnectMongoDB();
  }
}

seedMongoDB()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
