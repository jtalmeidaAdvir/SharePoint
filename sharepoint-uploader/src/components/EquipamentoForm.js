
import React from 'react';

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
}) => (
    <div>
        <h3>Selecione um equipamento existente ou cadastre um novo:</h3>
        <select
            value={equipamentoSelecionado}
            onChange={(e) => setEquipamentoSelecionado(e.target.value)}
            style={{ marginBottom: 10 }}
        >
            <option value="">Novo equipamento</option>
            {equipamentosExistentes.map((equip, idx) => (
                <option key={idx} value={equip}>{equip}</option>
            ))}
        </select>

        {!equipamentoSelecionado && (
            <>
                <input
                    type="text"
                    placeholder="Marca/Modelo"
                    value={marcaModelo}
                    onChange={(e) => setMarcaModelo(e.target.value)}
                /><br />
                <input
                    type="text"
                    placeholder="Tipo de Máquina"
                    value={tipoMaquina}
                    onChange={(e) => setTipoMaquina(e.target.value)}
                /><br />
                <input
                    type="text"
                    placeholder="Número de Série"
                    value={numeroSerie}
                    onChange={(e) => setNumeroSerie(e.target.value)}
                /><br />
            </>
        )}
    </div>
);

export default EquipamentoForm;
