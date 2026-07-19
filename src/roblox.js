const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Retourne le nom du rôle d'un utilisateur Roblox dans un groupe donné,
 * ou null si l'utilisateur n'est pas membre du groupe.
 */
export async function getUserRoleInGroup(robloxUserId, groupId) {
  const res = await fetch(`https://groups.roblox.com/v1/users/${robloxUserId}/groups/roles`);
  if (!res.ok) throw new Error(`Roblox API a répondu ${res.status} pour l'utilisateur ${robloxUserId}`);
  const data = await res.json();
  const entry = (data.data ?? []).find((g) => String(g.group.id) === String(groupId));
  return entry ? entry.role.name : null;
}

/**
 * Retourne la liste complète des membres d'un groupe Roblox avec leur rôle,
 * en suivant la pagination. Utile pour détecter les membres du groupe qui
 * ne sont pas encore enregistrés dans l'intranet.
 */
export async function getGroupMembers(groupId) {
  const members = [];
  let cursor = "";
  do {
    const url = `https://groups.roblox.com/v1/groups/${groupId}/users?limit=100&cursor=${cursor}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Roblox API a répondu ${res.status} pour le groupe ${groupId}`);
    const data = await res.json();
    for (const item of data.data ?? []) {
      members.push({ userId: item.user.userId, username: item.user.username, role: item.role.name });
    }
    cursor = data.nextPageCursor ?? "";
    if (cursor) await sleep(300); // ménage l'API Roblox entre deux pages
  } while (cursor);
  return members;
}
