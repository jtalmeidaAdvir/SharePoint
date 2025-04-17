
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
                setAlert({ show: true, message: 'Digite o nome do subempreiteiro', type: 'warning' });
                return;
            }
            const credentials = generateCredentials();
            await axios.post('http://localhost:5000/subempreiteiros', {
                nome: novoNome,
                username: credentials.username,
                password: credentials.password
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
        const linkNome = sub.nome.toLowerCase().replace(/\s+/g, '-');
        const link = `${window.location.origin}/upload/${linkNome}-${sub.id}`;
        navigator.clipboard.writeText(link);
        setAlert({ show: true, message: 'Link copiado!', type: 'success' });
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
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Gestão de Subempreiteiros</h2>
                <button className="btn btn-outline-danger" onClick={handleLogout}>
                    Terminar Sessão
                </button>
            </div>

            <div className="card p-4 mb-4">
                <div className="input-group mb-3">
                    <select
                        className="form-control"
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
                    <button className="btn btn-primary" onClick={adicionarSubempreiteiro}>
                        Adicionar
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Subempreiteiros Registados</h3>
                </div>
                <div className="list-group list-group-flush">
                    {subempreiteiros.map((sub) => (
                        <div key={sub.id} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h5 className="mb-0">{sub.nome}</h5>
                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-outline-primary"
                                        onClick={() => copiarLink(sub)}
                                    >
                                        <i className="bi bi-link-45deg"></i> Copiar Link
                                    </button>
                                    <button
                                        className="btn btn-outline-info"
                                        onClick={() => {
                                            const link = `${window.location.origin}/upload/${sub.id}`;
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
                                        className="btn btn-outline-danger"
                                        onClick={async () => {
                                            if (window.confirm(`Tem certeza que deseja remover ${sub.nome}?`)) {
                                                try {
                                                    await axios.delete(`http://0.0.0.0:5000/subempreiteiros/${sub.id}`);
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
                            </div>
                            <div className="small text-muted">
                                ID: {sub.id} • Criado em: {new Date(sub.dataCriacao).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
