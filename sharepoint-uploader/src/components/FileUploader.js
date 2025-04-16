import React from 'react';

const FileUploader = ({ onFileChange, onUpload }) => (
    <>
        <input type="file" onChange={onFileChange} /><br />
        <button onClick={onUpload}>Fazer Upload</button>
    </>
);

export default FileUploader;
