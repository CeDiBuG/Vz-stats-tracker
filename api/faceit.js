// api/faceit.js
export default async function handler(req, res) {
    console.log("--- Début de la requête Faceit ---");

    const API_KEY = process.env.FACEIT_API_KEY;
    const TEAM_ID = "8cf84bd4-eaf8-4cee-95e0-0ae9fc7c7003";

    // Debug : Vérifier si la clé est présente (sans l'afficher entièrement pour la sécurité)
    if (!API_KEY) {
        console.error("ERREUR: FACEIT_API_KEY est manquante dans les variables d'environnement.");
        return res.status(500).json({ error: "Clé API manquante sur le serveur" });
    } else {
        console.log("Clé API détectée : " + API_KEY.substring(0, 5) + "...");
    }

    try {
        console.log(`Appel API Faceit pour l'équipe ${TEAM_ID}...`);
        
        const response = await fetch(`https://api.faceit.com/teams/${TEAM_ID}`, {
            headers: { 
                "Authorization": `Bearer ${API_KEY}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`ERREUR FACEIT API: Statut ${response.status} - ${errorText}`);
            return res.status(response.status).json({ error: `Faceit API Error: ${response.status}` });
        }

        const data = await response.json();
        console.log("Succès : Données récupérées !");
        
        res.status(200).json(data);

    } catch (error) {
        console.error("ERREUR CRITIQUE SERVEUR:", error.message);
        res.status(500).json({ error: "Erreur interne du serveur : " + error.message });
    }
}
