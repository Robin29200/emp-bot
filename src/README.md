# EMP Bot — Installation

Bot Discord pour l'EMP (1er RPIMa, 13e RDP, 3e RPIMa) avec base de données partagée,
et petit serveur API prêt à être relié au site plus tard.

## 0. Créer le serveur Discord

Je ne peux pas créer le serveur à ta place (pas d'accès à un compte Discord), mais c'est
rapide : dans l'appli Discord, clique sur le **+** en bas de la liste des serveurs à
gauche > **Créer un serveur** > donne-lui un nom (ex: "École Militaire de Paris") >
valide. Le script `setup-server` ci-dessous se chargera ensuite de créer automatiquement
tous les rôles, catégories et salons dedans.

## 1. Prérequis

- [Node.js](https://nodejs.org) version 18 ou plus (télécharge la version "LTS")
- Un compte Discord avec les droits d'administration sur ton serveur

## 2. Créer l'application Discord

1. Va sur https://discord.com/developers/applications
2. Clique sur **New Application**, donne-lui un nom (ex: "EMP Bot")
3. Dans l'onglet **Bot** :
   - Clique sur **Reset Token**, copie le token (tu ne pourras plus le revoir après)
   - Active **Server Members Intent** (obligatoire pour la synchro Roblox → rôles Discord)
4. Dans l'onglet **General Information**, copie l'**Application ID**
5. Dans l'onglet **OAuth2 > URL Generator** :
   - Coche **bot** et **applications.commands**
   - Dans "Bot Permissions", coche **Administrator** (le plus simple pour l'instant — tu
     pourras restreindre plus tard) ou au minimum **Manage Roles**, **Manage Channels**,
     **Send Messages**, **Use Slash Commands**, **Embed Links**
   - Copie l'URL générée en bas, ouvre-la dans ton navigateur et invite le bot sur ton serveur

## 3. Récupérer l'ID de ton serveur

Dans Discord : Paramètres > Avancés > active **Mode développeur**.
Puis clic droit sur le nom de ton serveur > **Copier l'identifiant du serveur**.

## 4. Configurer le projet

1. Décompresse le dossier `emp-bot`
2. Ouvre un terminal dans ce dossier
3. Installe les dépendances :
   ```
   npm install
   ```
4. Copie `.env.example` en `.env` :
   ```
   cp .env.example .env
   ```
5. Ouvre `.env` et remplis :
   ```
   DISCORD_TOKEN=le_token_copié_à_l'étape_2
   CLIENT_ID=l'application_id_copié_à_l'étape_2
   GUILD_ID=l'id_de_serveur_copié_à_l'étape_3
   PORT=3000
   ```

## 5. Provisionner le serveur automatiquement (rôles + salons)

Une fois le `.env` rempli, ce script crée en une fois tous les rôles de grade, les rôles
de régiment (1er RPIMa, 13e RDP, 3e RPIMa), et l'organisation des salons/catégories :

```
npm run setup-server
```

Il est safe à relancer : il ne recrée pas ce qui existe déjà. Tu peux ensuite réorganiser
l'ordre des rôles/salons à la main dans Discord si tu veux ajuster.

## 6. Enregistrer les commandes slash

Cette étape crée les commandes `/effectif`, `/sanction`, `/planning`, `/absence` sur ton serveur :

```
npm run deploy
```

Tu dois voir `Commandes enregistrées avec succès sur le serveur.`

## 7. Lancer le bot

```
npm run bot
```

Le terminal doit afficher `Bot connecté en tant que ...`. Laisse cette fenêtre ouverte —
si tu la fermes, le bot se déconnecte. Teste avec `/effectif liste` sur ton serveur.

## 8. (Optionnel pour l'instant) Lancer l'API

Dans un **second terminal**, toujours dans le dossier du projet :

```
npm run server
```

Ça démarre une petite API sur `http://localhost:3000` qui lit/écrit dans la même base
de données que le bot (`emp.sqlite`). C'est la pièce qui permettra un jour de relier le
site web au bot — mais tant que ton PC n'est pas accessible depuis internet, seul ton
bot peut s'en servir.

## Commandes disponibles

| Commande | Description |
|---|---|
| `/effectif ajouter` | Ajoute un membre (pseudo, grade, Discord, Roblox ID) |
| `/effectif liste` | Liste les membres d'un régiment |
| `/effectif retirer` | Retire un membre |
| `/sanction ajouter` | Enregistre une sanction |
| `/sanction liste` | Liste les sanctions actives/récentes |
| `/planning ajouter` | Ajoute un événement au planning |
| `/planning liste` | Liste les événements à venir |
| `/absence declarer` | Déclare une absence |

## Synchro Roblox → grades automatiques

Le bot peut aller chercher le rôle Roblox de chaque membre (dans le groupe de l'EMP) et
mettre à jour son grade automatiquement, dans la base **et** sur Discord.

**Condition :** les noms des rôles dans ton groupe Roblox doivent être identiques aux
grades utilisés ici (ex: "Colonel", "Sergent-Chef"...).

1. Récupère l'ID de ton groupe Roblox : va sur la page du groupe, l'ID est dans l'URL
   (`roblox.com/groups/12345678/nom-du-groupe` → l'ID est `12345678`)
2. Ajoute-le dans `.env` : `ROBLOX_GROUP_ID=12345678`
3. Lie chaque membre à son compte Roblox (et Discord si besoin) avec :
   ```
   /effectif lier pseudo:<pseudo> roblox_id:<id roblox> membre_discord:<@membre>
   ```
   (le Roblox ID peut aussi être renseigné directement à la création avec `/effectif ajouter`)
4. Lance la synchro :
   ```
   npm run sync-roblox
   ```
   Le script parcourt tous les membres liés, compare leur rôle Roblox actuel à leur grade
   enregistré, et met à jour ce qui a changé (base de données + rôle Discord).

**Pour automatiser** : une fois que le bot tourne en continu (hébergé), tu peux
programmer `npm run sync-roblox` toutes les X heures avec une tâche cron (sur un VPS)
ou un "Cron Job" sur Railway/Render. Dis-moi quand tu en es là, je t'aiderai à le configurer.

## Faire tourner le bot en continu (24/7)

Pour l'instant le bot ne fonctionne que quand ton PC est allumé et le terminal ouvert.
Pour un vrai fonctionnement permanent, il faut l'héberger. Options simples et gratuites
au démarrage : **Railway**, **Render**, ou un petit **VPS** (ex: Hetzner, OVH).
Dis-moi quand tu en seras là, je te guiderai pas à pas selon l'option choisie.

## Relier le site web plus tard

Le site que je t'ai fait tourne dans l'environnement de Claude et ne peut pas encore
appeler cette API directement. Quand tu seras prêt à héberger le bot (étape ci-dessus),
je pourrai adapter le site pour qu'il lise et écrive dans cette même base de données
au lieu de son stockage actuel — à ce moment-là, bot et site seront vraiment synchronisés.
