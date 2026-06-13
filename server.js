const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

// Stockage léger des pseudo (optionnel)
let users = new Map();

console.log("Serveur WebSocket démarré sur port", PORT);

wss.on("connection", (ws) => {
    console.log("Client connecté");

    // Quand un message arrive
    ws.on("message", (data) => {
        let msg;

        try {
            msg = JSON.parse(data);
        } catch (e) {
            return;
        }

        // 1. Enregistrement du pseudo
        if (msg.type === "join") {
            users.set(ws, msg.name || "Anonyme");

            broadcast({
                type: "system",
                message: `${msg.name || "Anonyme"} a rejoint le chat`
            });
        }

        // 2. Message chat
        if (msg.type === "chat") {
            const name = users.get(ws) || "Anonyme";

            broadcast({
                type: "chat",
                name: name,
                message: msg.message
            });
        }
    });

    // Déconnexion
    ws.on("close", () => {
        const name = users.get(ws);
        users.delete(ws);

        if (name) {
            broadcast({
                type: "system",
                message: `${name} a quitté le chat`
            });
        }
    });
});

// Fonction broadcast (groupe unique)
function broadcast(data) {
    const json = JSON.stringify(data);

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(json);
        }
    });
}
