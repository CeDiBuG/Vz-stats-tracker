// api/faceit.js
export default async function handler(req, res) {
    const API_KEY = process.env.FACEIT_API_KEY;
    const TEAM_ID = "8cf84bd4-eaf8-4cee-95e0-0ae9fc7c7003";

    if (!API_KEY) return res.status(500).json({ error: "Clé API manquante" });

    try {
        const response = await fetch(`https://api.faceit.com/teams/${TEAM_ID}`, {
            headers: { 
                "Authorization": `Bearer ${API_KEY}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: "Erreur API Faceit" });
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
