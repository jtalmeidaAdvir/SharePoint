
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminPage = () => {
    const [subempreiteiros, setSubempreiteiros] = useState([]);
    const [novoNome, setNovoNome] = useState('');
    const [selectedSubempreiteiro, setSelectedSubempreiteiro] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        const authExpiration = localStorage.getItem('authExpiration');

        if (!isAuthenticated || (authExpiration && Date.now() > parseInt(authExpiration))) {
            localStorage.removeItem('isAuthenticated');
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
            const credentials = generateCredentials();
            await axios.post('http://localhost:5000/subempreiteiros', {
                nome: novoNome,
                username: credentials.username,
                password: credentials.password
            });
            setNovoNome('');
            fetchSubempreiteiros();
        } catch (error) {
            console.error('Erro ao adicionar subempreiteiro:', error);
        }
    };



    const copiarLink = (id) => {
        const link = `${window.location.origin}/upload/${id}`;
        navigator.clipboard.writeText(link);
        alert('Link copiado!');
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authExpiration');
        navigate('/login');
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Gestão de Subempreiteiros</h2>
                <button className="btn btn-outline-danger" onClick={handleLogout}>
                    Terminar Sessão
                </button>
            </div>

            <div className="card p-4 mb-4">
                <div className="input-group mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Nome do novo subempreiteiro"
                        value={novoNome}
                        onChange={(e) => setNovoNome(e.target.value)}
                    />
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
                        <div key={sub.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <span>{sub.nome}</span>
                            <div className="d-flex gap-2">
                                <button
                                    className="btn btn-outline-primary"
                                    onClick={() => copiarLink(sub.id)}
                                >
                                    Copiar Link
                                </button>
                                <div className="dropdown">
                                    <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                        ⋮
                                    </button>
                                    <ul className="dropdown-menu">
                                        <li>
                                            <button
                                                className="dropdown-item"
                                                onClick={() => alert(`Credenciais:\nUsuário: ${sub.username}\nSenha: ${sub.password}`)}
                                            >
                                                Ver Credenciais
                                            </button>
                                        </li>
                                    </ul>
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
