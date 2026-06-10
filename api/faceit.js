// api/faceit.js
export default async function handler(req, res) {
    const API_KEY = process.env.FACEIT_API_KEY;
    const TEAM_ID = "8cf84bd4-eaf8-4cee-95e0-0ae9fc7c7003";

    if (!API_KEY) {
        return res.status(500).json({ error: "La clé API n'est pas configurée sur Vercel" });
    }

    try {
        const response = await fetch(`https://api.faceit.com/teams/${TEAM_ID}`, {
            headers: { "Authorization": `Bearer ${API_KEY}` }
        });

        if (!response.ok) {
            throw new Error(`Faceit API responded with status ${response.status}`);
        }

        const data = await response.json();

        // 3. On renvoie les données au site web (index.html)
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des données : " + error.message });
    }
}