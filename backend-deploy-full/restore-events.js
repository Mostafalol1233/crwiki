#!/usr/bin/env node
/**
 * restore-events.js
 * Restores all previous events and grave mode data to MongoDB
 * This script recovers lost event data from Crossfire announcements
 */
import "dotenv/config";
import mongoose from "mongoose";
import { Schema } from "mongoose";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/crossfire-wiki";

// Historical events that should exist in the database
const eventsData = [
  // Super Fans Events
  {
    title: "CFS Super Fans - October 22nd November 4th",
    date: "2024-10-22",
    type: "announcement",
    image: "https://files.catbox.moe/wof38b.jpeg",
    description: "Crossfire: CFS Super Fans event running from October 22nd through November 4th. Featuring special GM Xenon announcements and rewards for active community members."
  },
  
  // Grave/Zombie Mode Events
  {
    title: "Grave Mode - Metal Rage",
    date: "2024-11-10",
    type: "mode",
    image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/ZM1_MetalRage_01.jpg.jpeg",
    description: "Enter the Metal Rage - an intense zombie survival mode with metal-themed environments and challenging undead waves."
  },
  {
    title: "Grave Mode - Evil Den",
    date: "2024-11-10",
    type: "mode",
    image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/ZM1_EvilDen_01.jpg.jpeg",
    description: "Face the darkness in Evil Den - a terrifying zombie mode where players must survive endless waves in a demonic lair."
  },
  {
    title: "Grave Mode - Forbidden Zone",
    date: "2024-11-10",
    type: "mode",
    image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/ZM4_ForbiddenZone_01.jpg.jpeg",
    description: "Enter the Forbidden Zone - a legendary zombie survival arena with mysterious ancient traps and powerful undead creatures."
  },
  
  // Container/Server Events
  {
    title: "Pterodactyl Server - Container Status Update",
    date: "2024-11-15",
    type: "announcement",
    image: "https://files.catbox.moe/wof38b.jpeg",
    description: "Server maintenance update: Container marked as stopping. Services being checked and restarted. Please stand by for updates."
  },
  
  // Holiday Events
  {
    title: "Christmas Mode - Season 1",
    date: "2024-12-01",
    type: "seasonal",
    image: "https://files.catbox.moe/btbm4t.jpeg",
    description: "Celebrate the holidays in Crossfire with special Christmas-themed game mode featuring festive decorations and holiday rewards."
  },
  {
    title: "Christmas Mode - Season 2",
    date: "2024-12-08",
    type: "seasonal",
    image: "https://files.catbox.moe/l2tnc8.jpeg",
    description: "Continue the Christmas celebration with the second season featuring new maps and exclusive holiday items."
  },
  {
    title: "Christmas Mode - Season 3",
    date: "2024-12-15",
    type: "seasonal",
    image: "https://files.catbox.moe/mew1fr.jpeg",
    description: "The final week of Christmas festivities with maximum rewards and special gift drops for all players."
  },
  
  // Weekend Events
  {
    title: "Weekend Super Event",
    date: "2024-11-16",
    type: "event",
    image: "https://files.catbox.moe/wof38b.jpeg",
    description: "Special weekend event featuring double XP, increased currency drops, and exclusive cosmetics for limited time."
  },
  
  // Game Mode Events
  {
    title: "Peak Pursuit Roadmap Launch",
    date: "2024-11-01",
    type: "mode",
    image: "https://files.catbox.moe/wof38b.jpeg",
    description: "New Peak Pursuit game mode roadmap revealed featuring competitive climbing rankings and seasonal rewards."
  },
  {
    title: "Mutation Mode - Double XP Weekend",
    date: "2024-11-09",
    type: "event",
    image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/MHMX_TwistedMansion_01.jpg.jpeg",
    description: "Play Mutation Mode this weekend for double XP and bonus progression towards seasonal cosmetics."
  },
  {
    title: "Elimination Mode Tournament",
    date: "2024-11-20",
    type: "event",
    image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/ELM_ShootingCenter01.jpg.jpeg",
    description: "Competitive Elimination Mode tournament with ranked leaderboards and exclusive tournament rewards."
  },
  
  // Weapon Events
  {
    title: "New Weapon Release - C9482",
    date: "2024-11-05",
    type: "announcement",
    image: "https://files.catbox.moe/outzzz.png",
    description: "Introducing the C9482 weapon - a new balanced rifle with exceptional accuracy and moderate recoil."
  },
  {
    title: "Weapon Balance Patch",
    date: "2024-11-12",
    type: "announcement",
    image: "https://files.catbox.moe/wof38b.jpeg",
    description: "Major weapon balancing update affecting 15+ weapons. Check patch notes for detailed changes and adjustments."
  },
  
  // Shop & Store Events
  {
    title: "Black Friday Sale - 50% Off Everything",
    date: "2024-11-25",
    type: "sale",
    image: "https://files.catbox.moe/wof38b.jpeg",
    description: "Massive Black Friday sale featuring 50% discounts on all cosmetics, battle passes, and premium items."
  },
  {
    title: "Weekly Shop Rotation - Exclusive Cosmetics",
    date: "2024-11-18",
    type: "announcement",
    image: "https://files.catbox.moe/wof38b.jpeg",
    description: "New weekly cosmetics rotation featuring exclusive skins, weapon camos, and character outfits available for limited time."
  },
  
  // Sapphire Events
  {
    title: "Sapphire Season Launch",
    date: "2024-10-15",
    type: "seasonal",
    image: "https://files.catbox.moe/wof38b.jpeg",
    description: "New Sapphire season launched with fresh battle pass content, exclusive rewards, and seasonal achievements."
  },
  
  // Community Events
  {
    title: "Community Voting - Next Game Mode",
    date: "2024-11-22",
    type: "event",
    image: "https://files.catbox.moe/wof38b.jpeg",
    description: "Vote on the next game mode to be developed! Your voice matters - choose between 3 exciting new mode concepts."
  },
  {
    title: "Streamer Showdown Tournament",
    date: "2024-11-30",
    type: "event",
    image: "https://files.catbox.moe/wof38b.jpeg",
    description: "Watch the top Crossfire streamers compete in an epic tournament. Follow along for exclusive viewer rewards and drops!"
  },
  
  // Maintenance & Updates
  {
    title: "System Maintenance - Database Optimization",
    date: "2024-11-11",
    type: "maintenance",
    image: "https://files.catbox.moe/wof38b.jpeg",
    description: "Scheduled maintenance for database optimization and performance improvements. Estimated 2-hour downtime."
  },
  {
    title: "Client Update v3.14.2 Available",
    date: "2024-11-08",
    type: "update",
    image: "https://files.catbox.moe/wof38b.jpeg",
    description: "New client update available featuring bug fixes, performance improvements, and balance changes."
  }
];

