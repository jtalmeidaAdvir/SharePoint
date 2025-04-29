import React, { useState, useEffect } from "react";
import { Nav } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import requiredDocsByCategory from "../constants/requiredDocsByCategory";
import EmpresaForm from "../components/EmpresaForm";
import TrabalhadorForm from "../components/TrabalhadorForm";
import EquipamentoForm from "../components/EquipamentoForm";
import DocumentosList from "../components/DocumentosList";
import AlertModal from "../components/AlertModal";

const UploadPage = () => {
    const { clienteId } = useParams();
    const navigate = useNavigate();

    const [entityData, setEntityData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const isAuthenticated = localStorage.getItem("uploadAuth_" + clienteId);
        if (!isAuthenticated) {
            navigate("/login?redirect=/upload/" + clienteId);
        } else {
            // Fetch entity data
            const fetchEntityData = async () => {
                setIsLoading(true);
                try {
                    const token = localStorage.getItem("token");
                    const response = await axios.get(
                        `http://localhost:5000/entidade/${clienteId}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    );
                    setEntityData(response.data.DataSet.Table[0]);
                } catch (error) {
                    console.error("Error fetching entity data:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchEntityData();
        }
    }, [clienteId, navigate]);

    const [category, setCategory] = useState("Empresas");
    const [docType, setDocType] = useState("");
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");
    const [docsStatus, setDocsStatus] = useState({});

    // Empresa
    const [nomeEmpresa, setNomeEmpresa] = useState("");
    const [sede, setSede] = useState("");
    const [nif, setNif] = useState("");
    const [validade, setValidade] = useState("");

    // Trabalhadores
    const [trabalhadoresExistentes, setTrabalhadoresExistentes] = useState([]);
    const [trabalhadorSelecionado, setTrabalhadorSelecionado] = useState("");
    const [nomeCompleto, setNomeCompleto] = useState("");
    const [funcao, setFuncao] = useState("");
    const [contribuinte, setContribuinte] = useState("");
    const [segSocial, setSegSocial] = useState("");
    const [dataNascimento, setDataNascimento] = useState("");

    // Equipamento
    const [equipamentosExistentes, setEquipamentosExistentes] = useState([]);
    const [equipamentoSelecionado, setEquipamentoSelecionado] = useState("");
    const [marcaModelo, setMarcaModelo] = useState("");
    const [tipoMaquina, setTipoMaquina] = useState("");
    const [numeroSerie, setNumeroSerie] = useState("");

    const requiredDocs = requiredDocsByCategory[category] || [];

    useEffect(() => {
        if (category === "Trabalhadores" && entityData?.EntidadeId) {
            axios
                .get(
                    `http://localhost:5000/entidade/${clienteId}/trabalhadores`,
                )
                .then((res) =>
                    setTrabalhadoresExistentes(res.data.DataSet.Table),
                )
                .catch((err) =>
                    console.error("Erro ao buscar trabalhadores:", err),
                );
        } else if (category === "Equipamentos" && entityData?.EntidadeId) {
            axios
                .get(`http://localhost:5000/entidade/${clienteId}/equipamentos`)
                .then((res) =>
                    setEquipamentosExistentes(res.data.DataSet.Table),
                )
                .catch((err) =>
                    console.error("Erro ao buscar equipamentos:", err),
                );
        }
    }, [category, entityData]);

    useEffect(() => {
        const handleResetDocsStatus = (event) => {
            setDocsStatus(event.detail);
        };

        window.addEventListener("resetDocsStatus", handleResetDocsStatus);

        if (
            entityData?.Nome &&
            ((category !== "Trabalhadores" &&
                category !== "Equipamentos" &&
                category !== "Autorizações") ||
                nomeCompleto ||
                trabalhadorSelecionado ||
                marcaModelo ||
                equipamentoSelecionado)
        ) {
            fetchDocsStatus();
        }

        return () => {
            window.removeEventListener(
                "resetDocsStatus",
                handleResetDocsStatus,
            );
        };
    }, [
        entityData,
        category,
        nomeCompleto,
        trabalhadorSelecionado,
        marcaModelo,
        equipamentoSelecionado,
    ]);

    const fetchDocsStatus = async () => {
        try {
            console.log("🔁 fetchDocsStatus chamado!");
            let endpoint = `http://localhost:5000/files/${entityData?.Nome}?category=${category}`;

            if (category === "Trabalhadores") {
                const nome = trabalhadorSelecionado || nomeCompleto;
                if (!nome) return;
                endpoint += `&trabalhador=${encodeURIComponent(nome)}`;
            } else if (category === "Equipamentos") {
                const nomeEquip = equipamentoSelecionado || marcaModelo;
                if (!nomeEquip) return;
                endpoint += `&equipamento=${encodeURIComponent(nomeEquip)}`;
            }

            const res = await axios.get(endpoint);
            const docsMap = {};

            // Initialize all required docs as not sent
            requiredDocs.forEach((doc) => {
                docsMap[doc] = "❌ Não enviado";
            });

            // Update with existing files if any
            if (res.data.files && Array.isArray(res.data.files)) {
                res.data.files.forEach((doc) => {
                    docsMap[doc.name] = doc.status;
                });
            }

            // Mapear campos de anexos adicionais do entityData
            if (entityData) {
                const anexos = {
                    CDU_AnexoFinancas: "Certidão de não dívida às Finanças",
                    CDU_AnexoSegSocial:
                        "Certidão de não dívida à Segurança Social",
                    CDU_AnexoCertidaoPermanente: "Certidão Permanente",
                    CDU_AnexoFolhaPag:
                        "Folha de Remuneração Mensal à Segurança Social",
                    CDU_AnexoComprovativoPagamento: "Comprovativo de Pagamento",
                    CDU_AnexoAlvara:
                        "Alvará ou Certificado de Construção ou Atividade",
                    CDU_AnexoSeguroRC: "Seguro de Responsabilidade Civil",
                    CDU_AnexoReciboSeguroAT:
                        "Recibo do Seguro de Acidentes de Trabalho",
                    CDU_AnexoSeguroAT:
                        "Condições do Seguro de Acidentes de Trabalho",
                };

                for (const [key, label] of Object.entries(anexos)) {
                    if (entityData[key]) {
                        docsMap[label] = "✅ Enviado";
                    }
                }

                // Verificar anexos específicos do trabalhador, se categoria for Trabalhadores
                if (category === "Trabalhadores") {
                    const trabalhador = trabalhadoresExistentes.find(
                        (t) => t.nome === trabalhadorSelecionado,
                    );

                    if (trabalhador) {
                        const anexosTrabalhador = {
                            anexo1: "Cartão de Cidadão ou residência",
                            anexo2: "Ficha Médica de aptidão",
                            anexo3: "Credenciação do trabalhador",
                            anexo4: "Trabalhos especializados",
                            anexo5: "Ficha de distribuição de EPI",
                        };

                        for (const [key, label] of Object.entries(
                            anexosTrabalhador,
                        )) {
                            if (trabalhador[key] === true) {
                                docsMap[label] = "✅ Enviado";
                            }
                            // Se for false ou undefined, ignora (não adiciona no docsMap)
                        }
                    }
                }

                // Verificar anexos específicos do equipamento
                if (category === "Equipamentos") {
                    const equipamento = equipamentosExistentes.find(
                        (e) => e.marca_modelo === equipamentoSelecionado,
                    );

                    if (equipamento) {
                        const anexosEquipamento = {
                            anexo1: "Certificado CE",
                            anexo2: "Certificado ou Declaração",
                            anexo3: "Registos de Manutenção",
                            anexo4: "Manual de utilizador",
                            anexo5: "Seguro",
                        };

                        for (const [key, label] of Object.entries(
                            anexosEquipamento,
                        )) {
                            const sharePointStatus = docsMap[label]?.includes(
                                "SharePoint",
                            )
                                ? "✅ SharePoint: Sim"
                                : "❌ SharePoint: Não";
                            const anexoStatus =
                                equipamento[key] === true
                                    ? "✅ Sistema: Sim"
                                    : "❌ Sistema: Não";
                            docsMap[label] =
                                `${sharePointStatus} | ${anexoStatus}`;
                        }
                    }
                }
            }

            setDocsStatus(docsMap);
        } catch (err) {
            console.error("Erro ao buscar documentos:", err);
            // Não mostra mensagem de erro, apenas limpa o status dos documentos
            setDocsStatus({});
        }
    };

    const [showModal, setShowModal] = useState(false);
    const [tempValidade, setTempValidade] = useState("");

    const [alertModal, setAlertModal] = useState({
        show: false,
        message: "",
        type: "warning",
    });

    const showAlert = (message, type = "warning") => {
        setAlertModal({ show: true, message, type });
    };

    const handleUpload = async () => {
        if (!file) {
            showAlert("Por favor selecione um arquivo para upload");
            return;
        }
        if (!docType) {
            showAlert("Por favor selecione o tipo de documento");
            return;
        }

        if (
            category === "Equipamentos" &&
            !marcaModelo &&
            !equipamentoSelecionado
        ) {
            showAlert(
                "Por favor, selecione um equipamento existente ou insira a marca/modelo do novo equipamento",
            );
            return;
        }

        if (
            category === "Empresas" ||
            (category === "Equipamentos" && docType === "Seguro") ||
            category === "Trabalhadores"
        ) {
            setShowModal(true);
            return;
        }

        const nomeFinal =
            category === "Trabalhadores"
                ? trabalhadorSelecionado || nomeCompleto
                : null;
        if (category === "Trabalhadores" && !nomeFinal)
            return showAlert("Selecione ou digite o nome do trabalhador");

        const renamedFile = new File([file], `${docType}`, { type: file.type });
        const formData = new FormData();
        formData.append("file", renamedFile);
        formData.append("docType", docType);

        // Dados adicionais por categoria
        if (category === "Empresas") {
            formData.append("nomeEmpresa", nomeEmpresa);
            formData.append("sede", sede);
            formData.append("nif", nif);
            formData.append("validade", validade);
        } else if (category === "Trabalhadores") {
            formData.append("nomeCompleto", nomeFinal);
            formData.append("funcao", funcao);
            formData.append("contribuinte", contribuinte);
            formData.append("segSocial", segSocial);
            formData.append("dataNascimento", dataNascimento);
        } else if (category === "Equipamentos") {
            formData.append("marcaModelo", marcaModelo);
            formData.append("tipoMaquina", tipoMaquina);
            formData.append("numeroSerie", numeroSerie);
        }

        try {
            setMessage("A enviar...");
            const folderPath =
                category === "Trabalhadores"
                    ? `Subempreiteiros/${entityData?.Nome}/Trabalhadores/${nomeFinal}`
                    : category === "Equipamentos"
                        ? `Subempreiteiros/${entityData?.Nome}/Equipamentos/${equipamentoSelecionado || marcaModelo}`
                        : `Subempreiteiros/${entityData?.Nome}/${category}`;

            const res = await axios.post(
                `http://localhost:5000/upload?folder=${encodeURIComponent(folderPath)}`,
                formData,
            );

            setMessage("✅ " + res.data.message);
            fetchDocsStatus();
        } catch (err) {
            console.error(err);
            setMessage(
                "❌ Erro: " + (err.response?.data?.error || err.message),
            );
        }
    };

    const handleConfirmUpload = () => {
        if (!tempValidade) {
            showAlert("Por favor, insira a data de validade do documento");
            return;
        }
        setValidade(tempValidade);
        setShowModal(false);
        proceedWithUpload();
    };

    const proceedWithUpload = async () => {
        const nomeFinal =
            category === "Trabalhadores"
                ? trabalhadorSelecionado || nomeCompleto
                : null;
        if (category === "Trabalhadores" && !nomeFinal)
            return showAlert("Selecione ou digite o nome do trabalhador");

        const renamedFile = new File([file], `${docType}`, { type: file.type });
        const formData = new FormData();
        formData.append("file", renamedFile);
        formData.append("docType", docType);

        if (category === "Empresas") {
            formData.append("nomeEmpresa", nomeEmpresa);
            formData.append("sede", sede);
            formData.append("nif", nif);
            formData.append("validade", validade);
        } else if (category === "Trabalhadores") {
            formData.append("nomeCompleto", nomeFinal);
            formData.append("funcao", funcao);
            formData.append("contribuinte", contribuinte);
            formData.append("segSocial", segSocial);
            formData.append("dataNascimento", dataNascimento);
        } else if (category === "Equipamentos") {
            formData.append("marcaModelo", marcaModelo);
            formData.append("tipoMaquina", tipoMaquina);
            formData.append("numeroSerie", numeroSerie);
        }

        try {
            setMessage("A enviar...");
            const folderPath =
                category === "Trabalhadores"
                    ? `Subempreiteiros/${entityData?.Nome}/Trabalhadores/${nomeFinal}`
                    : category === "Equipamentos"
                        ? `Subempreiteiros/${entityData?.Nome}/Equipamentos/${equipamentoSelecionado || marcaModelo}`
                        : `Subempreiteiros/${entityData?.Nome}/${category}`;

            const res = await axios.post(
                `http://localhost:5000/upload?folder=${encodeURIComponent(folderPath)}`,
                formData,
            );
            setMessage("✅ " + res.data.message);
            fetchDocsStatus();
        } catch (err) {
            console.error(err);
            setMessage(
                "❌ Erro: " + (err.response?.data?.error || err.message),
            );
        }
    };

    if (isLoading) {
        return (
            <div className="container mt-4 text-center">
                <div
                    className="spinner-border text-primary"
                    role="status"
                    style={{ width: "3rem", height: "3rem" }}
                >
                    <span className="visually-hidden">A carregar...</span>
                </div>
                <p className="mt-3">A carregar informações...</p>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <AlertModal
                show={alertModal.show}
                message={alertModal.message}
                type={alertModal.type}
                onClose={() =>
                    setAlertModal({ show: false, message: "", type: "warning" })
                }
            />
            {showModal && (
                <div
                    className="modal"
                    style={{
                        display: "block",
                        backgroundColor: "rgba(0,0,0,0.5)",
                    }}
                >
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Insira a Validade do Documento {category}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <input
                                    type="date"
                                    className="form-control"
                                    value={tempValidade}
                                    onChange={(e) =>
                                        setTempValidade(e.target.value)
                                    }
                                />
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleConfirmUpload}
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="header-container bg-gradient p-4 rounded-lg shadow-lg mb-4 animate__animated animate__fadeInDown">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h2 className="text-dark mb-0">
                            <i className="bi bi-cloud-upload me-2"></i>
                            Envio de Documentos
                        </h2>
                        <p className="text-dark mb-0">
                            {entityData?.Nome || `Subempreiteiro ${entityData?.Nome}`}
                        </p>
                    </div>

                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-warning btn-lg"
                            onClick={() => navigate("/documentos-caducados")}
                        >
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Documentos Caducados
                        </button>
                        <button
                            className="btn btn-light btn-lg"
                            onClick={() => {
                                localStorage.removeItem(
                                    "uploadAuth_" + entityData?.Nome,
                                );
                                localStorage.removeItem("isAuthenticated");
                                localStorage.removeItem("authExpiration");
                                navigate("/login");
                            }}
                        >
                            <i className="bi bi-box-arrow-right me-2"></i>
                            Terminar Sessão
                        </button>
                    </div>
                </div>
            </div>

            <div className="card p-4 mb-4">
                <div className="form-group">
                    <Nav
                        variant="pills"
                        className="mb-4 bg-light p-2 rounded-pill shadow-sm"
                        activeKey={category}
                        onSelect={(k) => setCategory(k)}
                    >
                        {Object.keys(requiredDocsByCategory).map((cat, idx) => (
                            <Nav.Item key={idx} className="mx-1">
                                <Nav.Link
                                    eventKey={cat}
                                    className={`rounded-pill ${category === cat ? "active shadow-sm" : ""}`}
                                >
                                    <i
                                        className={`bi bi-${cat === "Empresas"
                                                ? "building"
                                                : cat === "Trabalhadores"
                                                    ? "person"
                                                    : cat === "Equipamentos"
                                                        ? "tools"
                                                        : "file-earmark"
                                            } me-2`}
                                    ></i>
                                    {cat}
                                </Nav.Link>
                            </Nav.Item>
                        ))}
                    </Nav>

                    {/* Campos dinâmicos */}
                    {category === "Empresas" && (
                        <EmpresaForm
                            nomeEmpresa={nomeEmpresa}
                            sede={sede}
                            nif={nif}
                            setNomeEmpresa={setNomeEmpresa}
                            setSede={setSede}
                            setNif={setNif}
                            validade={validade}
                            setValidade={setValidade}
                            entityData={entityData}
                        />
                    )}

                    {category === "Trabalhadores" && (
                        <TrabalhadorForm
                            nomeCompleto={nomeCompleto}
                            setNomeCompleto={setNomeCompleto}
                            funcao={funcao}
                            setFuncao={setFuncao}
                            contribuinte={contribuinte}
                            setContribuinte={setContribuinte}
                            segSocial={segSocial}
                            setSegSocial={setSegSocial}
                            dataNascimento={dataNascimento}
                            setDataNascimento={setDataNascimento}
                            trabalhadoresExistentes={trabalhadoresExistentes}
                            trabalhadorSelecionado={trabalhadorSelecionado}
                            setTrabalhadorSelecionado={
                                setTrabalhadorSelecionado
                            }
                            entityid={clienteId}
                        />
                    )}

                    {category === "Equipamentos" && (
                        <EquipamentoForm
                            equipamentosExistentes={equipamentosExistentes}
                            equipamentoSelecionado={equipamentoSelecionado}
                            setEquipamentoSelecionado={
                                setEquipamentoSelecionado
                            }
                            marcaModelo={marcaModelo}
                            setMarcaModelo={setMarcaModelo}
                            tipoMaquina={tipoMaquina}
                            setTipoMaquina={setTipoMaquina}
                            numeroSerie={numeroSerie}
                            setNumeroSerie={setNumeroSerie}
                            entityid={clienteId}
                        />
                    )}

                    <div>
                        <p>{message}</p>

                        {((category !== "Trabalhadores" &&
                            category !== "Equipamentos") ||
                            (category === "Trabalhadores" &&
                                trabalhadorSelecionado) ||
                            (category === "Equipamentos" &&
                                equipamentoSelecionado)) && (
                            <DocumentosList
                                onRefresh={fetchDocsStatus}
                                    onUpload={(
                                        selectedDocType,
                                        selectedFile,
                                        newStatus,
                                    ) => {
                                        setDocType(selectedDocType);
                                        setFile(selectedFile);

                                        const formData = new FormData();
                                        formData.append("file", selectedFile);
                                        formData.append("docType", selectedDocType);
                                        formData.append(
                                            "idEntidade",
                                            entityData?.Id,
                                        );
                                        formData.append("marca", "teste30");
                                        const selectedWorker =
                                            trabalhadoresExistentes.find(
                                                (t) =>
                                                    t.nome ===
                                                    trabalhadorSelecionado,
                                            );
                                        if (
                                            category === "Trabalhadores" &&
                                            selectedWorker
                                        ) {
                                            formData.append(
                                                "validade",
                                                selectedWorker.data_validade ||
                                                new Date()
                                                    .toISOString()
                                                    .split("T")[0],
                                            );
                                        }

                                        const selectedEquipment =
                                            equipamentosExistentes.find(
                                                (e) =>
                                                    e.marca_modelo ===
                                                    equipamentoSelecionado,
                                            );
                                        if (
                                            category === "Equipamentos" &&
                                            selectedEquipment
                                        ) {
                                        }
                                        console.log("Iniciando upload:", {
                                            selectedDocType,
                                            selectedFileName: selectedFile.name,
                                            category,
                                            entityData: entityData?.Nome,
                                            selectedEquipment,
                                        });
                                        console.log("FormData criado com sucesso");

                                        const folderPath =
                                            category === "Trabalhadores"
                                                ? `Subempreiteiros/${entityData?.Nome}/Trabalhadores/${trabalhadorSelecionado || nomeCompleto}`
                                                : category === "Equipamentos"
                                                    ? `Subempreiteiros/${entityData?.Nome}/Equipamentos/${equipamentoSelecionado || marcaModelo}`
                                                    : `Subempreiteiros/${entityData?.Nome}/${category}`;

                                        console.log("Enviando para:", folderPath);

                                        axios
                                            .post(
                                                `http://localhost:5000/upload?folder=${encodeURIComponent(folderPath)}`,
                                                formData,
                                            )
                                            .then((res) => {
                                                console.log(
                                                    "Resposta do servidor:",
                                                    res.data,
                                                );
                                                setMessage(
                                                    "✅ " + res.data.message,
                                                );
                                                if (
                                                    newStatus &&
                                                    Object.keys(newStatus).length >
                                                    0
                                                ) {
                                                    setDocsStatus(newStatus);
                                                } else {
                                                    fetchDocsStatus();
                                                }
                                            })
                                            .catch((err) => {
                                                console.error(err);
                                                setMessage(
                                                    "❌ Erro: " +
                                                    (err.response?.data
                                                        ?.error || err.message),
                                                );
                                            });
                                    }}
                                    requiredDocs={requiredDocs}
                                    docsStatus={docsStatus}
                                    entityData={entityData}
                                    selectedWorker={
                                        category === "Trabalhadores"
                                            ? trabalhadoresExistentes.find(
                                                (t) =>
                                                    t.nome ===
                                                    trabalhadorSelecionado,
                                            )
                                            : null
                                    }
                                    selectedEquipment={
                                        category === "Equipamentos"
                                            ? equipamentosExistentes.find(
                                                (e) =>
                                                    e.marca_modelo ===
                                                    equipamentoSelecionado,
                                            )
                                            : null
                                    }
                                marca={marcaModelo}
                                validade={validade}
                                setValidade={setValidade}
                                />
                            )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadPage;
