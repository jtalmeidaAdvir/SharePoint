import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const requiredDocsByCategory = {
    Empresas: [
        "Certidão de não dívida às Finanças",
        "Certidão de não dívida à Segurança Social",
        "Certidão Permanente",
        "Folha de Remuneração Mensal à Segurança Social",
        "Comprovativo de Pagamento",
        "Recibo do Seguro de Acidentes de Trabalho",
        "Seguro de Responsabilidade Civil",
        "Condições do Seguro de Acidentes de Trabalho",
        "Alvará/Certificado de Construção ou Atividade",
        "XPTO"
    ],
    Trabalhadores: [
        "Cartão de Cidadão ou residência",
        "Ficha Médica de aptidão",
        "Credenciação do trabalhador",
        "Trabalhos especializados",
        "Ficha de distribuição de EPI's"
    ],
    Equipamentos: [
        "Certificado CE",
        "Certificado/Declaração",
        "Registos de Manutenção",
        "Manual de utilizador",
        "Seguro"
    ],
    Autorizações: [
        "Contrato/Nota de encomenda",
        "Horário de trabalho da empreitada",
        "Declaração de adesão ao PSS",
        "Declaração do responsável do estaleiro"
    ]
};

function UploadPage() {
    const { clienteId } = useParams();
    const [file, setFile] = useState(null);
    const [category, setCategory] = useState('Empresas');
    const [message, setMessage] = useState('');
    const [docsStatus, setDocsStatus] = useState({});
    const [docType, setDocType] = useState('');

    // Campos do trabalhador
    const [nomeCompleto, setNomeCompleto] = useState('');
    const [trabalhadoresExistentes, setTrabalhadoresExistentes] = useState([]);
    const [trabalhadorSelecionado, setTrabalhadorSelecionado] = useState('');

    // Campos adicionais
    const [funcao, setFuncao] = useState('');
    const [contribuinte, setContribuinte] = useState('');
    const [segSocial, setSegSocial] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');

    // Empresa
    const [nomeEmpresa, setNomeEmpresa] = useState('');
    const [sede, setSede] = useState('');
    const [nif, setNif] = useState('');

    // Equipamento
    const [marcaModelo, setMarcaModelo] = useState('');
    const [tipoMaquina, setTipoMaquina] = useState('');
    const [numeroSerie, setNumeroSerie] = useState('');

    // Autorização
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
        }
    }, [category, clienteId]);

    useEffect(() => {
        if (category !== "Trabalhadores" || nomeCompleto || trabalhadorSelecionado) {
            fetchDocsStatus();
        }
    }, [category, nomeCompleto, trabalhadorSelecionado]);

    const fetchDocsStatus = async () => {
        try {
            let endpoint = `http://localhost:5000/files/${clienteId}?category=${category}`;
            if (category === "Trabalhadores") {
                const nome = trabalhadorSelecionado || nomeCompleto;
                if (!nome) return;
                endpoint += `&trabalhador=${encodeURIComponent(nome)}`;
            }

            const res = await axios.get(endpoint);
            const docsMap = {};
            res.data.files.forEach(doc => {
                docsMap[doc.name] = doc.status;
            });
            setDocsStatus(docsMap);
        } catch (err) {
            console.error('Erro ao buscar documentos:', err);
            setMessage('❌ Erro ao buscar documentos. Veja logs.');
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file || !docType) return alert("Escolha um ficheiro e selecione o tipo de documento");

        const nomeFinal = category === "Trabalhadores" ? (trabalhadorSelecionado || nomeCompleto) : null;
        if (category === "Trabalhadores" && !nomeFinal) return alert("Selecione ou digite o nome do trabalhador");

        const renamedFile = new File([file], `${docType}`, { type: file.type });
        const formData = new FormData();
        formData.append("file", renamedFile);
        formData.append("docType", docType);

        // Info adicional
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
        <div style={{ padding: 20 }}>
            <h2>Envio de Documentos - Subempreiteiro {clienteId}</h2>

            <label>Categoria:</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ marginBottom: 20 }}>
                {Object.keys(requiredDocsByCategory).map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                ))}
            </select>

            {category === "Empresas" && (
                <div>
                    <input type="text" placeholder="Nome da Empresa" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} /><br />
                    <input type="text" placeholder="Sede" value={sede} onChange={(e) => setSede(e.target.value)} /><br />
                    <input type="text" placeholder="NIF/NIPC" value={nif} onChange={(e) => setNif(e.target.value)} />
                </div>
            )}

            {category === "Trabalhadores" && (
                <div>
                    <label>Trabalhador existente:</label>
                    <select value={trabalhadorSelecionado} onChange={(e) => setTrabalhadorSelecionado(e.target.value)}>
                        <option value="">-- Selecione --</option>
                        {trabalhadoresExistentes.map((t, i) => (
                            <option key={i} value={t}>{t}</option>
                        ))}
                    </select><br />
                    <label>Ou digite novo nome:</label><br />
                    <input type="text" placeholder="Nome Completo" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} /><br />
                    <input type="text" placeholder="Função" value={funcao} onChange={(e) => setFuncao(e.target.value)} /><br />
                    <input type="text" placeholder="Contribuinte" value={contribuinte} onChange={(e) => setContribuinte(e.target.value)} /><br />
                    <input type="text" placeholder="Segurança Social" value={segSocial} onChange={(e) => setSegSocial(e.target.value)} /><br />
                    <input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} />
                </div>
            )}

            {category === "Equipamentos" && (
                <div>
                    <input type="text" placeholder="Marca / Modelo" value={marcaModelo} onChange={(e) => setMarcaModelo(e.target.value)} /><br />
                    <input type="text" placeholder="Tipo de Máquina" value={tipoMaquina} onChange={(e) => setTipoMaquina(e.target.value)} /><br />
                    <input type="text" placeholder="Número de Série" value={numeroSerie} onChange={(e) => setNumeroSerie(e.target.value)} />
                </div>
            )}

            {category === "Autorizações" && (
                <div>
                    <select value={obraSelecionada} onChange={(e) => setObraSelecionada(e.target.value)}>
                        <option value="">Selecione uma obra</option>
                        {obrasDisponiveis.map((obra, index) => (
                            <option key={index} value={obra}>{obra}</option>
                        ))}
                    </select><br />
                    <input type="date" value={dataEntrada} onChange={(e) => setDataEntrada(e.target.value)} /><br />
                    <input type="date" value={dataSaida} onChange={(e) => setDataSaida(e.target.value)} placeholder="Data de Saída (opcional)" />
                </div>
            )}

            <h3>Documentos obrigatórios para {category}:</h3>
            <select onChange={(e) => setDocType(e.target.value)} value={docType}>
                <option value="">Selecione um documento</option>
                {requiredDocs.map((doc, index) => (
                    <option key={index} value={doc}>{doc}</option>
                ))}
            </select><br />

            <input type="file" onChange={handleFileChange} /><br />
            <button onClick={handleUpload}>Fazer Upload</button>

            <p>{message}</p>

            <ul>
                {requiredDocs.map((doc, index) => (
                    <li key={index} style={{ color: docsStatus[doc] === '✅ Enviado' ? 'green' : 'red' }}>
                        {doc} <span>{docsStatus[doc] || '❌ Não enviado'}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}


export default UploadPage;
