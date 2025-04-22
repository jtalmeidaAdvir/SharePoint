// index.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const dotenv = require("dotenv");
const fs = require("fs");

// Função para mensagens de sucesso no console
const logSuccess = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log('\x1b[42m\x1b[30m SUCCESS \x1b[0m \x1b[32m[%s]\x1b[0m %s', timestamp, message);
};

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
        logSuccess("Upload concluído e ficheiro local apagado");

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
        "Alvará ou Certificado de Construção ou Atividade",
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
        "Certificado ou Declaração",
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
    const { nome, username, password, entidadeId } = req.body;
    if (!nome || !username || !password || !entidadeId) {
        return res.status(400).json({ error: 'Nome, credenciais e ID da entidade são obrigatórios' });
    }

    // Verifica se já existe um subempreiteiro com esse username
    if (subempreiteiros.find(s => s.username === username)) {
        return res.status(400).json({ error: 'Username já existe' });
    }

    const novoSubempreiteiro = {
        id: entidadeId,
        nome,
        username,
        password,
        dataCriacao: new Date()
    };

    subempreiteiros.push(novoSubempreiteiro);
    console.log('Novo subempreiteiro cadastrado:', novoSubempreiteiro);
    res.status(201).json(novoSubempreiteiro);
});

app.listen(PORT, () => console.log(`✅ Backend rodando em http://0.0.0.0:${PORT}`));
async function getERPToken() {
    try {
        logSuccess("Iniciando autenticação no ERP");
        //194.65.139.112 - JPA
        //localhost - Advir
        const tokenResponse = await axios.post(`http://localhost:2018/WebApi/token`, new URLSearchParams({
            username: 'jtalm',
            password: '123',
            company: 'JPA',
            instance: 'DEFAULT',
            line: 'Evolution',
            grant_type: 'password'
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (tokenResponse.data.access_token) {
            logSuccess("Token ERP obtido com sucesso");
            return tokenResponse.data.access_token;
        } else {
            console.error('\x1b[41m\x1b[37m ERRO \x1b[0m Token ERP não encontrado na resposta');
            return null;
        }
    } catch (error) {
        console.error('\x1b[41m\x1b[37m ERRO \x1b[0m Falha na autenticação ERP:', error.response?.data || error.message);
        return null;
    }
}
app.get('/listar-entidades', async (req, res) => {
    try {
        const token = await getERPToken();
        if (!token) {
            return res.status(401).json({ error: 'Erro na autenticação ERP' });
        }

        const response = await axios.get('http://localhost:2018/WebApi/SharePoint/ListarEntidadesSGS', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Erro ao listar entidades:', error);
        res.status(500).json({ error: 'Erro ao obter entidades do ERP' });
    }
});

app.get('/entidade/:id', async (req, res) => {
    try {
        const token = await getERPToken();
        if (!token) {
            return res.status(401).json({ error: 'Erro na autenticação ERP' });
        }

        const response = await axios.get(`http://localhost:2018/WebApi/SharePoint/GetEntidade/${req.params.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Erro ao obter entidade:', error);
        res.status(500).json({ error: 'Erro ao obter dados da entidade do ERP' });
    }
});

app.get('/entidade/:id/trabalhadores', async (req, res) => {
    try {
        const token = await getERPToken();
        if (!token) {
            return res.status(401).json({ error: 'Erro na autenticação ERP' });
        }

        console.log(`Buscando trabalhadores para entidade ${req.params.id}`);
        const response = await axios.get(`http://localhost:2018/WebApi/SharePoint/ListarTrabalhadores/${req.params.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.data || !response.data.DataSet || !response.data.DataSet.Table) {
            console.error('Resposta inválida do ERP:', response.data);
            return res.status(500).json({ error: 'Resposta inválida do ERP' });
        }
        console.log(`Buscando trabalhadores para entidade ${req.params.id}`);
        console.log(`Encontrados ${response.data.DataSet.Table.length} trabalhadores`);
        res.json(response.data);
    } catch (error) {
        console.error('Erro ao obter trabalhadores:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Erro ao obter trabalhadores da entidade do ERP',
            details: error.response?.data || error.message
        });
    }
});

app.get('/entidade/:id/equipamentos', async (req, res) => {
    try {
        const token = await getERPToken();
        if (!token) {
            return res.status(401).json({ error: 'Erro na autenticação ERP' });
        }

        console.log(`Buscando equipamentos para entidade ${req.params.id}`);
        const response = await axios.get(`http://localhost:2018/WebApi/SharePoint/ListarEquipamentos/${req.params.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.data || !response.data.DataSet || !response.data.DataSet.Table) {
            console.error('Resposta inválida do ERP:', response.data);
            return res.status(500).json({ error: 'Resposta inválida do ERP' });
        }

        console.log(`Encontrados ${response.data.DataSet.Table.length} equipamentos`);
        res.json(response.data);
    } catch (error) {
        console.error('Erro ao obter equipamentos:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Erro ao obter equipamentos da entidade do ERP',
            details: error.response?.data || error.message
        });
    }
});

app.post('/verificar-credenciais', async (req, res) => {
    const { username, password } = req.body;
    console.log('Tentativa de login:', { username, password });
    console.log('Subempreiteiros cadastrados:', subempreiteiros);

    const subempreiteiro = subempreiteiros.find(s =>
        s.username === username && s.password === password
    );

    if (subempreiteiro) {
        const erpToken = await getERPToken();
        console.log('Login bem sucedido para:', subempreiteiro.nome);
        res.json({
            valid: true,
            id: subempreiteiro.id,
            nome: subempreiteiro.nome,
            erpToken
        });
    } else {
        if (username === 'admin' && password === 'admin123') {
            const erpToken = await getERPToken();
            console.log('Login admin bem sucedido');
            res.json({ valid: true, isAdmin: true, erpToken });
        } else {
            console.log('Login falhou');
            res.json({ valid: false });
        }
    }
});

app.delete('/subempreiteiros/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = subempreiteiros.findIndex(s => s.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Subempreiteiro não encontrado' });
    }

    subempreiteiros.splice(index, 1);
    res.json({ message: 'Subempreiteiro removido com sucesso' });
});