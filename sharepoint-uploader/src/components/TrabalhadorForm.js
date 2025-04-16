import React from 'react';

const TrabalhadorForm = ({
    nomeCompleto, setNomeCompleto, funcao, setFuncao,
    contribuinte, setContribuinte, segSocial, setSegSocial,
    dataNascimento, setDataNascimento,
    trabalhadoresExistentes, trabalhadorSelecionado, setTrabalhadorSelecionado
}) => (
    <div>
        <label>Trabalhador existente:</label>
        <select value={trabalhadorSelecionado} onChange={(e) => setTrabalhadorSelecionado(e.target.value)}>
            <option value="">-- Selecione --</option>
            {trabalhadoresExistentes.map((t, i) => (
                <option key={i} value={t}>{t}</option>
            ))}
        </select><br />
        <label>Ou digite novo nome:</label><br />
        <input type="text" placeholder="Nome Completo" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} /><br />
        <input type="text" placeholder="Função" value={funcao} onChange={(e) => setFuncao(e.target.value)} /><br />
        <input type="text" placeholder="Contribuinte" value={contribuinte} onChange={(e) => setContribuinte(e.target.value)} /><br />
        <input type="text" placeholder="Segurança Social" value={segSocial} onChange={(e) => setSegSocial(e.target.value)} /><br />
        <input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} />
    </div>
);

export default TrabalhadorForm;
