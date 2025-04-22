import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import requiredDocsByCategory from "../constants/requiredDocsByCategory";
import EmpresaForm from "../components/EmpresaForm";
import TrabalhadorForm from "../components/TrabalhadorForm";
import EquipamentoForm from "../components/EquipamentoForm";
import AutorizacaoForm from "../components/AutorizacaoForm";
import DocumentosSelector from "../components/DocumentosSelector";
import FileUploader from "../components/FileUploader";
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
                    console.log(
                        "Entity Data:",
                        response.data.DataSet.Table[0].Nome,
                    );
                    console.log("entidades:", response.data.DataSet);
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

    // Autorizações
    const obrasDisponiveis = ["Obra A", "Obra B", "Obra C"];
    const [obraSelecionada, setObraSelecionada] = useState("");
    const [dataEntrada, setDataEntrada] = useState("");
    const [dataSaida, setDataSaida] = useState("");

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

        window.addEventListener('resetDocsStatus', handleResetDocsStatus);

        if (
            entityData?.Nome &&
            ((category !== "Trabalhadores" &&
                category !== "Equipamentos" &&
                category !== "Autorizações") ||
                nomeCompleto ||
                trabalhadorSelecionado ||
                marcaModelo ||
                equipamentoSelecionado ||
                obraSelecionada)
        ) {
            fetchDocsStatus();
        }

        return () => {
            window.removeEventListener('resetDocsStatus', handleResetDocsStatus);
        };
    }, [
        entityData,
        category,
        nomeCompleto,
        trabalhadorSelecionado,
        marcaModelo,
        equipamentoSelecionado,
        obraSelecionada,
    ]);

    const fetchDocsStatus = async () => {
        try {
            let endpoint = `http://localhost:5000/files/${entityData?.Nome}?category=${category}`;
            if (category === "Trabalhadores") {
                const nome = trabalhadorSelecionado || nomeCompleto;
                if (!nome) return;
                endpoint += `&trabalhador=${encodeURIComponent(nome)}`;
            } else if (category === "Equipamentos") {
                const nomeEquip = equipamentoSelecionado || marcaModelo;
                if (!nomeEquip) return;
                endpoint += `&equipamento=${encodeURIComponent(nomeEquip)}`;
            } else if (category === "Autorizações" && obraSelecionada) {
                endpoint += `&obra=${encodeURIComponent(obraSelecionada)}`;
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

            console.log(
                trabalhadoresExistentes,
                equipamentosExistentes,
                docsMap,
            ); // Debugging log)

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
                    CDU_AnexoReciboSeguroAT:
                        "Condições do Seguro de Acidentes de Trabalho",
                    CDU_AnexoSeguroAT: "Seguro de Acidentes de Trabalho",
                    CDU_AnexoAlvara:
                        "Alvará ou Certificado de Construção ou Atividade",
                };

                for (const [key, label] of Object.entries(anexos)) {
                    if (entityData[key] !== undefined) {
                        const status =
                            entityData[key] === 1
                                ? "✅ Enviado"
                                : "❌ Não enviado";
                        docsMap[label] = status;
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
                        (e) => e.marca_modelo === equipamentoSelecionado
                    );

                    if (equipamento) {
                        const anexosEquipamento = {
                            anexo1: "Certificado CE",
                            anexo2: "Certificado ou Declaração",
                            anexo3: "Registos de Manutenção",
                            anexo4: "Manual de utilizador",
                            anexo5: "Seguro"
                        };

                        for (const [key, label] of Object.entries(anexosEquipamento)) {
                            const sharePointStatus = docsMap[label]?.includes('SharePoint') ? '✅ SharePoint: Sim' : '❌ SharePoint: Não';
                            const anexoStatus = equipamento[key] === true ? '✅ Sistema: Sim' : '❌ Sistema: Não';
                            docsMap[label] = `${sharePointStatus} | ${anexoStatus}`;
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
        if (!file || !docType) {
            showAlert("Selecione um ficheiro e o tipo de documento");
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
            return alert("Selecione ou digite o nome do trabalhador");

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
        } else if (category === "Autorizações") {
            formData.append("obra", obraSelecionada);
            formData.append("dataEntrada", dataEntrada);
            if (dataSaida) formData.append("dataSaida", dataSaida);
        }

        try {
            setMessage("A enviar...");
            const folderPath =
                category === "Trabalhadores"
                    ? `Subempreiteiros/${entityData?.Nome}/Trabalhadores/${nomeFinal}`
                    : category === "Equipamentos"
                        ? `Subempreiteiros/${entityData?.Nome}/Equipamentos/${equipamentoSelecionado || marcaModelo}`
                        : category === "Autorizações"
                            ? `Subempreiteiros/${entityData?.Nome}/Autorizações/${obraSelecionada}`
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
            alert("Por favor, insira a data de validade do documento");
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
            return alert("Selecione ou digite o nome do trabalhador");

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
        } else if (category === "Autorizações") {
            formData.append("obra", obraSelecionada);
            formData.append("dataEntrada", dataEntrada);
            if (dataSaida) formData.append("dataSaida", dataSaida);
        }

        try {
            setMessage("A enviar...");
            const folderPath =
                category === "Trabalhadores"
                    ? `Subempreiteiros/${entityData?.Nome}/Trabalhadores/${nomeFinal}`
                    : category === "Equipamentos"
                        ? `Subempreiteiros/${entityData?.Nome}/Equipamentos/${equipamentoSelecionado || marcaModelo}`
                        : category === "Autorizações"
                            ? `Subempreiteiros/${entityData?.Nome}/Autorizações/${obraSelecionada}`
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
                <p className="mt-3">A carregar informações da entidade...</p>
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
            <div className="bg-primary text-white p-4 rounded mb-4 d-flex justify-content-between align-items-center">
                <h2>
                    Envio de Documentos -{" "}
                    {entityData?.Nome || `Subempreiteiro ${entityData?.Nome}`}
                </h2>
                <button
                    className="btn btn-outline-light"
                    onClick={() => {
                        localStorage.removeItem(
                            "uploadAuth_" + entityData?.Nome,
                        );
                        localStorage.removeItem("isAuthenticated");
                        localStorage.removeItem("authExpiration");
                        navigate("/login");
                    }}
                >
                    <i className="bi bi-box-arrow-right"></i> Terminar Sessão
                </button>
            </div>

            <div className="card p-4 mb-4">
                <div className="form-group">
                    <label>Categoria:</label>
                    <select
                        className="form-control"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{ marginBottom: 20 }}
                    >
                        {Object.keys(requiredDocsByCategory).map((cat, idx) => (
                            <option key={idx} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>

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
                        />
                    )}

                    {category === "Autorizações" && (
                        <AutorizacaoForm
                            obrasDisponiveis={obrasDisponiveis}
                            obraSelecionada={obraSelecionada}
                            setObraSelecionada={setObraSelecionada}
                            dataEntrada={dataEntrada}
                            setDataEntrada={setDataEntrada}
                            dataSaida={dataSaida}
                            setDataSaida={setDataSaida}
                        />
                    )}

                    {/* Seleção de Documento e Upload */}
                    <DocumentosSelector
                        docType={docType}
                        setDocType={setDocType}
                        requiredDocs={requiredDocs}
                    />
                    <FileUploader
                        onFileChange={(e) => setFile(e.target.files[0])}
                        onUpload={handleUpload}
                    />

                    <p>{message}</p>

                    <DocumentosList
                        requiredDocs={requiredDocs}
                        docsStatus={docsStatus}
                    />
                </div>
            </div>
        </div>
    );
};

export default UploadPage;
