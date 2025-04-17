import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

import requiredDocsByCategory from '../constants/requiredDocsByCategory';

import EmpresaForm from '../components/EmpresaForm';
import TrabalhadorForm from '../components/TrabalhadorForm';
import EquipamentoForm from '../components/EquipamentoForm';
import AutorizacaoForm from '../components/AutorizacaoForm';
import DocumentosSelector from '../components/DocumentosSelector';
import FileUploader from '../components/FileUploader';
import DocumentosList from '../components/DocumentosList';

const UploadPage = () => {
    const { clienteId } = useParams();

    const [category, setCategory] = useState('Empresas');
    const [docType, setDocType] = useState('');
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [docsStatus, setDocsStatus] = useState({});

    // Empresa
    const [nomeEmpresa, setNomeEmpresa] = useState('');
    const [sede, setSede] = useState('');
    const [nif, setNif] = useState('');

    // Trabalhadores
    const [trabalhadoresExistentes, setTrabalhadoresExistentes] = useState([]);
    const [trabalhadorSelecionado, setTrabalhadorSelecionado] = useState('');
    const [nomeCompleto, setNomeCompleto] = useState('');
    const [funcao, setFuncao] = useState('');
    const [contribuinte, setContribuinte] = useState('');
    const [segSocial, setSegSocial] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');

    // Equipamento
    const [equipamentosExistentes, setEquipamentosExistentes] = useState([]);
    const [equipamentoSelecionado, setEquipamentoSelecionado] = useState('');
    const [marcaModelo, setMarcaModelo] = useState('');
    const [tipoMaquina, setTipoMaquina] = useState('');
    const [numeroSerie, setNumeroSerie] = useState('');

    // Autorizações
    const obrasDisponiveis = ["Obra A", "Obra B", "Obra C"];
    const [obraSelecionada, setObraSelecionada] = useState('');
    const [dataEntrada, setDataEntrada] = useState('');
    const [dataSaida, setDataSaida] = useState('');

    const requiredDocs = requiredDocsByCategory[category] || [];

    useEffect(() => {
        if (category === "Trabalhadores") {
            axios.get(`http://localhost:5000/trabalhadores/${clienteId}`)
                .then(res => setTrabalhadoresExistentes(res.data.trabalhadores))
                .catch(err => console.error("Erro ao buscar trabalhadores:", err));
        } else if (category === "Equipamentos") {
            axios.get(`http://localhost:5000/equipamentos/${clienteId}`)
                .then(res => setEquipamentosExistentes(res.data.equipamentos))
                .catch(err => console.error("Erro ao buscar equipamentos:", err));
        }
    }, [category, clienteId]);

    useEffect(() => {
        if ((category !== "Trabalhadores" && category !== "Equipamentos" && category !== "Autorizações") ||
            nomeCompleto || trabalhadorSelecionado ||
            marcaModelo || equipamentoSelecionado ||
            obraSelecionada) {
            fetchDocsStatus();
        }
    }, [category, nomeCompleto, trabalhadorSelecionado, marcaModelo, equipamentoSelecionado, obraSelecionada]);

    const fetchDocsStatus = async () => {
        try {
            let endpoint = `http://localhost:5000/files/${clienteId}?category=${category}`;
            if (category === "Trabalhadores") {
                const nome = trabalhadorSelecionado || nomeCompleto;
                if (!nome) return;
                endpoint += `&trabalhador=${encodeURIComponent(nome)}`;
            } else if (category === "Equipamentos") {
                const nomeEquip = equipamentoSelecionado || marcaModelo;
                if (!nomeEquip) return;
                endpoint += `&equipamento=${encodeURIComponent(nomeEquip)}`;
            } else if (category === "Autorizações" && obraSelecionada) {
                endpoint += `&obra=${encodeURIComponent(obraSelecionada)}`;
            }
            const res = await axios.get(endpoint);
            const docsMap = {};
            res.data.files.forEach(doc => {
                docsMap[doc.name] = doc.status;
            });
            setDocsStatus(docsMap);
        } catch (err) {
            console.error('Erro ao buscar documentos:', err);
            // Não mostra mensagem de erro, apenas limpa o status dos documentos
            setDocsStatus({});
        }
    };

    const handleUpload = async () => {
        if (!file || !docType) return alert("Selecione um ficheiro e o tipo de documento");

        const nomeFinal = category === "Trabalhadores" ? (trabalhadorSelecionado || nomeCompleto) : null;
        if (category === "Trabalhadores" && !nomeFinal) return alert("Selecione ou digite o nome do trabalhador");

        const renamedFile = new File([file], `${docType}`, { type: file.type });
        const formData = new FormData();
        formData.append("file", renamedFile);
        formData.append("docType", docType);

        // Dados adicionais por categoria
        if (category === "Empresas") {
            formData.append("nomeEmpresa", nomeEmpresa);
            formData.append("sede", sede);
            formData.append("nif", nif);
        } else if (category === "Trabalhadores") {
            formData.append("nomeCompleto", nomeFinal);
            formData.append("funcao", funcao);
            formData.append("contribuinte", contribuinte);
            formData.append("segSocial", segSocial);
            formData.append("dataNascimento", dataNascimento);
        } else if (category === "Equipamentos") {
            formData.append("marcaModelo", marcaModelo);
            formData.append("tipoMaquina", tipoMaquina);
            formData.append("numeroSerie", numeroSerie);
        } else if (category === "Autorizações") {
            formData.append("obra", obraSelecionada);
            formData.append("dataEntrada", dataEntrada);
            if (dataSaida) formData.append("dataSaida", dataSaida);
        }

        try {
            setMessage("A enviar...");
            const folderPath =
                category === "Trabalhadores"
                    ? `Subempreiteiros/${clienteId}/Trabalhadores/${nomeFinal}`
                    : category === "Equipamentos"
                        ? `Subempreiteiros/${clienteId}/Equipamentos/${equipamentoSelecionado || marcaModelo}`
                        : category === "Autorizações"
                            ? `Subempreiteiros/${clienteId}/Autorizações/${obraSelecionada}`
                            : `Subempreiteiros/${clienteId}/${category}`;

            const res = await axios.post(
                `http://localhost:5000/upload?folder=${encodeURIComponent(folderPath)}`,
                formData
            );

            setMessage("✅ " + res.data.message);
            fetchDocsStatus();
        } catch (err) {
            console.error(err);
            setMessage("❌ Erro: " + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="container mt-4">
            <div className="bg-primary text-white p-4 rounded mb-4">
                <h2>Envio de Documentos - Subempreiteiro {clienteId}</h2>
            </div>

            <div className="card p-4 mb-4">
                <div className="form-group">
                    <label>Categoria:</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ marginBottom: 20 }}>
                        {Object.keys(requiredDocsByCategory).map((cat, idx) => (
                            <option key={idx} value={cat}>{cat}</option>
                        ))}
                    </select>

                    {/* Campos dinâmicos */}
                    {category === 'Empresas' && (
                        <EmpresaForm
                            nomeEmpresa={nomeEmpresa}
                            sede={sede}
                            nif={nif}
                            setNomeEmpresa={setNomeEmpresa}
                            setSede={setSede}
                            setNif={setNif}
                        />
                    )}

                    {category === 'Trabalhadores' && (
                        <TrabalhadorForm
                            nomeCompleto={nomeCompleto}
                            setNomeCompleto={setNomeCompleto}
                            funcao={funcao}
                            setFuncao={setFuncao}
                            contribuinte={contribuinte}
                            setContribuinte={setContribuinte}
                            segSocial={segSocial}
                            setSegSocial={setSegSocial}
                            dataNascimento={dataNascimento}
                            setDataNascimento={setDataNascimento}
                            trabalhadoresExistentes={trabalhadoresExistentes}
                            trabalhadorSelecionado={trabalhadorSelecionado}
                            setTrabalhadorSelecionado={setTrabalhadorSelecionado}
                        />
                    )}

                    {category === 'Equipamentos' && (
                        <EquipamentoForm
                            equipamentosExistentes={equipamentosExistentes}
                            equipamentoSelecionado={equipamentoSelecionado}
                            setEquipamentoSelecionado={setEquipamentoSelecionado}
                            marcaModelo={marcaModelo}
                            setMarcaModelo={setMarcaModelo}
                            tipoMaquina={tipoMaquina}
                            setTipoMaquina={setTipoMaquina}
                            numeroSerie={numeroSerie}
                            setNumeroSerie={setNumeroSerie}
                        />
                    )}

                    {category === 'Autorizações' && (
                        <AutorizacaoForm
                            obrasDisponiveis={obrasDisponiveis}
                            obraSelecionada={obraSelecionada}
                            setObraSelecionada={setObraSelecionada}
                            dataEntrada={dataEntrada}
                            setDataEntrada={setDataEntrada}
                            dataSaida={dataSaida}
                            setDataSaida={setDataSaida}
                        />
                    )}

                    {/* Seleção de Documento e Upload */}
                    <DocumentosSelector docType={docType} setDocType={setDocType} requiredDocs={requiredDocs} />
                    <FileUploader onFileChange={(e) => setFile(e.target.files[0])} onUpload={handleUpload} />

                    <p>{message}</p>

                    <DocumentosList requiredDocs={requiredDocs} docsStatus={docsStatus} />
                </div>
            </div>
        </div>
    );
};

export default UploadPage;
