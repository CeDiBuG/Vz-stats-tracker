// api/faceit.js
export default async function handler(req, res) {
    console.log("Requête reçue sur le serveur Vercel...");

    const API_KEY = process.env.FACEIT_API_KEY;
    const TEAM_ID = "8cf84bd4-eaf8-4cee-95e0-0ae9fc7c7003";

    if (!API_KEY) {
        console.error("ERREUR : La variable FACEIT_API_KEY est vide !");
        return res.status(500).json({ error: "Variable d'environnement manquante" });
    }

    try {
        console.log(`Appel Faceit pour l'équipe ${TEAM_ID}...`);

        const response = await fetch(`https://open.faceit.com/data/v4/teams/${TEAM_ID}`, {
            method: 'GET',
            headers: { 
                "Authorization": `Bearer ${API_KEY}`,
                "Accept": "application/json"
            }
        });

        console.log(`Réponse Faceit reçue avec le statut : ${response.status}`);

        if (!response.ok) {
            const errorData = await response.text();
            console.error(`Faceit a renvoyé une erreur: ${errorData}`);
            return res.status(response.status).json({ error: "Erreur Faceit API" });
        }

        const data = await response.json();
        console.log("Succès ! Données envoyées au frontend.");
        return res.status(200).json(data);

    } catch (error) {
        console.error("ERREUR CRITIQUE :", error.message);
        return res.status(500).json({ error: "Crash serveur Vercel: " + error.message });
    }
}
