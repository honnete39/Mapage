const http = require("http");
const fs = require("fs");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    fs.readFile("index.html", (err, data) => {
        if (err) {
            res.writeHead(500);
            return res.end("Erreur serveur");
        }

        res.writeHead(200, {
            "Content-Type": "text/html"
        });

        res.end(data);
    });
});

const wss = new WebSocket.Server({ server });

let users = new Map();

// fichier de stockage léger
const FILE = "messages.json";

// charger messages existants
let messages = [];
if (fs.existsSync(FILE)) {
    try {
        messages = JSON.parse(fs.readFileSync(FILE));
    } catch {
        messages = [];
    }
}

function saveMessage(msg) {
    messages.push(msg);

    // limiter taille (important Render RAM)
    if (messages.length > 100) {
        messages.shift();
    }

    fs.writeFileSync(FILE, JSON.stringify(messages));
}

wss.on("connection", (ws) => {
    console.log("Client connecté");

    // envoyer historique
    ws.send(JSON.stringify({
        type: "history",
        messages
    }));

    ws.on("message", (data) => {
        let msg;

        try {
            msg = JSON.parse(data);
        } catch {
            return;
        }

        if (msg.type === "join") {
            users.set(ws, msg.name || "Anonyme");

            broadcast({
                type: "system",
                message: `${msg.name || "Anonyme"} a rejoint`
            });
        }

        if (msg.type === "chat") {
            const name = users.get(ws) || "Anonyme";

            const fullMsg = {
                type: "chat",
                name,
                message: msg.message,
                time: Date.now()
            };

            saveMessage(fullMsg);
            broadcast(fullMsg);
        }
    });

    ws.on("close", () => {
        const name = users.get(ws);
        users.delete(ws);

        if (name) {
            broadcast({
                type: "system",
                message: `${name} a quitté`
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

server.listen(PORT, () => {
    console.log("Server running on", PORT);
});
