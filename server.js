const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

// Serveur HTTP (OBLIGATOIRE pour Render)
const server = http.createServer();

const wss = new WebSocket.Server({ server });

let users = new Map();

wss.on("connection", (ws) => {
    console.log("Client connecté");

    ws.on("message", (data) => {
        let msg;

        try {
            msg = JSON.parse(data);
        } catch (e) {
            return;
        }

        // JOIN
        if (msg.type === "join") {
            users.set(ws, msg.name || "Anonyme");

            broadcast({
                type: "system",
                message: `${msg.name || "Anonyme"} a rejoint le chat`
            });
        }

        // CHAT
        if (msg.type === "chat") {
            const name = users.get(ws) || "Anonyme";

            broadcast({
                type: "chat",
                name,
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

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(json);
        }
    });
}

// IMPORTANT Render écoute ici
server.listen(PORT, () => {
    console.log("Server WebSocket running on port", PORT);
});
