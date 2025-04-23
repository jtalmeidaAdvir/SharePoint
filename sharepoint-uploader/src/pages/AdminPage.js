import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AlertModal from '../components/AlertModal';

const AdminPage = () => {
    const [subempreiteiros, setSubempreiteiros] = useState([]);
    const [entidades, setEntidades] = useState([]);
    const [novoNome, setNovoNome] = useState('');

    useEffect(() => {
        const fetchEntidades = async () => {
            try {
                const response = await axios.get('http://localhost:5000/listar-entidades');
                const data = response.data?.DataSet?.Table || [];
                console.log('Resposta da API de entidades:', response.data);
                console.log('Dados processados:', data);
                setEntidades(data);
            } catch (err) {
                console.error('Erro ao buscar entidades:', err);
                setAlert(err.message || 'Erro desconhecido');
            }
        };

        fetchEntidades();
    }, []);


    const [selectedSubempreiteiro, setSelectedSubempreiteiro] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
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
        if (localStorage.getItem('isAuthenticated')) {
            fetchSubempreiteiros();
        }
    }, []);

    if (!localStorage.getItem('isAuthenticated')) {
        return null;
    }

    const fetchSubempreiteiros = async () => {
        try {
            const response = await axios.get('http://localhost:5000/subempreiteiros');
            setSubempreiteiros(response.data.subempreiteiros);
        } catch (error) {
            console.error('Erro ao buscar subempreiteiros:', error);
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
            await axios.post('http://localhost:5000/subempreiteiros', {
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
        const link = `http://192.168.1.22:3000/upload/${sub.id}`;
        try {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(link).then(() => {
                    setAlert({ show: true, message: `Link copiado: ${link}`, type: 'success' });
                });
            } else {
                // Fallback for when clipboard API is not available
                const textArea = document.createElement("textarea");
                textArea.value = link;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                setAlert({ show: true, message: `Link copiado: ${link}`, type: 'success' });
            }
        } catch (err) {
            setAlert({ show: true, message: `Erro ao copiar link: ${link}`, type: 'error' });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authExpiration');
        navigate('/login');
    };

    return (
        <div className="container mt-4">
            <AlertModal
                show={alert.show}
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert({ show: false, message: '', type: 'success' })}
            />
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
                <h2 className="h3">Gestão de Subempreiteiros</h2>
                <button className="btn btn-outline-danger w-100 w-sm-auto" onClick={handleLogout}>
                    Terminar Sessão
                </button>
            </div>

            <div className="card p-3 p-sm-4 mb-4">
                <div className="d-flex flex-column flex-sm-row gap-2">
                    <select
                        className="form-select flex-grow-1"
                        value={novoNome}
                        onChange={(e) => setNovoNome(e.target.value)}
                    >
                        <option value="">Selecione uma entidade</option>
                        {entidades.map((entidade, index) => (
                            <option key={index} value={entidade.Nome}>
                                {entidade.Nome}
                            </option>
                        ))}
                    </select>
                    <button className="btn btn-primary w-100 w-sm-auto" onClick={adicionarSubempreiteiro}>
                        Adicionar
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="h4 mb-0">Subempreiteiros Registados</h3>
                </div>
                <div className="list-group list-group-flush">
                    {subempreiteiros.map((sub) => (
                        <div key={sub.id} className="list-group-item p-3">
                            <div className="d-flex flex-column gap-2">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 text-break">{sub.nome}</h5>
                                </div>
                                <div className="d-flex flex-column flex-sm-row gap-2">
                                    <button
                                        className="btn btn-outline-primary w-100 w-sm-auto"
                                        onClick={() => copiarLink(sub)}
                                    >
                                        <i className="bi bi-link-45deg"></i> Copiar Link
                                    </button>
                                    <button
                                        className="btn btn-outline-info w-100 w-sm-auto"
                                        onClick={() => {
                                            const link = `http://192.168.1.22:3000/upload/${sub.id}`;
                                            setAlert({
                                                show: true,
                                                message: `Link de acesso: ${link}\n\nCredenciais de acesso:\nUsuário: ${sub.username}\nSenha: ${sub.password}\n\nGuarde estas informações com segurança!`,
                                                type: 'info'
                                            });
                                        }}
                                    >
                                        <i className="bi bi-key"></i> Ver Credenciais
                                    </button>
                                    <button
                                        className="btn btn-outline-danger w-100 w-sm-auto"
                                        onClick={async () => {
                                            if (window.confirm(`Tem certeza que deseja remover ${sub.nome}?`)) {
                                                try {
                                                    await axios.delete(`http://localhost:5000/subempreiteiros/${sub.id}`);
                                                    setSubempreiteiros(prev => prev.filter(s => s.id !== sub.id));
                                                    setAlert({ show: true, message: 'Subempreiteiro removido com sucesso', type: 'success' });
                                                } catch (error) {
                                                    setAlert({ show: true, message: 'Erro ao remover subempreiteiro', type: 'error' });
                                                    console.error('Erro ao remover subempreiteiro:', error);
                                                }
                                            }
                                        }}
                                    >
                                        <i className="bi bi-trash"></i> Remover
                                    </button>
                                </div>
                                <div className="small text-muted">
                                    ID: {sub.id} • Criado em: {new Date(sub.dataCriacao).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;