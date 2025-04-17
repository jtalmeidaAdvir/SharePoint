﻿// index.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();
const app = express();
app.use(express.json());
const upload = multer({ dest: "uploads/" });

app.use(cors());

const PORT = 5000;

async function getAccessToken() {
    const url = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append("client_id", process.env.CLIENT_ID);
    params.append("client_secret", process.env.CLIENT_SECRET);
    params.append("grant_type", "client_credentials");
    params.append("scope", "https://graph.microsoft.com/.default");

    const res = await axios.post(url, params);
    return res.data.access_token;
}

// ------------------- UPLOAD -------------------
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const token = await getAccessToken();
        const file = req.file;
        const docType = req.body.docType;
        const folderPath = req.query.folder || "";

        console.log("📤 Upload iniciado:");
        console.log("- Cliente folderPath:", folderPath);
        console.log("- Tipo de documento:", docType);
        console.log("- Ficheiro original:", file.originalname);

        const renamedFileName = `${docType}.txt`; // Altere a extensão conforme necessário
        const renamedFilePath = `uploads/${renamedFileName}`;

        fs.renameSync(file.path, renamedFilePath);
        const fileStream = fs.createReadStream(renamedFilePath);

        const uploadUrl = `https://graph.microsoft.com/v1.0/sites/${process.env.SITE_ID}/drive/root:/${folderPath}/${renamedFileName}:/content`;

        console.log("- Upload para o SharePoint em:", uploadUrl);

        await axios.put(uploadUrl, fileStream, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/octet-stream",
            },
        });

        fs.unlinkSync(renamedFilePath);
        console.log("✅ Upload concluído e ficheiro local apagado.");

        res.json({ message: "Ficheiro enviado com sucesso!" });
    } catch (err) {
        console.error("❌ Erro no upload:", err.response?.data || err.message);
        res.status(500).json({ error: "Erro ao fazer upload para o SharePoint" });
    }
});

// ------------------- LISTAGEM -------------------
// 🗂️ Documentos obrigatórios por categoria
const requiredDocsByCategory = {
    Empresas: [
        "Certidão de não dívida às Finanças",
        "Certidão Permanente",
        "Folha de Remuneração Mensal à Segurança Social",
        "Comprovativo de Pagamento",
        "Recibo do Seguro de Acidentes de Trabalho",
        "Seguro de Responsabilidade Civil",
        "Condições do Seguro de Acidentes de Trabalho",
        "Alvará/Certificado de Construção ou Atividade",
        "Certidão de não dívida à Segurança Social"
    ],
    Trabalhadores: [
        "Cartão de Cidadão ou residência",
        "Ficha Médica de aptidão",
        "Credenciação do trabalhador",
        "Trabalhos especializados",
        "Ficha de distribuição de EPI's"
    ],
    Equipamentos: [
        "Certificado CE",
        "Certificado/Declaração",
        "Registos de Manutenção",
        "Manual de utilizador",
        "Seguro"
    ],
    "Autorizações": [
        "Contrato/Nota de encomenda",
        "Horário de trabalho da empreitada",
        "Declaração de adesão ao PSS",
        "Declaração do responsável do estaleiro"
    ]
};

