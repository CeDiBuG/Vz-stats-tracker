// api/faceit.js
export default async function handler(req, res) {
    const API_KEY = process.env.FACEIT_API_KEY;
    const TEAM_ID = "8cf84bd4-eaf8-4cee-95e0-0ae9fc7c7003";
    const GAME_ID = "cs2"; // On précise que c'est pour CS2

    if (!API_KEY) return res.status(500).json({ error: "Clé API manquante" });

    try {
        // On lance les deux requêtes en parallèle pour gagner du temps
        const [teamRes, statsRes] = await Promise.all([
            fetch(`https://api.faceit.com/teams/${TEAM_ID}`, { 
                headers: { "Authorization": `Bearer ${API_KEY}` } 
            }),
            fetch(`https://api.faceit.com/teams/${TEAM_ID}/stats/${GAME_ID}`, { 
                headers: { "Authorization": `Bearer ${API_KEY}` } 
            })
        ]);

        // On crée un objet qui regroupe tout
        const result = {
            members: teamRes.ok ? (await teamRes.json()).members : null,
            teamStats: statsRes.ok ? await statsRes.json() : null,
            apiStatus: (teamRes.ok || statsRes.ok) ? "OK" : "DOWN"
        };

        res.status(200).json(result);

    } catch (error) {
        res.status(200).json({ apiStatus: "DOWN", error: error.message });
    }
}
