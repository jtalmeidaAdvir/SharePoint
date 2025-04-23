import React, { useState } from "react";
import axios from 'axios'; // Import axios

const TrabalhadorForm = ({
    nomeCompleto,
    setNomeCompleto,
    funcao,
    setFuncao,
    contribuinte,
    setContribuinte,
    segSocial,
    setSegSocial,
    dataNascimento,
    setDataNascimento,
    trabalhadoresExistentes,
    trabalhadorSelecionado,
    setTrabalhadorSelecionado,
    entityid, // Added entityData prop
}) => {
    const [mode, setMode] = useState("select");

    const handleTrabalhadorSelect = (e) => {
        const trabalhador = trabalhadoresExistentes.find(
            (t) => t.nome === e.target.value,
        );
        if (trabalhador) {
            setTrabalhadorSelecionado(trabalhador.nome);
            setNomeCompleto(trabalhador.nome);
            setFuncao(trabalhador.categoria);
            setContribuinte(trabalhador.contribuinte?.trim());
            setSegSocial(trabalhador.seguranca_social?.trim());
            setDataNascimento(trabalhador.data_nascimento?.split(" ")[0]);
        }
    };

    const resetDocsStatus = () => {
        const requiredDocs = [
            "Cartão de Cidadão ou residência",
            "Ficha Médica de aptidão",
            "Credenciação do trabalhador",
            "Trabalhos especializados",
            "Ficha de distribuição de EPI's"
        ];
        const emptyStatus = {};
        requiredDocs.forEach(doc => {
            emptyStatus[doc] = "❌ Não enviado";
        });
        return emptyStatus;
    };

    const handleSaveWorker = async () => {
        try {
    

            // Ensure segSocial is a valid number


            

            const newWorker = {
                Nome: nomeCompleto.trim(),
                Funcao: funcao.trim(),
                Contribuinte: contribuinte.trim(),
                NumSegurancaSocial: segSocial,
                DataNascimento: dataNascimento,
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
                Anexo5: false
            };

            console.log("Enviando dados do trabalhador:", newWorker);
            const response = await axios.put(
                "http://localhost:5000/WebApi/SharePoint/InsertTrabalhador",
                newWorker,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                alert("Trabalhador inserido com sucesso!");
                handleModeChange('select');
            }
        } catch (error) {
            console.error("Erro ao salvar trabalhador:", error);
            const errorMsg = error.response?.data?.error || "Erro ao inserir trabalhador";
            alert(errorMsg);
        }
    };

    const handleModeChange = (newMode) => {
        setMode(newMode);
        if (newMode === "create") {
            setTrabalhadorSelecionado("");
            setNomeCompleto("");
            setFuncao("");
            setContribuinte("");
            setSegSocial("");
            setDataNascimento("");
            window.dispatchEvent(new CustomEvent('resetDocsStatus', {
                detail: resetDocsStatus()
            }));
        }
    };

    return (
        <div className="mb-4">
            <div className="btn-group w-100 mb-3" role="group">
                <button
                    type="button"
                    className={`btn ${mode === 'select' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handleModeChange('select')}
                >
                    Selecionar Trabalhador Existente
                </button>
                <button
                    type="button"
                    className={`btn ${mode === 'create' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handleModeChange('create')}
                >
                    Criar Novo Trabalhador
                </button>
            </div>

            {mode === 'select' && trabalhadoresExistentes && trabalhadoresExistentes.length > 0 ? (
                <div>
                    <div className="mb-3">
                        <label className="form-label">Selecione um Trabalhador:</label>
                        <select
                            className="form-select"
                            value={trabalhadorSelecionado}
                            onChange={handleTrabalhadorSelect}
                        >
                            <option value="">Escolha um trabalhador</option>
                            {trabalhadoresExistentes.map((trab, idx) => (
                                <option key={idx} value={trab.nome}>
                                    {trab.nome} - {trab.categoria}
                                </option>
                            ))}
                        </select>
                    </div>

                    {trabalhadorSelecionado && (
                        <div className="card p-3">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="card-title mb-0">Informação do Trabalhador</h5>
                                <button
                                    className="btn btn-outline-primary btn-sm"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#infoTrabalhador"
                                    aria-expanded="true"
                                    aria-controls="infoTrabalhador"
                                >
                                    <i className="bi bi-eye"></i> Ver/Ocultar
                                </button>
                            </div>
                            <div className="collapse" id="infoTrabalhador">
                                <div className="mb-3">
                                    <label className="form-label">Nome Completo:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={nomeCompleto}
                                        disabled
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Função:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={funcao}
                                        disabled
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Contribuinte:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={contribuinte}
                                        disabled
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Nº Segurança Social:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={segSocial}
                                        disabled
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Data de Nascimento:</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={dataNascimento}
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : mode === 'create' ? (
                <div className="card p-3">
                    <h5 className="card-title mb-3">Novo Trabalhador</h5>
                    <div className="mb-3">
                        <label className="form-label">Nome Completo:</label>
                        <input
                            type="text"
                            className="form-control"
                            value={nomeCompleto}
                            onChange={(e) => setNomeCompleto(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Função:</label>
                        <input
                            type="text"
                            className="form-control"
                            value={funcao}
                            onChange={(e) => setFuncao(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Contribuinte:</label>
                        <input
                            type="text"
                            className="form-control"
                            value={contribuinte}
                            onChange={(e) => setContribuinte(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Nº Segurança Social:</label>
                        <input
                            type="text"
                            className="form-control"
                            value={segSocial}
                            onChange={(e) => setSegSocial(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Data de Nascimento:</label>
                        <input
                            type="date"
                            className="form-control"
                            value={dataNascimento}
                            onChange={(e) => setDataNascimento(e.target.value)}
                        />
                    </div>
                    <button onClick={handleSaveWorker} className="btn btn-success">Salvar Trabalhador</button> {/* Added save button */}
                </div>
            ) : null}
        </div>
    );
};

export default TrabalhadorForm;