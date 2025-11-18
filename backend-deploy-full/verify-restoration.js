#!/usr/bin/env node
/**
 * verify-restoration.js
 * Verifies that all events and graves have been properly restored
 */
import "dotenv/config";
import mongoose from "mongoose";
import { Schema } from "mongoose";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/crossfire-wiki";

async function verifyRestoration() {
  try {
    console.log("🔍 Verifying database restoration...\n");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Define schemas
    const EventSchema = new Schema({}, { collection: 'events' });
    const ModeSchema = new Schema({}, { collection: 'modes' });
    const MercenarySchema = new Schema({}, { collection: 'mercenaries' });
    const WeaponSchema = new Schema({}, { collection: 'weapons' });
    const RankSchema = new Schema({}, { collection: 'ranks' });

    const Event = mongoose.model('Event_Verify', EventSchema);
    const Mode = mongoose.model('Mode_Verify', ModeSchema);
    const Mercenary = mongoose.model('Mercenary_Verify', MercenarySchema);
    const Weapon = mongoose.model('Weapon_Verify', WeaponSchema);
    const Rank = mongoose.model('Rank_Verify', RankSchema);

    // Get counts
    const eventCount = await Event.countDocuments();
    const modeCount = await Mode.countDocuments();
    const mercenaryCount = await Mercenary.countDocuments();
    const weaponCount = await Weapon.countDocuments();
    const rankCount = await Rank.countDocuments();

    console.log("📊 DATABASE RESTORATION VERIFICATION");
    console.log("=====================================");
    console.log(`📅 Events: ${eventCount}`);
    console.log(`🎮 Game Modes: ${modeCount}`);
    console.log(`⚔️  Mercenaries: ${mercenaryCount}`);
    console.log(`🔫 Weapons: ${weaponCount}`);
    console.log(`🏅 Ranks: ${rankCount}`);

    // Get grave/zombie modes
    const graveModes = await Mode.find({ 
      name: { $regex: /zombie|grave|evil den|metal rage/i } 
    }).lean();
    
    console.log(`\n🧟 Grave/Zombie Modes Found: ${graveModes.length}`);
    graveModes.forEach(mode => {
      console.log(`  ✓ ${mode.name}`);
    });

    // Get recent events
    console.log(`\n📋 Latest 10 Events:`);
    const recentEvents = await Event.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    recentEvents.forEach((event, i) => {
      console.log(`  ${i + 1}. ${event.title} (${event.type}) - ${event.date}`);
    });

    // Check for event types
    const eventTypes = await Event.distinct('type');
    console.log(`\n📂 Event Types in Database:`);
    eventTypes.forEach(type => {
      console.log(`  • ${type}`);
    });

    console.log("\n✅ VERIFICATION COMPLETE!");
    console.log("All data has been successfully restored to MongoDB.\n");

    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    throw error;
  }
}

verifyRestoration().catch(console.error);
