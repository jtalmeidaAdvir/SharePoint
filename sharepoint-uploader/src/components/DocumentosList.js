import React from 'react';

const DocumentosList = ({ requiredDocs, docsStatus, entityData }) => {

    const extractValidityDate = (status) => {
        if (!status) return null;
        // Handle HTML encoded format
        if (status.includes("&#40;")) {
            const match = status.match(/&#40;Válido até&#58;\s*(\d{2}\/\d{2}\/\d{4})&#41;/);
            return match ? match[1] : null;
        }

        
        // Handle regular format
        const match = status.match(/Válido até\s*:\s*(\d{2}\/\d{2}\/\d{4})/);
        return match ? match[1] : null;
    };

    const getValidityDate = (docName, status, entityData) => {
        console.log('---------------------');


        // Check for worker document validity dates
        if (docName.startsWith('caminho')) {
            console.log('Processing Worker Document');
            const validityMatch = status?.match(/&#40;Válido até&#58;\s*(\d{2}\/\d{2}\/\d{4})&#41;/);
            console.log('Extracted Worker Validity:', validityMatch?.[1]);
            return validityMatch ? validityMatch[1] : null;
        }

        // Check for company document validity dates
        if (status?.includes("Válido até")) {
            console.log('Checking company document format');
            const validity = extractValidityDate(status);
            console.log('Company validity:', validity);
            return validity;
        }

        const validityMap = {
            "Alvará ou Certificado de Construção ou Atividade": entityData?.CDU_ValidadeAlvara,
            "Certidão de não dívida às Finanças": entityData?.CDU_ValidadeFinancas,
            "Certidão de não dívida à Segurança Social": entityData?.CDU_ValidadeSegSocial,
            "Comprovativo de Pagamento": entityData?.CDU_ValidadeComprovativoPagamento,
            "Condições do Seguro de Acidentes de Trabalho": entityData?.CDU_ValidadeReciboSeguroAT,
            "Seguro de Responsabilidade Civil": entityData?.CDU_ValidadeSeguroRC
        };

        const date = validityMap[docName];
        if (!date) return null;
        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="docs-list mt-4">
            <div className="row row-cols-1 row-cols-md-2 g-4">
                {requiredDocs.map((doc, index) => (
                    <div key={index} className="col">
                        <div className="card h-100 border-0 shadow-sm">
                            <div className="card-body">
                                <div className="d-flex align-items-start gap-3">
                                    <div className="status-icon">
                                        {docsStatus[doc]?.includes('✅') ? (
                                            <span className="badge bg-success rounded-circle p-2">
                                                <i className="bi bi-check-lg"></i>
                                            </span>
                                        ) : (
                                            <span className="badge bg-danger rounded-circle p-2">
                                                <i className="bi bi-x-lg"></i>
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-grow-1">
                                        <h6 className="mb-2 fw-bold text-dark">{doc}</h6>
                                        <p className="mb-0 small">
                                            <span className={`status-badge ${docsStatus[doc]?.includes('✅') ? 'text-success' : 'text-danger'}`}>
                                                {docsStatus[doc]?.replace('✅', '').replace('❌', '').replace(/\(Válido até:[^)]*\)/, '')}
                                            </span>
                                            {getValidityDate(doc, docsStatus[doc], entityData) && (
                                                <span className="ms-2 text-muted">
                                                    | Validade: {getValidityDate(doc, docsStatus[doc], entityData)}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DocumentosList;