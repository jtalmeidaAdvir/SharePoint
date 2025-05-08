import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AlertModal from '../components/AlertModal';

const AdminPage = () => {
    const [subempreiteiros, setSubempreiteiros] = useState([]);
    const [entidades, setEntidades] = useState([]);
    const [novoNome, setNovoNome] = useState('');
    const [selectedSubempreiteiro, setSelectedSubempreiteiro] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
    const [loadingEntidades, setLoadingEntidades] = useState(true);
    const [loadingSubs, setLoadingSubs] = useState(true);
    const [copied, setCopied] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        const isAdmin = localStorage.getItem('isAdmin');
        const authExpiration = localStorage.getItem('authExpiration');

        if (!isAuthenticated || !isAdmin || (authExpiration && Date.now() > parseInt(authExpiration))) {
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('authExpiration');
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        const fetchEntidades = async () => {
            try {
                const response = await axios.get('http://51.254.116.237:5000/listar-entidades');
                const data = response.data?.DataSet?.Table || [];
                setEntidades(data);
            } catch (err) {
                console.error('Erro ao buscar entidades:', err);
                setAlert({ show: true, message: err.message || 'Erro desconhecido', type: 'error' });
            } finally {
                setLoadingEntidades(false);
            }
        };

        fetchEntidades();
    }, []);

    useEffect(() => {
        if (localStorage.getItem('isAuthenticated')) {
            fetchSubempreiteiros();
        }
    }, []);

    const fetchSubempreiteiros = async () => {
        setLoadingSubs(true);
        try {
            const response = await axios.get('http://51.254.116.237:5000/subempreiteiros');
            setSubempreiteiros(response.data.subempreiteiros);
        } catch (error) {
            console.error('Erro ao buscar subempreiteiros:', error);
            setAlert({ show: true, message: 'Erro ao carregar subempreiteiros', type: 'error' });
        } finally {
            setLoadingSubs(false);
        }
    };

    const generateCredentials = () => {
        const username = Math.random().toString(36).substring(2, 8);
        const password = Math.random().toString(36).substring(2, 8);
        return { username, password };
    };

    const adicionarSubempreiteiro = async () => {
        try {
            if (!novoNome.trim()) {
                setAlert({ show: true, message: 'Selecione uma entidade', type: 'warning' });
                return;
            }
            const entidadeSelecionada = entidades.find(e => e.Nome === novoNome);
            if (!entidadeSelecionada) {
                setAlert({ show: true, message: 'Entidade não encontrada', type: 'warning' });
                return;
            }
            const credentials = generateCredentials();
            await axios.post('http://51.254.116.237:5000/subempreiteiros', {
                nome: novoNome,
                username: credentials.username,
                password: credentials.password,
                entidadeId: entidadeSelecionada.id
            });
            setNovoNome('');
            fetchSubempreiteiros();
            setAlert({ show: true, message: 'Subempreiteiro adicionado com sucesso', type: 'success' });
        } catch (error) {
            setAlert({ show: true, message: 'Erro ao adicionar subempreiteiro', type: 'error' });
            console.error('Erro ao adicionar subempreiteiro:', error);
        }
    };

    const copiarLink = (sub) => {
        const link = `http://192.168.1.9:3000/upload/${sub.id}`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(link)
                .then(() => {
                    setAlert({ show: true, message: `Link copiado: ${link}`, type: 'success' });
                })
                .catch((err) => {
                    setAlert({ show: true, message: `Erro ao copiar link: ${link}`, type: 'error' });
                });
        } else {
            // Fallback para navegadores que não suportam navigator.clipboard
            const textarea = document.createElement('textarea');
            textarea.value = link;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                setAlert({ show: true, message: `Link copiado (fallback): ${link}`, type: 'success' });
            } catch (err) {
                setAlert({ show: true, message: `Erro ao copiar link (fallback): ${link}`, type: 'error' });
            }
            document.body.removeChild(textarea);
        }
    };


    const confirmarRemocao = async (sub) => {
        if (window.confirm(`Tem certeza que deseja remover ${sub.nome}?`)) {
            try {
                await axios.delete(`http://51.254.116.237:5000/subempreiteiros/${sub.id}`);
                setSubempreiteiros(prev => prev.filter(s => s.id !== sub.id));
                setAlert({ show: true, message: 'Subempreiteiro removido com sucesso', type: 'success' });
            } catch (error) {
                setAlert({ show: true, message: 'Erro ao remover subempreiteiro', type: 'error' });
                console.error('Erro ao remover subempreiteiro:', error);
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authExpiration');
        navigate('/login');
    };

    if (!localStorage.getItem('isAuthenticated')) return null;

    return (
        <div className="container mt-4">
            <header className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                <div className="d-flex align-items-center gap-3">
                    <img src="/jpa.png" alt="Logo" style={{ height: '40px' }} />
                    <h1 className="h4 m-0">Painel de Administração</h1>
                </div>
                <button className="btn btn-outline-danger d-flex align-items-center" onClick={handleLogout} title="Terminar Sessão">
                    <i className="bi bi-box-arrow-right fs-5 me"></i>
                </button>
            </header>


            {selectedSubempreiteiro && (
                <AlertModal
                    show={true}
                    type="info"
                    message={
                        <div>
                            <p>
                                <strong>Link de Acesso:</strong><br />
                                <span
                                    style={{ cursor: 'pointer', color: '#0d6efd', textDecoration: 'underline' }}
                                    onClick={() => {
                                        const link = `http://192.168.1.9:3000/upload/${selectedSubempreiteiro.id}`;

                                        if (navigator.clipboard && navigator.clipboard.writeText) {
                                            navigator.clipboard.writeText(link)
                                                .then(() => {
                                                    setCopied(true);
                                                    setTimeout(() => setCopied(false), 2000);
                                                })
                                                .catch((err) => {
                                                    console.error('Erro ao copiar:', err);
                                                    fallbackCopy(link);
                                                });
                                        } else {
                                            fallbackCopy(link);
                                        }

                                        function fallbackCopy(text) {
                                            const textarea = document.createElement('textarea');
                                            textarea.value = text;
                                            document.body.appendChild(textarea);
                                            textarea.select();
                                            try {
                                                document.execCommand('copy');
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 2000);
                                            } catch (err) {
                                                console.error('Fallback também falhou:', err);
                                            }
                                            document.body.removeChild(textarea);
                                        }
                                    }}
                                >
                                    http://192.168.1.9:3000/upload/{selectedSubempreiteiro.id}
                                </span>


                            </p>
                            <p>
                                <strong>User:</strong> {selectedSubempreiteiro.username}<br />
                                <strong>Password:</strong> {selectedSubempreiteiro.password}
                            </p>
                        </div>
                    }
                    onClose={() => setSelectedSubempreiteiro(null)}
                />

            )}

            <div className="card p-4 mb-4 shadow-sm">
                <div className="row g-3 align-items-center">
                    <div className="col-md">
                        <select
                            className="form-select"
                            value={novoNome}
                            onChange={(e) => setNovoNome(e.target.value)}
                        >
                            <option value="">Selecione uma entidade para adicionar</option>
                            {entidades.map((entidade, index) => (
                                <option key={index} value={entidade.Nome}>{entidade.Nome}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-auto">
                        <button className="btn btn-primary w-100" onClick={adicionarSubempreiteiro}>
                            <i className="bi bi-person-plus me"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm">
                <div className="card-header">
                    <h3 className="h5 mb-0">Subempreiteiros Registados</h3>
                </div>
                <div className="list-group list-group-flush">
                    {loadingSubs ? (
                        <div className="p-4 text-center">
                            <div className="spinner-border text-primary" role="status" />
                            <div className="mt-2">A carregar subempreiteiros...</div>
                        </div>
                    ) : (
                        subempreiteiros.map((sub) => (
                            <div key={sub.id} className="list-group-item p-3">
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                                    <h5 className="mb-0 text-break">{sub.nome}</h5>
                                    <div className="d-flex flex-wrap gap-2">
                                        <button className="btn btn-outline-primary" onClick={() => setSelectedSubempreiteiro(sub)}>
                                            <i className="bi bi-key"></i> Ver Credenciais
                                        </button>
                                        <button className="btn btn-outline-danger" onClick={() => confirmarRemocao(sub)}>
                                            <i className="bi bi-trash"></i> Remover
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            {copied && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    backgroundColor: 'blue',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    zIndex: 9999,
                    transition: 'opacity 0.3s ease-in-out'
                }}>
                    Link copiado 📋
                </div>
            )}

        </div>

    );
};

export default AdminPage;