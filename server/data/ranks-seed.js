// RANKS - 26 Complete Progression System from backend-deploy-full/seed-from-urls.js
// Using emblem as image field for proper integration
const ranksData = [
  { name: "Brigadier General 1", tier: 1, image: "https://files.catbox.moe/s7cki2.jpeg", bonus: "", description: "First rank in progression", requirements: "Start your rank progression" },
  { name: "Brigadier General 2", tier: 2, image: "https://files.catbox.moe/ysfqm5.jpeg", bonus: "AK-47-K-Yellow Fractal 60 days", description: "Second brigadier rank", requirements: "Reach 8M EXP" },
  { name: "Brigadier General 3", tier: 3, image: "https://files.catbox.moe/b28ove.jpeg", bonus: "", description: "Third brigadier rank", requirements: "Reach 8.5M EXP" },
  { name: "Brigadier General 4", tier: 4, image: "https://files.catbox.moe/5kqiv0.jpeg", bonus: "", description: "Fourth brigadier rank", requirements: "Reach 9M EXP" },
  { name: "Brigadier General 5", tier: 5, image: "https://files.catbox.moe/dxp982.jpeg", bonus: "", description: "Fifth brigadier rank", requirements: "Reach 9.5M EXP" },
  { name: "Brigadier General 6", tier: 6, image: "https://files.catbox.moe/znkwhf.jpeg", bonus: "30 x 7th Anniversary Crates", description: "Sixth brigadier rank", requirements: "Reach 10M EXP" },
  { name: "Major General 1", tier: 7, image: "https://files.catbox.moe/0z7arw.jpeg", bonus: "", description: "First major general rank", requirements: "Reach 10.5M EXP" },
  { name: "Major General 2", tier: 8, image: "https://files.catbox.moe/r5bv00.jpeg", bonus: "G-Yellow Crystal perm", description: "Second major general rank", requirements: "Reach 11.2M EXP" },
  { name: "Major General 3", tier: 9, image: "https://files.catbox.moe/u1u353.jpeg", bonus: "", description: "Third major general rank", requirements: "Reach 11.8M EXP" },
  { name: "Major General 4", tier: 10, image: "https://files.catbox.moe/zvmosb.jpeg", bonus: "", description: "Fourth major general rank", requirements: "Reach 12.5M EXP" },
  { name: "Major General 5", tier: 11, image: "https://files.catbox.moe/r732ah.jpeg", bonus: "10 Color Blaze Crates", description: "Fifth major general rank", requirements: "Reach 13.2M EXP" },
  { name: "Major General 6", tier: 12, image: "https://files.catbox.moe/8n9syh.jpeg", bonus: "Slaughter Ticket Box", description: "Sixth major general rank", requirements: "Reach 13.9M EXP" },
  { name: "Lieutenant General 1", tier: 13, image: "https://files.catbox.moe/a5m2o4.jpeg", bonus: "", description: "First lieutenant general rank", requirements: "Reach 14.6M EXP" },
  { name: "Lieutenant General 2", tier: 14, image: "https://files.catbox.moe/9cz5b0.jpeg", bonus: "", description: "Second lieutenant general rank", requirements: "Reach 15.4M EXP" },
  { name: "Lieutenant General 3", tier: 15, image: "https://files.catbox.moe/pn404m.jpeg", bonus: "M4A1-S-Yellow Fractal perm", description: "Third lieutenant general rank", requirements: "Reach 16.3M EXP" },
  { name: "Lieutenant General 4", tier: 16, image: "https://files.catbox.moe/k4xaa3.jpeg", bonus: "", description: "Fourth lieutenant general rank", requirements: "Reach 17.1M EXP" },
  { name: "Lieutenant General 5", tier: 17, image: "https://files.catbox.moe/pq4ung.jpeg", bonus: "", description: "Fifth lieutenant general rank", requirements: "Reach 18M EXP" },
  { name: "Lieutenant General 6", tier: 18, image: "https://files.catbox.moe/34w8kx.jpeg", bonus: "RPK-Infernal Dragon 30 days", description: "Sixth lieutenant general rank", requirements: "Reach 19M EXP" },
  { name: "General 1", tier: 19, image: "https://files.catbox.moe/sy65bu.jpeg", bonus: "", description: "First general rank", requirements: "Reach 20M EXP" },
  { name: "General 2", tier: 20, image: "https://files.catbox.moe/ehamvu.jpeg", bonus: "AK-47-K-Yellow Fractal perm", description: "Second general rank", requirements: "Reach 21M EXP" },
  { name: "General 3", tier: 21, image: "https://files.catbox.moe/136e14.jpeg", bonus: "", description: "Third general rank", requirements: "Reach 22M EXP" },
  { name: "General 4", tier: 22, image: "https://files.catbox.moe/3xzm6i.jpeg", bonus: "AWM-Infernal Dragon 30 days", description: "Fourth general rank", requirements: "Reach 23M EXP" },
  { name: "General 5", tier: 23, image: "https://files.catbox.moe/q4itad.jpeg", bonus: "", description: "Fifth general rank", requirements: "Reach 24.2M EXP" },
  { name: "General 6", tier: 24, image: "https://files.catbox.moe/ibwcla.jpeg", bonus: "AK-47 Fury 30 days", description: "Sixth general rank", requirements: "Reach 25.3M EXP" },
  { name: "Marshall", tier: 25, image: "https://files.catbox.moe/ibwcla.jpeg", bonus: "", description: "Marshall rank", requirements: "Reach 26.5M EXP" },
  { name: "Grand Marshall", tier: 26, image: "https://files.catbox.moe/eu1zph.jpeg", bonus: "30 Free Crate Tickets", description: "Highest rank achievable", requirements: "Reach 100M EXP" }
];

module.exports = { ranksData };
