import React from 'react';

const DocumentosList = ({ requiredDocs, docsStatus }) => (
    <ul>
        {requiredDocs.map((doc, index) => (
            <li key={index} style={{ color: docsStatus[doc] === '✅ Enviado' ? 'green' : 'red' }}>
                {doc} <span>{docsStatus[doc] || '❌ Não enviado'}</span>
            </li>
        ))}
    </ul>
);

export default DocumentosList;
