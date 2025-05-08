
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

const DocumentosCaducadosPage = () => {
    const [documentosCaducados, setDocumentosCaducados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [file, setFile] = useState(null);

    useEffect(() => {
        fetchDocumentosCaducados();
    }, []);

    const fetchDocumentosCaducados = async () => {
        try {
            const response = await axios.get('http://51.254.116.237:5000/documentos-caducados');
            setDocumentosCaducados(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Erro ao buscar documentos:', error);
            setLoading(false);
        }
    };

    const handleFileUpload = async (docId) => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('docId', docId);

        try {
            await axios.post('http://51.254.116.237:5000/atualizar-documento', formData);
            await fetchDocumentosCaducados();
            setFile(null);
            setSelectedDoc(null);
        } catch (error) {
            console.error('Erro ao atualizar documento:', error);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Carregando...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-4">
            <div className="row mb-4 align-items-center">
                <div className="col">
                    <h2 className="mb-0">Documentos Caducados</h2>
                </div>
                <div className="col-auto">
                    <button
                        className="btn btn-outline-primary"
                        onClick={fetchDocumentosCaducados}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Atualizar Lista
                    </button>
                </div>
            </div>

            {documentosCaducados.length === 0 ? (
                <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    Não existem documentos caducados.
                </div>
            ) : (
                <div className="row g-4">
                    {documentosCaducados.map((doc) => (
                        <div key={doc.id} className="col-12 col-md-6 col-lg-4">
                            <div className="card h-100 shadow-sm hover-card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h5 className="card-title text-break mb-0">{doc.nome}</h5>
                                        <span className="badge bg-danger">Caducado</span>
                                    </div>

                                    <div className="mb-3">
                                        <small className="text-muted d-block mb-2">
                                            <i className="bi bi-building me-2"></i>
                                            {doc.entidade}
                                        </small>
                                        <small className="text-danger d-block">
                                            <i className="bi bi-calendar-x me-2"></i>
                                            Válido até: {doc.validade}
                                        </small>
                                    </div>

                                    <div className="d-grid gap-2">
                                        {selectedDoc === doc.id ? (
                                            <>
                                                <div className="input-group mb-2">
                                                    <input
                                                        type="file"
                                                        className="form-control"
                                                        onChange={(e) => setFile(e.target.files[0])}
                                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                    />
                                                </div>
                                                <button
                                                    className="btn btn-primary w-100"
                                                    onClick={() => handleFileUpload(doc.id)}
                                                >
                                                    <i className="bi bi-cloud-upload me-2"></i>
                                                    Atualizar
                                                </button>
                                                <button
                                                    className="btn btn-outline-secondary w-100"
                                                    onClick={() => setSelectedDoc(null)}
                                                >
                                                    <i className="bi bi-x-lg me-2"></i>
                                                    Cancelar
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                className="btn btn-outline-primary w-100"
                                                onClick={() => setSelectedDoc(doc.id)}
                                            >
                                                <i className="bi bi-arrow-up-circle me-2"></i>
                                                Substituir Documento
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DocumentosCaducadosPage;
