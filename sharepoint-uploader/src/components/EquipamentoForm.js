
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
    const [showError, setShowError] = useState(false);

    const handleMarcaModeloChange = (e) => {
        setMarcaModelo(e.target.value);
        setShowError(e.target.value.trim() === '');
    };

    return (
        <div>
            <select className="form-control" value={equipamentoSelecionado} onChange={(e) => setEquipamentoSelecionado(e.target.value)}>
                <option value="">-- Selecione um equipamento existente --</option>
                {equipamentosExistentes.map((e, i) => (
                    <option key={i} value={e}>{e}</option>
                ))}
            </select>
            <div className="mt-3">
                <label>Ou insira novo equipamento:</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Marca / Modelo *"
                    value={marcaModelo}
                    onChange={handleMarcaModeloChange}
                    onBlur={() => setShowError(marcaModelo.trim() === '')}
                    style={{
                        borderColor: showError ? '#dc3545' : '',
                        boxShadow: showError ? '0 0 0 0.2rem rgba(220, 53, 69, 0.25)' : ''
                    }}
                />
                {showError && (
                    <div className="text-danger" style={{ fontSize: '0.875em', marginTop: '0.25rem' }}>
                        O campo Marca/Modelo é obrigatório
                    </div>
                )}
                <input type="text" className="form-control" placeholder="Tipo de Máquina" value={tipoMaquina} onChange={(e) => setTipoMaquina(e.target.value)} />
                <input type="text" className="form-control" placeholder="Número de Série" value={numeroSerie} onChange={(e) => setNumeroSerie(e.target.value)} />
            </div>
        </div>
    );
};

export default EquipamentoForm;
