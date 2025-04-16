import React from 'react';

const AutorizacaoForm = ({ obrasDisponiveis, obraSelecionada, setObraSelecionada, dataEntrada, setDataEntrada, dataSaida, setDataSaida }) => (
    <div>
        <select value={obraSelecionada} onChange={(e) => setObraSelecionada(e.target.value)}>
            <option value="">Selecione uma obra</option>
            {obrasDisponiveis.map((obra, index) => (
                <option key={index} value={obra}>{obra}</option>
            ))}
        </select><br />
        <input type="date" value={dataEntrada} onChange={(e) => setDataEntrada(e.target.value)} /><br />
        <input type="date" value={dataSaida} onChange={(e) => setDataSaida(e.target.value)} placeholder="Data de Saída (opcional)" />
    </div>
);

export default AutorizacaoForm;
