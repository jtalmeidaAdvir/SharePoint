import React from 'react';

const DocumentosList = ({ requiredDocs, docsStatus }) => (
    <div className="docs-list">
        <ul style={{ listStyle: 'none', padding: 0 }}>
            {requiredDocs.map((doc, index) => (
                <li key={index}>
                    {doc}
                    <span className={docsStatus[doc] === '✅ Enviado' ? 'status-enviado' : 'status-nao-enviado'}>
                        {docsStatus[doc] || '❌ Não enviado'}
                    </span>
                </li>
            ))}
        </ul>
    </div>
);

export default DocumentosList;
