import React from 'react';

const EquipamentoForm = ({ marcaModelo, setMarcaModelo, tipoMaquina, setTipoMaquina, numeroSerie, setNumeroSerie }) => (
    <div>
        <input type="text" placeholder="Marca / Modelo" value={marcaModelo} onChange={(e) => setMarcaModelo(e.target.value)} /><br />
        <input type="text" placeholder="Tipo de Máquina" value={tipoMaquina} onChange={(e) => setTipoMaquina(e.target.value)} /><br />
        <input type="text" placeholder="Número de Série" value={numeroSerie} onChange={(e) => setNumeroSerie(e.target.value)} />
    </div>
);

export default EquipamentoForm;
