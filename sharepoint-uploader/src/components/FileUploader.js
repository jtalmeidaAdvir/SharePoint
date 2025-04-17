import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const FileUploader = ({ onFileChange, onUpload }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState(''); // Novo estado para o nome do arquivo

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles?.length > 0) {
            const file = acceptedFiles[0];
            onFileChange({ target: { files: [file] } });
            setFileName(file.name); // Atualiza o nome do arquivo
        }
    }, [onFileChange]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        multiple: false,
        onDragEnter: () => setIsDragging(true),
        onDragLeave: () => setIsDragging(false),
        onDropAccepted: () => setIsDragging(false)
    });

    return (
        <div className="mb-3">
            <div
                {...getRootProps()}
                className={`dropzone bg-light p-3 mb-3 rounded ${isDragging ? 'active' : ''}`}
            >
                <input {...getInputProps()} />
                <div className="dropzone-icon display-4 text-primary">📄</div>
                <p>Arraste e solte um arquivo aqui, ou clique para selecionar</p>
                <p className="text-muted">Formatos aceitos: PDF, DOC, DOCX, JPG, PNG</p>
                <p className="text-info">{fileName}</p> {/* Exibe o nome do arquivo */}
            </div>

            <button
                onClick={onUpload}
                className="btn btn-primary btn-block"
            >
                Fazer Upload
            </button>
        </div>
    );
};

export default FileUploader;