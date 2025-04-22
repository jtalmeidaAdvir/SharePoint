
import React from 'react';

const DocumentosList = ({ requiredDocs, docsStatus }) => (
    <div className="docs-list mt-4">
        <div className="list-group">
            {requiredDocs.map((doc, index) => (
                <div key={index} className="list-group-item d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                    <div className="doc-name">{doc}</div>
                    <span className={`badge ${docsStatus[doc]?.includes('✅') ? 'bg-success' : 'bg-danger'} rounded-pill`}>
                        {docsStatus[doc] || '❌ Não enviado'}
                    </span>
                </div>
            ))}
        </div>
    </div>
);

export default DocumentosList;
