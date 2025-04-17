import React from 'react';

const DocumentosSelector = ({ docType, setDocType, requiredDocs }) => (
    <div className="form-group">
        <h3>Documentos obrigatórios:</h3>
        <select
            className="form-control"
            onChange={(e) => setDocType(e.target.value)}
            value={docType}
        >
            <option value="">Selecione um documento</option>
            {requiredDocs.map((doc, index) => (
                <option key={index} value={doc}>{doc}</option>
            ))}
        </select>
    </div>
);

export default DocumentosSelector;
