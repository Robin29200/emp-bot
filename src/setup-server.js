import { Client, GatewayIntentBits, PermissionsBitField, ChannelType } from "discord.js";
import "dotenv/config";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const GRADES = [
  "Chef d'État Major de l'Armée de Terre", "Général de Corps d'Armée", "Général de Division", "Général de Brigade",
  "Colonel", "Lieutenant-Colonel", "Commandant", "Capitaine", "Lieutenant", "Sous-Lieutenant", "Aspirant",
  "Major", "Adjudant-Chef", "Adjudant", "Sergent-Chef", "Sergent",
  "Caporal-Chef de 1ère classe", "Caporal-Chef", "Caporal", "Soldat de 1ère classe", "Soldat",
];

const REGIMENT_ROLES = ["1er RPIMa", "13e RDP", "3e RPIMa"];

const STRUCTURE = [
  {
    category: "📌 ACCUEIL",
    channels: [
      { name: "règlement", type: "text" },
      { name: "annonces", type: "text" },
      { name: "candidatures", type: "text" },
    ],
  },
  {
    category: "🎖️ ÉTAT-MAJOR",
    channels: [
      { name: "commandement", type: "text" },
      { name: "sanctions-log", type: "text" },
    ],
  },
  {
    category: "⚔️ 1ER RPIMA",
    channels: [
      { name: "général-1rpima", type: "text" },
      { name: "instruction-1rpima", type: "text" },
      { name: "vocal-1rpima", type: "voice" },
    ],
  },
  {
    category: "⚔️ 13E RDP",
    channels: [
      { name: "général-13rdp", type: "text" },
      { name: "instruction-13rdp", type: "text" },
      { name: "vocal-13rdp", type: "voice" },
    ],
  },
  {
    category: "⚔️ 3E RPIMA",
    channels: [
      { name: "général-3rpima", type: "text" },
      { name: "instruction-3rpima", type: "text" },
      { name: "vocal-3rpima", type: "voice" },
    ],
  },
];

async function ensureRole(guild, name, options = {}) {
  const existing = guild.roles.cache.find((r) => r.name === name);
  if (existing) return existing;
  return guild.roles.create({ name, ...options });
}

async function ensureCategory(guild, name) {
  const existing = guild.channels.cache.find((c) => c.name === name && c.type === ChannelType.GuildCategory);
  if (existing) return existing;
  return guild.channels.create({ name, type: ChannelType.GuildCategory });
}

async function ensureChannel(guild, name, type, parentId) {
  const existing = guild.channels.cache.find((c) => c.name === name && c.parentId === parentId);
  if (existing) return existing;
  return guild.channels.create({
    name,
    type: type === "voice" ? ChannelType.GuildVoice : ChannelType.GuildText,
    parent: parentId,
  });
}

client.once("ready", async () => {
  console.log(`Connecté en tant que ${client.user.tag}. Provisionnement en cours...`);

  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  await guild.roles.fetch();
  await guild.channels.fetch();

  console.log("→ Création des rôles de grade...");
  for (const grade of GRADES) {
    await ensureRole(guild, grade, { color: "Gold", hoist: false, mentionable: false });
  }

  console.log("→ Création des rôles de régiment...");
  for (const reg of REGIMENT_ROLES) {
    await ensureRole(guild, reg, { color: "DarkGreen", hoist: true, mentionable: true });
  }

  await ensureRole(guild, "Recrue", { color: "Grey", hoist: true, mentionable: true });

  console.log("→ Création des catégories et salons...");
  for (const section of STRUCTURE) {
    const cat = await ensureCategory(guild, section.category);
    for (const ch of section.channels) {
      await ensureChannel(guild, ch.name, ch.type, cat.id);
    }
  }

  console.log("✅ Serveur provisionné avec succès. Tu peux fermer ce script (Ctrl+C).");
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
