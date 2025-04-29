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
    console.log(
        "\x1b[42m\x1b[30m SUCCESS \x1b[0m \x1b[32m[%s]\x1b[0m %s",
        timestamp,
        message,
    );
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
        if (!token) {
            throw new Error("Falha ao obter token do SharePoint");
        }

        const erpToken = await getERPToken();
        if (!erpToken) {
            throw new Error("Falha ao obter token do ERP");
        }

        const file = req.file;
        if (!file) {
            throw new Error("Nenhum arquivo foi enviado");
        }

        const docType = req.body.docType;
        if (!docType) {
            throw new Error("Tipo de documento não especificado");
        }

        let folderPath = req.query.folder || "";
        if (!folderPath) {
            throw new Error("Caminho da pasta não especificado");
        }

        // Check if this is a worker or equipment document being uploaded to wrong folder
        const workerDocs = [
            "Cartão de Cidadão ou residência",
            "Ficha Médica de aptidão",
            "Credenciação do trabalhador",
            "Trabalhos especializados",
            "Ficha de distribuição de EPI",
        ];

        const equipmentDocs = [
            "Certificado CE",
            "Certificado ou Declaração",
            "Registos de Manutenção",
            "Manual de utilizador",
            "Seguro",
        ];

        if (workerDocs.includes(docType) && folderPath.includes("/Empresa")) {
            // Redirect to worker folder
            folderPath = folderPath.replace("/Empresa", "/Trabalhadores");
            console.log(
                "Redirecionando documento de trabalhador para:",
                folderPath,
            );
        } else if (
            equipmentDocs.includes(docType) &&
            folderPath.includes("/Empresa")
        ) {
            // Redirect to equipment folder
            folderPath = folderPath.replace("/Empresa", "/Equipamentos");
            console.log(
                "Redirecionando documento de equipamento para:",
                folderPath,
            );
        }

        const { idEntidade, validade, contribuinte, marca } =
            req.body;

      /*  console.log("📤 Upload iniciado:");
        console.log("- Cliente folderPath:", folderPath);
        console.log("- Tipo de documento:", docType);
        console.log("- Ficheiro original:", file.originalname);
        console.log("- ID Entidade:", idEntidade);
        console.log("- Validade:", validade);
        console.log("- contribuinte:", contribuinte);
        console.log("- Marca/Modelo:", marca);*/
        // Log equipment data if present

        const renamedFileName = `${docType}.txt`;
        const renamedFilePath = `uploads/${renamedFileName}`;

        fs.renameSync(file.path, renamedFilePath);
        const fileStream = fs.createReadStream(renamedFilePath);

        // Add equipment subfolder to the path if equipment document
        if (equipmentDocs.includes(docType) && marca) {
            folderPath = `${folderPath}/${marca}`;
        }


        const uploadUrl = `https://graph.microsoft.com/v1.0/sites/${process.env.SITE_ID}/drive/root:/${folderPath}/${renamedFileName}:/content`;

       // console.log("- Upload para o SharePoint em:", uploadUrl);

        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                await axios.put(uploadUrl, fileStream, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/octet-stream",
                        "If-None-Match": "*", // Previne conflitos de ETag
                    },
                });
                break;
            } catch (uploadError) {
                if (
                    uploadError.response?.data?.error?.code ===
                    "resourceModified" &&
                    retryCount < maxRetries - 1
                ) {
                    console.log(
                        `Tentativa ${retryCount + 1} falhou, tentando novamente...`,
                    );
                    retryCount++;
                    // Reabrir o stream para nova tentativa
                    fileStream.destroy();
                    fileStream = fs.createReadStream(renamedFilePath);
                } else {
                    throw uploadError;
                }
            }
        }

        fs.unlinkSync(renamedFilePath);
        logSuccess("Upload concluído e ficheiro local apagado");

        // Atualizar documento no ERP
        if (idEntidade) {
            const isWorkerDoc = folderPath.includes("/Trabalhadores");
            const isEquipmentDoc = folderPath.includes("/Equipamentos");

            console.log("isequipmentDoc", isEquipmentDoc);
            console.log("isWorkerDoc", isWorkerDoc);

            const docTypeMappingValidacoes = {
                // Documentos de Empresa
                "Certidão de não dívida às Finanças": "CDU_ValidadeFinancas",
                "Certidão de não dívida à Segurança Social":
                    "CDU_ValidadeSegSocial",
                "Folha de Remuneração Mensal à Segurança Social":
                    "CDU_FolhaPagSegSocial",
                "Comprovativo de Pagamento":
                    "CDU_ValidadeComprovativoPagamento",
                "Recibo do Seguro de Acidentes de Trabalho":
                    "CDU_ValidadeReciboSeguroAT",
                "Seguro de Responsabilidade Civil": "CDU_ValidadeSeguroRC",
                "Condições do Seguro de Acidentes de Trabalho":
                    "CDU_ValidadeSeguroAT",
                "Alvará ou Certificado de Construção ou Atividade":
                    "CDU_ValidadeAlvara",
                "Certidão Permanente": "CDU_ValidadeCertidaoPermanente",

                // Documentos de Trabalhador (apenas para pasta Trabalhadores)
                "Cartão de Cidadão ou residência": "caminho1",
                "Ficha Médica de aptidão": "caminho2",
                "Credenciação do trabalhador": "caminho3",
                "Trabalhos especializados": "caminho4",
                "Ficha de distribuição de EPI": "caminho5",

                // Documentos de Equipamento (apenas para pasta Equipamentos)
                "Certificado CE": "caminho1",
                "Certificado ou Declaração": "caminho2",
                "Registos de Manutenção": "caminho3",
                "Manual de utilizador": "caminho4",
                Seguro: "caminho5",
            };

            const docTypeMappingAnexos = {
                // Documentos de Empresa
                "Certidão de não dívida às Finanças": "CDU_anexofinancas",
                "Certidão de não dívida à Segurança Social":
                    "CDU_anexoSegSocial",
                "Folha de Remuneração Mensal à Segurança Social":
                    "CDU_AnexoFolhaPag",
                "Comprovativo de Pagamento": "CDU_anexoComprovativoPagamento",
                "Recibo do Seguro de Acidentes de Trabalho":
                    "CDU_anexoReciboSeguroAT",
                "Seguro de Responsabilidade Civil": "CDU_anexoSeguroRC",
                "Condições do Seguro de Acidentes de Trabalho":
                    "CDU_anexoSeguroAT",
                "Alvará ou Certificado de Construção ou Atividade":
                    "CDU_anexoAlvara",
                "Certidão Permanente": "CDU_anexoCertidaoPermanente",

                // Documentos de Trabalhador
                "Cartão de Cidadão ou residência": "anexo1",
                "Ficha Médica de aptidão": "anexo2",
                "Credenciação do trabalhador": "anexo3",
                "Trabalhos especializados": "anexo4",
                "Ficha de distribuição de EPI": "anexo5",

                // Documentos de Equipamento
                "Certificado CE": "anexo1",
                "Certificado ou Declaração": "anexo2",
                "Registos de Manutenção": "anexo3",
                "Manual de utilizador": "anexo4",
                Seguro: "anexo5",
            };

            const docKeyAnexos = docTypeMappingAnexos[docType];
            const docKey = docTypeMappingValidacoes[docType];

            if (docKey) {
                if (folderPath.includes("/Equipamentos")) {
                    // Use equipment update endpoint
                    console.log("Atualizando equipamento no ERP...");
                    const dataOriginal = new Date(validade);
                    let formattedValidade = "";

                    if (!isNaN(dataOriginal.getTime())) {
                        const validadeFormatada = dataOriginal.toLocaleDateString("pt-PT");
                        formattedValidade =
                            docType === "Cartão de Cidadão ou residência"
                                ? `CartaoCidadao &#40;Válido até&#58; ${validadeFormatada}&#41;`
                                : `${docType} &#40;Válido até&#58; ${validadeFormatada}&#41;`;

                        console.log("Validade formatada:", formattedValidade);
                    } else {
                        console.error("Data inválida:", validade);
                        formattedValidade =
                            docType === "Cartão de Cidadão ou residência"
                                ? "CartaoCidadao"
                                : docType;
                    }

            
                    await axios.put(
                        `http://194.65.139.112:2018/WebApi/SharePoint/UpdateEquipamento`,
                        {
                            Documento: docKey,
                            Validade: formattedValidade,
                            Anexo: docKeyAnexos,
                            Marca: marca,
                            IdEntidade: idEntidade,
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${erpToken}`,
                                "Content-Type": "application/json",
                            },
                        },
                    );
                    logSuccess("Equipamento atualizado no ERP");
                } else if (folderPath.includes("/Trabalhadores")) {
                    // Use worker update endpoint
                    console.log("Atualizando trabalhador no ERP...");
                    const dataOriginal = new Date(validade); // validade = "2025-04-23"
                    const validadeFormatada =
                        dataOriginal.toLocaleDateString("pt-PT"); // => "23/04/2025"

                    const formattedValidade =
                        docType === "Cartão de Cidadão ou residência"
                            ? `CartaoCidadao &#40;Válido até&#58; ${validadeFormatada}&#41;`
                            : `${docType} &#40;Válido até&#58; ${validadeFormatada}&#41;`;

                    await axios.put(
                        `http://194.65.139.112:2018/WebApi/SharePoint/UpdateTrabalhador`,
                        {
                            Documento: docKey,
                            Validade: formattedValidade, // com texto "Cartão Cidadão (Válido até: ...)"
                            Anexo: docKeyAnexos,
                            Contribuinte: contribuinte,
                            IdEntidade: idEntidade,
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${erpToken}`,
                                "Content-Type": "application/json",
                            },
                        },
                    );
                    logSuccess("Trabalhador atualizado no ERP");
                } else {
                    // Use company update endpoint
                    await axios.put(
                        `http://194.65.139.112:2018/WebApi/SharePoint/UpdateEntidade/${docKey}/${validade}/${docKeyAnexos}/${idEntidade}`,
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${erpToken}`,
                                "Content-Type": "application/json",
                            },
                        },
                    );
                    logSuccess("Entidade atualizada no ERP");
                }
            }
        }

        res.json({ message: "Ficheiro enviado com sucesso!" });
    } catch (err) {
        console.error("❌ Erro no upload:", err.response?.data || err.message);
        const errorMessage =
            err.response?.data?.error ||
            err.message ||
            "Erro ao fazer upload para o SharePoint";
        res.status(500).json({
            error: errorMessage,
            details: err.response?.data || err.message,
        });
    }
});

// Rota para inserir novo trabalhador
app.put("/WebApi/SharePoint/InsertTrabalhador", async (req, res) => {
    const token = await getERPToken();
    if (!token) {
        return res.status(401).json({ error: "Erro na autenticação ERP" });
    }

    const trabalhador = req.body;
    console.log(
        "Inserindo novo trabalhador:",
        JSON.stringify(trabalhador, null, 2),
    );

    try {
        console.log(
            "Fazendo requisição para o ERP em: http://194.65.139.112:2018/WebApi/SharePoint/InsertTrabalhador",
        );
        const response = await axios.put(
            `http://194.65.139.112:2018/WebApi/SharePoint/InsertTrabalhador`,
            trabalhador,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            },
        );

        if (response.data) {
            console.log("Trabalhador inserido com sucesso:", response.data);
            res.json(response.data);
        } else {
            throw new Error("Resposta vazia do ERP");
        }
    } catch (error) {
        console.error("Erro ao inserir trabalhador:", error.message);
        if (error.response) {
            console.error("Resposta do ERP:", error.response.data);
        }
        res.status(500).json({
            error: "Erro ao inserir trabalhador no ERP",
            details: error.response?.data || error.message,
            data: trabalhador,
        });
    }
});


app.put("/WebApi/SharePoint/InsertEquipamento", async (req, res) => {
    const token = await getERPToken();
    if (!token) {
        return res.status(401).json({ error: "Erro na autenticação ERP" });
    }

    const equipamento = req.body;
    console.log(
        "Inserindo novo equipamento:",
        JSON.stringify(equipamento, null, 2),
    );

    try {
        const erpUrl = "http://194.65.139.112:2018/WebApi/SharePoint/InsertEquipamento";
        console.log("Fazendo requisição para o ERP em:", erpUrl);

        const response = await axios.put(erpUrl, equipamento, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (response.data) {
            console.log("Equipamento inserido com sucesso:", response.data);
            res.json(response.data);
        } else {
            throw new Error("Resposta vazia do ERP");
        }
    } catch (error) {
        console.error("Erro ao inserir equipamento:", error.message);
        if (error.response) {
            console.error("Resposta do ERP:", error.response.data);
        }
        res.status(500).json({
            error: "Erro ao inserir equipamento no ERP",
            details: error.response?.data || error.message,
            data: equipamento,
        });
    }
});


// ------------------- LISTAGEM -------------------
// 🗂️ Documentos obrigatórios por categoria
const requiredDocsByCategory = {
    Empresa: [
        "Certidão de não dívida às Finanças",
        "Certidão Permanente",
        "Folha de Remuneração Mensal à Segurança Social",
        "Comprovativo de Pagamento",
        "Recibo do Seguro de Acidentes de Trabalho",
        "Seguro de Responsabilidade Civil",
        "Condições do Seguro de Acidentes de Trabalho",
        "Alvará ou Certificado de Construção ou Atividade",
        "Certidão de não dívida à Segurança Social",
    ],
    Trabalhadores: [
        "Cartão de Cidadão ou residência",
        "Ficha Médica de aptidão",
        "Credenciação do trabalhador",
        "Trabalhos especializados",
        "Ficha de distribuição de EPI",
    ],
    Equipamentos: [
        "Certificado CE",
        "Certificado ou Declaração",
        "Registos de Manutenção",
        "Manual de utilizador",
        "Seguro",
    ],
    Autorizações: [
        "Contrato/Nota de encomenda",
        "Horário de trabalho da empreitada",
        "Declaração de adesão ao PSS",
        "Declaração do responsável do estaleiro",
    ],
};

app.get("/files/:clienteId", async (req, res) => {
    try {
        const token = await getAccessToken();
        const clienteId = req.params.clienteId;
        const category = req.query.category || "Empresa";
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


        if (trabalhador) console.log("- Trabalhador:", trabalhador);

        const response = await axios.get(listFilesUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const filesFromSharePoint = response.data.value;
        filesFromSharePoint.forEach((file) => console.log(`- ${file.name}`));

        // Usa os documentos obrigatórios apenas se for uma categoria conhecida
        const requiredDocs = requiredDocsByCategory[category] || [];

        const files = requiredDocs.map((docName) => {
            const match = filesFromSharePoint.find((file) =>
                file.name.toLowerCase().startsWith(docName.toLowerCase()),
            );
            return {
                name: docName,
                webUrl: match ? match.webUrl : null,
                status: match ? "✅ Enviado" : "❌ Não Enviado",
            };
        });

        res.json({ files });
    } catch (err) {
        // If folder doesn't exist, return empty files array instead of error
        if (err.response?.data?.error?.code === "itemNotFound") {
            console.log("📂 Pasta não encontrada, retornando lista vazia");
            res.json({ files: [] });
            return;
        }

        console.error(
            "❌ Erro ao listar arquivos:",
            err.response?.data || err.message,
        );
        res.status(500).json({
            error: "Erro ao listar arquivos do SharePoint",
        });
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
            .filter((item) => item.folder) // só pastas (trabalhadores)
            .map((item) => item.name); // nome do trabalhador (pasta)

        res.json({ trabalhadores: subfolders });
    } catch (err) {
        console.error(
            "❌ Erro ao listar trabalhadores:",
            err.response?.data || err.message,
        );
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
            .filter((item) => item.folder)
            .map((item) => item.name);

        res.json({ equipamentos: subfolders });
    } catch (err) {
        console.error(
            "❌ Erro ao listar equipamentos:",
            err.response?.data || err.message,
        );
        res.status(500).json({ error: "Erro ao listar equipamentos" });
    }
});

// Armazenamento temporário (em produção, use um banco de dados)
let subempreiteiros = [];

app.get("/subempreiteiros", (req, res) => {
    res.json({ subempreiteiros });
});

app.post("/subempreiteiros", (req, res) => {
    const { nome, username, password, entidadeId } = req.body;
    if (!nome || !username || !password || !entidadeId) {
        return res.status(400).json({
            error: "Nome, credenciais e ID da entidade são obrigatórios",
        });
    }

    // Verifica se já existe um subempreiteiro com esse username
    if (subempreiteiros.find((s) => s.username === username)) {
        return res.status(400).json({ error: "Username já existe" });
    }

    const novoSubempreiteiro = {
        id: entidadeId,
        nome,
        username,
        password,
        dataCriacao: new Date(),
    };

    subempreiteiros.push(novoSubempreiteiro);
    console.log("Novo subempreiteiro cadastrado:", novoSubempreiteiro);
    res.status(201).json(novoSubempreiteiro);
});

app.listen(PORT, () =>
    console.log(`✅ Backend rodando em http://0.0.0.0:${PORT}`),
);
async function getERPToken() {
    try {
        console.log("==========================================");
        console.log("🚀 Iniciando autenticação no ERP...");

        const payload = new URLSearchParams({
            username: "Advir",
            password: "Code495@",
            company: "CLNJPA2",
            instance: "DEFAULT",
            line: "Professional",
            grant_type: "password",
        });

        console.log("📤 Payload de autenticação ERP montado:", Object.fromEntries(payload.entries()));

        const tokenResponse = await axios.post(
            `http://194.65.139.112:2018/WebApi/token`,
            payload,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        console.log("📥 Resposta recebida do ERP:", tokenResponse.data);

        if (tokenResponse.data.access_token) {
            console.log("✅ Token ERP obtido com sucesso!");
            console.log("🔑 Token:", tokenResponse.data.access_token);
            console.log("==========================================\n");
            return tokenResponse.data.access_token;
        } else {
            console.error(
                "\x1b[41m\x1b[37m ERRO \x1b[0m Token ERP não encontrado na resposta:", tokenResponse.data
            );
            console.log("==========================================\n");
            return null;
        }
    } catch (error) {
        console.error(
            "\x1b[41m\x1b[37m ERRO \x1b[0m Falha na autenticação ERP:",
            error.response?.data || error.message,
        );
        console.log("==========================================\n");
        return null;
    }
}


app.get("/listar-entidades", async (req, res) => {
    try {
        const token = await getERPToken();
        if (!token) {
            return res.status(401).json({ error: "Erro na autenticação ERP" });
        }

        const response = await axios.get(
            "http://194.65.139.112:2018/WebApi/SharePoint/ListarEntidadesSGS",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            },
        );

        res.json(response.data);
    } catch (error) {
        console.error("Erro ao listar entidades:", error);
        res.status(500).json({ error: "Erro ao obter entidades do ERP" });
    }
});

app.get("/entidade/:id", async (req, res) => {
    try {
        const token = await getERPToken();
        if (!token) {
            return res.status(401).json({ error: "Erro na autenticação ERP" });
        }

        const response = await axios.get(
            `http://194.65.139.112:2018/WebApi/SharePoint/GetEntidade/${req.params.id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            },
        );

        res.json(response.data);
    } catch (error) {
        console.error("Erro ao obter entidade:", error);
        res.status(500).json({
            error: "Erro ao obter dados da entidade do ERP",
        });
    }
});

app.get("/entidade/:id/trabalhadores", async (req, res) => {
    try {
        const token = await getERPToken();
        if (!token) {
            return res.status(401).json({ error: "Erro na autenticação ERP" });
        }

        console.log(`Buscando trabalhadores para entidade ${req.params.id}`);
        const response = await axios.get(
            `http://194.65.139.112:2018/WebApi/SharePoint/ListarTrabalhadores/${req.params.id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            },
        );

        if (
            !response.data ||
            !response.data.DataSet ||
            !response.data.DataSet.Table
        ) {
            console.error("Resposta inválida do ERP:", response.data);
            return res.status(500).json({ error: "Resposta inválida do ERP" });
        }
        console.log(`Buscando trabalhadores para entidade ${req.params.id}`);
        console.log(
            `Encontrados ${response.data.DataSet.Table.length} trabalhadores`,
        );
        res.json(response.data);
    } catch (error) {
        console.error(
            "Erro ao obter trabalhadores:",
            error.response?.data || error.message,
        );
        res.status(500).json({
            error: "Erro ao obter trabalhadores da entidade do ERP",
            details: error.response?.data || error.message,
        });
    }
});

// Rota para atualizar documentos da entidade
app.put(
    "/WebApi/SharePoint/UpdateEntidade/:documento/:validade/:anexo/:idEntidade",
    async (req, res) => {
        try {
            const token = await getERPToken();
            if (!token) {
                return res
                    .status(401)
                    .json({ error: "Erro na autenticação ERP" });
            }

            const { documento, validade, anexo, idEntidade } = req.params;

            // Monta o objeto de atualização com os campos dinâmicos
            const updateData = {
                [`CDU_Validade${documento}`]: validade,
                [`CDU_Anexo${anexo}`]: anexo === "true" ? true : false, // added type checking
            };

            const response = await axios.put(
                `http://194.65.139.112:2018/WebApi/SharePoint/UpdateEntidade/${idEntidade}`,
                updateData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                },
            );

            res.json(response.data);
        } catch (error) {
            console.error("Erro ao atualizar entidade:", error);
            res.status(500).json({
                error: "Erro ao atualizar entidade no ERP",
                details: error.response?.data || error.message,
            });
        }
    },
);

// Nova rota para atualizar documentos dos trabalhadores
app.put(
    "/WebApi/SharePoint/UpdateTrabalhador/:idEntidade/:documento/:validade/:anexo/:contribuinte",
    async (req, res) => {
        try {
            const token = await getERPToken();
            if (!token) {
                return res
                    .status(401)
                    .json({ error: "Erro na autenticação ERP" });
            }

            const { documento, validade, anexo, contribuinte, idEntidade } =
                req.params;

            // Monta o objeto de atualização com os campos dinâmicos
            const updateData = {
                [`CDU_Validade${documento}`]: validade,
                [`CDU_Anexo${anexo}`]: anexo === "true" ? true : false,
                Contribuinte: contribuinte,
            };

            console.log("Objeto de atualização que será enviado:");
            console.log(updateData);

            const response = await axios.put(
                `http://194.65.139.112:2018/WebApi/SharePoint/UpdateTrabalhador/${idEntidade}`,
                updateData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                },
            );

            res.json(response.data);
        } catch (error) {
            console.error("Erro ao atualizar trabalhador:", error);
            res.status(500).json({
                error: "Erro ao atualizar trabalhador no ERP",
                details: error.response?.data || error.message,
            });
        }
    },
);

// Update equipment endpoint
app.put("/WebApi/SharePoint/UpdateEquipamento", async (req, res) => {
    try {
        const token = await getERPToken();
        if (!token) {
            return res.status(401).json({ error: "Erro na autenticação ERP" });
        }

        const { Documento, Validade, Anexo, Marca, IdEntidade } = req.body;

        console.log("Atualizando equipamento:", {
            Documento,
            Validade,
            Anexo,
            Marca,
            IdEntidade,
        });

        const response = await axios.put(
            `http://194.65.139.112:2018/WebApi/SharePoint/UpdateEquipamento`,
            {
                Documento,
                Validade,
                Anexo,
                Marca,
                IdEntidade,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            },
        );

        logSuccess("Equipamento atualizado no ERP");
        res.json(response.data);
    } catch (error) {
        console.error("Erro ao atualizar equipamento:", error);
        res.status(500).json({
            error: "Erro ao atualizar equipamento no ERP",
            details: error.response?.data || error.message,
        });
    }
});

app.get("/entidade/:id/equipamentos", async (req, res) => {
    try {
        const token = await getERPToken();
        if (!token) {
            return res.status(401).json({ error: "Erro na autenticação ERP" });
        }

        console.log(`Buscando equipamentos para entidade ${req.params.id}`);
        const response = await axios.get(
            `http://194.65.139.112:2018/WebApi/SharePoint/ListarEquipamentos/${req.params.id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            },
        );

        if (
            !response.data ||
            !response.data.DataSet ||
            !response.data.DataSet.Table
        ) {
            console.error("Resposta inválida do ERP:", response.data);
            return res.status(500).json({ error: "Resposta inválida do ERP" });
        }

        console.log(
            `Encontrados ${response.data.DataSet.Table.length} equipamentos`,
        );
        res.json(response.data);
    } catch (error) {
        console.error(
            "Erro ao obter equipamentos:",
            error.response?.data || error.message,
        );
        res.status(500).json({
            error: "Erro ao obter equipamentos da entidade do ERP",
            details: error.response?.data || error.message,
        });
    }
});

app.post("/verificar-credenciais", async (req, res) => {
    const { username, password } = req.body;
    console.log("==========================================");
    console.log("🔐 Tentativa de login recebida:", { username, password });
    console.log("📋 Lista de subempreiteiros cadastrados:", subempreiteiros);

    const subempreiteiro = subempreiteiros.find(
        (s) => s.username === username && s.password === password,
    );

    if (subempreiteiro) {
        console.log(`✅ Login bem-sucedido! Usuário: ${subempreiteiro.nome} (ID: ${subempreiteiro.id})`);
        const erpToken = await getERPToken();
        console.log("🔑 ERP Token gerado para subempreiteiro:", erpToken);
        res.json({
            valid: true,
            id: subempreiteiro.id,
            nome: subempreiteiro.nome,
            erpToken,
        });
    } else {
        if (username === "admin" && password === "admin123") {
            console.log("✅ Login admin bem-sucedido!");
            const erpToken = await getERPToken();
            console.log("🔑 ERP Token gerado para admin:", erpToken);
            res.json({ valid: true, isAdmin: true, erpToken });
        } else {
            console.warn("❌ Falha no login: Credenciais inválidas para usuário:", username);
            res.json({ valid: false });
        }
    }
    console.log("==========================================\n");
});


app.delete("/subempreiteiros/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = subempreiteiros.findIndex((s) => s.id === id);

    if (index === -1) {
        return res.status(404).json({ error: "Subempreiteiro não encontrado" });
    }

    subempreiteiros.splice(index, 1);
    res.json({ message: "Subempreiteiro removido com sucesso" });
});