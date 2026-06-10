export default async function handler(req, res) {
    const API_KEY = process.env.FACEIT_API_KEY;
    const TEAM_ID = "8cf84bd4-eaf8-4cee-95e0-0ae9fc7c7003";

    if (!API_KEY) {
        return res.status(500).json({ error: "Missing API key" });
    }

    const headers = {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json"
    };

    try {
        const teamRes = await fetch(
            `https://open.faceit.com/data/v4/teams/${TEAM_ID}`,
            { headers }
        );

        if (!teamRes.ok) {
            return res.status(teamRes.status).json({
                error: "Team API error"
            });
        }

        const team = await teamRes.json();

        const members = team.members || [];

        const players = await Promise.all(
            members.map(async (m) => {
                try {
                    const pRes = await fetch(
                        `https://open.faceit.com/data/v4/players/${m.user_id}`,
                        { headers }
                    );

                    const p = await pRes.json();

                    const cs = p.games?.cs2 || {};

                    return {
                        nickname: m.nickname,
                        avatar: p.avatar || m.avatar || "",
                        elo: cs.faceit_elo || 0,
                        level: cs.skill_level || 0
                    };
                } catch {
                    return {
                        nickname: m.nickname,
                        avatar: m.avatar || "",
                        elo: 0,
                        level: 0
                    };
                }
            })
        );

        return res.status(200).json({
            team: {
                name: team.name,
                avatar: team.avatar
            },
            players
        });

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
