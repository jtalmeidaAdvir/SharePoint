import React, { useState } from "react";

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
}) => {
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
        } else {
            setTrabalhadorSelecionado("");
            setNomeCompleto("");
            setFuncao("");
            setContribuinte("");
            setSegSocial("");
            setDataNascimento("");
        }
    };

    return (
        <div>
            <div className="mt-3">
                <label>Trabalhador:</label>
                {trabalhadoresExistentes &&
                    trabalhadoresExistentes.length > 0 ? (
                    <select
                        className="form-control"
                        value={trabalhadorSelecionado}
                        onChange={handleTrabalhadorSelect}
                    >
                        <option value="">
                            Selecione um trabalhador existente
                        </option>
                        {trabalhadoresExistentes.map((trab, idx) => (
                            <option key={idx} value={trab.nome}>
                                {trab.nome} - {trab.categoria}
                            </option>
                        ))}
                    </select>
                ) : null}

                <input
                    type="text"
                    className="form-control"
                    placeholder="Nome Completo"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                />
                <input
                    type="text"
                    className="form-control"
                    placeholder="Função"
                    value={funcao}
                    onChange={(e) => setFuncao(e.target.value)}
                />
                <input
                    type="text"
                    className="form-control"
                    placeholder="Contribuinte"
                    value={contribuinte}
                    onChange={(e) => setContribuinte(e.target.value)}
                />
                <input
                    type="text"
                    className="form-control"
                    placeholder="Nº Segurança Social"
                    value={segSocial}
                    onChange={(e) => setSegSocial(e.target.value)}
                />
                <input
                    type="date"
                    className="form-control"
                    placeholder="Data de Nascimento"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                />
            </div>
        </div>
    );
};
export default TrabalhadorForm;
