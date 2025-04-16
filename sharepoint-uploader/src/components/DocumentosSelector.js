import React from 'react';

const DocumentosSelector = ({ docType, setDocType, requiredDocs }) => (
    <>
        <h3>Documentos obrigatórios:</h3>
        <select onChange={(e) => setDocType(e.target.value)} value={docType}>
            <option value="">Selecione um documento</option>
            {requiredDocs.map((doc, index) => (
                <option key={index} value={doc}>{doc}</option>
            ))}
        </select><br />
    </>
);

export default DocumentosSelector;
