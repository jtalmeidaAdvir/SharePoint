import React from 'react';

const EmpresaForm = ({ nomeEmpresa, sede, nif, setNomeEmpresa, setSede, setNif }) => (
    <div>
        <input type="text" placeholder="Nome da Empresa" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} /><br />
        <input type="text" placeholder="Sede" value={sede} onChange={(e) => setSede(e.target.value)} /><br />
        <input type="text" placeholder="NIF/NIPC" value={nif} onChange={(e) => setNif(e.target.value)} />
    </div>
);

export default EmpresaForm;