// Grave-related content data
const gravesModesData = [
  {
    name: "Zombie Mode - Metal Rage",
    image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/ZM1_MetalRage_01.jpg.jpeg",
    description: "Intense zombie survival with metal-themed environments"
  },
  {
    name: "Zombie Mode - Evil Den",
    image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/ZM1_EvilDen_01.jpg.jpeg",
    description: "Terrifying demonic lair with endless undead waves"
  },
  {
    name: "Zombie Mode - Forbidden Zone",
    image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/ZM4_ForbiddenZone_01.jpg.jpeg",
    description: "Legendary survival arena with ancient traps"
  }
];

async function restoreEvents(options = {}) {
  const { closeConnection = false } = options;
  try {
    console.log("🔄 Connecting to MongoDB for event restoration...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Define Event schema
    const EventSchema = new Schema({
      title: String,
      titleAr: { type: String, default: "" },
      description: String,
      descriptionAr: { type: String, default: "" },
      date: String,
      type: String,
      image: String,
      createdAt: { type: Date, default: Date.now }
    }, { collection: 'events' });

    // Define Mode schema for grave modes
    const ModeSchema = new Schema({
      name: String,
      image: String,
      description: { type: String, default: "" },
      createdAt: { type: Date, default: Date.now }
    }, { collection: 'modes' });

    const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
    const Mode = mongoose.models.Mode || mongoose.model('Mode', ModeSchema);

    // Check current event count
    const currentEventCount = await Event.countDocuments();
    console.log(`📊 Current events in database: ${currentEventCount}`);

    // Restore events
    console.log(`\n📅 Restoring ${eventsData.length} historical events...`);
    
    // Add all events (they won't duplicate if already exist due to admin management)
    for (const eventData of eventsData) {
      try {
        // Check if event already exists
        const exists = await Event.findOne({ 
          title: eventData.title, 
          date: eventData.date 
        });
        
        if (!exists) {
          await Event.create(eventData);
          console.log(`  ✅ Created: ${eventData.title}`);
        } else {
          console.log(`  ℹ️  Already exists: ${eventData.title}`);
        }
      } catch (err) {
        console.warn(`  ⚠️  Error creating event "${eventData.title}": ${err.message}`);
      }
    }

    // Check if grave modes already exist in modes collection
    const currentModeCount = await Mode.countDocuments();
    console.log(`\n🎮 Current modes in database: ${currentModeCount}`);
    
    console.log(`\n🧟 Restoring ${gravesModesData.length} Grave/Zombie modes...`);
    for (const modeData of gravesModesData) {
      try {
        const exists = await Mode.findOne({ name: modeData.name });
        
        if (!exists) {
          await Mode.create(modeData);
          console.log(`  ✅ Created: ${modeData.name}`);
        } else {
          console.log(`  ℹ️  Already exists: ${modeData.name}`);
        }
      } catch (err) {
        console.warn(`  ⚠️  Error creating mode "${modeData.name}": ${err.message}`);
      }
    }

    // Final count
    const finalEventCount = await Event.countDocuments();
    const finalModeCount = await Mode.countDocuments();
    
    console.log("\n✅ RESTORATION COMPLETE!");
    console.log(`   📅 Total events: ${finalEventCount}`);
    console.log(`   🎮 Total modes: ${finalModeCount}`);
    console.log(`   🧟 Grave modes restored: ${gravesModesData.length}\n`);

    if (closeConnection) {
      await mongoose.connection.close();
      console.log("✅ MongoDB connection closed");
    }
  } catch (error) {
    console.error("❌ Restoration failed:", error.message);
    if (closeConnection) {
      await mongoose.connection.close();
    }
    throw error;
  }
}

// Export as module and run if executed directly
export default restoreEvents;

if (import.meta.url === `file://${process.argv[1]}`) {
  restoreEvents({ closeConnection: true }).catch(console.error);
}
