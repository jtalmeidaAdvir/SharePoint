import React, { useState, useEffect } from "react";
import axios from "axios";

const EquipamentoForm = ({
    equipamentosExistentes,
    equipamentoSelecionado,
    setEquipamentoSelecionado,
    marcaModelo,
    setMarcaModelo,
    tipoMaquina,
    setTipoMaquina,
    numeroSerie,
    setNumeroSerie,
    entityid,
}) => {
    const [mode, setMode] = useState("select");
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000); // Simula carregamento por 1 segundo
        return () => clearTimeout(timer);
    }, [equipamentosExistentes]);

    const handleEquipamentoSelect = (e) => {
        const equipamento = equipamentosExistentes.find(
            (eq) =>
                eq.marca_modelo === e.target.value || eq.marca === e.target.value
        );

        if (equipamento) {
            setEquipamentoSelecionado(equipamento.marca_modelo || equipamento.marca);
            setMarcaModelo(equipamento.marca_modelo || equipamento.marca);
            setTipoMaquina(equipamento.tipo_maquina || equipamento.tipo || "");
            setNumeroSerie(equipamento.numero_serie || equipamento.serie || "");
        }
    };

    const resetDocsStatus = () => {
        const requiredDocs = [
            "Certificado CE",
            "Certificado ou Declaração",
            "Registos de Manutenção",
            "Manual de utilizador",
            "Seguro",
        ];
        const emptyStatus = {};
        requiredDocs.forEach((doc) => {
            emptyStatus[doc] = "❌ Não enviado";
        });
        return emptyStatus;
    };

    const handleModeChange = (newMode) => {
        setMode(newMode);
        if (newMode === "create") {
            setEquipamentoSelecionado("");
            setMarcaModelo("");
            setTipoMaquina("");
            setNumeroSerie("");
            window.dispatchEvent(
                new CustomEvent("resetDocsStatus", {
                    detail: resetDocsStatus(),
                })
            );
        }
    };

    const handleSaveEquipamento = async () => {
        setIsSaving(true);
        console.log("id empresa", entityid);
        try {
            const novoEquipamento = {
                Marca: marcaModelo.trim(),
                Tipo: tipoMaquina.trim(),
                Serie: numeroSerie.trim(),
                IdEntidade: entityid,
                Caminho1: "",
                Caminho2: "",
                Caminho3: "",
                Caminho4: "",
                Caminho5: "",
                Anexo1: false,
                Anexo2: false,
                Anexo3: false,
                Anexo4: false,
                Anexo5: false,
            };

            const response = await axios.put(
                "http://51.254.116.237:5000/WebApi/SharePoint/InsertEquipamento",
                novoEquipamento,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data) {
                alert("Equipamento inserido com sucesso!");
                handleModeChange("select");
            }
        } catch (error) {
            console.error("Erro ao salvar equipamento:", error);
            const errorMsg =
                error.response?.data?.error || "Erro ao inserir equipamento";
            alert(errorMsg);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="mb-4">
            <div className="btn-group w-100 mb-3" role="group">
                <button
                    type="button"
                    className={`btn ${mode === "select" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => handleModeChange("select")}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            A carregar...
                        </>
                    ) : (
                        "Selecionar Equipamento Existente"
                    )}
                </button>
                <button
                    type="button"
                    className={`btn ${mode === "create" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => handleModeChange("create")}
                >
                    Criar Novo Equipamento
                </button>
            </div>

            {mode === "select" && !loading && equipamentosExistentes?.length === 0 && (
                <div className="alert alert-info">
                    Nenhum equipamento encontrado. Por favor, crie um novo equipamento.
                </div>
            )}

            {mode === "select" && !loading && equipamentosExistentes?.length > 0 ? (
                <div>
                    <div className="mb-3">
                        <label className="form-label">Selecione um Equipamento:</label>
                        <select
                            className="form-select"
                            value={equipamentoSelecionado}
                            onChange={handleEquipamentoSelect}
                        >
                            <option value="">Escolha um equipamento</option>
                            {equipamentosExistentes.map((equip, idx) => (
                                <option key={idx} value={equip.marca_modelo || equip.marca}>
                                    {equip.marca_modelo || equip.marca} - {equip.tipo_maquina || equip.tipo}
                                </option>
                            ))}
                        </select>
                    </div>

                    {equipamentoSelecionado && (
                        <div className="card p-3">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="card-title mb-0">Informação do Equipamento</h5>
                                <button
                                    className="btn btn-outline-primary btn-sm"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#infoEquipamento"
                                    aria-expanded="true"
                                    aria-controls="infoEquipamento"
                                >
                                    <i className="bi bi-eye"></i> Ver/Ocultar
                                </button>
                            </div>
                            <div className="collapse show" id="infoEquipamento">
                                <div className="mb-3">
                                    <label className="form-label">Marca / Modelo:</label>
                                    <input type="text" className="form-control" value={marcaModelo} disabled />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Tipo de Máquina:</label>
                                    <input type="text" className="form-control" value={tipoMaquina} disabled />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Número de Série:</label>
                                    <input type="text" className="form-control" value={numeroSerie} disabled />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : mode === "create" ? (
                <div className="card p-3">
                    <h5 className="card-title mb-3">Novo Equipamento</h5>
                    <div className="mb-3">
                        <label className="form-label">Marca / Modelo:</label>
                        <input
                            type="text"
                            className="form-control"
                            value={marcaModelo}
                            onChange={(e) => setMarcaModelo(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Tipo de Máquina:</label>
                        <input
                            type="text"
                            className="form-control"
                            value={tipoMaquina}
                            onChange={(e) => setTipoMaquina(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Número de Série:</label>
                        <input
                            type="text"
                            className="form-control"
                            value={numeroSerie}
                            onChange={(e) => setNumeroSerie(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleSaveEquipamento}
                        className="btn btn-success"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                ></span>
                                Salvando...
                            </>
                        ) : (
                            "Salvar Equipamento"
                        )}
                    </button>
                </div>
            ) : null}
        </div>
    );
};

export default EquipamentoForm;
