import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertModal from '../components/AlertModal';
import axios from 'axios';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const params = new URLSearchParams(window.location.search);
        const redirectPath = params.get('redirect');

        try {
            console.log('Enviando solicitação de login...');
            const response = await axios.post('http://51.254.116.237:5000/verificar-credenciais', { username, password });
            console.log('Resposta recebida:', response.data);

            if (response.data.valid) {
                console.log('Credenciais válidas. Armazenando dados no localStorage...');

                const expirationTime = Date.now() + (24 * 60 * 60 * 1000);
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('authExpiration', expirationTime.toString());

                if (response.data.erpToken) {
                    console.log('ERP Token recebido:', response.data.erpToken);
                    localStorage.setItem('erpToken', response.data.erpToken);
                }

                if (response.data.isAdmin) {
                    console.log('Usuário é admin. Redirecionando para /admin...');
                    localStorage.setItem('isAdmin', 'true');
                    navigate('/admin');
                } else if (redirectPath && redirectPath.startsWith('/upload/')) {
                    console.log('Redirecionamento para upload detectado:', redirectPath);

                    const clientId = redirectPath.replace('/upload/', '');
                    console.log('Client ID extraído:', clientId);

                    if (response.data.id === clientId) {
                        console.log('ID do cliente confere. Autorizando upload.');
                        localStorage.setItem('uploadAuth_' + clientId, 'true');
                        navigate(redirectPath);
                    } else {
                        console.warn('ID do cliente NÃO confere. Exibindo alerta.');
                        setShowAlert(true);
                    }
                } else {
                    console.log('Usuário comum. Redirecionando para /admin...');
                    navigate('/admin');
                }
            } else {
                console.warn('Credenciais inválidas. Exibindo alerta.');
                setShowAlert(true);
            }
        } catch (error) {
            console.error("Falha no login:", error);
            setShowAlert(true);
        } finally {
            console.log('Finalizando processo de login...');
            setIsLoading(false);
        }

    };


    return (
        <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center py-5"
            style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
            <AlertModal
                show={showAlert}
                message="Credenciais inválidas"
                type="error"
                onClose={() => setShowAlert(false)}
            />
            <div className="card shadow-lg" style={{ maxWidth: '400px', width: '100%' }}>
                <div className="card-body p-4">
                    <div className="text-center mb-4">
                        <img
                            src="/favicon.ico"
                            alt="Logo"
                            style={{ width: '64px', height: '64px', marginBottom: '1rem' }}
                        />
                        <h3 className="card-title fw-bold">Bem-vindo</h3>
                        <p className="text-muted">Sistema de Gestão de Documentos</p>
                    </div>
                    <form onSubmit={handleLogin} className="mt-4">
                        <div className="mb-3">
                            <label className="form-label">Utilizador</label>
                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="bi bi-person"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Introduza o seu utilizador"
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="form-label">Palavra-passe</label>
                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="bi bi-lock"></i>
                                </span>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Introduza a sua palavra-passe"
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary w-100 py-2" disabled={isLoading}>
                            {isLoading ? (
                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                    <span className="visually-hidden">A carregar...</span>
                                </div>
                            ) : null}
                            {isLoading ? 'A entrar...' : 'Entrar'}
                        </button>
                    </form>
                    <div className="text-center mt-4">
                        <small className="text-muted">© 2024 Gestão de Documentos. Todos os direitos reservados.</small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;