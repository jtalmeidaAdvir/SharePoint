
import React, { useState } from 'react';

const EquipamentoForm = ({
    equipamentosExistentes,
    equipamentoSelecionado,
    setEquipamentoSelecionado,
    marcaModelo,
    setMarcaModelo,
    tipoMaquina,
    setTipoMaquina,
    numeroSerie,
    setNumeroSerie
}) => {
    const [mode, setMode] = useState('select');

    const handleEquipamentoSelect = (e) => {
        const equipamento = equipamentosExistentes.find(eq => eq.marca_modelo === e.target.value || eq.marca === e.target.value);

        if (equipamento) {
            setEquipamentoSelecionado(equipamento.marca_modelo || equipamento.marca);
            setMarcaModelo(equipamento.marca_modelo || equipamento.marca);
            setTipoMaquina(equipamento.tipo_maquina || equipamento.tipo || '');
            setNumeroSerie(equipamento.numero_serie || equipamento.serie || '');
        }
    };

    const resetDocsStatus = () => {
        const requiredDocs = [
            "Certificado CE",
            "Certificado ou Declaração",
            "Registos de Manutenção",
            "Manual de utilizador",
            "Seguro"
        ];
        const emptyStatus = {};
        requiredDocs.forEach(doc => {
            emptyStatus[doc] = "❌ Não enviado";
        });
        return emptyStatus;
    };

    const handleModeChange = (newMode) => {
        setMode(newMode);
        if (newMode === 'create') {
            setEquipamentoSelecionado('');
            setMarcaModelo('');
            setTipoMaquina('');
            setNumeroSerie('');
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
                    Selecionar Equipamento Existente
                </button>
                <button
                    type="button"
                    className={`btn ${mode === 'create' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handleModeChange('create')}
                >
                    Criar Novo Equipamento
                </button>
            </div>

            {mode === 'select' && equipamentosExistentes && equipamentosExistentes.length > 0 ? (
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
                            <div className="collapse" id="infoEquipamento">
                                <div className="mb-3">
                                    <label className="form-label">Marca / Modelo:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={marcaModelo}
                                        disabled
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Tipo de Máquina:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={tipoMaquina}
                                        disabled
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Número de Série:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={numeroSerie}
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : mode === 'create' ? (
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
                </div>
            ) : null}
        </div>
    );
};

export default EquipamentoForm;
