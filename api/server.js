var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/mongodb.ts
import mongoose2 from "mongoose";
async function connectMongoDB() {
  if (cached.conn) {
    console.log("\u{1F4E1} Using cached MongoDB connection");
    return cached.conn;
  }
  if (!cached.promise) {
    const opts = {
      bufferCommands: true
    };
    cached.promise = mongoose2.connect(MONGODB_URI, opts).then((mongoose3) => {
      console.log("\u2705 New MongoDB connection established");
      return mongoose3;
    });
  }
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}
var MONGODB_URI, globalWithMongoose, cached;
var init_mongodb = __esm({
  "server/mongodb.ts"() {
    "use strict";
    MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error("Please define the MONGODB_URI environment variable");
    }
    globalWithMongoose = global;
    cached = globalWithMongoose.mongoose || { conn: null, promise: null };
    if (!globalWithMongoose.mongoose) {
      globalWithMongoose.mongoose = cached;
    }
    mongoose2.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      cached.promise = null;
      cached.conn = null;
    });
  }
});

// server/data/seed-data.js
var seed_data_exports = {};
__export(seed_data_exports, {
  mercenariesData: () => mercenariesData,
  modesData: () => modesData,
  ranksData: () => ranksData,
  weaponsData: () => weaponsData
});
var weaponsData, modesData, ranksData, mercenariesData;
var init_seed_data = __esm({
  "server/data/seed-data.js"() {
    "use strict";
    weaponsData = [
      // Assault Rifles
      {
        name: "M4A1",
        image: "/assets/weapons/C4410.png",
        category: "Assault Rifle",
        description: "A versatile automatic rifle with balanced stats, ideal for medium-range combat.",
        stats: {
          damage: 28,
          accuracy: 85,
          recoil: "Medium",
          fireRate: "High",
          mobility: "Medium",
          magazine: 30,
          range: "Medium"
        }
      },
      {
        name: "AK-47",
        image: "/assets/weapons/C4742.png",
        category: "Assault Rifle",
        description: "High-damage rifle with strong recoil, perfect for close-quarters combat.",
        stats: {
          damage: 34,
          accuracy: 80,
          recoil: "High",
          fireRate: "Medium",
          mobility: "Medium",
          magazine: 30,
          range: "Medium"
        }
      },
      {
        name: "SCAR-L",
        image: "/assets/weapons/C4936.png",
        category: "Assault Rifle",
        description: "Modern assault rifle with excellent accuracy and controlled recoil.",
        stats: {
          damage: 30,
          accuracy: 90,
          recoil: "Low",
          fireRate: "High",
          mobility: "Medium",
          magazine: 30,
          range: "Medium"
        }
      },
      {
        name: "M16A4",
        image: "/assets/weapons/C4953.png",
        category: "Assault Rifle",
        description: "Burst-fire assault rifle with high accuracy and moderate damage.",
        stats: {
          damage: 32,
          accuracy: 88,
          recoil: "Medium",
          fireRate: "Medium",
          mobility: "Medium",
          magazine: 30,
          range: "Medium"
        }
      },
      // Sniper Rifles
      {
        name: "AWM",
        image: "/assets/weapons/C5154.png",
        category: "Sniper Rifle",
        description: "Bolt-action sniper rifle with devastating one-shot kill potential.",
        stats: {
          damage: 100,
          accuracy: 100,
          recoil: "Low",
          fireRate: "Very Low",
          mobility: "Low",
          magazine: 5,
          range: "Long"
        }
      },
      {
        name: "CheyTac M200",
        image: "/assets/weapons/C5155.png",
        category: "Sniper Rifle",
        description: "Anti-materiel sniper rifle with extreme range and penetration.",
        stats: {
          damage: 120,
          accuracy: 100,
          recoil: "High",
          fireRate: "Very Low",
          mobility: "Very Low",
          magazine: 5,
          range: "Very Long"
        }
      },
      // Submachine Guns
      {
        name: "MP5",
        image: "/assets/weapons/C5156.png",
        category: "Submachine Gun",
        description: "Compact SMG with high fire rate, excellent for close-range engagements.",
        stats: {
          damage: 22,
          accuracy: 75,
          recoil: "Medium",
          fireRate: "Very High",
          mobility: "High",
          magazine: 30,
          range: "Short"
        }
      },
      {
        name: "UMP45",
        image: "/assets/weapons/C5157.png",
        category: "Submachine Gun",
        description: "Balanced SMG with good damage and controllable recoil.",
        stats: {
          damage: 25,
          accuracy: 78,
          recoil: "Medium",
          fireRate: "High",
          mobility: "Medium",
          magazine: 25,
          range: "Short"
        }
      },
      // Shotguns
      {
        name: "Remington 870",
        image: "/assets/weapons/C5303.png",
        category: "Shotgun",
        description: "Pump-action shotgun with devastating close-range damage.",
        stats: {
          damage: 80,
          accuracy: 60,
          recoil: "High",
          fireRate: "Low",
          mobility: "Medium",
          magazine: 8,
          range: "Very Short"
        }
      },
      // Pistols
      {
        name: "Desert Eagle",
        image: "/assets/weapons/C5362.png",
        category: "Pistol",
        description: "High-caliber pistol with powerful stopping power.",
        stats: {
          damage: 50,
          accuracy: 85,
          recoil: "High",
          fireRate: "Low",
          mobility: "High",
          magazine: 7,
          range: "Short"
        }
      },
      // Add more weapons as needed, mapping to available images
      {
        name: "M249 SAW",
        image: "/assets/weapons/C5390.png",
        category: "Machine Gun",
        description: "Light machine gun with high capacity and sustained fire.",
        stats: {
          damage: 26,
          accuracy: 70,
          recoil: "High",
          fireRate: "High",
          mobility: "Low",
          magazine: 100,
          range: "Medium"
        }
      },
      {
        name: "M60E4",
        image: "/assets/weapons/C5473.png",
        category: "Machine Gun",
        description: "Heavy machine gun with massive damage output.",
        stats: {
          damage: 35,
          accuracy: 65,
          recoil: "Very High",
          fireRate: "Medium",
          mobility: "Very Low",
          magazine: 100,
          range: "Medium"
        }
      },
      // Continue mapping remaining images to weapons
      {
        name: "FN F2000",
        image: "/assets/weapons/C6411.png",
        category: "Assault Rifle",
        description: "Bullpup assault rifle with good accuracy and mobility.",
        stats: {
          damage: 29,
          accuracy: 87,
          recoil: "Medium",
          fireRate: "High",
          mobility: "High",
          magazine: 30,
          range: "Medium"
        }
      },
      {
        name: "G36C",
        image: "/assets/weapons/C6547.png",
        category: "Assault Rifle",
        description: "Compact assault rifle with balanced performance.",
        stats: {
          damage: 27,
          accuracy: 86,
          recoil: "Medium",
          fireRate: "High",
          mobility: "Medium",
          magazine: 30,
          range: "Medium"
        }
      },
      {
        name: "P90",
        image: "/assets/weapons/C6777.png",
        category: "Submachine Gun",
        description: "Bullpup SMG with high capacity and fire rate.",
        stats: {
          damage: 21,
          accuracy: 76,
          recoil: "Medium",
          fireRate: "Very High",
          mobility: "High",
          magazine: 50,
          range: "Short"
        }
      },
      {
        name: "SPAS-12",
        image: "/assets/weapons/C7325.png",
        category: "Shotgun",
        description: "Semi-automatic shotgun with fast reload and high damage.",
        stats: {
          damage: 75,
          accuracy: 65,
          recoil: "High",
          fireRate: "Medium",
          mobility: "Medium",
          magazine: 8,
          range: "Very Short"
        }
      },
      {
        name: "M14 EBR",
        image: "/assets/weapons/C7411.png",
        category: "Designated Marksman Rifle",
        description: "Semi-automatic DMR with excellent accuracy.",
        stats: {
          damage: 45,
          accuracy: 95,
          recoil: "Low",
          fireRate: "Medium",
          mobility: "Medium",
          magazine: 20,
          range: "Long"
        }
      },
      {
        name: "M24",
        image: "/assets/weapons/C8017.png",
        category: "Sniper Rifle",
        description: "Bolt-action sniper with good balance of damage and mobility.",
        stats: {
          damage: 90,
          accuracy: 98,
          recoil: "Medium",
          fireRate: "Very Low",
          mobility: "Medium",
          magazine: 5,
          range: "Long"
        }
      },
      {
        name: "M82A1",
        image: "/assets/weapons/C8020.png",
        category: "Anti-Materiel Rifle",
        description: "Heavy anti-materiel rifle for long-range precision.",
        stats: {
          damage: 110,
          accuracy: 100,
          recoil: "Very High",
          fireRate: "Very Low",
          mobility: "Very Low",
          magazine: 5,
          range: "Very Long"
        }
      },
      {
        name: "M95",
        image: "/assets/weapons/C8053.png",
        category: "Sniper Rifle",
        description: "Modern sniper rifle with excellent ergonomics.",
        stats: {
          damage: 95,
          accuracy: 99,
          recoil: "Low",
          fireRate: "Very Low",
          mobility: "Medium",
          magazine: 5,
          range: "Long"
        }
      },
      {
        name: "M107",
        image: "/assets/weapons/C8663.png",
        category: "Anti-Materiel Rifle",
        description: "Powerful AMR with penetration capabilities.",
        stats: {
          damage: 115,
          accuracy: 100,
          recoil: "Very High",
          fireRate: "Very Low",
          mobility: "Very Low",
          magazine: 5,
          range: "Very Long"
        }
      },
      {
        name: "M110",
        image: "/assets/weapons/C8665.png",
        category: "Sniper Rifle",
        description: "Semi-automatic sniper rifle with high capacity.",
        stats: {
          damage: 85,
          accuracy: 97,
          recoil: "Medium",
          fireRate: "Medium",
          mobility: "Medium",
          magazine: 10,
          range: "Long"
        }
      },
      {
        name: "M200",
        image: "/assets/weapons/C9288.png",
        category: "Anti-Materiel Rifle",
        description: "Extreme range sniper with massive damage.",
        stats: {
          damage: 125,
          accuracy: 100,
          recoil: "Very High",
          fireRate: "Very Low",
          mobility: "Very Low",
          magazine: 5,
          range: "Extreme"
        }
      },
      {
        name: "M400",
        image: "/assets/weapons/C9482.png",
        category: "Anti-Materiel Rifle",
        description: "Heavy caliber AMR for vehicle destruction.",
        stats: {
          damage: 150,
          accuracy: 100,
          recoil: "Extreme",
          fireRate: "Very Low",
          mobility: "Very Low",
          magazine: 5,
          range: "Extreme"
        }
      }
    ];
    modesData = [
      {
        name: "Team Deathmatch",
        image: "/assets/modes/TDM_AirForceOne_01.jpg.jpeg",
        description: "Classic team vs team combat. The team with the most kills wins.",
        type: "team"
      },
      {
        name: "Search & Destroy",
        image: "/assets/modes/SND_Ankara3_01.jpg.jpeg",
        description: "One team plants the bomb while the other defends. No respawns.",
        type: "team"
      },
      {
        name: "Capture the Flag",
        image: "/assets/modes/FFA_Farm.jpg.jpeg",
        description: "Teams compete to capture the enemy flag while defending their own.",
        type: "team"
      },
      {
        name: "Domination",
        image: "/assets/modes/EM_Christmas_01.jpg.jpeg",
        description: "Teams fight to control multiple points on the map.",
        type: "team"
      },
      {
        name: "Ghost Mode",
        image: "/assets/modes/GUESS_DanceParty_01.jpg.jpeg",
        description: "One team is invisible until they attack. Stealth vs awareness.",
        type: "special"
      },
      {
        name: "Free for All",
        image: "/assets/modes/FFA_Farm.jpg.jpeg",
        description: "Every player for themselves in a battle royale style.",
        type: "solo"
      },
      {
        name: "Knife Mode",
        image: "/assets/modes/MESC_Desktop.jpg.jpeg",
        description: "Only knives allowed. Pure skill-based combat.",
        type: "special"
      },
      {
        name: "Sniper Mode",
        image: "/assets/modes/SND_EagleEye2_06.jpg.jpeg",
        description: "Only sniper rifles. Long-range precision battles.",
        type: "special"
      },
      {
        name: "Shotgun Mode",
        image: "/assets/modes/STDM_Fort_01.jpg.jpeg",
        description: "Shotguns only. Close-quarters carnage.",
        type: "special"
      },
      {
        name: "Bomb Defusal",
        image: "/assets/modes/SND_CentralStation01.jpg.jpeg",
        description: "Defend or defuse the bomb in strategic locations.",
        type: "team"
      }
    ];
    ranksData = [
      // Generate ranks 1-104 with images and requirements
      ...Array.from({ length: 104 }, (_, i) => {
        const rankNum = i + 1;
        const image = `/assets/ranks/rank_${rankNum}.jpg.jpeg`;
        let name = "";
        let description = "";
        let requirements = "";
        if (rankNum === 1) {
          name = "Trainee";
          description = "Starting rank for all new players.";
          requirements = "New account creation";
        } else if (rankNum <= 5) {
          name = `Private ${rankNum - 1}`;
          description = "Basic soldier showing initial combat skills.";
          requirements = `Reach Level ${rankNum * 2} and win ${rankNum * 3} matches`;
        } else if (rankNum <= 10) {
          name = `Corporal ${rankNum - 5}`;
          description = "Shows basic understanding of game mechanics.";
          requirements = `Reach Level ${rankNum * 3} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
        } else if (rankNum <= 20) {
          name = `Sergeant ${rankNum - 10}`;
          description = "Demonstrates growing combat expertise.";
          requirements = `Reach Level ${rankNum * 4} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
        } else if (rankNum <= 30) {
          name = `Staff Sergeant ${rankNum - 20}`;
          description = "Experienced soldier with proven skills.";
          requirements = `Reach Level ${rankNum * 5} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
        } else if (rankNum <= 40) {
          name = `Warrant Officer ${rankNum - 30}`;
          description = "Elite player with exceptional performance.";
          requirements = `Reach Level ${rankNum * 6} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
        } else if (rankNum <= 50) {
          name = `Second Lieutenant ${rankNum - 40}`;
          description = "Officer rank for tactical commanders.";
          requirements = `Reach Level ${rankNum * 7} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
        } else if (rankNum <= 60) {
          name = `First Lieutenant ${rankNum - 50}`;
          description = "Senior officer with leadership qualities.";
          requirements = `Reach Level ${rankNum * 8} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
        } else if (rankNum <= 70) {
          name = `Captain ${rankNum - 60}`;
          description = "Commanding officer with strategic vision.";
          requirements = `Reach Level ${rankNum * 9} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
        } else if (rankNum <= 80) {
          name = `Major ${rankNum - 70}`;
          description = "High-ranking officer with extensive experience.";
          requirements = `Reach Level ${rankNum * 10} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
        } else if (rankNum <= 90) {
          name = `Lieutenant Colonel ${rankNum - 80}`;
          description = "Elite commander with mastery of tactics.";
          requirements = `Reach Level ${rankNum * 11} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
        } else if (rankNum <= 100) {
          name = `Colonel ${rankNum - 90}`;
          description = "Supreme commander with legendary status.";
          requirements = `Reach Level ${rankNum * 12} and maintain ${(rankNum / 10).toFixed(1)} K/D ratio`;
        } else {
          name = `General ${rankNum - 100}`;
          description = "Ultimate rank for the most skilled players.";
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
    mercenariesData = [
      {
        name: "Wolf",
        image: "/assets/merc-wolf.jpg",
        role: "Assault",
        sounds: [
          "/sounds/merc/wolf-line1.mp3",
          "/sounds/merc/wolf-line2.mp3",
          "/sounds/merc/wolf-line3.mp3"
        ]
      },
      {
        name: "Vipers",
        image: "/assets/merc-vipers.jpg",
        role: "Sniper",
        sounds: [
          "/sounds/merc/vipers-line1.mp3",
          "/sounds/merc/vipers-line2.mp3"
        ]
      },
      {
        name: "Sisterhood",
        image: "/assets/merc-sisterhood.jpg",
        role: "Medic",
        sounds: [
          "/sounds/merc/sisterhood-line1.mp3"
        ]
      },
      {
        name: "Black Mamba",
        image: "/assets/merc-blackmamba.jpg",
        role: "Scout"
      },
      {
        name: "Arch Honorary",
        image: "/assets/merc-archhonorary.jpg",
        role: "Tank"
      },
      {
        name: "Desperado",
        image: "/assets/merc-desperado.jpg",
        role: "Engineer"
      },
      {
        name: "Ronin",
        image: "/assets/merc-ronin.jpg",
        role: "Samurai"
      },
      {
        name: "Dean",
        image: "/assets/merc-dean.jpg",
        role: "Specialist"
      },
      {
        name: "Thoth",
        image: "/assets/merc-thoth.jpg",
        role: "Guardian"
      },
      {
        name: "SFG",
        image: "/assets/merc-sfg.jpg",
        role: "Special Forces Group"
      }
    ];
  }
});

// server/db-connect.ts
var db_connect_exports = {};
__export(db_connect_exports, {
  initializeDatabase: () => initializeDatabase
});
async function initializeDatabase() {
  try {
    await connectMongoDB();
    console.log("\u2705 Database connection initialized");
  } catch (error) {
    console.error("\u274C Database connection failed:", error);
    throw error;
  }
}
var init_db_connect = __esm({
  "server/db-connect.ts"() {
    "use strict";
    init_mongodb();
  }
});

// server/index.ts
import "dotenv/config";
import express2 from "express";
import path5 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";

// server/routes.ts
import { createServer } from "http";
import fs2 from "fs";
import path2 from "path";
import multer from "multer";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// shared/mongodb-schema.ts
import mongoose, { Schema } from "mongoose";
import { z } from "zod";
var UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
var PostSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  summary: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  tags: { type: [String], required: true },
  author: { type: String, required: true },
  views: { type: Number, default: 0 },
  readingTime: { type: Number, required: true },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  // SEO fields
  seoTitle: { type: String, default: "" },
  seoDescription: { type: String, default: "" },
  seoKeywords: { type: [String], default: [] },
  canonicalUrl: { type: String, default: "" },
  ogImage: { type: String, default: "" },
  twitterImage: { type: String, default: "" },
  schemaType: { type: String, default: "Article" },
  breadcrumbs: { type: [{ name: String, url: String }], default: [] },
  updatedAt: { type: Date, default: Date.now }
});
var CommentSchema = new Schema({
  postId: { type: String, required: true },
  parentCommentId: { type: String },
  name: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
var EventSchema = new Schema({
  title: { type: String, required: true },
  titleAr: { type: String, default: "" },
  description: { type: String, default: "" },
  descriptionAr: { type: String, default: "" },
  date: { type: String, required: true },
  type: { type: String, required: true },
  image: { type: String, default: "" },
  // SEO fields
  seoTitle: { type: String, default: "" },
  seoDescription: { type: String, default: "" },
  seoKeywords: { type: [String], default: [] },
  canonicalUrl: { type: String, default: "" },
  ogImage: { type: String, default: "" },
  twitterImage: { type: String, default: "" },
  schemaType: { type: String, default: "Event" },
  breadcrumbs: { type: [{ name: String, url: String }], default: [] }
});
var NewsSchema = new Schema({
  title: { type: String, required: true },
  titleAr: { type: String, default: "" },
  dateRange: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  content: { type: String, required: true },
  contentAr: { type: String, default: "" },
  htmlContent: { type: String, default: "" },
  author: { type: String, required: true },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  // SEO fields
  seoTitle: { type: String, default: "" },
  seoDescription: { type: String, default: "" },
  seoKeywords: { type: [String], default: [] },
  canonicalUrl: { type: String, default: "" },
  ogImage: { type: String, default: "" },
  twitterImage: { type: String, default: "" },
  schemaType: { type: String, default: "NewsArticle" },
  breadcrumbs: { type: [{ name: String, url: String }], default: [] },
  updatedAt: { type: Date, default: Date.now }
});
var TicketSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  status: { type: String, default: "open" },
  priority: { type: String, default: "normal" },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
var TicketReplySchema = new Schema({
  ticketId: { type: String, required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
var AdminSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roles: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});
var NewsletterSubscriberSchema = new Schema({
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});
var SellerSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  images: { type: [String], default: [] },
  prices: { type: [{ item: String, price: Number }], default: [] },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  whatsapp: { type: String, default: "" },
  discord: { type: String, default: "" },
  website: { type: String, default: "" },
  featured: { type: Boolean, default: false },
  promotionText: { type: String, default: "" },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
var SellerReviewSchema = new Schema({
  sellerId: { type: String, required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});
var TutorialSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  youtubeUrl: { type: String, required: true },
  youtubeId: { type: String, required: true },
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
var TutorialCommentSchema = new Schema({
  tutorialId: { type: String, required: true },
  author: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
var SiteSettingsSchema = new Schema(
  {
    reviewVerificationEnabled: { type: Boolean, default: false },
    reviewVerificationVideoUrl: { type: String, default: "" },
    reviewVerificationPassphrase: { type: String, default: "" },
    reviewVerificationPrompt: { type: String, default: "" },
    reviewVerificationTimecode: { type: String, default: "" },
    reviewVerificationYouTubeChannelUrl: { type: String, default: "" }
  },
  {
    timestamps: true
  }
);
var WeaponSchema = new Schema({
  name: { type: String, required: true },
  image: { type: String, default: "" },
  background: { type: String, default: "" },
  category: { type: String, default: "" },
  description: { type: String, default: "" },
  stats: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
var ModeSchema = new Schema({
  name: { type: String, required: true },
  image: { type: String, default: "" },
  description: { type: String, default: "" },
  type: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
var RankSchema = new Schema({
  name: { type: String, required: true },
  image: { type: String, default: "" },
  description: { type: String, default: "" },
  requirements: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
var MercenarySchema = new Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  role: { type: String, required: true },
  sounds: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
var AdminPermissionSchema = new Schema({
  adminId: { type: String, required: true, unique: true },
  permissions: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
var UserModel = mongoose.model("User", UserSchema);
var PostModel = mongoose.model("Post", PostSchema);
var CommentModel = mongoose.model("Comment", CommentSchema);
var EventModel = mongoose.model("Event", EventSchema);
var NewsModel = mongoose.model("News", NewsSchema);
var TicketModel = mongoose.model("Ticket", TicketSchema);
var TicketReplyModel = mongoose.model("TicketReply", TicketReplySchema);
var AdminModel = mongoose.model("Admin", AdminSchema);
var NewsletterSubscriberModel = mongoose.model("NewsletterSubscriber", NewsletterSubscriberSchema);
var SellerModel = mongoose.model("Seller", SellerSchema);
var SellerReviewModel = mongoose.model("SellerReview", SellerReviewSchema);
var TutorialModel = mongoose.model("Tutorial", TutorialSchema);
var TutorialCommentModel = mongoose.model("TutorialComment", TutorialCommentSchema);
var SiteSettingsModel = mongoose.model("SiteSettings", SiteSettingsSchema);
var WeaponModel = mongoose.model("Weapon", WeaponSchema);
var ModeModel = mongoose.model("Mode", ModeSchema);
var RankModel = mongoose.model("Rank", RankSchema);
var MercenaryModel = mongoose.model("Mercenary", MercenarySchema);
var AdminPermissionModel = mongoose.model("AdminPermission", AdminPermissionSchema);
var insertUserSchema = z.object({
  username: z.string(),
  password: z.string()
});
var insertPostSchema = z.object({
  title: z.string(),
  content: z.string(),
  summary: z.string(),
  image: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  author: z.string(),
  readingTime: z.number(),
  featured: z.boolean().optional(),
  // SEO fields
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
  canonicalUrl: z.string().optional(),
  ogImage: z.string().optional(),
  twitterImage: z.string().optional(),
  schemaType: z.string().optional(),
  breadcrumbs: z.array(z.object({ name: z.string(), url: z.string() })).optional()
});
var insertCommentSchema = z.object({
  postId: z.string(),
  parentCommentId: z.string().optional(),
  name: z.string(),
  content: z.string()
});
var insertEventSchema = z.object({
  title: z.string(),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  date: z.string(),
  type: z.string(),
  image: z.string().optional(),
  // SEO fields
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
  canonicalUrl: z.string().optional(),
  ogImage: z.string().optional(),
  twitterImage: z.string().optional(),
  schemaType: z.string().optional(),
  breadcrumbs: z.array(z.object({ name: z.string(), url: z.string() })).optional()
});
var insertNewsSchema = z.object({
  title: z.string(),
  titleAr: z.string().optional(),
  dateRange: z.string(),
  image: z.string(),
  category: z.string(),
  content: z.string(),
  contentAr: z.string().optional(),
  htmlContent: z.string().optional(),
  author: z.string(),
  featured: z.boolean().optional(),
  // SEO fields
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
  canonicalUrl: z.string().optional(),
  ogImage: z.string().optional(),
  twitterImage: z.string().optional(),
  schemaType: z.string().optional(),
  breadcrumbs: z.array(z.object({ name: z.string(), url: z.string() })).optional()
});
var insertTicketSchema = z.object({
  title: z.string(),
  description: z.string(),
  userName: z.string(),
  userEmail: z.string(),
  status: z.string().optional(),
  priority: z.string().optional(),
  category: z.string()
});
var insertTicketReplySchema = z.object({
  ticketId: z.string(),
  authorName: z.string(),
  content: z.string(),
  isAdmin: z.boolean().optional()
});
var insertAdminSchema = z.object({
  username: z.string(),
  password: z.string(),
  roles: z.array(z.string()).default([])
});
var insertNewsletterSubscriberSchema = z.object({
  email: z.string().email()
});
var insertSellerSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  prices: z.array(z.object({ item: z.string(), price: z.number() })).optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  discord: z.string().optional(),
  website: z.string().optional(),
  featured: z.boolean().optional(),
  promotionText: z.string().optional()
});
var insertSellerReviewSchema = z.object({
  sellerId: z.string(),
  userName: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  verificationAnswer: z.string().optional()
});
var insertTutorialSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  youtubeUrl: z.string().url(),
  youtubeId: z.string().min(1)
});
var updateTutorialSchema = insertTutorialSchema.partial();
var insertTutorialCommentSchema = z.object({
  tutorialId: z.string().min(1),
  author: z.string().min(1),
  content: z.string().min(1)
});
var insertWeaponSchema = z.object({
  name: z.string().min(1),
  image: z.string().optional(),
  background: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  stats: z.record(z.any()).optional()
});
var insertModeSchema = z.object({
  name: z.string().min(1),
  image: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional()
});
var insertRankSchema = z.object({
  name: z.string().min(1),
  image: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional()
});
var insertMercenarySchema = z.object({
  name: z.string().min(1),
  image: z.string().min(1),
  role: z.string().min(1),
  sounds: z.array(z.string()).optional()
});
var urlOrEmptyString = z.string().trim().optional().transform((value) => value ?? "").refine((value) => {
  if (!value) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}, { message: "Must be a valid URL or left blank" });
var siteSettingsSchema = z.object({
  reviewVerificationEnabled: z.boolean(),
  reviewVerificationVideoUrl: urlOrEmptyString,
  reviewVerificationPassphrase: z.string().trim().max(200).optional().transform((value) => value ?? ""),
  reviewVerificationPrompt: z.string().trim().max(1e3).optional().transform((value) => value ?? ""),
  reviewVerificationTimecode: z.string().trim().max(50).optional().transform((value) => value ?? ""),
  reviewVerificationYouTubeChannelUrl: urlOrEmptyString
});
var updateSiteSettingsSchema = siteSettingsSchema.partial();

// server/mongodb-storage.ts
init_mongodb();
var MongoDBStorage = class {
  mercenaries;
  initialized = false;
  defaultSiteSettings = {
    reviewVerificationEnabled: false,
    reviewVerificationVideoUrl: "",
    reviewVerificationPassphrase: "",
    reviewVerificationPrompt: "",
    reviewVerificationTimecode: "",
    reviewVerificationYouTubeChannelUrl: ""
  };
  constructor() {
    this.mercenaries = /* @__PURE__ */ new Map();
    this.initializeMercenaries();
  }
  // Call this to establish the MongoDB connection. Separated from the
  // constructor so callers can catch connection failures and fall back.
  async initialize() {
    await this.connect();
  }
  async connect() {
    if (!this.initialized) {
      await connectMongoDB();
      this.initialized = true;
    }
  }
  initializeMercenaries() {
    Promise.resolve().then(() => (init_seed_data(), seed_data_exports)).then(({ mercenariesData: mercenariesData2 }) => {
      mercenariesData2.forEach((merc, index) => {
        const mercenary = {
          id: String(index + 1),
          name: merc.name,
          image: merc.image,
          role: merc.role,
          sounds: merc.sounds
        };
        this.mercenaries.set(mercenary.id, mercenary);
      });
    }).catch((err) => {
      console.error("Failed to load mercenaries from seed data:", err);
      const mercenaries = [
        {
          id: "1",
          name: "Wolf",
          image: "/assets/merc-wolf.jpg",
          role: "Assault",
          sounds: [
            "/sounds/merc/wolf-line1.mp3",
            "/sounds/merc/wolf-line2.mp3",
            "/sounds/merc/wolf-line3.mp3"
          ]
        },
        {
          id: "2",
          name: "Vipers",
          image: "/assets/merc-vipers.jpg",
          role: "Sniper",
          sounds: [
            "/sounds/merc/vipers-line1.mp3",
            "/sounds/merc/vipers-line2.mp3"
          ]
        },
        {
          id: "3",
          name: "Sisterhood",
          image: "/assets/merc-sisterhood.jpg",
          role: "Medic",
          sounds: [
            "/sounds/merc/sisterhood-line1.mp3"
          ]
        },
        { id: "4", name: "Black Mamba", image: "/assets/merc-blackmamba.jpg", role: "Scout" },
        { id: "5", name: "Arch Honorary", image: "/assets/merc-archhonorary.jpg", role: "Tank" },
        { id: "6", name: "Desperado", image: "/assets/merc-desperado.jpg", role: "Engineer" },
        { id: "7", name: "Ronin", image: "/assets/merc-ronin.jpg", role: "Samurai" },
        { id: "8", name: "Dean", image: "/assets/merc-dean.jpg", role: "Specialist" },
        { id: "9", name: "Thoth", image: "/assets/merc-thoth.jpg", role: "Guardian" },
        { id: "10", name: "SFG", image: "/assets/merc-sfg.jpg", role: "Special Forces Group" }
      ];
      mercenaries.forEach((merc) => this.mercenaries.set(merc.id, merc));
    });
  }
  async getUser(id) {
    const user = await UserModel.findById(id);
    return user || void 0;
  }
  async getUserByUsername(username) {
    const user = await UserModel.findOne({ username });
    return user || void 0;
  }
  async createUser(user) {
    const newUser = await UserModel.create(user);
    return newUser;
  }
  async getAllPosts() {
    const posts = await PostModel.find().sort({ createdAt: -1 }).lean();
    return posts.map((post) => ({
      ...post,
      id: String(post._id),
      tags: post.tags || [],
      views: post.views || 0,
      category: post.category || "",
      author: post.author || "Unknown"
    }));
  }
  async getPostById(id) {
    const post = await PostModel.findById(id).lean();
    if (!post) return void 0;
    return {
      ...post,
      id: String(post._id),
      tags: post.tags || [],
      views: post.views || 0,
      category: post.category || "",
      author: post.author || "Unknown"
    };
  }
  async createPost(post) {
    const newPost = await PostModel.create(post);
    const lean = await PostModel.findById(newPost._id).lean();
    if (!lean) throw new Error("Failed to create post");
    return {
      ...lean,
      id: String(lean._id),
      tags: lean.tags || [],
      views: lean.views || 0,
      category: lean.category || "",
      author: lean.author || "Unknown"
    };
  }
  async updatePost(id, post) {
    const updated = await PostModel.findByIdAndUpdate(id, post, { new: true }).lean();
    if (!updated) return void 0;
    return {
      ...updated,
      id: String(updated._id),
      tags: updated.tags || [],
      views: updated.views || 0,
      category: updated.category || "",
      author: updated.author || "Unknown"
    };
  }
  async deletePost(id) {
    const result = await PostModel.findByIdAndDelete(id);
    return !!result;
  }
  async incrementPostViews(id) {
    await PostModel.findByIdAndUpdate(id, { $inc: { views: 1 } });
  }
  async getCommentsByPostId(postId) {
    const comments = await CommentModel.find({ postId }).sort({ createdAt: -1 });
    return comments;
  }
  async createComment(comment) {
    const newComment = await CommentModel.create(comment);
    return newComment;
  }
  async getAllEvents() {
    const events = await EventModel.find().lean();
    return events.map((event) => ({
      ...event,
      id: String(event._id)
    }));
  }
  async createEvent(event) {
    const newEvent = await EventModel.create(event);
    const lean = await EventModel.findById(newEvent._id).lean();
    if (!lean) throw new Error("Failed to create event");
    return {
      ...lean,
      id: String(lean._id)
    };
  }
  async deleteEvent(id) {
    const result = await EventModel.findByIdAndDelete(id);
    return !!result;
  }
  async getAllNews() {
    const news = await NewsModel.find().sort({ createdAt: -1 });
    return news.map((item) => ({
      id: String(item._id),
      title: item.title,
      titleAr: item.titleAr,
      dateRange: item.dateRange,
      image: item.image,
      category: item.category,
      content: item.content,
      contentAr: item.contentAr,
      htmlContent: item.htmlContent,
      author: item.author,
      featured: item.featured,
      createdAt: item.createdAt
    }));
  }
  async createNews(news) {
    const newNews = await NewsModel.create(news);
    return {
      id: String(newNews._id),
      title: newNews.title,
      titleAr: newNews.titleAr,
      dateRange: newNews.dateRange,
      image: newNews.image,
      category: newNews.category,
      content: newNews.content,
      contentAr: newNews.contentAr,
      htmlContent: newNews.htmlContent,
      author: newNews.author,
      featured: newNews.featured,
      createdAt: newNews.createdAt
    };
  }
  async updateNews(id, news) {
    const updated = await NewsModel.findByIdAndUpdate(id, news, { new: true });
    if (!updated) return void 0;
    return {
      id: String(updated._id),
      title: updated.title,
      titleAr: updated.titleAr,
      dateRange: updated.dateRange,
      image: updated.image,
      category: updated.category,
      content: updated.content,
      contentAr: updated.contentAr,
      htmlContent: updated.htmlContent,
      author: updated.author,
      featured: updated.featured,
      createdAt: updated.createdAt
    };
  }
  async deleteNews(id) {
    const result = await NewsModel.findByIdAndDelete(id);
    return !!result;
  }
  async getAllMercenaries() {
    return Array.from(this.mercenaries.values());
  }
  async createMercenary(mercenary) {
    const id = String(this.mercenaries.size + 1);
    const newMercenary = { ...mercenary, id };
    this.mercenaries.set(id, newMercenary);
    return newMercenary;
  }
  async updateMercenary(id, mercenary) {
    this.mercenaries.set(id, mercenary);
  }
  async deleteMercenary(id) {
    return this.mercenaries.delete(id);
  }
  async getAllAdminPermissions() {
    try {
      const permissions = await AdminPermissionModel.find().lean();
      const result = {};
      permissions.forEach((perm) => {
        result[perm.adminId] = perm.permissions;
      });
      return result;
    } catch (error) {
      console.error("Error getting admin permissions:", error);
      return {};
    }
  }
  async updateAdminPermissions(adminId, permissions) {
    try {
      await AdminPermissionModel.findOneAndUpdate(
        { adminId },
        { permissions, updatedAt: /* @__PURE__ */ new Date() },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error("Error updating admin permissions:", error);
      throw error;
    }
  }
  async getAllTickets() {
    const tickets = await TicketModel.find().sort({ createdAt: -1 }).lean();
    return tickets.map((ticket) => ({
      ...ticket,
      id: String(ticket._id)
    }));
  }
  async getTicketById(id) {
    const ticket = await TicketModel.findById(id).lean();
    if (!ticket) return void 0;
    return {
      ...ticket,
      id: String(ticket._id)
    };
  }
  async getTicketsByEmail(email) {
    const tickets = await TicketModel.find({ userEmail: email }).sort({ createdAt: -1 }).lean();
    return tickets.map((ticket) => ({
      ...ticket,
      id: String(ticket._id)
    }));
  }
  async createTicket(ticket) {
    const newTicket = await TicketModel.create(ticket);
    const ticketObj = await TicketModel.findById(newTicket._id).lean();
    return {
      ...ticketObj,
      id: String(ticketObj._id)
    };
  }
  async updateTicket(id, ticket) {
    const updated = await TicketModel.findByIdAndUpdate(
      id,
      { ...ticket, updatedAt: /* @__PURE__ */ new Date() },
      { new: true }
    ).lean();
    if (!updated) return void 0;
    return {
      ...updated,
      id: String(updated._id)
    };
  }
  async deleteTicket(id) {
    const result = await TicketModel.findByIdAndDelete(id);
    return !!result;
  }
  async getTicketReplies(ticketId) {
    const replies = await TicketReplyModel.find({ ticketId }).sort({ createdAt: 1 });
    return replies;
  }
  async createTicketReply(reply) {
    const newReply = await TicketReplyModel.create(reply);
    return newReply;
  }
  async getAllAdmins() {
    const admins = await AdminModel.find().sort({ createdAt: -1 }).lean();
    return admins.map((admin) => ({
      ...admin,
      id: String(admin._id)
    }));
  }
  async getAdminById(id) {
    const admin = await AdminModel.findById(id).lean();
    if (!admin) return void 0;
    return {
      ...admin,
      id: String(admin._id)
    };
  }
  async getAdminByUsername(username) {
    const admin = await AdminModel.findOne({ username }).lean();
    if (!admin) return void 0;
    return {
      ...admin,
      id: String(admin._id)
    };
  }
  async createAdmin(admin) {
    const newAdmin = await AdminModel.create(admin);
    const adminObj = await AdminModel.findById(newAdmin._id).lean();
    return {
      ...adminObj,
      id: String(adminObj._id)
    };
  }
  async updateAdmin(id, admin) {
    const updated = await AdminModel.findByIdAndUpdate(id, admin, { new: true }).lean();
    if (!updated) return void 0;
    return {
      ...updated,
      id: String(updated._id)
    };
  }
  async deleteAdmin(id) {
    const result = await AdminModel.findByIdAndDelete(id);
    return !!result;
  }
  async getEventById(id) {
    const event = await EventModel.findById(id).lean();
    if (!event) return void 0;
    return {
      ...event,
      id: String(event._id)
    };
  }
  async updateEvent(id, event) {
    const updated = await EventModel.findByIdAndUpdate(id, event, { new: true }).lean();
    if (!updated) return void 0;
    return {
      ...updated,
      id: String(updated._id)
    };
  }
  async getAllNewsletterSubscribers() {
    const subscribers = await NewsletterSubscriberModel.find().sort({ createdAt: -1 });
    return subscribers;
  }
  async getNewsletterSubscriberByEmail(email) {
    const subscriber = await NewsletterSubscriberModel.findOne({ email });
    return subscriber || void 0;
  }
  async createNewsletterSubscriber(subscriber) {
    const newSubscriber = await NewsletterSubscriberModel.create(subscriber);
    return newSubscriber;
  }
  async deleteNewsletterSubscriber(id) {
    const result = await NewsletterSubscriberModel.findByIdAndDelete(id);
    return !!result;
  }
  async getAllSellers() {
    const sellers = await SellerModel.find().sort({ createdAt: -1 }).lean();
    return sellers.map((seller) => ({
      ...seller,
      id: String(seller._id),
      images: seller.images || [],
      prices: seller.prices || [],
      averageRating: seller.averageRating || 0,
      totalReviews: seller.totalReviews || 0
    }));
  }
  async getSellerById(id) {
    const seller = await SellerModel.findById(id).lean();
    if (!seller) return void 0;
    return {
      ...seller,
      id: String(seller._id),
      images: seller.images || [],
      prices: seller.prices || [],
      averageRating: seller.averageRating || 0,
      totalReviews: seller.totalReviews || 0
    };
  }
  async createSeller(seller) {
    const newSeller = await SellerModel.create(seller);
    const lean = await SellerModel.findById(newSeller._id).lean();
    if (!lean) throw new Error("Failed to create seller");
    return {
      ...lean,
      id: String(lean._id),
      images: lean.images || [],
      prices: lean.prices || [],
      averageRating: lean.averageRating || 0,
      totalReviews: lean.totalReviews || 0
    };
  }
  async updateSeller(id, seller) {
    const updated = await SellerModel.findByIdAndUpdate(id, seller, { new: true }).lean();
    if (!updated) return void 0;
    return {
      ...updated,
      id: String(updated._id),
      images: updated.images || [],
      prices: updated.prices || [],
      averageRating: updated.averageRating || 0,
      totalReviews: updated.totalReviews || 0
    };
  }
  async deleteSeller(id) {
    const result = await SellerModel.findByIdAndDelete(id);
    await SellerReviewModel.deleteMany({ sellerId: id });
    return !!result;
  }
  async getSellerReviews(sellerId) {
    const reviews = await SellerReviewModel.find({ sellerId }).sort({ createdAt: -1 }).lean();
    return reviews.map((review) => ({
      ...review,
      id: String(review._id)
    }));
  }
  async createSellerReview(review) {
    const newReview = await SellerReviewModel.create(review);
    await this.updateSellerRating(review.sellerId);
    const lean = await SellerReviewModel.findById(newReview._id).lean();
    if (!lean) throw new Error("Failed to create review");
    return {
      ...lean,
      id: String(lean._id)
    };
  }
  async deleteSellerReview(reviewId) {
    const review = await SellerReviewModel.findByIdAndDelete(reviewId);
    if (!review) return false;
    await this.updateSellerRating(review.sellerId);
    return true;
  }
  async updateSellerRating(sellerId) {
    const reviews = await SellerReviewModel.find({ sellerId });
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;
    await SellerModel.findByIdAndUpdate(sellerId, {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews
    });
  }
  async getAllTutorials() {
    const tutorials = await TutorialModel.find().sort({ createdAt: -1 }).lean();
    return tutorials.map((tutorial) => ({
      ...tutorial,
      id: String(tutorial._id)
    }));
  }
  async getTutorialById(id) {
    const tutorial = await TutorialModel.findById(id).lean();
    if (!tutorial) return void 0;
    return {
      ...tutorial,
      id: String(tutorial._id)
    };
  }
  async createTutorial(tutorial) {
    const newTutorial = await TutorialModel.create(tutorial);
    const lean = await TutorialModel.findById(newTutorial._id).lean();
    if (!lean) throw new Error("Failed to create tutorial");
    return {
      ...lean,
      id: String(lean._id)
    };
  }
  async updateTutorial(id, tutorial) {
    const updated = await TutorialModel.findByIdAndUpdate(id, tutorial, { new: true }).lean();
    if (!updated) return void 0;
    return {
      ...updated,
      id: String(updated._id)
    };
  }
  async deleteTutorial(id) {
    const result = await TutorialModel.findByIdAndDelete(id);
    await TutorialCommentModel.deleteMany({ tutorialId: id });
    return !!result;
  }
  async incrementTutorialLikes(id) {
    const updated = await TutorialModel.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    ).lean();
    if (!updated) return void 0;
    return {
      ...updated,
      id: String(updated._id)
    };
  }
  async getTutorialComments(tutorialId) {
    const comments = await TutorialCommentModel.find({ tutorialId }).sort({ createdAt: -1 }).lean();
    return comments.map((comment) => ({
      ...comment,
      id: String(comment._id)
    }));
  }
  async createTutorialComment(comment) {
    const newComment = await TutorialCommentModel.create(comment);
    const lean = await TutorialCommentModel.findById(newComment._id).lean();
    if (!lean) throw new Error("Failed to create tutorial comment");
    return {
      ...lean,
      id: String(lean._id)
    };
  }
  async deleteTutorialComment(id) {
    const result = await TutorialCommentModel.findByIdAndDelete(id);
    return !!result;
  }
  mapSiteSettings(doc) {
    if (!doc) {
      return { ...this.defaultSiteSettings };
    }
    return {
      reviewVerificationEnabled: Boolean(doc.reviewVerificationEnabled),
      reviewVerificationVideoUrl: doc.reviewVerificationVideoUrl || "",
      reviewVerificationPassphrase: doc.reviewVerificationPassphrase || "",
      reviewVerificationPrompt: doc.reviewVerificationPrompt || "",
      reviewVerificationTimecode: doc.reviewVerificationTimecode || "",
      reviewVerificationYouTubeChannelUrl: doc.reviewVerificationYouTubeChannelUrl || ""
    };
  }
  async getSiteSettings() {
    await this.connect();
    const existing = await SiteSettingsModel.findOne().lean();
    if (!existing) {
      await SiteSettingsModel.create(this.defaultSiteSettings);
      return { ...this.defaultSiteSettings };
    }
    return this.mapSiteSettings(existing);
  }
  async updateSiteSettings(settings) {
    await this.connect();
    const update = {
      ...settings
    };
    for (const key of Object.keys(update)) {
      if (update[key] === void 0) {
        delete update[key];
      }
    }
    const updated = await SiteSettingsModel.findOneAndUpdate({}, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }).lean();
    return this.mapSiteSettings(updated);
  }
  // Weapons methods
  async getAllWeapons() {
    await this.connect();
    const weapons = await WeaponModel.find().sort({ createdAt: -1 });
    return weapons.map((w) => ({
      ...w.toObject(),
      id: w._id.toString()
    }));
  }
  async getWeaponById(id) {
    await this.connect();
    const weapon = await WeaponModel.findById(id).lean();
    if (!weapon) return void 0;
    return {
      id: weapon._id.toString(),
      name: weapon.name,
      image: weapon.image,
      category: weapon.category || "",
      description: weapon.description || "",
      stats: weapon.stats || {},
      createdAt: weapon.createdAt,
      updatedAt: weapon.updatedAt
    };
  }
  async createWeapon(weapon) {
    await this.connect();
    const created = await WeaponModel.create(weapon);
    const lean = await WeaponModel.findById(created._id).lean();
    if (!lean) throw new Error("Failed to create weapon");
    return {
      id: lean._id.toString(),
      name: lean.name,
      image: lean.image,
      category: lean.category || "",
      description: lean.description || "",
      stats: lean.stats || {},
      createdAt: lean.createdAt,
      updatedAt: lean.updatedAt
    };
  }
  async updateWeapon(id, weapon) {
    await this.connect();
    const updated = await WeaponModel.findByIdAndUpdate(id, { ...weapon, updatedAt: /* @__PURE__ */ new Date() }, { new: true }).lean();
    if (!updated) return void 0;
    return {
      id: updated._id.toString(),
      name: updated.name,
      image: updated.image,
      category: updated.category || "",
      description: updated.description || "",
      stats: updated.stats || {},
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    };
  }
  async deleteWeapon(id) {
    await this.connect();
    const result = await WeaponModel.findByIdAndDelete(id);
    return !!result;
  }
  // Modes methods
  async getAllModes() {
    await this.connect();
    const modes = await ModeModel.find().sort({ createdAt: -1 });
    return modes.map((m) => ({
      ...m.toObject(),
      id: m._id.toString()
    }));
  }
  async getModeById(id) {
    await this.connect();
    const mode = await ModeModel.findById(id).lean();
    if (!mode) return void 0;
    return {
      id: mode._id.toString(),
      name: mode.name,
      image: mode.image,
      description: mode.description || "",
      type: mode.type || "",
      createdAt: mode.createdAt,
      updatedAt: mode.updatedAt
    };
  }
  async createMode(mode) {
    await this.connect();
    const created = await ModeModel.create(mode);
    return {
      id: created._id.toString(),
      name: created.name,
      image: created.image,
      description: created.description || "",
      type: created.type || "",
      createdAt: created.createdAt,
      updatedAt: created.updatedAt
    };
  }
  async updateMode(id, mode) {
    await this.connect();
    const updated = await ModeModel.findByIdAndUpdate(id, { ...mode, updatedAt: /* @__PURE__ */ new Date() }, { new: true }).lean();
    if (!updated) return void 0;
    return {
      id: updated._id.toString(),
      name: updated.name,
      image: updated.image,
      description: updated.description || "",
      type: updated.type || "",
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    };
  }
  async deleteMode(id) {
    await this.connect();
    const result = await ModeModel.findByIdAndDelete(id);
    return !!result;
  }
  // Ranks methods
  async getAllRanks() {
    await this.connect();
    const ranks = await RankModel.find().sort({ createdAt: -1 }).lean();
    return ranks.map((r) => ({
      id: r._id.toString(),
      name: r.name,
      image: r.image,
      description: r.description || "",
      requirements: r.requirements || "",
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));
  }
  async getRankById(id) {
    await this.connect();
    const rank = await RankModel.findById(id).lean();
    if (!rank) return void 0;
    return {
      id: rank._id.toString(),
      name: rank.name,
      image: rank.image,
      description: rank.description || "",
      requirements: rank.requirements || "",
      createdAt: rank.createdAt,
      updatedAt: rank.updatedAt
    };
  }
  async createRank(rank) {
    await this.connect();
    const created = await RankModel.create(rank);
    return {
      id: created._id.toString(),
      name: created.name,
      image: created.image,
      description: created.description || "",
      requirements: created.requirements || "",
      createdAt: created.createdAt,
      updatedAt: created.updatedAt
    };
  }
  async updateRank(id, rank) {
    await this.connect();
    const updated = await RankModel.findByIdAndUpdate(id, { ...rank, updatedAt: /* @__PURE__ */ new Date() }, { new: true }).lean();
    if (!updated) return void 0;
    return {
      id: updated._id.toString(),
      name: updated.name,
      image: updated.image,
      description: updated.description || "",
      requirements: updated.requirements || "",
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    };
  }
  async deleteRank(id) {
    await this.connect();
    const result = await RankModel.findByIdAndDelete(id);
    return !!result;
  }
};

// server/memory-storage.ts
import { v4 as uuidv4 } from "uuid";
var MemoryStorage = class {
  posts = [];
  comments = [];
  events = [];
  news = [];
  mercenaries = /* @__PURE__ */ new Map();
  tickets = [];
  ticketReplies = [];
  admins = [];
  newsletterSubscribers = [];
  sellers = [];
  sellerReviews = [];
  tutorials = [];
  tutorialComments = [];
  weapons = [];
  modes = [];
  ranks = [];
  siteSettings = {
    reviewVerificationEnabled: false,
    reviewVerificationVideoUrl: "",
    reviewVerificationPassphrase: "",
    reviewVerificationPrompt: "",
    reviewVerificationTimecode: "",
    reviewVerificationYouTubeChannelUrl: ""
  };
  constructor() {
    const admin = {
      id: uuidv4(),
      username: "admin",
      password: "$2a$10$eW91ci1kZWZhdWx0LXBhc3N3b3JkLWhhc2g........",
      // dummy
      roles: ["admin"],
      createdAt: /* @__PURE__ */ new Date()
    };
    this.admins.push(admin);
    this.mercenaries.set("1", { id: "1", name: "Wolf", image: "/assets/merc-wolf.jpg", role: "Assault" });
    this.mercenaries.set("2", { id: "2", name: "Vipers", image: "/assets/merc-vipers.jpg", role: "Sniper" });
    this.mercenaries.set("3", { id: "3", name: "Sisterhood", image: "/assets/merc-sisterhood.jpg", role: "Medic" });
    const now = /* @__PURE__ */ new Date();
    const samplePost1 = {
      id: uuidv4(),
      title: "Top 5 CrossFire Weapons \u2014 2025 Review",
      content: "A deep dive into the top 5 weapons in CrossFire for 2025...",
      summary: "Quick guide to the best weapons in 2025 for competitive play.",
      image: "/assets/feature-crossfire.jpg",
      category: "Reviews",
      tags: ["Weapons", "Review"],
      author: "Bimora Team",
      featured: false,
      readingTime: 4,
      views: 123,
      createdAt: now
    };
    const samplePost2 = {
      id: uuidv4(),
      title: "How to Master the New Mid Line Map",
      content: "Strategies and tips to control Mid Line map...",
      summary: "Learn pro tips to dominate Mid Line in Search & Destroy.",
      image: "/assets/feature-crossfire.jpg",
      category: "Tutorials",
      tags: ["Maps", "Guide"],
      author: "Bimora Team",
      featured: true,
      readingTime: 6,
      views: 98,
      createdAt: new Date(now.getTime() - 1e3 * 60 * 60 * 24)
    };
    const samplePost3 = {
      id: uuidv4(),
      title: "Player Experience: CFS Super Fans Event Review",
      content: "Our hands-on review of the CFS Super Fans event and rewards...",
      summary: "Event review and what you should aim to collect.",
      image: "/assets/news-superfans.jpg",
      category: "Reviews",
      tags: ["Event", "Review"],
      author: "Bimora Team",
      featured: false,
      readingTime: 3,
      views: 45,
      createdAt: new Date(now.getTime() - 1e3 * 60 * 60 * 48)
    };
    this.posts = [samplePost1, samplePost2, samplePost3];
    this.news = [
      {
        id: uuidv4(),
        title: "Mystic Moonlight Market",
        dateRange: "Oct 29 - Nov 11",
        image: "/assets/news-sapphire.jpg",
        category: "Event",
        content: "Explore the enchanting Mystic Moonlight Market event!",
        author: "[GM]Xenon",
        featured: true,
        createdAt: now
      },
      {
        id: uuidv4(),
        title: "CF Shop Special Sale",
        dateRange: "Oct 8 - Oct 22",
        image: "/assets/news-shop.jpg",
        category: "Sale",
        content: "Don't miss our biggest CF Shop sale of the year!",
        author: "[GM]Xenon",
        featured: false,
        createdAt: new Date(now.getTime() - 1e3 * 60 * 60 * 24)
      }
    ];
  }
  // Users
  async getUser(id) {
    return void 0;
  }
  async getUserByUsername(username) {
    return void 0;
  }
  async createUser(user) {
    const u = { ...user, id: uuidv4(), createdAt: /* @__PURE__ */ new Date() };
    return u;
  }
  // Posts
  async getAllPosts() {
    return this.posts;
  }
  async getPostById(id) {
    return this.posts.find((p) => p.id === id);
  }
  async createPost(post) {
    const p = { ...post, id: uuidv4(), createdAt: /* @__PURE__ */ new Date(), views: 0 };
    this.posts.unshift(p);
    return p;
  }
  async updatePost(id, post) {
    const idx = this.posts.findIndex((p) => p.id === id);
    if (idx === -1) return void 0;
    this.posts[idx] = { ...this.posts[idx], ...post };
    return this.posts[idx];
  }
  async deletePost(id) {
    const before = this.posts.length;
    this.posts = this.posts.filter((p) => p.id !== id);
    return this.posts.length < before;
  }
  async incrementPostViews(id) {
    const p = this.posts.find((p2) => p2.id === id);
    if (p) p.views = (p.views || 0) + 1;
  }
  // Comments
  async getCommentsByPostId(postId) {
    return this.comments.filter((c) => c.postId === postId);
  }
  async createComment(comment) {
    const c = { ...comment, id: uuidv4(), createdAt: /* @__PURE__ */ new Date() };
    this.comments.push(c);
    return c;
  }
  // Events
  async getAllEvents() {
    return this.events;
  }
  async getEventById(id) {
    return this.events.find((e) => e.id === id);
  }
  async createEvent(event) {
    const e = { ...event, id: uuidv4(), createdAt: /* @__PURE__ */ new Date() };
    this.events.unshift(e);
    return e;
  }
  async updateEvent(id, event) {
    const idx = this.events.findIndex((e) => e.id === id);
    if (idx === -1) return void 0;
    this.events[idx] = { ...this.events[idx], ...event };
    return this.events[idx];
  }
  async deleteEvent(id) {
    const before = this.events.length;
    this.events = this.events.filter((e) => e.id !== id);
    return this.events.length < before;
  }
  // News
  async getAllNews() {
    return this.news;
  }
  async createNews(news) {
    const n = { ...news, id: uuidv4(), createdAt: /* @__PURE__ */ new Date() };
    this.news.unshift(n);
    return n;
  }
  async updateNews(id, news) {
    const idx = this.news.findIndex((n) => n.id === id);
    if (idx === -1) return void 0;
    this.news[idx] = { ...this.news[idx], ...news };
    return this.news[idx];
  }
  async deleteNews(id) {
    const before = this.news.length;
    this.news = this.news.filter((n) => n.id !== id);
    return this.news.length < before;
  }
  // Mercenaries
  async getAllMercenaries() {
    return Array.from(this.mercenaries.values());
  }
  async createMercenary(mercenary) {
    const id = String(this.mercenaries.size + 1);
    const newMercenary = { ...mercenary, id };
    this.mercenaries.set(id, newMercenary);
    return newMercenary;
  }
  async updateMercenary(id, mercenary) {
    this.mercenaries.set(id, mercenary);
  }
  async deleteMercenary(id) {
    return this.mercenaries.delete(id);
  }
  // Admin Permissions
  async getAllAdminPermissions() {
    return {};
  }
  async updateAdminPermissions(adminId, permissions) {
  }
  // Tickets
  async getAllTickets() {
    return this.tickets;
  }
  async getTicketById(id) {
    return this.tickets.find((t) => t.id === id);
  }
  async getTicketsByEmail(email) {
    return this.tickets.filter((t) => t.userEmail === email);
  }
  async createTicket(ticket) {
    const t = { ...ticket, id: uuidv4(), createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() };
    this.tickets.unshift(t);
    return t;
  }
  async updateTicket(id, ticket) {
    const idx = this.tickets.findIndex((t) => t.id === id);
    if (idx === -1) return void 0;
    this.tickets[idx] = { ...this.tickets[idx], ...ticket, updatedAt: /* @__PURE__ */ new Date() };
    return this.tickets[idx];
  }
  async deleteTicket(id) {
    const before = this.tickets.length;
    this.tickets = this.tickets.filter((t) => t.id !== id);
    return this.tickets.length < before;
  }
  async getTicketReplies(ticketId) {
    return this.ticketReplies.filter((r) => r.ticketId === ticketId);
  }
  async createTicketReply(reply) {
    const r = { ...reply, id: uuidv4(), createdAt: /* @__PURE__ */ new Date() };
    this.ticketReplies.push(r);
    return r;
  }
  // Admins
  async getAllAdmins() {
    return this.admins;
  }
  async getAdminById(id) {
    return this.admins.find((a) => a.id === id);
  }
  async getAdminByUsername(username) {
    return this.admins.find((a) => a.username === username);
  }
  async createAdmin(admin) {
    const a = { ...admin, id: uuidv4(), createdAt: /* @__PURE__ */ new Date() };
    this.admins.unshift(a);
    return a;
  }
  async updateAdmin(id, admin) {
    const idx = this.admins.findIndex((a) => a.id === id);
    if (idx === -1) return void 0;
    this.admins[idx] = { ...this.admins[idx], ...admin };
    return this.admins[idx];
  }
  async deleteAdmin(id) {
    const before = this.admins.length;
    this.admins = this.admins.filter((a) => a.id !== id);
    return this.admins.length < before;
  }
  // Newsletter subscribers
  async getAllNewsletterSubscribers() {
    return this.newsletterSubscribers;
  }
  async getNewsletterSubscriberByEmail(email) {
    return this.newsletterSubscribers.find((s) => s.email === email);
  }
  async createNewsletterSubscriber(subscriber) {
    const s = { ...subscriber, id: uuidv4(), createdAt: /* @__PURE__ */ new Date() };
    this.newsletterSubscribers.unshift(s);
    return s;
  }
  async deleteNewsletterSubscriber(id) {
    const before = this.newsletterSubscribers.length;
    this.newsletterSubscribers = this.newsletterSubscribers.filter((s) => s.id !== id);
    return this.newsletterSubscribers.length < before;
  }
  // Sellers
  async getAllSellers() {
    return this.sellers;
  }
  async getSellerById(id) {
    return this.sellers.find((s) => s.id === id);
  }
  async createSeller(seller) {
    const s = { ...seller, id: uuidv4(), createdAt: /* @__PURE__ */ new Date(), images: seller.images || [], prices: seller.prices || [], averageRating: 0, totalReviews: 0 };
    this.sellers.unshift(s);
    return s;
  }
  async updateSeller(id, seller) {
    const idx = this.sellers.findIndex((s) => s.id === id);
    if (idx === -1) return void 0;
    this.sellers[idx] = { ...this.sellers[idx], ...seller };
    return this.sellers[idx];
  }
  async deleteSeller(id) {
    const before = this.sellers.length;
    this.sellers = this.sellers.filter((s) => s.id !== id);
    this.sellerReviews = this.sellerReviews.filter((r) => r.sellerId !== id);
    return this.sellers.length < before;
  }
  async getSellerReviews(sellerId) {
    return this.sellerReviews.filter((r) => r.sellerId === sellerId);
  }
  async createSellerReview(review) {
    const r = { ...review, id: uuidv4(), createdAt: /* @__PURE__ */ new Date() };
    this.sellerReviews.push(r);
    await this.updateSellerRating(review.sellerId);
    return r;
  }
  async deleteSellerReview(reviewId) {
    const before = this.sellerReviews.length;
    const removed = this.sellerReviews.find((r) => r.id === reviewId);
    if (!removed) return false;
    this.sellerReviews = this.sellerReviews.filter((r) => r.id !== reviewId);
    await this.updateSellerRating(removed.sellerId);
    return this.sellerReviews.length < before;
  }
  async updateSellerRating(sellerId) {
    const reviews = this.sellerReviews.filter((r) => r.sellerId === sellerId);
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / totalReviews : 0;
    const seller = this.sellers.find((s) => s.id === sellerId);
    if (seller) {
      seller.averageRating = Math.round(averageRating * 10) / 10;
      seller.totalReviews = totalReviews;
    }
  }
  async getSiteSettings() {
    return { ...this.siteSettings };
  }
  async updateSiteSettings(settings) {
    this.siteSettings = {
      ...this.siteSettings,
      ...settings || {}
    };
    return { ...this.siteSettings };
  }
  // Tutorials
  async getAllTutorials() {
    return this.tutorials;
  }
  async getTutorialById(id) {
    return this.tutorials.find((t) => t.id === id);
  }
  async createTutorial(tutorial) {
    const t = { ...tutorial, id: uuidv4(), createdAt: /* @__PURE__ */ new Date(), likes: 0 };
    this.tutorials.unshift(t);
    return t;
  }
  async updateTutorial(id, tutorial) {
    const idx = this.tutorials.findIndex((t) => t.id === id);
    if (idx === -1) return void 0;
    this.tutorials[idx] = { ...this.tutorials[idx], ...tutorial };
    return this.tutorials[idx];
  }
  async deleteTutorial(id) {
    const before = this.tutorials.length;
    this.tutorials = this.tutorials.filter((t) => t.id !== id);
    this.tutorialComments = this.tutorialComments.filter((c) => c.tutorialId !== id);
    return this.tutorials.length < before;
  }
  async incrementTutorialLikes(id) {
    const t = this.tutorials.find((t2) => t2.id === id);
    if (!t) return void 0;
    t.likes = (t.likes || 0) + 1;
    return t;
  }
  async getTutorialComments(tutorialId) {
    return this.tutorialComments.filter((c) => c.tutorialId === tutorialId);
  }
  async createTutorialComment(comment) {
    const c = { ...comment, id: uuidv4(), createdAt: /* @__PURE__ */ new Date() };
    this.tutorialComments.push(c);
    return c;
  }
  async deleteTutorialComment(id) {
    const before = this.tutorialComments.length;
    this.tutorialComments = this.tutorialComments.filter((c) => c.id !== id);
    return this.tutorialComments.length < before;
  }
  // Weapons
  async getAllWeapons() {
    return this.weapons;
  }
  async getWeaponById(id) {
    return this.weapons.find((w) => w.id === id);
  }
  async createWeapon(weapon) {
    const w = { ...weapon, id: uuidv4(), createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() };
    this.weapons.unshift(w);
    return w;
  }
  async updateWeapon(id, weapon) {
    const idx = this.weapons.findIndex((w) => w.id === id);
    if (idx === -1) return void 0;
    this.weapons[idx] = { ...this.weapons[idx], ...weapon, updatedAt: /* @__PURE__ */ new Date() };
    return this.weapons[idx];
  }
  async deleteWeapon(id) {
    const before = this.weapons.length;
    this.weapons = this.weapons.filter((w) => w.id !== id);
    return this.weapons.length < before;
  }
  // Modes
  async getAllModes() {
    return this.modes;
  }
  async getModeById(id) {
    return this.modes.find((m) => m.id === id);
  }
  async createMode(mode) {
    const m = { ...mode, id: uuidv4(), createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() };
    this.modes.unshift(m);
    return m;
  }
  async updateMode(id, mode) {
    const idx = this.modes.findIndex((m) => m.id === id);
    if (idx === -1) return void 0;
    this.modes[idx] = { ...this.modes[idx], ...mode, updatedAt: /* @__PURE__ */ new Date() };
    return this.modes[idx];
  }
  async deleteMode(id) {
    const before = this.modes.length;
    this.modes = this.modes.filter((m) => m.id !== id);
    return this.modes.length < before;
  }
  // Ranks
  async getAllRanks() {
    return this.ranks;
  }
  async getRankById(id) {
    return this.ranks.find((r) => r.id === id);
  }
  async createRank(rank) {
    const r = { ...rank, id: uuidv4(), createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() };
    this.ranks.unshift(r);
    return r;
  }
  async updateRank(id, rank) {
    const idx = this.ranks.findIndex((r) => r.id === id);
    if (idx === -1) return void 0;
    this.ranks[idx] = { ...this.ranks[idx], ...rank, updatedAt: /* @__PURE__ */ new Date() };
    return this.ranks[idx];
  }
  async deleteRank(id) {
    const before = this.ranks.length;
    this.ranks = this.ranks.filter((r) => r.id !== id);
    return this.ranks.length < before;
  }
};

// server/storage.ts
var _storage;
try {
  const mongo = new MongoDBStorage();
  await mongo.initialize();
  console.log("Using MongoDBStorage");
  _storage = mongo;
} catch (err) {
  console.error("MongoDB initialize failed, falling back to MemoryStorage:", err);
  const mem = new MemoryStorage();
  _storage = mem;
}
var storage = _storage;
if (process.env.VERCEL) {
  try {
    await storage.getAllPosts();
    console.log("MongoDB connection warmed up for Vercel");
  } catch (err) {
    console.error("Failed to warm up MongoDB connection:", err);
  }
}

// server/utils/auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "SuperAdmin#2024$SecurePass!9x";
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
async function verifyAdminPassword(password) {
  return password === ADMIN_PASSWORD;
}
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log("[AUTH] Authorization header:", authHeader ? "present" : "missing");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("[AUTH] No Bearer token found");
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.substring(7);
  console.log("[AUTH] Token extracted, length:", token.length);
  const payload = verifyToken(token);
  console.log("[AUTH] Token verification result:", payload ? "valid" : "invalid");
  if (!payload) {
    return res.status(401).json({ error: "Invalid token" });
  }
  req.user = payload;
  next();
}
function requireSuperAdmin(req, res, next) {
  const user = req.user;
  if (!user || !user.roles || !user.roles.includes("super_admin")) {
    return res.status(403).json({ error: "Forbidden: Super Admin access required" });
  }
  next();
}
function hasPermission(user, perm) {
  if (!user) return false;
  if (user.roles && Array.isArray(user.roles) && user.roles.includes("super_admin")) return true;
  const perms = user.permissions || {};
  if (Array.isArray(perm)) {
    return perm.some((p) => Boolean(perms[p]));
  }
  return Boolean(perms[perm]);
}
function requireAdminOrTicketManager(req, res, next) {
  const user = req.user;
  if (!user) return res.status(403).json({ error: "Forbidden: Admin access required" });
  const allowedRoles = ["super_admin", "admin", "ticket_manager"];
  const hasRole = user.roles && Array.isArray(user.roles) && allowedRoles.some((role) => user.roles.includes(role));
  const hasPerm = hasPermission(user, "tickets:manage");
  if (!hasRole && !hasPerm) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
}
function requireEventManager(req, res, next) {
  const user = req.user;
  if (!user) return res.status(403).json({ error: "Forbidden: Event Manager access required" });
  const hasRole = user.roles && Array.isArray(user.roles) && user.roles.includes("event_manager");
  const hasPerm = hasPermission(user, ["events:add"]);
  if (!hasRole && !hasPerm) {
    return res.status(403).json({ error: "Forbidden: Event Manager access required" });
  }
  next();
}
function requireEventScraper(req, res, next) {
  const user = req.user;
  if (!user) return res.status(403).json({ error: "Forbidden: Event Scraper access required" });
  const hasRole = user.roles && Array.isArray(user.roles) && user.roles.includes("event_scraper");
  const hasPerm = hasPermission(user, ["events:scrape"]);
  if (!hasRole && !hasPerm) {
    return res.status(403).json({ error: "Forbidden: Event Scraper access required" });
  }
  next();
}
function requireNewsManager(req, res, next) {
  const user = req.user;
  if (!user) return res.status(403).json({ error: "Forbidden: News Manager access required" });
  const hasRole = user.roles && Array.isArray(user.roles) && user.roles.includes("news_manager");
  const hasPerm = hasPermission(user, ["news:add"]);
  if (!hasRole && !hasPerm) {
    return res.status(403).json({ error: "Forbidden: News Manager access required" });
  }
  next();
}
function requireSellerManager(req, res, next) {
  const user = req.user;
  if (!user) return res.status(403).json({ error: "Forbidden: Seller Manager access required" });
  const hasRole = user.roles && Array.isArray(user.roles) && user.roles.includes("seller_manager");
  const hasPerm = hasPermission(user, ["sellers:manage"]);
  if (!hasRole && !hasPerm) {
    return res.status(403).json({ error: "Forbidden: Seller Manager access required" });
  }
  next();
}
function requireTutorialManager(req, res, next) {
  const user = req.user;
  if (!user) return res.status(403).json({ error: "Forbidden: Tutorial Manager access required" });
  const hasRole = user.roles && Array.isArray(user.roles) && user.roles.includes("tutorial_manager");
  const hasPerm = hasPermission(user, ["tutorials:manage"]);
  if (!hasRole && !hasPerm) {
    return res.status(403).json({ error: "Forbidden: Tutorial Manager access required" });
  }
  next();
}
function requireWeaponManager(req, res, next) {
  const user = req.user;
  if (!user) return res.status(403).json({ error: "Forbidden: Weapon Manager access required" });
  const hasRole = user.roles && Array.isArray(user.roles) && ["weapon_manager", "super_admin"].some((r) => user.roles.includes(r));
  const hasPerm = hasPermission(user, ["weapons:manage"]);
  if (!hasRole && !hasPerm) {
    return res.status(403).json({ error: "Forbidden: Weapon Manager access required" });
  }
  next();
}
function requirePostManager(req, res, next) {
  const user = req.user;
  if (!user) return res.status(403).json({ error: "Forbidden: Post Manager access required" });
  const hasRole = user.roles && Array.isArray(user.roles) && ["post_manager", "super_admin"].some((r) => user.roles.includes(r));
  const hasPerm = hasPermission(user, ["posts:manage"]);
  if (!hasRole && !hasPerm) {
    return res.status(403).json({ error: "Forbidden: Post Manager access required" });
  }
  next();
}

// server/utils/helpers.ts
function calculateReadingTime(content) {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return minutes;
}
function generateSummary(content, maxLength = 200) {
  const plainText = content.replace(/[#*`]/g, "").trim();
  if (plainText.length <= maxLength) {
    return plainText;
  }
  return plainText.substring(0, maxLength).trim() + "...";
}
function formatDate(date) {
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 6e4);
  const diffHours = Math.floor(diffMs / 36e5);
  const diffDays = Math.floor(diffMs / 864e5);
  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }
}

// server/services/scraper.ts
import axios from "axios";
import * as cheerio from "cheerio";
import DOMPurify from "isomorphic-dompurify";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
function slugify(input) {
  if (!input) return "";
  return input.toString().normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
var _localAssetList = null;
async function getLocalAssetList() {
  if (_localAssetList) return _localAssetList;
  try {
    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = path.dirname(currentFile);
    const assetsDir = path.resolve(currentDir, "..", "attached_assets");
    const entries = await fs.readdir(assetsDir);
    _localAssetList = entries.filter((name) => {
      const ext = path.extname(name).toLowerCase();
      return [".png", ".jpg", ".jpeg", ".webp", ".gif", ".jfif", ".bmp", ".svg"].includes(ext);
    });
    return _localAssetList;
  } catch (e) {
    _localAssetList = [];
    return _localAssetList;
  }
}
function findLocalAssetInList(name, list) {
  if (!name) return "";
  const normalized = slugify(name);
  for (const file of list) {
    const n = file.toLowerCase();
    if (n.includes(normalized) || normalized.split("-").some((part) => part && n.includes(part))) {
      return `/assets/${file}`;
    }
  }
  const tokens = normalized.split("-").filter(Boolean);
  for (const file of list) {
    const n = file.toLowerCase();
    for (const t of tokens) {
      if (t.length > 2 && n.includes(t)) return `/assets/${file}`;
    }
  }
  return "";
}
var FORUM_BASE_URL = "https://forum.z8games.com";
var ANNOUNCEMENTS_URL = `${FORUM_BASE_URL}/categories/crossfire-announcements`;
var CF_BASE_URL = "https://crossfire.z8games.com";
async function scrapeForumAnnouncements() {
  try {
    const response = await axios.get(ANNOUNCEMENTS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      timeout: 1e4
    });
    const $ = cheerio.load(response.data);
    const posts = [];
    $(".ItemDiscussion, .DiscussionRow, .Item-Discussion, .Discussion").each((_, element) => {
      const $el = $(element);
      const titleLink = $el.find('a.Title, .Title a, .DiscussionName a, a[href*="/discussion/"]').first();
      const title = titleLink.text().trim();
      const href = titleLink.attr("href");
      if (!title || !href) return;
      const fullUrl = href.startsWith("http") ? href : `${FORUM_BASE_URL}${href}`;
      const discussionId = href.match(/\/discussion\/(\d+)/)?.[1] || "";
      const dateEl = $el.find(".MItem-LastCommentDate time, time, .DateCreated, .LastCommentDate").first();
      const date = dateEl.attr("title") || dateEl.text().trim() || (/* @__PURE__ */ new Date()).toLocaleDateString();
      posts.push({
        url: fullUrl,
        title,
        date,
        discussionId
      });
    });
    return posts.slice(0, 20);
  } catch (error) {
    console.error("Error scraping forum announcements:", error.message);
    throw new Error(`Failed to scrape forum: ${error.message}`);
  }
}
async function scrapeEventDetails(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      timeout: 15e3
    });
    const $ = cheerio.load(response.data);
    const title = $('h1.DiscussionName, h1.PageTitle, h1, .DiscussionHeader h1, .Title h1, [class*="discussion"] h1').first().text().trim() || "Untitled Event";
    const dateEl = $('.DateCreated time, .MItem-LastCommentDate time, time[datetime], .CommentInfo time, [class*="date"] time').first();
    const date = dateEl.attr("datetime") || dateEl.attr("title") || dateEl.text().trim() || (/* @__PURE__ */ new Date()).toLocaleDateString();
    const contentSelectors = [
      ".Message.userContent",
      ".MessageList .Message",
      ".CommentList .Message",
      ".ItemComment .Message",
      ".UserContent",
      "article .Message",
      ".MessageContent",
      '[class*="message"][class*="body"]',
      ".Comment-Body",
      ".Item-BodyWrap"
    ];
    let contentDiv = null;
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        contentDiv = element;
        break;
      }
    }
    if (!contentDiv) {
      contentDiv = $('.ItemDiscussion, .Discussion, [class*="discussion"]').first();
    }
    contentDiv?.find("script, style, iframe, .Signature, .Options, .CommentInfo, .Meta, .ReactionButton").remove();
    contentDiv?.find("img").each((_, img) => {
      const $img = $(img);
      const src = $img.attr("src") || "";
      if (src && !src.startsWith("http")) {
        const fullSrc = src.startsWith("//") ? `https:${src}` : `${FORUM_BASE_URL}${src}`;
        $img.attr("src", fullSrc);
      }
    });
    contentDiv?.find("a").each((_, link) => {
      const $link = $(link);
      const href = $link.attr("href") || "";
      if (href && !href.startsWith("http") && !href.startsWith("#")) {
        const fullHref = href.startsWith("//") ? `https:${href}` : `${FORUM_BASE_URL}${href}`;
        $link.attr("href", fullHref);
      }
    });
    contentDiv?.find("*").each((_, el) => {
      const $el = $(el);
      const style = $el.attr("style") || "";
      if (style) {
        $el.attr("style", style.trim());
      }
    });
    let content = contentDiv?.html()?.trim() || "";
    if (content) {
      content = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [
          "p",
          "br",
          "strong",
          "b",
          "em",
          "i",
          "u",
          "strike",
          "s",
          "del",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "ul",
          "ol",
          "li",
          "a",
          "img",
          "blockquote",
          "pre",
          "code",
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td",
          "div",
          "span",
          "hr"
        ],
        ALLOWED_ATTR: [
          "href",
          "src",
          "alt",
          "title",
          "style",
          "class",
          "width",
          "height",
          "target",
          "rel"
        ],
        ALLOW_DATA_ATTR: false,
        KEEP_CONTENT: true
      });
    }
    const imageSelectors = [
      ".Message img",
      ".UserContent img",
      "article img",
      ".MessageContent img",
      ".Comment-Body img",
      '[class*="message"] img',
      ".ItemComment img"
    ];
    let imageUrl = "";
    for (const selector of imageSelectors) {
      const img = $(selector).first();
      if (img.length > 0) {
        const src = img.attr("src") || img.attr("data-src");
        if (src && !src.includes("emoji") && !src.includes("icon") && !src.includes("avatar")) {
          imageUrl = src;
          break;
        }
      }
    }
    if (!imageUrl) {
      const allImages = $("img");
      allImages.each((_, img) => {
        const src = $(img).attr("src") || $(img).attr("data-src") || "";
        if (src && !src.includes("emoji") && !src.includes("icon") && !src.includes("avatar") && !src.includes("logo")) {
          imageUrl = src;
          return false;
        }
      });
    }
    const fullImageUrl = imageUrl && !imageUrl.startsWith("http") ? imageUrl.startsWith("//") ? `https:${imageUrl}` : `${FORUM_BASE_URL}${imageUrl}` : imageUrl;
    if (!content || content.length < 50) {
      const textContent = contentDiv?.text()?.trim() || "";
      if (textContent) {
        content = `<p>${textContent}</p>`;
      } else {
        content = `<p>${title}</p>`;
      }
    }
    const categoryMatch = url.match(/categories\/([^\/]+)/);
    const category = categoryMatch ? categoryMatch[1].replace(/-/g, " ") : "Announcement";
    console.log(`Scraped ${url}:`, {
      title: title.substring(0, 50),
      hasContent: content.length > 0,
      contentLength: content.length,
      hasImage: !!fullImageUrl,
      imageUrl: fullImageUrl.substring(0, 100)
    });
    return {
      url,
      title,
      date,
      image: fullImageUrl,
      content,
      category: category.charAt(0).toUpperCase() + category.slice(1)
    };
  } catch (error) {
    console.error(`Error scraping event details from ${url}:`, error.message);
    throw new Error(`Failed to scrape event details: ${error.message}`);
  }
}
async function scrapeMultipleEvents(urls) {
  const events = [];
  for (const url of urls) {
    try {
      const event = await scrapeEventDetails(url);
      events.push(event);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Skipping ${url}: ${error.message}`);
    }
  }
  return events;
}
async function scrapeRanks() {
  try {
    const response = await axios.get(`${CF_BASE_URL}/ranks.html`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      timeout: 15e3,
      responseType: "text",
      validateStatus: (status) => status < 500
    });
    if (!response.data || typeof response.data !== "string") {
      throw new Error("Invalid response from server");
    }
    const $ = cheerio.load(response.data);
    const ranks = [];
    const localList = await getLocalAssetList();
    const rankSelectors = [
      ".rank-item",
      ".rank",
      '[class*="rank"]',
      ".item",
      "li",
      'div[class*="rank"]'
    ];
    let rankElements = $();
    for (const selector of rankSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        rankElements = elements;
        break;
      }
    }
    rankElements.each((index, element) => {
      const $el = $(element);
      let name = $el.find('h3, h4, .name, .title, [class*="name"], [class*="title"]').first().text().trim() || $el.text().trim().split("\n")[0].trim();
      if (!name || name.length < 2) {
        const alt = $el.find("img").first().attr("alt") || "";
        const titleAttr = $el.find("img").first().attr("title") || "";
        const linkText = $el.find("a").first().text().trim() || "";
        name = (alt || titleAttr || linkText || name).trim();
      }
      if (!name || name.length < 2) return;
      let imageUrl = "";
      const img = $el.find("img").first();
      if (img.length > 0) {
        imageUrl = img.attr("src") || img.attr("data-src") || img.attr("data-lazy-src") || "";
        if (imageUrl && !imageUrl.startsWith("http")) {
          imageUrl = imageUrl.startsWith("//") ? `https:${imageUrl}` : `${CF_BASE_URL}${imageUrl}`;
        }
      }
      const description = $el.find('.description, .desc, p, [class*="desc"]').first().text().trim();
      const id = `rank-${slugify(name) || index}`;
      const finalImage = imageUrl || findLocalAssetInList(name, localList);
      ranks.push({
        id,
        name,
        image: finalImage,
        description: description || void 0
      });
    });
    if (ranks.length === 0) {
      $("img").each((index, img) => {
        const $img = $(img);
        const src = $img.attr("src") || $img.attr("data-src") || "";
        if (!src || src.includes("logo") || src.includes("icon") || src.includes("button")) return;
        const fullSrc = src.startsWith("http") ? src : src.startsWith("//") ? `https:${src}` : `${CF_BASE_URL}${src}`;
        const parent = $img.parent();
        const name = parent.find("h3, h4, .name, .title").first().text().trim() || parent.text().trim().split("\n")[0].trim() || $img.attr("alt") || "";
        if (name && name.length > 2) {
          const id = `rank-${slugify(name) || index}`;
          const finalImage = fullSrc || findLocalAssetInList(name, localList);
          ranks.push({ id, name, image: finalImage });
        }
      });
    }
    return ranks.slice(0, 50);
  } catch (error) {
    console.error("Error scraping ranks:", error.message);
    throw new Error(`Failed to scrape ranks: ${error.message}`);
  }
}
async function scrapeModes() {
  try {
    const response = await axios.get(`${CF_BASE_URL}/modes.html`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      timeout: 15e3,
      responseType: "text",
      validateStatus: (status) => status < 500
    });
    if (!response.data || typeof response.data !== "string") {
      throw new Error("Invalid response from server");
    }
    const $ = cheerio.load(response.data);
    const modes = [];
    const localList = await getLocalAssetList();
    const modeSelectors = [
      ".mode-item",
      ".mode",
      '[class*="mode"]',
      ".item",
      "li",
      'div[class*="mode"]'
    ];
    let modeElements = $();
    for (const selector of modeSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        modeElements = elements;
        break;
      }
    }
    modeElements.each((index, element) => {
      const $el = $(element);
      let name = $el.find('h3, h4, .name, .title, [class*="name"], [class*="title"]').first().text().trim() || $el.text().trim().split("\n")[0].trim();
      if (!name || name.length < 2) {
        const alt = $el.find("img").first().attr("alt") || "";
        const titleAttr = $el.find("img").first().attr("title") || "";
        const linkText = $el.find("a").first().text().trim() || "";
        name = (alt || titleAttr || linkText || name).trim();
      }
      if (!name || name.length < 2) return;
      let imageUrl = "";
      const img = $el.find("img").first();
      if (img.length > 0) {
        imageUrl = img.attr("src") || img.attr("data-src") || img.attr("data-lazy-src") || "";
        if (imageUrl && !imageUrl.startsWith("http")) {
          imageUrl = imageUrl.startsWith("//") ? `https:${imageUrl}` : `${CF_BASE_URL}${imageUrl}`;
        }
      }
      const description = $el.find('.description, .desc, p, [class*="desc"]').first().text().trim();
      const id = `mode-${slugify(name) || index}`;
      const finalImage = imageUrl || findLocalAssetInList(name, localList);
      modes.push({ id, name, image: finalImage, description: description || void 0 });
    });
    if (modes.length === 0) {
      $("img").each((index, img) => {
        const $img = $(img);
        const src = $img.attr("src") || $img.attr("data-src") || "";
        if (!src || src.includes("logo") || src.includes("icon") || src.includes("button")) return;
        const fullSrc = src.startsWith("http") ? src : src.startsWith("//") ? `https:${src}` : `${CF_BASE_URL}${src}`;
        const parent = $img.parent();
        const name = parent.find("h3, h4, .name, .title").first().text().trim() || parent.text().trim().split("\n")[0].trim() || $img.attr("alt") || "";
        if (name && name.length > 2) {
          const id = `mode-${slugify(name) || index}`;
          const finalImage = fullSrc || findLocalAssetInList(name, localList);
          modes.push({ id, name, image: finalImage });
        }
      });
    }
    return modes.slice(0, 50);
  } catch (error) {
    console.error("Error scraping modes:", error.message);
    throw new Error(`Failed to scrape modes: ${error.message}`);
  }
}
async function scrapeWeapons() {
  try {
    const response = await axios.get(`${CF_BASE_URL}/weapons.html`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      timeout: 15e3,
      responseType: "text",
      validateStatus: (status) => status < 500
    });
    if (!response.data || typeof response.data !== "string") {
      throw new Error("Invalid response from server");
    }
    const $ = cheerio.load(response.data);
    const weapons = [];
    const localList = await getLocalAssetList();
    const weaponSelectors = [
      ".weapon-item",
      ".weapon",
      '[class*="weapon"]',
      ".item",
      "li",
      'div[class*="weapon"]'
    ];
    let weaponElements = $();
    for (const selector of weaponSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        weaponElements = elements;
        break;
      }
    }
    weaponElements.each((index, element) => {
      const $el = $(element);
      let name = $el.find('h3, h4, .name, .title, [class*="name"], [class*="title"]').first().text().trim() || $el.text().trim().split("\n")[0].trim();
      if (!name || name.length < 2) {
        const alt = $el.find("img").first().attr("alt") || "";
        const titleAttr = $el.find("img").first().attr("title") || "";
        const linkText = $el.find("a").first().text().trim() || "";
        name = (alt || titleAttr || linkText || name).trim();
      }
      if (!name || name.length < 2) return;
      let imageUrl = "";
      const img = $el.find("img").first();
      if (img.length > 0) {
        imageUrl = img.attr("src") || img.attr("data-src") || img.attr("data-lazy-src") || "";
        if (imageUrl && !imageUrl.startsWith("http")) {
          imageUrl = imageUrl.startsWith("//") ? `https:${imageUrl}` : `${CF_BASE_URL}${imageUrl}`;
        }
      }
      const description = $el.find('.description, .desc, p, [class*="desc"]').first().text().trim();
      const category = $el.find('.category, [class*="category"]').first().text().trim();
      const stats = {};
      $el.find('table tr, .stat, [class*="stat"]').each((_, statEl) => {
        const $stat = $(statEl);
        const label = $stat.find('td:first-child, .label, [class*="label"]').first().text().trim();
        const value = $stat.find('td:last-child, .value, [class*="value"]').first().text().trim();
        if (label && value) {
          stats[label] = value;
        }
      });
      const id = `weapon-${slugify(name) || index}`;
      const finalImage = imageUrl || findLocalAssetInList(name, localList);
      weapons.push({
        id,
        name,
        image: finalImage,
        category: category || void 0,
        description: description || void 0,
        stats: Object.keys(stats).length > 0 ? stats : void 0
      });
    });
    if (weapons.length === 0) {
      $("img").each((index, img) => {
        const $img = $(img);
        const src = $img.attr("src") || $img.attr("data-src") || "";
        if (!src || src.includes("logo") || src.includes("icon") || src.includes("button")) return;
        const fullSrc = src.startsWith("http") ? src : src.startsWith("//") ? `https:${src}` : `${CF_BASE_URL}${src}`;
        const parent = $img.parent();
        const name = parent.find("h3, h4, .name, .title").first().text().trim() || parent.text().trim().split("\n")[0].trim() || $img.attr("alt") || "";
        if (name && name.length > 2) {
          const id = `weapon-${slugify(name) || index}`;
          const finalImage = fullSrc || findLocalAssetInList(name, localList);
          weapons.push({ id, name, image: finalImage });
        }
      });
    }
    return weapons.slice(0, 100);
  } catch (error) {
    console.error("Error scraping weapons:", error.message);
    throw new Error(`Failed to scrape weapons: ${error.message}`);
  }
}

// server/routes.ts
init_seed_data();
import DOMPurify2 from "isomorphic-dompurify";
var upload = multer({ storage: multer.memoryStorage() });
var uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  max: 10,
  // Limit each IP to 10 uploads per hour
  message: "Too many upload requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});
var apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 100,
  // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});
async function registerRoutes(app2) {
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (username && password) {
        const admin = await storage.getAdminByUsername(username);
        if (!admin) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
        const isValid = await comparePassword(password, admin.password);
        if (!isValid) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
        let permissions = void 0;
        try {
          const allPerms = await storage.getAllAdminPermissions();
          permissions = allPerms?.[admin.id] || void 0;
        } catch (err) {
          console.error("Failed to load admin permissions during login", err);
        }
        const tokenPayload = {
          id: admin.id,
          username: admin.username,
          roles: admin.roles
        };
        if (permissions) tokenPayload.permissions = permissions;
        const token = generateToken(tokenPayload);
        res.json({
          token,
          admin: {
            id: admin.id,
            username: admin.username,
            roles: admin.roles,
            permissions: permissions || {}
          }
        });
      } else if (password) {
        const isValid = await verifyAdminPassword(password);
        if (!isValid) {
          return res.status(401).json({ error: "Invalid password" });
        }
        const token = generateToken({ roles: ["super_admin"] });
        res.json({ token, admin: { roles: ["super_admin"] } });
      } else {
        return res.status(400).json({ error: "Username and password or password required" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/posts", async (req, res) => {
    try {
      const { category, search, featured } = req.query;
      let posts = await storage.getAllPosts();
      if (category && category !== "all") {
        posts = posts.filter(
          (post) => post.category.toLowerCase() === category.toLowerCase()
        );
      }
      if (search) {
        const searchLower = search.toLowerCase();
        posts = posts.filter(
          (post) => post.title.toLowerCase().includes(searchLower) || post.summary.toLowerCase().includes(searchLower) || post.content.toLowerCase().includes(searchLower) || post.tags.some((tag) => tag.toLowerCase().includes(searchLower))
        );
      }
      if (featured === "true") {
        posts = posts.filter((post) => post.featured);
      }
      const formattedPosts = posts.map((post) => ({
        ...post,
        date: formatDate(post.createdAt)
      }));
      res.json(formattedPosts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.getPostById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      await storage.incrementPostViews(req.params.id);
      const formattedPost = {
        ...post,
        date: formatDate(post.createdAt)
      };
      res.json(formattedPost);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/posts", requireAuth, requirePostManager, async (req, res) => {
    try {
      const data = insertPostSchema.parse(req.body);
      const readingTime = data.readingTime || calculateReadingTime(data.content);
      const summary = data.summary || generateSummary(data.content);
      const post = await storage.createPost({
        ...data,
        readingTime,
        summary
      });
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.patch("/api/posts/:id", requireAuth, requirePostManager, async (req, res) => {
    try {
      const updates = req.body;
      if (updates.content && !updates.readingTime) {
        updates.readingTime = calculateReadingTime(updates.content);
      }
      if (updates.content && !updates.summary) {
        updates.summary = generateSummary(updates.content);
      }
      const post = await storage.updatePost(req.params.id, updates);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/posts/:id", requireAuth, requirePostManager, async (req, res) => {
    try {
      const deleted = await storage.deletePost(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByPostId(req.params.id);
      const formattedComments = comments.map((comment) => ({
        ...comment,
        date: formatDate(comment.createdAt)
      }));
      res.json(formattedComments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/posts/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const { author, content, parentCommentId } = req.body;
      const commentData = {
        postId: id,
        name: author,
        content,
        parentCommentId: parentCommentId || void 0
      };
      const data = insertCommentSchema.parse(commentData);
      const comment = await storage.createComment(data);
      const formattedComment = {
        ...comment,
        date: formatDate(comment.createdAt)
      };
      res.status(201).json(formattedComment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/health", (_req, res) => {
    res.json({ ok: true, time: Date.now() });
  });
  app2.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  const sanitizeHTML = (html) => {
    return DOMPurify2.sanitize(html, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "strike",
        "s",
        "del",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "a",
        "img",
        "blockquote",
        "pre",
        "code",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "div",
        "span",
        "hr"
      ],
      ALLOWED_ATTR: [
        "href",
        "src",
        "alt",
        "title",
        "style",
        "class",
        "width",
        "height",
        "target",
        "rel"
      ],
      ALLOW_DATA_ATTR: false,
      KEEP_CONTENT: true
    });
  };
  app2.post("/api/events", requireAuth, requireEventManager, async (req, res) => {
    try {
      const data = insertEventSchema.parse(req.body);
      if (data.description) {
        data.description = sanitizeHTML(data.description);
      }
      if (data.descriptionAr) {
        data.descriptionAr = sanitizeHTML(data.descriptionAr);
      }
      const event = await storage.createEvent(data);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.patch("/api/events/:id", requireAuth, requireEventManager, async (req, res) => {
    try {
      const updates = req.body;
      if (updates.description) {
        updates.description = sanitizeHTML(updates.description);
      }
      if (updates.descriptionAr) {
        updates.descriptionAr = sanitizeHTML(updates.descriptionAr);
      }
      const event = await storage.updateEvent(req.params.id, updates);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/events/:id", requireAuth, requireEventManager, async (req, res) => {
    try {
      const deleted = await storage.deleteEvent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/scrape/forum-list", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const posts = await scrapeForumAnnouncements();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/scrape/event-details", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      const event = await scrapeEventDetails(url);
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/scrape/multiple-events", requireAuth, requireEventScraper, async (req, res) => {
    try {
      const { urls } = req.body;
      if (!urls || !Array.isArray(urls)) {
        return res.status(400).json({ error: "URLs array is required" });
      }
      const events = await scrapeMultipleEvents(urls);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/scrape/ranks", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const ranks = await scrapeRanks();
      res.json(ranks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/scrape/modes", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const modes = await scrapeModes();
      res.json(modes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/scrape/weapons", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const weapons = await scrapeWeapons();
      res.json(weapons);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/cf/ranks", async (req, res) => {
    try {
      const ranks = await scrapeRanks();
      res.json(ranks);
    } catch (error) {
      console.error("Error in /api/cf/ranks:", error);
      res.status(500).json({ error: error.message || "Failed to fetch ranks" });
    }
  });
  app2.get("/api/cf/modes", async (req, res) => {
    try {
      const modes = await scrapeModes();
      res.json(modes);
    } catch (error) {
      console.error("Error in /api/cf/modes:", error);
      res.status(500).json({ error: error.message || "Failed to fetch modes" });
    }
  });
  app2.get("/api/cf/weapons", async (req, res) => {
    try {
      const weapons = await scrapeWeapons();
      res.json(weapons);
    } catch (error) {
      console.error("Error in /api/cf/weapons:", error);
      res.status(500).json({ error: error.message || "Failed to fetch weapons" });
    }
  });
  app2.post("/api/seed/cf-data", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      let createdWeapons = 0;
      for (const w of weaponsData) {
        const all = await storage.getAllWeapons();
        if (!all.find((x) => x.name === w.name)) {
          try {
            const parsed = insertWeaponSchema.parse(w);
            await storage.createWeapon(parsed);
            createdWeapons += 1;
          } catch {
          }
        }
      }
      let createdModes = 0;
      for (const m of modesData) {
        const all = await storage.getAllModes();
        if (!all.find((x) => x.name === m.name)) {
          try {
            const parsed = insertModeSchema.parse(m);
            await storage.createMode(parsed);
            createdModes += 1;
          } catch {
          }
        }
      }
      let createdRanks = 0;
      for (const r of ranksData) {
        const all = await storage.getAllRanks();
        if (!all.find((x) => x.name === r.name)) {
          try {
            const parsed = insertRankSchema.parse(r);
            await storage.createRank(parsed);
            createdRanks += 1;
          } catch {
          }
        }
      }
      res.status(201).json({ success: true, createdWeapons, createdModes, createdRanks });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to seed CF data" });
    }
  });
  app2.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = process.env.BASE_URL || "https://crossfire.wiki";
      const posts = await storage.getAllPosts();
      const news = await storage.getAllNews();
      const events = await storage.getAllEvents();
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;
      posts.forEach((post) => {
        const lastmod = post.updatedAt || post.createdAt;
        sitemap += `  <url>
    <loc>${baseUrl}/post/${post.id}</loc>
    <lastmod>${new Date(lastmod).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      });
      news.forEach((item) => {
        const lastmod = item.updatedAt || item.createdAt;
        sitemap += `  <url>
    <loc>${baseUrl}/news/${item.id}</loc>
    <lastmod>${new Date(lastmod).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      });
      events.forEach((event) => {
        sitemap += `  <url>
    <loc>${baseUrl}/events/${event.id}</loc>
    <lastmod>${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      });
      const categories = [...new Set(posts.map((p) => p.category))];
      categories.forEach((category) => {
        sitemap += `  <url>
    <loc>${baseUrl}/category/${category.toLowerCase()}</loc>
    <lastmod>${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      });
      sitemap += `</urlset>`;
      res.setHeader("Content-Type", "application/xml");
      res.send(sitemap);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/robots.txt", async (req, res) => {
    const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Sitemap: ${process.env.BASE_URL || "https://crossfire.wiki"}/sitemap.xml
`;
    res.setHeader("Content-Type", "text/plain");
    res.send(robots);
  });
  app2.get("/api/weapons", async (req, res) => {
    try {
      const weapons = await storage.getAllWeapons();
      res.json(weapons);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/weapons/:id", async (req, res) => {
    try {
      const weapon = await storage.getWeaponById(req.params.id);
      if (!weapon) {
        return res.status(404).json({ error: "Weapon not found" });
      }
      res.json(weapon);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/weapons", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const data = insertWeaponSchema.parse(req.body);
      const weapon = await storage.createWeapon(data);
      res.status(201).json(weapon);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.post("/api/weapons/bulk-create", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const { weapons } = req.body;
      if (!weapons || !Array.isArray(weapons)) {
        return res.status(400).json({ error: "weapons array is required" });
      }
      const created = [];
      for (const w of weapons) {
        try {
          const parsed = insertWeaponSchema.parse(w);
          const createdWeapon = await storage.createWeapon(parsed);
          created.push(createdWeapon);
        } catch (innerErr) {
          console.error("Skipping weapon due to validation error:", innerErr?.message || innerErr);
        }
      }
      res.status(201).json({ success: true, count: created.length, weapons: created });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.patch("/api/weapons/:id", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const updates = insertWeaponSchema.partial().parse(req.body);
      const weapon = await storage.updateWeapon(req.params.id, updates);
      if (!weapon) {
        return res.status(404).json({ error: "Weapon not found" });
      }
      res.json(weapon);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/weapons/:id", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const deleted = await storage.deleteWeapon(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Weapon not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/modes", async (req, res) => {
    try {
      const modes = await storage.getAllModes();
      res.json(modes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/modes/:id", async (req, res) => {
    try {
      const mode = await storage.getModeById(req.params.id);
      if (!mode) {
        return res.status(404).json({ error: "Mode not found" });
      }
      res.json(mode);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/modes", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const data = insertModeSchema.parse(req.body);
      const mode = await storage.createMode(data);
      res.status(201).json(mode);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.patch("/api/modes/:id", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const updates = insertModeSchema.partial().parse(req.body);
      const mode = await storage.updateMode(req.params.id, updates);
      if (!mode) {
        return res.status(404).json({ error: "Mode not found" });
      }
      res.json(mode);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/modes/:id", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const deleted = await storage.deleteMode(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Mode not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/ranks", async (req, res) => {
    try {
      const ranks = await storage.getAllRanks();
      res.json(ranks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/ranks/:id", async (req, res) => {
    try {
      const rank = await storage.getRankById(req.params.id);
      if (!rank) {
        return res.status(404).json({ error: "Rank not found" });
      }
      res.json(rank);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/ranks", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const data = insertRankSchema.parse(req.body);
      const rank = await storage.createRank(data);
      res.status(201).json(rank);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.patch("/api/ranks/:id", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const updates = insertRankSchema.partial().parse(req.body);
      const rank = await storage.updateRank(req.params.id, updates);
      if (!rank) {
        return res.status(404).json({ error: "Rank not found" });
      }
      res.json(rank);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/ranks/:id", requireAuth, requireWeaponManager, async (req, res) => {
    try {
      const deleted = await storage.deleteRank(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Rank not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/events/bulk-create", requireAuth, requireEventScraper, async (req, res) => {
    try {
      const { events, createAsNews } = req.body;
      if (!events || !Array.isArray(events)) {
        return res.status(400).json({ error: "Events array is required" });
      }
      const createdEvents = [];
      const createdNews = [];
      for (const eventData of events) {
        const scrapedEvent = eventData;
        const eventToCreate = {
          title: scrapedEvent.title,
          titleAr: "",
          description: sanitizeHTML(scrapedEvent.content),
          descriptionAr: "",
          date: scrapedEvent.date,
          type: "upcoming",
          image: scrapedEvent.image
        };
        const validated = insertEventSchema.parse(eventToCreate);
        const created = await storage.createEvent(validated);
        createdEvents.push(created);
        if (createAsNews) {
          const newsToCreate = {
            title: scrapedEvent.title,
            titleAr: "",
            dateRange: scrapedEvent.date,
            image: scrapedEvent.image || "",
            category: scrapedEvent.category || "Announcement",
            content: sanitizeHTML(scrapedEvent.content),
            contentAr: "",
            htmlContent: sanitizeHTML(scrapedEvent.content),
            author: "Forum Scraper",
            featured: false
          };
          const validatedNews = insertNewsSchema.parse(newsToCreate);
          const createdNewsItem = await storage.createNews(validatedNews);
          createdNews.push(createdNewsItem);
        }
      }
      res.status(201).json({
        success: true,
        count: createdEvents.length,
        events: createdEvents,
        newsCount: createdNews.length,
        news: createdNews
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const posts = await storage.getAllPosts();
      const allComments = await Promise.all(
        posts.map((post) => storage.getCommentsByPostId(post.id))
      );
      const totalComments = allComments.flat().length;
      const totalViews = posts.reduce((sum, post) => sum + post.views, 0);
      res.json({
        totalPosts: posts.length,
        totalComments,
        totalViews,
        recentPosts: posts.slice(0, 5).map((post) => ({
          ...post,
          date: formatDate(post.createdAt)
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/settings/site", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.put("/api/settings/site", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const raw = req.body ?? {};
      const toBoolean = (value) => {
        if (typeof value === "string") {
          return ["true", "1", "on", "yes"].includes(value.toLowerCase());
        }
        return Boolean(value);
      };
      const normalized = {
        reviewVerificationEnabled: toBoolean(raw.reviewVerificationEnabled),
        reviewVerificationVideoUrl: raw.reviewVerificationVideoUrl ?? "",
        reviewVerificationPassphrase: raw.reviewVerificationPassphrase ?? "",
        reviewVerificationPrompt: raw.reviewVerificationPrompt ?? "",
        reviewVerificationTimecode: raw.reviewVerificationTimecode ?? ""
      };
      const parsed = siteSettingsSchema.parse(normalized);
      if (parsed.reviewVerificationEnabled) {
        if (!parsed.reviewVerificationPassphrase.trim()) {
          return res.status(400).json({ error: "Verification phrase is required when review verification is enabled." });
        }
        if (!parsed.reviewVerificationVideoUrl.trim()) {
          return res.status(400).json({ error: "Verification video URL is required when review verification is enabled." });
        }
      }
      const updated = await storage.updateSiteSettings({
        ...parsed,
        reviewVerificationVideoUrl: parsed.reviewVerificationVideoUrl.trim(),
        reviewVerificationPassphrase: parsed.reviewVerificationPassphrase.trim(),
        reviewVerificationPrompt: parsed.reviewVerificationPrompt.trim(),
        reviewVerificationTimecode: parsed.reviewVerificationTimecode.trim(),
        reviewVerificationYouTubeChannelUrl: parsed.reviewVerificationYouTubeChannelUrl.trim()
      });
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.get("/api/public/settings/review-verification", async (_req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json({
        reviewVerificationEnabled: settings.reviewVerificationEnabled,
        reviewVerificationVideoUrl: settings.reviewVerificationVideoUrl,
        reviewVerificationPrompt: settings.reviewVerificationPrompt,
        reviewVerificationTimecode: settings.reviewVerificationTimecode,
        reviewVerificationYouTubeChannelUrl: settings.reviewVerificationYouTubeChannelUrl
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/news", async (req, res) => {
    try {
      const news = await storage.getAllNews();
      res.json(news);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/news", requireAuth, requireNewsManager, async (req, res) => {
    try {
      const data = insertNewsSchema.parse(req.body);
      if (data.content) {
        data.content = sanitizeHTML(data.content);
      }
      if (data.contentAr) {
        data.contentAr = sanitizeHTML(data.contentAr);
      }
      const news = await storage.createNews(data);
      res.status(201).json(news);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.patch("/api/news/:id", requireAuth, requireNewsManager, async (req, res) => {
    try {
      const updates = req.body;
      if (updates.content) {
        updates.content = sanitizeHTML(updates.content);
      }
      if (updates.contentAr) {
        updates.contentAr = sanitizeHTML(updates.contentAr);
      }
      const news = await storage.updateNews(req.params.id, updates);
      if (!news) {
        return res.status(404).json({ error: "News item not found" });
      }
      res.json(news);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/news/:id", requireAuth, requireNewsManager, async (req, res) => {
    try {
      const deleted = await storage.deleteNews(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "News item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/mercenaries", async (req, res) => {
    try {
      const mercenaries = await storage.getAllMercenaries();
      res.json(mercenaries);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.patch("/api/mercenaries/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { image, sounds } = req.body;
      const mercenary = await storage.getAllMercenaries();
      const current = mercenary.find((m) => m.id === id);
      if (!current) {
        return res.status(404).json({ error: "Mercenary not found" });
      }
      const updated = {
        ...current,
        ...image && { image },
        ...sounds && { sounds: Array.isArray(sounds) ? sounds.slice(0, 30) : [] }
        // Max 30 sounds
      };
      await storage.updateMercenary(id, updated);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.get("/api/tickets", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const tickets = await storage.getAllTickets();
      const formattedTickets = tickets.map((ticket) => {
        const formatted = {
          ...ticket,
          createdAt: formatDate(ticket.createdAt),
          updatedAt: formatDate(ticket.updatedAt)
        };
        if (!user.roles || !user.roles.includes("super_admin")) {
          delete formatted.userEmail;
        }
        return formatted;
      });
      res.json(formattedTickets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/tickets/my/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const tickets = await storage.getTicketsByEmail(email);
      const formattedTickets = tickets.map((ticket) => ({
        ...ticket,
        createdAt: formatDate(ticket.createdAt),
        updatedAt: formatDate(ticket.updatedAt)
      }));
      res.json(formattedTickets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/tickets/:id", async (req, res) => {
    try {
      const ticket = await storage.getTicketById(req.params.id);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      const formattedTicket = {
        ...ticket,
        createdAt: formatDate(ticket.createdAt),
        updatedAt: formatDate(ticket.updatedAt)
      };
      res.json(formattedTicket);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/tickets", async (req, res) => {
    try {
      const data = insertTicketSchema.parse(req.body);
      const ticket = await storage.createTicket(data);
      const formattedTicket = {
        ...ticket,
        createdAt: formatDate(ticket.createdAt),
        updatedAt: formatDate(ticket.updatedAt)
      };
      res.status(201).json(formattedTicket);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.patch("/api/tickets/:id", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const ticket = await storage.updateTicket(req.params.id, updates);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      const formattedTicket = {
        ...ticket,
        createdAt: formatDate(ticket.createdAt),
        updatedAt: formatDate(ticket.updatedAt)
      };
      res.json(formattedTicket);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/tickets/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteTicket(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/tickets/:id/replies", async (req, res) => {
    try {
      const replies = await storage.getTicketReplies(req.params.id);
      const formattedReplies = replies.map((reply) => ({
        ...reply,
        createdAt: formatDate(reply.createdAt)
      }));
      res.json(formattedReplies);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/tickets/:id/replies", async (req, res) => {
    try {
      const { id } = req.params;
      const { authorName, content, isAdmin } = req.body;
      const replyData = {
        ticketId: id,
        authorName,
        content,
        isAdmin: isAdmin || false
      };
      const data = insertTicketReplySchema.parse(replyData);
      const reply = await storage.createTicketReply(data);
      const formattedReply = {
        ...reply,
        createdAt: formatDate(reply.createdAt)
      };
      res.status(201).json(formattedReply);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.get("/api/admins", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const admins = await storage.getAllAdmins();
      const sanitizedAdmins = admins.map(({ password, ...admin }) => admin);
      res.json(sanitizedAdmins);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/admins", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { username, password, role, roles: rolesFromBody, permissions } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      const existingAdmin = await storage.getAdminByUsername(username);
      if (existingAdmin) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const hashedPassword = await hashPassword(password);
      let finalRoles = [];
      if (Array.isArray(rolesFromBody) && rolesFromBody.length > 0) {
        finalRoles = rolesFromBody;
      } else if (role) {
        finalRoles = [role];
      } else {
        finalRoles = ["admin"];
      }
      if (permissions && typeof permissions === "object") {
        const permToRole = {
          "events:add": "event_manager",
          "events:scrape": "event_scraper",
          "news:add": "news_manager",
          "news:scrape": "news_scraper",
          "posts:manage": "post_manager",
          "sellers:manage": "seller_manager",
          "tutorials:manage": "tutorial_manager",
          "tickets:manage": "ticket_manager",
          "mercenaries:manage": "mercenary_manager",
          "settings:manage": "settings_manager"
        };
        for (const [perm, enabled] of Object.entries(permissions)) {
          if (enabled && permToRole[perm]) {
            if (!finalRoles.includes(permToRole[perm])) finalRoles.push(permToRole[perm]);
          }
        }
      }
      const data = insertAdminSchema.parse({
        username,
        password: hashedPassword,
        roles: finalRoles
      });
      const admin = await storage.createAdmin(data);
      const { password: _, ...sanitizedAdmin } = admin;
      res.status(201).json(sanitizedAdmin);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.patch("/api/admins/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const updates = {};
      if (req.body.username !== void 0) updates.username = req.body.username;
      if (req.body.password !== void 0) {
        updates.password = await hashPassword(req.body.password);
      }
      if (req.body.roles !== void 0) updates.roles = req.body.roles;
      else if (req.body.permissions && typeof req.body.permissions === "object") {
        const permissions = req.body.permissions;
        const permToRole = {
          "events:add": "event_manager",
          "events:scrape": "event_scraper",
          "news:add": "news_manager",
          "news:scrape": "news_scraper",
          "posts:manage": "post_manager",
          "sellers:manage": "seller_manager",
          "tutorials:manage": "tutorial_manager",
          "tickets:manage": "ticket_manager",
          "mercenaries:manage": "mercenary_manager",
          "settings:manage": "settings_manager"
        };
        const rolesFromPerms = [];
        for (const [perm, enabled] of Object.entries(permissions)) {
          if (enabled && permToRole[perm]) {
            rolesFromPerms.push(permToRole[perm]);
          }
        }
        if (rolesFromPerms.length > 0) updates.roles = rolesFromPerms;
      }
      const admin = await storage.updateAdmin(req.params.id, updates);
      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }
      const { password: _, ...sanitizedAdmin } = admin;
      res.json(sanitizedAdmin);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/admins/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteAdmin(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Admin not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/admin-permissions", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const permissions = await storage.getAllAdminPermissions();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.put("/api/admin-permissions/:adminId", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { adminId } = req.params;
      const { permissions } = req.body;
      if (!permissions || typeof permissions !== "object") {
        return res.status(400).json({ error: "Permissions object is required" });
      }
      await storage.updateAdminPermissions(adminId, permissions);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/newsletter-subscribers", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const subscribers = await storage.getAllNewsletterSubscribers();
      res.json(subscribers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/newsletter-subscribe", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const existing = await storage.getNewsletterSubscriberByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Email already subscribed" });
      }
      const data = insertNewsletterSubscriberSchema.parse({ email });
      const subscriber = await storage.createNewsletterSubscriber(data);
      res.status(201).json(subscriber);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/newsletter-subscribers/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteNewsletterSubscriber(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Subscriber not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/upload-image", uploadLimiter, requireAuth, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      const formData = new FormData();
      formData.append("reqtype", "fileupload");
      const blob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype });
      formData.append("fileToUpload", blob, req.file.originalname);
      const response = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        throw new Error("Failed to upload to catbox.moe");
      }
      const imageUrl = await response.text();
      res.json({ url: imageUrl.trim() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/admin/seed-from-assets", requireAuth, requireWeaponManager, async (_req, res) => {
    try {
      const assetsPath = path2.join(process.cwd(), "attached_assets");
      const exists = fs2.existsSync(assetsPath);
      if (!exists) {
        return res.status(400).json({ error: "attached_assets directory not found on server" });
      }
      const files = await fs2.promises.readdir(assetsPath);
      let createdWeapons = [];
      let createdModes = [];
      let createdRanks = [];
      const imageFiles = files.filter((f) => /\.(jpg|jpeg|png|gif|jfif|webp)$/i.test(f));
      for (const fileName of imageFiles) {
        const filePath = path2.join(assetsPath, fileName);
        const buffer = await fs2.promises.readFile(filePath);
        const formData = new FormData();
        formData.append("reqtype", "fileupload");
        const blob = new Blob([new Uint8Array(buffer)]);
        formData.append("fileToUpload", blob, fileName);
        const response = await fetch("https://catbox.moe/user/api.php", {
          method: "POST",
          body: formData
        });
        if (!response.ok) {
          console.error("Failed to upload", fileName);
          continue;
        }
        const imageUrl = (await response.text()).trim();
        const lower = fileName.toLowerCase();
        if (lower.includes("weap") || lower.includes("weapon") || lower.includes("feature-weap") || lower.includes("image_")) {
          try {
            const created = await storage.createWeapon({ name: path2.parse(fileName).name, image: imageUrl, category: "", description: "" });
            createdWeapons.push(created);
          } catch (err) {
            console.error("Failed to create weapon for", fileName, err);
          }
        } else if (lower.includes("coop") || lower.includes("mode") || lower.includes("feature-coop")) {
          try {
            const created = await storage.createMode({ name: path2.parse(fileName).name, image: imageUrl, description: "", type: "" });
            createdModes.push(created);
          } catch (err) {
            console.error("Failed to create mode for", fileName, err);
          }
        } else if (lower.includes("comp") || lower.includes("rank") || lower.includes("feature-comp")) {
          try {
            const created = await storage.createRank({ name: path2.parse(fileName).name, image: imageUrl, description: "", requirements: "" });
            createdRanks.push(created);
          } catch (err) {
            console.error("Failed to create rank for", fileName, err);
          }
        } else {
          try {
            const created = await storage.createWeapon({ name: path2.parse(fileName).name, image: imageUrl, category: "", description: "" });
            createdWeapons.push(created);
          } catch (err) {
            console.error("Failed to create default weapon for", fileName, err);
          }
        }
      }
      const subfolders = ["modes", "ranks", "weapons"];
      for (const subfolder of subfolders) {
        const subDir = path2.join(assetsPath, subfolder);
        if (fs2.existsSync(subDir)) {
          const subFiles = await fs2.promises.readdir(subDir);
          for (const fileName of subFiles) {
            if (!/\.(jpg|jpeg|png|gif|jfif|webp)$/i.test(fileName)) continue;
            const filePath = path2.join(subDir, fileName);
            const buffer = await fs2.promises.readFile(filePath);
            const formData = new FormData();
            formData.append("reqtype", "fileupload");
            const blob = new Blob([new Uint8Array(buffer)]);
            formData.append("fileToUpload", blob, fileName);
            const response = await fetch("https://catbox.moe/user/api.php", {
              method: "POST",
              body: formData
            });
            if (!response.ok) {
              console.error("Failed to upload", fileName);
              continue;
            }
            const imageUrl = (await response.text()).trim();
            try {
              if (subfolder === "modes") {
                const created = await storage.createMode({ name: path2.parse(fileName).name, image: imageUrl, description: "", type: "" });
                createdModes.push(created);
              } else if (subfolder === "ranks") {
                const created = await storage.createRank({ name: path2.parse(fileName).name, image: imageUrl, description: "", requirements: "" });
                createdRanks.push(created);
              } else if (subfolder === "weapons") {
                const created = await storage.createWeapon({ name: path2.parse(fileName).name, image: imageUrl, category: "", description: "" });
                createdWeapons.push(created);
              }
            } catch (err) {
              console.error("Failed to create item for", fileName, err);
            }
          }
        }
      }
      const crossfireDir = path2.join(assetsPath, "crossfire_images");
      if (fs2.existsSync(crossfireDir)) {
        const cfFiles = await fs2.promises.readdir(crossfireDir);
        for (const fileName of cfFiles) {
          if (!/\.(jpg|jpeg|png|gif|jfif|webp)$/i.test(fileName)) continue;
          const filePath = path2.join(crossfireDir, fileName);
          const buffer = await fs2.promises.readFile(filePath);
          const formData = new FormData();
          formData.append("reqtype", "fileupload");
          const blob = new Blob([new Uint8Array(buffer)]);
          formData.append("fileToUpload", blob, fileName);
          const response = await fetch("https://catbox.moe/user/api.php", {
            method: "POST",
            body: formData
          });
          if (!response.ok) {
            console.error("Failed to upload", fileName);
            continue;
          }
          const imageUrl = (await response.text()).trim();
          try {
            const created = await storage.createWeapon({ name: path2.parse(fileName).name, image: imageUrl, category: "", description: "" });
            createdWeapons.push(created);
          } catch (err) {
            console.error("Failed to create weapon for", fileName, err);
          }
        }
      }
      res.json({ success: true, weapons: createdWeapons.length, modes: createdModes.length, ranks: createdRanks.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/sellers", async (req, res) => {
    try {
      const sellers = await storage.getAllSellers();
      res.json(sellers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/sellers/:id", async (req, res) => {
    try {
      const seller = await storage.getSellerById(req.params.id);
      if (!seller) {
        return res.status(404).json({ error: "Seller not found" });
      }
      res.json(seller);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/sellers", requireAuth, requireSellerManager, async (req, res) => {
    try {
      const data = insertSellerSchema.parse(req.body);
      const seller = await storage.createSeller(data);
      res.json(seller);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.patch("/api/sellers/:id", requireAuth, requireSellerManager, async (req, res) => {
    try {
      const data = insertSellerSchema.partial().parse(req.body);
      const seller = await storage.updateSeller(req.params.id, data);
      if (!seller) {
        return res.status(404).json({ error: "Seller not found" });
      }
      res.json(seller);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.delete("/api/sellers/:id", requireAuth, requireSellerManager, async (req, res) => {
    try {
      const success = await storage.deleteSeller(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Seller not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/sellers/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getSellerReviews(req.params.id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  const reviewLimiter = rateLimit({
    windowMs: 60 * 60 * 1e3,
    // 1 hour
    max: 1,
    // Generate a key per IP + seller id. Use a safe accessor and cast to any to avoid TS mismatches.
    // Use express-rate-limit's ipKeyGenerator to correctly handle IPv6 and forwarded headers.
    keyGenerator: (req) => {
      const ip = ipKeyGenerator(req) || "unknown";
      const sellerId = req.params?.id || "";
      return `${ip}:${sellerId}`;
    },
    handler: (_req, res) => {
      res.status(429).json({ error: "Too many reviews from this IP for this seller. Try again later." });
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  app2.post("/api/sellers/:id/reviews", reviewLimiter, async (req, res) => {
    try {
      const parsed = insertSellerReviewSchema.parse({
        ...req.body,
        sellerId: req.params.id,
        verificationAnswer: req.body?.verificationAnswer
      });
      const { verificationAnswer, ...rest } = parsed;
      const reviewPayload = { ...rest };
      const settings = await storage.getSiteSettings();
      if (settings.reviewVerificationEnabled) {
        const expected = (settings.reviewVerificationPassphrase || "").trim().toLowerCase();
        const provided = (verificationAnswer || "").trim().toLowerCase();
        if (!expected) {
          return res.status(403).json({ error: "Reviews are temporarily locked. Please try again later." });
        }
        if (!provided || provided !== expected) {
          return res.status(403).json({ error: "Verification failed. Please enter the correct verification word." });
        }
      }
      const existing = await storage.getSellerReviews(req.params.id);
      const exists = existing.some((r) => (r.userName || "").toLowerCase() === (reviewPayload.userName || "").toLowerCase());
      if (exists) {
        return res.status(400).json({ error: "You have already reviewed this seller" });
      }
      const review = await storage.createSellerReview(reviewPayload);
      res.json(review);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.delete("/api/sellers/:id/reviews/:reviewId", requireAuth, requireAdminOrTicketManager, async (req, res) => {
    try {
      const { reviewId } = req.params;
      const deleted = await storage.deleteSellerReview(reviewId);
      if (!deleted) {
        return res.status(404).json({ error: "Review not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/tutorials", async (req, res) => {
    try {
      const tutorials = await storage.getAllTutorials();
      res.json(tutorials);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/tutorials/:id", async (req, res) => {
    try {
      const tutorial = await storage.getTutorialById(req.params.id);
      if (!tutorial) {
        return res.status(404).json({ error: "Tutorial not found" });
      }
      res.json(tutorial);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/tutorials", requireAuth, requireTutorialManager, async (req, res) => {
    try {
      const data = insertTutorialSchema.parse(req.body);
      const tutorial = await storage.createTutorial(data);
      res.status(201).json(tutorial);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.patch("/api/tutorials/:id", requireAuth, requireTutorialManager, async (req, res) => {
    try {
      const updates = updateTutorialSchema.parse(req.body);
      const tutorial = await storage.updateTutorial(req.params.id, updates);
      if (!tutorial) {
        return res.status(404).json({ error: "Tutorial not found" });
      }
      res.json(tutorial);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/tutorials/:id", requireAuth, requireTutorialManager, async (req, res) => {
    try {
      const deleted = await storage.deleteTutorial(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Tutorial not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/tutorials/:id/like", async (req, res) => {
    try {
      const tutorial = await storage.incrementTutorialLikes(req.params.id);
      if (!tutorial) {
        return res.status(404).json({ error: "Tutorial not found" });
      }
      res.json(tutorial);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/tutorials/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getTutorialComments(req.params.id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/tutorials/:id/comments", async (req, res) => {
    try {
      const data = insertTutorialCommentSchema.parse({
        ...req.body,
        tutorialId: req.params.id
      });
      const comment = await storage.createTutorialComment(data);
      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/tutorials/comments/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteTutorialComment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Comment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs3 from "fs";
import path4 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path3.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/client"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1600
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    },
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:5000",
        changeOrigin: true,
        secure: false
      }
    }
  },
  define: {
    "process.env.VITE_API_URL": JSON.stringify(process.env.VITE_API_URL),
    "process.env.PUBLIC_BASE_URL": JSON.stringify(process.env.PUBLIC_BASE_URL)
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path4.resolve(import.meta.dirname, "..", "dist", "client");
  if (!fs3.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/index.ts
init_seed_data();
var app = express2();
var index_default = app;
app.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const allowedOrigin = process.env.PUBLIC_BASE_URL || process.env.VITE_API_URL || "*";
  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path6 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path6.startsWith("/api")) {
      let logLine = `${req.method} ${path6} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    const { initializeDatabase: initializeDatabase2 } = await Promise.resolve().then(() => (init_db_connect(), db_connect_exports));
    await initializeDatabase2();
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
  if (process.env.AUTO_SEED === "1") {
    try {
      const existingWeapons = await storage.getAllWeapons();
      if (!existingWeapons || existingWeapons.length === 0) {
        let created = 0;
        for (const w of weaponsData) {
          try {
            await storage.createWeapon(insertWeaponSchema.parse(w));
            created++;
          } catch {
          }
        }
        log(`AUTO_SEED: created ${created} weapons`);
      }
      const existingModes = await storage.getAllModes();
      if (!existingModes || existingModes.length === 0) {
        let created = 0;
        for (const m of modesData) {
          try {
            await storage.createMode(insertModeSchema.parse(m));
            created++;
          } catch {
          }
        }
        log(`AUTO_SEED: created ${created} modes`);
      }
      const existingRanks = await storage.getAllRanks();
      if (!existingRanks || existingRanks.length === 0) {
        let created = 0;
        for (const r of ranksData) {
          try {
            await storage.createRank(insertRankSchema.parse(r));
            created++;
          } catch {
          }
        }
        log(`AUTO_SEED: created ${created} ranks`);
      }
    } catch (err) {
      console.error("AUTO_SEED failed:", err);
    }
  }
  const server = await registerRoutes(app);
  const currentFile = fileURLToPath2(import.meta.url);
  const currentDir = path5.dirname(currentFile);
  const assetsPath = path5.resolve(currentDir, "..", "attached_assets");
  app.use("/assets", express2.static(assetsPath));
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  if (process.env.VERCEL) {
  } else {
    const port = parseInt(process.env.PORT || "5000", 10);
    const maxAttempts = 10;
    let attempted = 0;
    const tryListen = (p) => new Promise((resolve, reject) => {
      const onError = (err) => {
        server.off("listening", onListening);
        server.off("error", onError);
        reject(err);
      };
      const onListening = () => {
        server.off("listening", onListening);
        server.off("error", onError);
        log(`serving on port ${p}`);
        resolve();
      };
      server.once("error", onError);
      server.once("listening", onListening);
      try {
        server.listen({ port: p, host: "0.0.0.0", reusePort: true });
      } catch (err) {
        onError(err);
      }
    });
    (async () => {
      let currentPort = port;
      while (attempted < maxAttempts) {
        try {
          await tryListen(currentPort);
          break;
        } catch (err) {
          if (err && err.code === "EADDRINUSE") {
            log(`port ${currentPort} in use, trying port ${currentPort + 1}...`);
            attempted += 1;
            currentPort += 1;
            await new Promise((r) => setTimeout(r, 200));
            continue;
          }
          throw err;
        }
      }
      if (attempted >= maxAttempts) {
        log(`Failed to bind after ${maxAttempts} attempts. Please free port ${port} or set PORT to a different value.`);
        process.exit(1);
      }
    })();
  }
})();
export {
  index_default as default
};
