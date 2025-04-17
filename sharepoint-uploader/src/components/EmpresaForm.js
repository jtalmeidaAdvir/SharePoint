import React from 'react';

const EmpresaForm = ({
    nomeEmpresa,
    sede,
    nif,
    setNomeEmpresa,
    setSede,
    setNif
}) => (
    <div>
        <div className="mt-3">
            <label>Dados da Empresa:</label>
            <input type="text" className="form-control" placeholder="Nome da Empresa" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} />
            <input type="text" className="form-control" placeholder="Sede" value={sede} onChange={(e) => setSede(e.target.value)} />
            <input type="text" className="form-control" placeholder="NIF/NIPC" value={nif} onChange={(e) => setNif(e.target.value)} />
        </div>
    </div>
);

export default EmpresaForm;