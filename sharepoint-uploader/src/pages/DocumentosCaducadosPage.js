
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
            const response = await axios.get('http://localhost:5000/documentos-caducados');
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
            await axios.post('http://localhost:5000/atualizar-documento', formData);
            await fetchDocumentosCaducados();
            setFile(null);
            setSelectedDoc(null);
        } catch (error) {
            console.error('Erro ao atualizar documento:', error);
        }
    };

    if (loading) {
        return <div className="text-center mt-5"><div className="spinner-border text-primary" /></div>;
    }

    return (
        <div className="container mt-4">
            <h2 className="mb-4">Documentos Caducados</h2>
            <div className="row">
                {documentosCaducados.map((doc) => (
                    <div key={doc.id} className="col-md-6 mb-4">
                        <div className="card hover-card">
                            <div className="card-body">
                                <h5 className="card-title">{doc.nome}</h5>
                                <p className="card-text text-danger">
                                    Data de Validade: {doc.validade}
                                </p>
                                <p className="card-text">
                                    Entidade: {doc.entidade}
                                </p>
                                <div className="mt-3">
                                    {selectedDoc === doc.id ? (
                                        <div>
                                            <input
                                                type="file"
                                                className="form-control mb-2"
                                                onChange={(e) => setFile(e.target.files[0])}
                                            />
                                            <button
                                                className="btn btn-primary me-2"
                                                onClick={() => handleFileUpload(doc.id)}
                                            >
                                                Atualizar
                                            </button>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => setSelectedDoc(null)}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="btn btn-outline-primary"
                                            onClick={() => setSelectedDoc(doc.id)}
                                        >
                                            Substituir Documento
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DocumentosCaducadosPage;
