
import React, { useState } from 'react';

const TrabalhadorForm = ({
    nomeCompleto, setNomeCompleto,
    funcao, setFuncao,
    contribuinte, setContribuinte,
    segSocial, setSegSocial,
    dataNascimento, setDataNascimento,
    trabalhadoresExistentes,
    trabalhadorSelecionado,
    setTrabalhadorSelecionado
}) => {
    const [showErrors, setShowErrors] = useState({
        nomeCompleto: false,
        contribuinte: false,
        segSocial: false
    });

    const handleInputChange = (field, value, setter) => {
        setter(value);
        setShowErrors(prev => ({
            ...prev,
            [field]: value.trim() === ''
        }));
    };

    return (
        <div>
            <select className="form-control" value={trabalhadorSelecionado} onChange={(e) => setTrabalhadorSelecionado(e.target.value)}>
                <option value="">-- Selecione um trabalhador existente --</option>
                {trabalhadoresExistentes.map((t, i) => (
                    <option key={i} value={t}>{t}</option>
                ))}
            </select>
            <div className="mt-3">
                <label>Ou insira novo trabalhador:</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Nome Completo *"
                    value={nomeCompleto}
                    onChange={(e) => handleInputChange('nomeCompleto', e.target.value, setNomeCompleto)}
                    onBlur={() => setShowErrors(prev => ({ ...prev, nomeCompleto: nomeCompleto.trim() === '' }))}
                    style={{
                        borderColor: showErrors.nomeCompleto ? '#dc3545' : '',
                        boxShadow: showErrors.nomeCompleto ? '0 0 0 0.2rem rgba(220, 53, 69, 0.25)' : ''
                    }}
                />
                {showErrors.nomeCompleto && (
                    <div className="text-danger" style={{ fontSize: '0.875em', marginTop: '0.25rem' }}>
                        O campo Nome Completo é obrigatório
                    </div>
                )}
                <input type="text" className="form-control" placeholder="Função" value={funcao} onChange={(e) => setFuncao(e.target.value)} />
                <input
                    type="text"
                    className="form-control"
                    placeholder="Contribuinte *"
                    value={contribuinte}
                    onChange={(e) => handleInputChange('contribuinte', e.target.value, setContribuinte)}
                    onBlur={() => setShowErrors(prev => ({ ...prev, contribuinte: contribuinte.trim() === '' }))}
                    style={{
                        borderColor: showErrors.contribuinte ? '#dc3545' : '',
                        boxShadow: showErrors.contribuinte ? '0 0 0 0.2rem rgba(220, 53, 69, 0.25)' : ''
                    }}
                />
                {showErrors.contribuinte && (
                    <div className="text-danger" style={{ fontSize: '0.875em', marginTop: '0.25rem' }}>
                        O campo Contribuinte é obrigatório
                    </div>
                )}
                <input
                    type="text"
                    className="form-control"
                    placeholder="Segurança Social *"
                    value={segSocial}
                    onChange={(e) => handleInputChange('segSocial', e.target.value, setSegSocial)}
                    onBlur={() => setShowErrors(prev => ({ ...prev, segSocial: segSocial.trim() === '' }))}
                    style={{
                        borderColor: showErrors.segSocial ? '#dc3545' : '',
                        boxShadow: showErrors.segSocial ? '0 0 0 0.2rem rgba(220, 53, 69, 0.25)' : ''
                    }}
                />
                {showErrors.segSocial && (
                    <div className="text-danger" style={{ fontSize: '0.875em', marginTop: '0.25rem' }}>
                        O campo Segurança Social é obrigatório
                    </div>
                )}
                <input type="date" className="form-control" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} />
            </div>
        </div>
    );
};

export default TrabalhadorForm;
