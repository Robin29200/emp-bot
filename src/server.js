import express from "express";
import cors from "cors";
import "dotenv/config";
import { Members, Sanctions, Planning, Absences, Documents, Activity } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const VALID_BRANCHES = ["1rpima", "13rdp", "3rpima"];
const checkBranch = (req, res, next) => {
  if (!VALID_BRANCHES.includes(req.params.branch)) return res.status(400).json({ error: "Régiment inconnu" });
  next();
};

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/:branch/summary", checkBranch, (req, res) => {
  const { branch } = req.params;
  res.json({
    members: Members.list(branch),
    sanctions: Sanctions.list(branch),
    planning: Planning.list(branch),
    absences: Absences.list(branch),
    documents: Documents.list(branch),
    activity: Activity.list(branch),
  });
});

// ---------- Members ----------
app.get("/api/:branch/members", checkBranch, (req, res) => res.json(Members.list(req.params.branch)));
app.post("/api/:branch/members", checkBranch, (req, res) => {
  const { pseudo, grade, discordId, robloxId, user } = req.body;
  if (!pseudo || !grade) return res.status(400).json({ error: "pseudo et grade requis" });
  Members.add(req.params.branch, pseudo, grade, discordId, robloxId);
  Activity.log(req.params.branch, user ?? "Site web", "AJOUT_MEMBRE", pseudo);
  res.status(201).json({ ok: true });
});
app.delete("/api/:branch/members/:pseudo", checkBranch, (req, res) => {
  Members.remove(req.params.branch, req.params.pseudo);
  Activity.log(req.params.branch, req.query.user ?? "Site web", "RETRAIT_MEMBRE", req.params.pseudo);
  res.json({ ok: true });
});
app.patch("/api/:branch/members/:pseudo", checkBranch, (req, res) => {
  const { discordId, robloxId, grade } = req.body;
  if (discordId !== undefined) Members.setDiscordId(req.params.branch, req.params.pseudo, discordId);
  if (robloxId !== undefined) Members.setRobloxId(req.params.branch, req.params.pseudo, robloxId);
  if (grade !== undefined) Members.updateGrade(req.params.branch, req.params.pseudo, grade);
  res.json({ ok: true });
});

// ---------- Sanctions ----------
app.get("/api/:branch/sanctions", checkBranch, (req, res) => res.json(Sanctions.list(req.params.branch)));
app.post("/api/:branch/sanctions", checkBranch, (req, res) => {
  const { titre, cible, type, statut, user } = req.body;
  if (!titre || !type) return res.status(400).json({ error: "titre et type requis" });
  Sanctions.add(req.params.branch, titre, cible, type, statut ?? "Active");
  Activity.log(req.params.branch, user ?? "Site web", "AJOUT_SANCTION", cible);
  res.status(201).json({ ok: true });
});
app.delete("/api/:branch/sanctions/:id", checkBranch, (req, res) => {
  Sanctions.remove(req.params.branch, req.params.id);
  res.json({ ok: true });
});

// ---------- Planning ----------
app.get("/api/:branch/planning", checkBranch, (req, res) => res.json(Planning.list(req.params.branch)));
app.post("/api/:branch/planning", checkBranch, (req, res) => {
  const { date, title, category, user } = req.body;
  if (!date || !title) return res.status(400).json({ error: "date et titre requis" });
  Planning.add(req.params.branch, date, title, category ?? "Instruction");
  Activity.log(req.params.branch, user ?? "Site web", "CREATION_EVENEMENT", title);
  res.status(201).json({ ok: true });
});
app.delete("/api/:branch/planning/:id", checkBranch, (req, res) => {
  Planning.remove(req.params.branch, req.params.id);
  res.json({ ok: true });
});

// ---------- Absences ----------
app.get("/api/:branch/absences", checkBranch, (req, res) => res.json(Absences.list(req.params.branch)));
app.post("/api/:branch/absences", checkBranch, (req, res) => {
  const { membre, debut, fin, raison, user } = req.body;
  if (!membre || !debut || !fin) return res.status(400).json({ error: "membre, debut et fin requis" });
  Absences.add(req.params.branch, membre, debut, fin, raison);
  Activity.log(req.params.branch, user ?? "Site web", "DECLARATION_ABSENCE", membre);
  res.status(201).json({ ok: true });
});
app.delete("/api/:branch/absences/:id", checkBranch, (req, res) => {
  Absences.remove(req.params.branch, req.params.id);
  res.json({ ok: true });
});

// ---------- Documents ----------
app.get("/api/:branch/documents", checkBranch, (req, res) => res.json(Documents.list(req.params.branch)));
app.post("/api/:branch/documents", checkBranch, (req, res) => {
  const { title, content, user } = req.body;
  if (!title) return res.status(400).json({ error: "titre requis" });
  Documents.add(req.params.branch, title, content);
  Activity.log(req.params.branch, user ?? "Site web", "AJOUT_DOCUMENT", title);
  res.status(201).json({ ok: true });
});
app.delete("/api/:branch/documents/:id", checkBranch, (req, res) => {
  Documents.remove(req.params.branch, req.params.id);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API disponible sur http://localhost:${PORT}`));
