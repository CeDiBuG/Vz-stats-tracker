// api/faceit.js
export default async function handler(req, res) {
    const API_KEY = process.env.FACEIT_API_KEY;
    const TEAM_ID = "8cf84bd4-eaf8-4cee-95e0-0ae9fc7c7003";
    const GAME_ID = "cs2";

    if (!API_KEY) return res.status(500).json({ error: "Clé API manquante" });

    try {
        // 1. On récupère les infos de base et les stats globales de l'équipe en parallèle
        const [teamRes, globalStatsRes] = await Promise.all([
            fetch(`https://open.faceit.com/data/v4/teams/${TEAM_ID}`, { headers: { "Authorization": `Bearer ${API_KEY}` } }),
            fetch(`https://open.faceit.com/data/v4/teams/${TEAM_ID}/stats/${GAME_ID}`, { headers: { "Authorization": `Bearer ${API_KEY}` } })
        ]);

        if (!teamRes.ok) return res.status(teamRes.status).json({ error: "Erreur Team API" });

        const teamData = await teamRes.json();
        const globalStats = globalStatsRes.ok ? await globalStatsRes.json() : null;

        const playerDetailsPromises = teamData.members.map(async (member) => {
            try {
                const pRes = await fetch(`https://api.faceit.com/players/${member.user_id}`, { 
                    headers: { "Authorization": `Bearer ${API_KEY}` } 
                });
                const pData = await pRes.json();
                
                // On extrait uniquement les stats CS2
                return {
                    nickname: member.nickname,
                    avatar: member.avatar,
                    elo: pData.game_stats.cs2.lifetime.elo,
                    winRate: pData.game_stats.cs2.lifetime.win_rate,
                    kd: pData.game_stats.cs2.lifetime.kd,
                    role: "Pro Player" // Le rôle n'est pas dans l'API Faceit
                };
            } catch (e) {
                return { nickname: member.nickname, avatar: member.avatar, elo: "N/A", winRate: 0, kd: 0 };
            }
        });

        const fullPlayersStats = await Promise.all(playerDetailsPromises);

        res.status(200).json({
            teamInfo: teamData,
            globalStats: globalStats ? globalStats.lifetime : null,
            players: fullPlayersStats
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
