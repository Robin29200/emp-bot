import { REST, Routes, SlashCommandBuilder } from "discord.js";
import "dotenv/config";

const BRANCHES = [
  { name: "1er RPIMa", value: "1rpima" },
  { name: "13e RDP", value: "13rdp" },
  { name: "3e RPIMa", value: "3rpima" },
];

const GRADES = [
  "Chef d'État Major de l'Armée de Terre", "Général de Corps d'Armée", "Général de Division", "Général de Brigade",
  "Colonel", "Lieutenant-Colonel", "Commandant", "Capitaine", "Lieutenant", "Sous-Lieutenant", "Aspirant",
  "Major", "Adjudant-Chef", "Adjudant", "Sergent-Chef", "Sergent",
  "Caporal-Chef de 1ère classe", "Caporal-Chef", "Caporal", "Soldat de 1ère classe", "Soldat",
].map((g) => ({ name: g, value: g }));

const SANCTION_TYPES = ["Avertissement oral", "Rapport écrit", "Consigne", "Rétrogradation", "Exclusion temporaire", "Radiation"]
  .map((t) => ({ name: t, value: t }));

const CATEGORIES = ["Instruction", "Manœuvre", "Inspection", "Cérémonie", "Permission"].map((c) => ({ name: c, value: c }));

const branchOption = (b) => b.addStringOption((o) => o.setName("regiment").setDescription("Régiment").setRequired(true).addChoices(...BRANCHES));

const commands = [
  new SlashCommandBuilder()
    .setName("effectif")
    .setDescription("Gérer les effectifs")
    .addSubcommand((sub) =>
      branchOption(sub.setName("ajouter").setDescription("Ajouter un membre"))
        .addStringOption((o) => o.setName("pseudo").setDescription("Pseudo Roblox").setRequired(true))
        .addStringOption((o) => o.setName("grade").setDescription("Grade").setRequired(true).addChoices(...GRADES.slice(0, 25)))
        .addUserOption((o) => o.setName("membre_discord").setDescription("Membre Discord lié").setRequired(false))
        .addStringOption((o) => o.setName("roblox_id").setDescription("Roblox ID").setRequired(false))
    )
    .addSubcommand((sub) =>
      branchOption(sub.setName("liste").setDescription("Lister les membres"))
    )
    .addSubcommand((sub) =>
      branchOption(sub.setName("retirer").setDescription("Retirer un membre"))
        .addStringOption((o) => o.setName("pseudo").setDescription("Pseudo à retirer").setRequired(true))
    )
    .addSubcommand((sub) =>
      branchOption(sub.setName("lier").setDescription("Lier un compte Discord et/ou Roblox à un membre existant"))
        .addStringOption((o) => o.setName("pseudo").setDescription("Pseudo du membre").setRequired(true))
        .addUserOption((o) => o.setName("membre_discord").setDescription("Compte Discord à lier").setRequired(false))
        .addStringOption((o) => o.setName("roblox_id").setDescription("Roblox ID à lier").setRequired(false))
    ),

  new SlashCommandBuilder()
    .setName("sanction")
    .setDescription("Gérer les sanctions")
    .addSubcommand((sub) =>
      branchOption(sub.setName("ajouter").setDescription("Ajouter une sanction"))
        .addStringOption((o) => o.setName("titre").setDescription("Titre de la sanction").setRequired(true))
        .addStringOption((o) => o.setName("cible").setDescription("Pseudo du membre sanctionné").setRequired(true))
        .addStringOption((o) => o.setName("type").setDescription("Type").setRequired(true).addChoices(...SANCTION_TYPES))
        .addStringOption((o) =>
          o.setName("statut").setDescription("Statut").setRequired(false).addChoices(
            { name: "Active", value: "Active" }, { name: "Levée", value: "Levée" }, { name: "Contestée", value: "Contestée" }
          )
        )
    )
    .addSubcommand((sub) => branchOption(sub.setName("liste").setDescription("Lister les sanctions"))),

  new SlashCommandBuilder()
    .setName("planning")
    .setDescription("Gérer le planning")
    .addSubcommand((sub) =>
      branchOption(sub.setName("ajouter").setDescription("Ajouter un événement"))
        .addStringOption((o) => o.setName("date").setDescription("Date (AAAA-MM-JJ)").setRequired(true))
        .addStringOption((o) => o.setName("titre").setDescription("Titre de l'événement").setRequired(true))
        .addStringOption((o) => o.setName("categorie").setDescription("Catégorie").setRequired(true).addChoices(...CATEGORIES))
    )
    .addSubcommand((sub) => branchOption(sub.setName("liste").setDescription("Lister les événements à venir"))),

  new SlashCommandBuilder()
    .setName("absence")
    .setDescription("Gérer les absences")
    .addSubcommand((sub) =>
      branchOption(sub.setName("declarer").setDescription("Déclarer une absence"))
        .addStringOption((o) => o.setName("pseudo").setDescription("Pseudo du membre").setRequired(true))
        .addStringOption((o) => o.setName("debut").setDescription("Début (AAAA-MM-JJ)").setRequired(true))
        .addStringOption((o) => o.setName("fin").setDescription("Fin (AAAA-MM-JJ)").setRequired(true))
        .addStringOption((o) => o.setName("raison").setDescription("Raison").setRequired(false))
    ),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

try {
  console.log("Enregistrement des commandes slash...");
  await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
  console.log("Commandes enregistrées avec succès sur le serveur.");
} catch (err) {
  console.error("Erreur lors de l'enregistrement des commandes :", err);
}
