import React from 'react';

const EquipamentoForm = ({ marcaModelo, setMarcaModelo, tipoMaquina, setTipoMaquina, numeroSerie, setNumeroSerie }) => (
    <div>
        <input type="text" placeholder="Marca / Modelo" value={marcaModelo} onChange={(e) => setMarcaModelo(e.target.value)} /><br />
        <input type="text" placeholder="Tipo de M�quina" value={tipoMaquina} onChange={(e) => setTipoMaquina(e.target.value)} /><br />
        <input type="text" placeholder="N�mero de S�rie" value={numeroSerie} onChange={(e) => setNumeroSerie(e.target.value)} />
    </div>
);

export default EquipamentoForm;
