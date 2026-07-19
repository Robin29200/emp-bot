import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import "dotenv/config";
import { Members, Sanctions, Planning, Absences, Activity } from "./db.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

const GOLD = 0xc9a227;
const branchLabel = (v) => ({ "1rpima": "1er RPIMa", "13rdp": "13e RDP", "3rpima": "3e RPIMa" }[v] ?? v);

client.once("ready", () => {
  console.log(`Bot connecté en tant que ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  const sub = interaction.options.getSubcommand();
  const branch = interaction.options.getString("regiment");
  const user = interaction.user.username;

  try {
    if (commandName === "effectif") {
      if (sub === "ajouter") {
        const pseudo = interaction.options.getString("pseudo");
        const grade = interaction.options.getString("grade");
        const discordUser = interaction.options.getUser("membre_discord");
        const robloxId = interaction.options.getString("roblox_id") ?? "";
        Members.add(branch, pseudo, grade, discordUser?.id ?? "", robloxId);
        Activity.log(branch, user, "AJOUT_MEMBRE", pseudo);
        return interaction.reply({ content: `✅ **${pseudo}** ajouté au **${branchLabel(branch)}** avec le grade *${grade}*.` });
      }
      if (sub === "liste") {
        const members = Members.list(branch);
        if (members.length === 0) return interaction.reply({ content: `Aucun membre enregistré pour le ${branchLabel(branch)}.` });
        const embed = new EmbedBuilder()
          .setTitle(`Effectifs — ${branchLabel(branch)}`)
          .setColor(GOLD)
          .setDescription(members.map((m) => `**${m.pseudo}** — ${m.grade}`).join("\n"));
        return interaction.reply({ embeds: [embed] });
      }
      if (sub === "retirer") {
        const pseudo = interaction.options.getString("pseudo");
        Members.remove(branch, pseudo);
        Activity.log(branch, user, "RETRAIT_MEMBRE", pseudo);
        return interaction.reply({ content: `🗑️ **${pseudo}** retiré du ${branchLabel(branch)}.` });
      }
      if (sub === "lier") {
        const pseudo = interaction.options.getString("pseudo");
        const discordUser = interaction.options.getUser("membre_discord");
        const robloxId = interaction.options.getString("roblox_id");
        if (!discordUser && !robloxId) {
          return interaction.reply({ content: "Précise au moins un compte Discord ou un Roblox ID à lier.", ephemeral: true });
        }
        if (discordUser) Members.setDiscordId(branch, pseudo, discordUser.id);
        if (robloxId) Members.setRobloxId(branch, pseudo, robloxId);
        Activity.log(branch, user, "LIAISON_COMPTE", pseudo);
        return interaction.reply({ content: `🔗 Comptes mis à jour pour **${pseudo}**.` });
      }
    }

    if (commandName === "sanction") {
      if (sub === "ajouter") {
        const titre = interaction.options.getString("titre");
        const cible = interaction.options.getString("cible");
        const type = interaction.options.getString("type");
        const statut = interaction.options.getString("statut") ?? "Active";
        Sanctions.add(branch, titre, cible, type, statut);
        Activity.log(branch, user, "AJOUT_SANCTION", cible);
        return interaction.reply({ content: `⚠️ Sanction **${type}** enregistrée pour **${cible}** (${branchLabel(branch)}).` });
      }
      if (sub === "liste") {
        const sanctions = Sanctions.list(branch);
        if (sanctions.length === 0) return interaction.reply({ content: `Aucune sanction pour le ${branchLabel(branch)}.` });
        const embed = new EmbedBuilder()
          .setTitle(`Sanctions — ${branchLabel(branch)}`)
          .setColor(0x8b2e2e)
          .setDescription(sanctions.slice(0, 15).map((s) => `**${s.cible || "—"}** — ${s.type} (${s.statut})`).join("\n"));
        return interaction.reply({ embeds: [embed] });
      }
    }

    if (commandName === "planning") {
      if (sub === "ajouter") {
        const date = interaction.options.getString("date");
        const titre = interaction.options.getString("titre");
        const categorie = interaction.options.getString("categorie");
        Planning.add(branch, date, titre, categorie);
        Activity.log(branch, user, "CREATION_EVENEMENT", titre);
        return interaction.reply({ content: `📅 Événement **${titre}** ajouté le ${date} (${branchLabel(branch)}).` });
      }
      if (sub === "liste") {
        const today = new Date().toISOString().slice(0, 10);
        const events = Planning.list(branch).filter((e) => e.date >= today);
        if (events.length === 0) return interaction.reply({ content: `Aucun événement à venir pour le ${branchLabel(branch)}.` });
        const embed = new EmbedBuilder()
          .setTitle(`Planning — ${branchLabel(branch)}`)
          .setColor(GOLD)
          .setDescription(events.slice(0, 15).map((e) => `**${e.date}** — ${e.title} _(${e.category})_`).join("\n"));
        return interaction.reply({ embeds: [embed] });
      }
    }

    if (commandName === "absence" && sub === "declarer") {
      const pseudo = interaction.options.getString("pseudo");
      const debut = interaction.options.getString("debut");
      const fin = interaction.options.getString("fin");
      const raison = interaction.options.getString("raison") ?? "";
      Absences.add(branch, pseudo, debut, fin, raison);
      Activity.log(branch, user, "DECLARATION_ABSENCE", pseudo);
      return interaction.reply({ content: `📋 Absence de **${pseudo}** déclarée du ${debut} au ${fin}.` });
    }
  } catch (err) {
    console.error(err);
    if (!interaction.replied) {
      await interaction.reply({ content: "❌ Une erreur est survenue lors du traitement de la commande.", ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
