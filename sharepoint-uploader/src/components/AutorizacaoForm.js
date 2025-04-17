import React, { useState } from 'react';

const AutorizacaoForm = ({
    obrasDisponiveis,
    obraSelecionada,
    setObraSelecionada,
    dataEntrada,
    setDataEntrada,
    dataSaida,
    setDataSaida
}) => {
    const [mostrarDataSaida, setMostrarDataSaida] = useState(false);

    const handleDataSaidaChange = (e) => {
        if (!mostrarDataSaida) {
            setDataSaida('');
        } else {
            setDataSaida(e.target.value);
        }
    };

    return (
        <div>
            <select className="form-control" value={obraSelecionada} onChange={(e) => setObraSelecionada(e.target.value)}>
                <option value="">Selecione uma obra</option>
                {obrasDisponiveis.map((obra, index) => (
                    <option key={index} value={obra}>{obra}</option>
                ))}
            </select>
            <div className="mt-3">
                <label>Data de Entrada:</label>
                <input type="date" className="form-control" value={dataEntrada} onChange={(e) => setDataEntrada(e.target.value)} />

                <div className="form-check mt-3">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id="mostrarDataSaida"
                        checked={mostrarDataSaida}
                        onChange={(e) => setMostrarDataSaida(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="mostrarDataSaida">
                        Incluir data de saida
                    </label>
                </div>

                {mostrarDataSaida && (
                    <div className="mt-2">
                        <label>Data de Saida:</label>
                        <input
                            type="date"
                            className="form-control"
                            value={dataSaida}
                            onChange={handleDataSaidaChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AutorizacaoForm;