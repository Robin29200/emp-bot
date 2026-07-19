import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import { Members, Activity } from "./db.js";
import { getUserRoleInGroup } from "./roblox.js";

const GRADES = [
  "Chef d'État Major de l'Armée de Terre", "Général de Corps d'Armée", "Général de Division", "Général de Brigade",
  "Colonel", "Lieutenant-Colonel", "Commandant", "Capitaine", "Lieutenant", "Sous-Lieutenant", "Aspirant",
  "Major", "Adjudant-Chef", "Adjudant", "Sergent-Chef", "Sergent",
  "Caporal-Chef de 1ère classe", "Caporal-Chef", "Caporal", "Soldat de 1ère classe", "Soldat",
];

const GROUP_ID = process.env.ROBLOX_GROUP_ID;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!GROUP_ID) {
  console.error("❌ ROBLOX_GROUP_ID manquant dans le .env");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

async function syncDiscordRole(guild, discordId, newGrade) {
  if (!discordId) return "pas de compte Discord lié";
  try {
    const member = await guild.members.fetch(discordId);
    const rolesToRemove = member.roles.cache.filter((r) => GRADES.includes(r.name) && r.name !== newGrade);
    for (const role of rolesToRemove.values()) await member.roles.remove(role);

    let newRole = guild.roles.cache.find((r) => r.name === newGrade);
    if (!newRole) newRole = await guild.roles.create({ name: newGrade, color: "Gold" });
    if (!member.roles.cache.has(newRole.id)) await member.roles.add(newRole);
    return "rôle Discord mis à jour";
  } catch (err) {
    return `impossible de mettre à jour le rôle Discord (${err.message})`;
  }
}

client.once("ready", async () => {
  console.log(`Connecté en tant que ${client.user.tag}. Synchronisation Roblox en cours...\n`);
  const guild = await client.guilds.fetch(process.env.GUILD_ID);

  const members = Members.listAll().filter((m) => m.roblox_id);
  if (members.length === 0) {
    console.log("Aucun membre avec un Roblox ID enregistré. Utilise /effectif lier pour en associer.");
    process.exit(0);
  }

  let updated = 0, unchanged = 0, notInGroup = 0, errors = 0;

  for (const m of members) {
    try {
      const roleName = await getUserRoleInGroup(m.roblox_id, GROUP_ID);

      if (!roleName) {
        console.log(`⚠️  ${m.pseudo} n'est plus dans le groupe Roblox.`);
        notInGroup++;
        continue;
      }
      if (!GRADES.includes(roleName)) {
        console.log(`⚠️  ${m.pseudo} a le rôle Roblox "${roleName}", qui ne correspond à aucun grade connu — ignoré.`);
        continue;
      }
      if (roleName === m.grade) {
        unchanged++;
        continue;
      }

      Members.updateGrade(m.branch, m.pseudo, roleName);
      Activity.log(m.branch, "Synchro Roblox", "SYNC_ROBLOX_GRADE", `${m.pseudo}: ${m.grade} → ${roleName}`);
      const discordResult = await syncDiscordRole(guild, m.discord_id, roleName);
      console.log(`✅ ${m.pseudo}: ${m.grade} → ${roleName} (${discordResult})`);
      updated++;
    } catch (err) {
      console.log(`❌ Erreur pour ${m.pseudo} : ${err.message}`);
      errors++;
    }
    await sleep(400); // ménage l'API Roblox entre chaque membre
  }

  console.log(`\nTerminé. ${updated} mis à jour, ${unchanged} inchangés, ${notInGroup} plus dans le groupe, ${errors} erreurs.`);
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