app.get("/files/:clienteId", async (req, res) => {
    try {
        const token = await getAccessToken();
        const clienteId = req.params.clienteId;
        const category = req.query.category || "Empresas";
        const trabalhador = req.query.trabalhador;

        // Montar caminho
        let folderPath = `Subempreiteiros/${encodeURIComponent(clienteId)}/${category}`;
        if (category === "Trabalhadores" && trabalhador) {
            folderPath += `/${encodeURIComponent(trabalhador)}`;
        } else if (category === "Equipamentos" && req.query.equipamento) {
            folderPath += `/${encodeURIComponent(req.query.equipamento)}`;
        } else if (category === "Autorizações" && req.query.obra) {
            folderPath += `/${encodeURIComponent(req.query.obra)}`;
        }

        const listFilesUrl = `https://graph.microsoft.com/v1.0/sites/${process.env.SITE_ID}/drive/root:/${folderPath}:/children`;

        console.log("📂 Listando arquivos para cliente:", clienteId);
        console.log("- Categoria:", category);
        if (trabalhador) console.log("- Trabalhador:", trabalhador);
        console.log("- Caminho da pasta:", folderPath);

        const response = await axios.get(listFilesUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const filesFromSharePoint = response.data.value;
        console.log("📁 Arquivos encontrados:");
        filesFromSharePoint.forEach(file => console.log(`- ${file.name}`));

        // Usa os documentos obrigatórios apenas se for uma categoria conhecida
        const requiredDocs = requiredDocsByCategory[category] || [];

        const files = requiredDocs.map(docName => {
            const match = filesFromSharePoint.find(file =>
                file.name.toLowerCase().startsWith(docName.toLowerCase())
            );
            return {
                name: docName,
                webUrl: match ? match.webUrl : null,
                status: match ? "✅ Enviado" : "❌ Não Enviado"
            };
        });

        res.json({ files });
    } catch (err) {
        console.error("❌ Erro ao listar arquivos:", err.response?.data || err.message);
        res.status(500).json({ error: "Erro ao listar arquivos do SharePoint" });
    }
});

app.get("/trabalhadores/:clienteId", async (req, res) => {
    try {
        const token = await getAccessToken();
        const clienteId = req.params.clienteId;
        const folderPath = `Subempreiteiros/${encodeURIComponent(clienteId)}/Trabalhadores`;

        const listUrl = `https://graph.microsoft.com/v1.0/sites/${process.env.SITE_ID}/drive/root:/${folderPath}:/children`;

        const response = await axios.get(listUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const subfolders = response.data.value
            .filter(item => item.folder) // só pastas (trabalhadores)
            .map(item => item.name); // nome do trabalhador (pasta)

        res.json({ trabalhadores: subfolders });
    } catch (err) {
        console.error("❌ Erro ao listar trabalhadores:", err.response?.data || err.message);
        res.status(500).json({ error: "Erro ao listar trabalhadores" });
    }
});

app.get("/equipamentos/:clienteId", async (req, res) => {
    try {
        const token = await getAccessToken();
        const clienteId = req.params.clienteId;
        const folderPath = `Subempreiteiros/${encodeURIComponent(clienteId)}/Equipamentos`;

        const listUrl = `https://graph.microsoft.com/v1.0/sites/${process.env.SITE_ID}/drive/root:/${folderPath}:/children`;

        const response = await axios.get(listUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const subfolders = response.data.value
            .filter(item => item.folder)
            .map(item => item.name);

        res.json({ equipamentos: subfolders });
    } catch (err) {
        console.error("❌ Erro ao listar equipamentos:", err.response?.data || err.message);
        res.status(500).json({ error: "Erro ao listar equipamentos" });
    }
});

// Armazenamento temporário (em produção, use um banco de dados)
let subempreiteiros = [];
let nextId = 1;

app.get('/subempreiteiros', (req, res) => {
    res.json({ subempreiteiros });
});

app.post('/subempreiteiros', (req, res) => {
    const { nome, username, password } = req.body;
    if (!nome || !username || !password) {
        return res.status(400).json({ error: 'Nome e credenciais são obrigatórios' });
    }

    const novoSubempreiteiro = {
        id: nextId++,
        nome,
        username,
        password,
        dataCriacao: new Date()
    };

    subempreiteiros.push(novoSubempreiteiro);
    res.status(201).json(novoSubempreiteiro);
});

app.listen(PORT, () => console.log(`✅ Backend rodando em http://0.0.0.0:${PORT}`));
app.post('/verificar-credenciais', (req, res) => {
    const { username, password } = req.body;
    const subempreiteiro = subempreiteiros.find(s => 
        s.username === username && s.password === password
    );
    res.json({ valid: !!subempreiteiro });
});
