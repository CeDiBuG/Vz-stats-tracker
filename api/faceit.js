// api/faceit.js
export default async function handler(req, res) {
    const API_KEY = process.env.FACEIT_API_KEY;
    const TEAM_ID = "8cf84bd4-eaf8-4cee-95e0-0ae9fc7c7003";
    const GAME_ID = "cs2";

    if (!API_KEY) return res.status(500).json({ error: "Clé API manquante" });

    const headers = { "Authorization": `Bearer ${API_KEY}` };

    const faceit = async (path) => {
        const r = await fetch(`https://open.faceit.com/data/v4${path}`, { headers });
        if (!r.ok) throw new Error(`Faceit API error ${r.status} — ${path}`);
        return r.json();
    };

    try {
        const [teamData, globalStatsRaw, tournamentsRaw] = await Promise.allSettled([
            faceit(`/teams/${TEAM_ID}`),
            faceit(`/teams/${TEAM_ID}/stats/${GAME_ID}`),
            faceit(`/teams/${TEAM_ID}/tournaments?game=${GAME_ID}&limit=10`),
        ]);

        if (teamData.status === "rejected") {
            return res.status(502).json({ error: "Impossible de récupérer l'équipe" });
        }

        const team      = teamData.value;
        const globalStats = globalStatsRaw.status === "fulfilled" ? globalStatsRaw.value?.lifetime : null;
        const tournaments = tournamentsRaw.status === "fulfilled"  ? (tournamentsRaw.value?.items ?? []) : [];

        // ── 2. Stats individuelles des joueurs ────────────────────────────────
        const players = await Promise.all(
            team.members.map(async (member) => {
                try {
                    const p = await faceit(`/players/${member.user_id}`);
                    return {
                        nickname: member.nickname,
                        avatar:   member.avatar,
                        elo:      p.games?.cs2?.faceit_elo      ?? "N/A",
                        winRate:  p.game_stats?.cs2?.lifetime?.win_rate ?? 0,
                        kd:       p.game_stats?.cs2?.lifetime?.kd       ?? 0,
                    };
                } catch {
                    return { nickname: member.nickname, avatar: member.avatar, elo: "N/A", winRate: 0, kd: 0 };
                }
            })
        );

        const matchResults = await Promise.allSettled(
            tournaments.map(async (t) => {
                const [past, upcoming] = await Promise.allSettled([
                    faceit(`/championships/${t.championship_id}/matches?type=past&limit=5`),
                    faceit(`/championships/${t.championship_id}/matches?type=upcoming&limit=5`),
                ]);
                return {
                    championship: {
                        id:     t.championship_id,
                        name:   t.name,
                        status: t.status,
                    },
                    pastMatches:     past.status     === "fulfilled" ? (past.value?.items     ?? []) : [],
                    upcomingMatches: upcoming.status === "fulfilled" ? (upcoming.value?.items ?? []) : [],
                };
            })
        );

        const matchesByLeague = matchResults
            .filter(r => r.status === "fulfilled")
            .map(r => r.value);

        const isOurTeam = (id) => id === TEAM_ID;

        const lastMatches = matchesByLeague
            .flatMap(({ championship, pastMatches }) =>
                pastMatches
                    .filter(m =>
                        isOurTeam(m.teams?.faction1?.roster_id) ||
                        isOurTeam(m.teams?.faction2?.roster_id)
                    )
                    .map(m => {
                        const isF1     = isOurTeam(m.teams?.faction1?.roster_id);
                        const us       = isF1 ? m.teams.faction1 : m.teams.faction2;
                        const them     = isF1 ? m.teams.faction2 : m.teams.faction1;
                        const ourScore  = isF1 ? m.results?.score?.faction1 : m.results?.score?.faction2;
                        const theirScore = isF1 ? m.results?.score?.faction2 : m.results?.score?.faction1;
                        const won      = m.results?.winner === (isF1 ? "faction1" : "faction2");
                        return {
                            league:    championship.name,
                            map:       m.voting?.map?.pick?.[0] ?? "TBD",
                            opponent:  them.name ?? "Adversaire",
                            score:     `${ourScore ?? "?"} – ${theirScore ?? "?"}`,
                            result:    won ? "win" : "loss",
                            date:      m.finished_at
                                ? new Date(m.finished_at * 1000).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" })
                                : "—",
                            matchId:   m.match_id,
                        };
                    })
            )
            .sort((a, b) => b.date - a.date)
            .slice(0, 8);

        const nextMatches = matchesByLeague
            .flatMap(({ championship, upcomingMatches }) =>
                upcomingMatches
                    .filter(m =>
                        isOurTeam(m.teams?.faction1?.roster_id) ||
                        isOurTeam(m.teams?.faction2?.roster_id)
                    )
                    .map(m => {
                        const isF1  = isOurTeam(m.teams?.faction1?.roster_id);
                        const them  = isF1 ? m.teams.faction2 : m.teams.faction1;
                        return {
                            league:   championship.name,
                            map:      m.voting?.map?.pick?.[0] ?? "TBD",
                            opponent: them.name ?? "Adversaire",
                            date:     m.scheduled_at
                                ? new Date(m.scheduled_at * 1000).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" })
                                : "À planifier",
                            matchId:  m.match_id,
                        };
                    })
            )
            .slice(0, 5);

        res.status(200).json({
            teamInfo:    team,
            globalStats,
            players,
            leagues:     matchesByLeague.map(l => l.championship),
            lastMatches,
            nextMatches,
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
