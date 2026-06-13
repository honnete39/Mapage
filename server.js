const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

// ⚠️ IMPORTANT: utiliser server HTTP pour Render
const server = require("http").createServer();
const wss = new WebSocket.Server({ server });

let users = new Map();

console.log("Serveur WebSocket démarré");

wss.on("connection", (ws) => {
    console.log("Client connecté");

    ws.on("message", (data) => {
        let msg;

        try {
            msg = JSON.parse(data);
        } catch (e) {
            return;
        }

        if (msg.type === "join") {
            users.set(ws, msg.name || "Anonyme");

            broadcast({
                type: "system",
                message: `${msg.name || "Anonyme"} a rejoint le chat`
            });
        }

        if (msg.type === "chat") {
            const name = users.get(ws) || "Anonyme";

            broadcast({
                type: "chat",
                name: name,
                message: msg.message
            });
        }
    });

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

function broadcast(data) {
    const json = JSON.stringify(data);

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(json);
        }
    });
}

// ⚠️ Render écoute ce server HTTP
server.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
