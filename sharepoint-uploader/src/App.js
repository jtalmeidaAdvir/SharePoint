// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UploadPage from './pages/UploadPage';

function App() {
    return (
        <Router>
            <Routes>
                {/* Rota dinâmica: /upload/:clienteId */}
                <Route path="/upload/:clienteId" element={<UploadPage />} />

                {/* Página inicial opcional (pode personalizar depois) */}
                <Route path="*" element={<div style={{ padding: 20 }}><h2>404 - Página não encontrada</h2></div>} />
            </Routes>
        </Router>
    );
}

export default App;
