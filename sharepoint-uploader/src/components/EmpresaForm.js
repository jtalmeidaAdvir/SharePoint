
import React from 'react';

const EmpresaForm = ({
    nomeEmpresa,
    sede,
    nif,
    setNomeEmpresa,
    setSede,
    setNif,
    entityData
}) => (
    <div>
        <div className="mt-3">
            <label>Dados da Empresa:</label>
            <input type="text" className="form-control" placeholder="Nome da Empresa" value={entityData?.Nome || nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} disabled={!!entityData?.Nome} />
            <input type="text" className="form-control" placeholder="Sede" value={entityData?.Morada ? `${entityData.Morada}, ${entityData.CodPostal} ${entityData.CodPostalLocal}` : sede} onChange={(e) => setSede(e.target.value)} disabled={!!entityData?.Morada} />
            <input type="text" className="form-control" placeholder="NIF/NIPC" value={entityData?.NIPC || nif} onChange={(e) => setNif(e.target.value)} disabled={!!entityData?.NIPC} />
        </div>
    </div>
);

export default EmpresaForm;
