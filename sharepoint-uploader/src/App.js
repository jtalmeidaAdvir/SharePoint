// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import DocumentosCaducadosPage from './pages/DocumentosCaducadosPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/upload/:clienteId" element={<UploadPage />} />
                <Route path="/documentos-caducados" element={<DocumentosCaducadosPage />} />
                <Route path="/" element={<LoginPage />} />
            </Routes>
        </Router>
    );
}

export default App;
