
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
}) => {
    const handleEquipamentoSelect = (e) => {
        console.log('Equipamentos existentes:', equipamentosExistentes);
        const equipamento = equipamentosExistentes.find(eq => eq.marca_modelo === e.target.value);
        console.log('Equipamento selecionado:', equipamento);

        if (equipamento) {
            setEquipamentoSelecionado(equipamento.marca_modelo);
            setMarcaModelo(equipamento.marca_modelo);
            setTipoMaquina(equipamento.tipo_maquina || '');
            setNumeroSerie(equipamento.numero_serie || '');
            console.log('Dados do equipamento:', {
                marca_modelo: equipamento.marca_modelo,
                tipo_maquina: equipamento.tipo_maquina,
                numero_serie: equipamento.numero_serie
            });
        } else {
            setEquipamentoSelecionado('');
            setMarcaModelo('');
            setTipoMaquina('');
            setNumeroSerie('');
        }
    };

    return (
        <div>
            {equipamentosExistentes && equipamentosExistentes.length > 0 ? (
                <select
                    className="form-control"
                    value={equipamentoSelecionado}
                    onChange={handleEquipamentoSelect}
                >
                    <option value="">Selecione um equipamento existente</option>
                    {equipamentosExistentes.map((equip, idx) => (
                        <option key={idx} value={equip.marca_modelo}>
                            {equip.marca_modelo} - {equip.tipo_maquina}
                        </option>
                    ))}
                </select>
            ) : null}

            <div className="mt-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Marca / Modelo"
                    value={marcaModelo}
                    onChange={(e) => setMarcaModelo(e.target.value)}
                />
                <input
                    type="text"
                    className="form-control"
                    placeholder="Tipo de Máquina"
                    value={tipoMaquina}
                    onChange={(e) => setTipoMaquina(e.target.value)}
                />
                <input
                    type="text"
                    className="form-control"
                    placeholder="Número de Série"
                    value={numeroSerie}
                    onChange={(e) => setNumeroSerie(e.target.value)}
                />
            </div>
        </div>
    );
};

export default EquipamentoForm;
