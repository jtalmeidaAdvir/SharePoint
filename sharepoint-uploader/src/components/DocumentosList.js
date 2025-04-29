import React, { useState, useEffect } from "react";
import FileUploader from "./FileUploader";
import AlertModal from "./AlertModal";
import axios from "axios";

const DocumentosList = ({
    requiredDocs = [],
    docsStatus = {},
    entityData,
    selectedWorker,
    selectedEquipment,
    marca,
    onUpload,
}) => {
    const [showModal, setShowModal] = useState(false);
    const [docType, setDocType] = useState("");
    const [file, setFile] = useState(null);
    const tiposSemInput = [
        "Condições do Seguro de Acidentes de Trabalho",
        "Manual de utilizador",
        "Certificado ou Declaração",
        "Certificado CE",
        "Registos de Manutenção"
    ];
    const tiposSemValidade = [
        "Condições do Seguro de Acidentes de Trabalho",
        "Manual de utilizador",
        "Certificado ou Declaração",
        "Certificado CE",
        "Registos de Manutenção"
    ];
    const deveExibirInput = !tiposSemInput.includes(docType);

    const extractValidityDate = (status) => {
        if (!status) return null;
        if (status.includes("&#40;")) {
            const match = status.match(
                /&#40;Válido até&#58;\s*(\d{2}\/\d{2}\/\d{4})&#41;/,
            );
            return match ? match[1] : null;
        }

        const match = status.match(/Válido até\s*:\s*(\d{2}\/\d{2}\/\d{4})/);
        return match ? match[1] : null;
    };

    const getValidityDate = (docName, status, entityData, selectedWorker, selectedEquipment) => {
        if (selectedWorker) {
            const docMap = {
                "Cartão de Cidadão ou residência": selectedWorker.caminho1,
                "Ficha Médica de aptidão": selectedWorker.caminho2,
                "Credenciação do trabalhador": selectedWorker.caminho3,
                "Trabalhos especializados": selectedWorker.caminho4,
                "Ficha de distribuição de EPI": selectedWorker.caminho5,
            };

            const docStatus = docMap[docName];
            if (docStatus) {
                const validityMatch = docStatus.match(
                    /&#40;Válido até&#58;\s*(\d{2}\/\d{2}\/\d{4})&#41;/,
                );
                if (validityMatch) return validityMatch[1];
            }
        }
        if (selectedEquipment) {
            const docMap = {
                "Seguro": selectedEquipment.caminho5,
            },
                docStatus = docMap[docName];
            if (docStatus) {
                const validityMatch = docStatus.match(
                    /&#40;Válido até&#58;\s*(\d{2}\/\d{2}\/\d{4})&#41;/,
                );
                if (validityMatch) return validityMatch[1];
            }
        }


        if (status?.includes("Válido até")) {
            const validity = extractValidityDate(status);
            return validity;
        }

        const validityMap = {
            "Alvará ou Certificado de Construção ou Atividade":
                entityData?.CDU_ValidadeAlvara,
            "Certidão de não dívida às Finanças":
                entityData?.CDU_ValidadeFinancas,
            "Certidão de não dívida à Segurança Social":
                entityData?.CDU_ValidadeSegSocial,
            "Comprovativo de Pagamento":
                entityData?.CDU_ValidadeComprovativoPagamento,
            "Condições do Seguro de Acidentes de Trabalho":
                entityData?.CDU_ValidadeSeguroRC,
            "Seguro de Responsabilidade Civil":
                entityData?.CDU_ValidadeSeguroRC,
            "Certidão Permanente": entityData?.CDU_ValidadeCertidaoPermanente,
            "Folha de Remuneração Mensal à Segurança Social":
                entityData?.CDU_FolhaPagSegSocial,
            "Recibo do Seguro de Acidentes de Trabalho":
                entityData?.CDU_ValidadeReciboSeguroAT,
        };

        const date = validityMap[docName];
        if (!date) return null;
        return new Date(date).toLocaleDateString();
    };

    const [tempValidade, setTempValidade] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [alertModal, setAlertModal] = useState({
        show: false,
        message: "",
        type: "success",
    });

    const handleConfirmUpload = async () => {
        setIsUploading(true);
        let folderPath = `Subempreiteiros/${entityData?.Nome}/Empresas`;
        const formData = new FormData();


        formData.append("file", file);
        formData.append("docType", docType);
        formData.append("contribuinte", selectedWorker?.contribuinte);
        formData.append("marca", marca);
        console.log("marca", marca);
        formData.append("idEntidade", entityData?.ID);
        formData.append(
            "validade",
            tiposSemValidade.includes(docType) ? "" : tempValidade
        );
        formData.append("anexo", "true");

        if (selectedWorker?.id) {
            // Adiciona o nome do trabalhador ao caminho
            folderPath = `Subempreiteiros/${entityData?.Nome}/Trabalhadores/${selectedWorker.nome}`;
        }

        axios
            .post(
                `http://localhost:5000/upload?folder=${encodeURIComponent(folderPath)}`,
                formData,
            )
            .then((res) => {
                console.log("Upload successful:", res.data);
                setShowModal(false);
                setTempValidade("");
                setIsUploading(false);
                setAlertModal({
                    show: true,
                    message: "Documento enviado com sucesso!",
                    type: "success",
                });
                // window.dispatchEvent(new CustomEvent('resetDocsStatus'));
            })
            .catch((err) => {
                console.error("Upload error:", err);
                setIsUploading(false);
                alert(
                    "Erro ao fazer upload: " +
                    (err.response?.data?.error || err.message),
                );
            });
    };


    useEffect(() => {
        if (showModal && !deveExibirInput) {
            handleConfirmUpload();
        }
    }, [showModal, deveExibirInput]);



    return (
        <div className="docs-list mt-4">
            <AlertModal
                show={alertModal.show}
                message={alertModal.message}
                type={alertModal.type}
                onClose={() =>
                    setAlertModal({ show: false, message: "", type: "success" })
                }
            />
            {showModal && (
                <div
                    className="modal"
                    style={{
                        display: "block",
                        backgroundColor: "rgba(0,0,0,0.5)",
                    }}
                >
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {deveExibirInput ? "Insira a Validade do Documento" : "A enviar documento..."}
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>

                            <div className="modal-body">
                                {deveExibirInput ? (
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={tempValidade}
                                        onChange={(e) => setTempValidade(e.target.value)}
                                    />
                                ) : (
                                    <div className="d-flex align-items-center justify-content-center gap-2 py-2">
                                        <div className="spinner-border text-primary" role="status" />
                                        <span className="text-primary fw-semibold">A enviar documento...</span>
                                    </div>
                                )}
                            </div>

                            {deveExibirInput && (
                                <div className="modal-footer">
                 
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleConfirmUpload}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    role="status"
                                                    aria-hidden="true"
                                                ></span>
                                                A enviar...
                                            </>
                                        ) : (
                                            "Confirmar"
                                        )}
                                    </button>
                                </div>
                            )}


                        </div>
                    </div>

                </div>
            )}
            <div className="row row-cols-1 row-cols-md-2 g-4">
                {requiredDocs?.map(
                    (doc, index) =>
                        doc && (
                            <div key={index} className="col">
                                <div className="card h-100 border-0 shadow-sm">
                                    <div className="card-body">
                                        <div className="d-flex align-items-start gap-3">
                                            <div className="status-icon">
                                                {docsStatus &&
                                                    doc &&
                                                    docsStatus[doc]?.includes(
                                                        "✅",
                                                    ) ? (
                                                    <span className="badge bg-success rounded-circle p-2">
                                                        <i className="bi bi-check-lg"></i>
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-danger rounded-circle p-2">
                                                        <i className="bi bi-x-lg"></i>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-grow-1">
                                                <h6 className="mb-2 fw-bold text-dark">
                                                    {doc}
                                                </h6>
                                                <p className="mb-0 small">
                                                    <span
                                                        className={`status-badge ${docsStatus?.[doc]?.includes("✅") ? "text-success" : "text-danger"}`}
                                                    >
                                                        {docsStatus?.[doc]
                                                            ? docsStatus[doc]
                                                                .replace(
                                                                    "✅",
                                                                    "",
                                                                )
                                                                .replace(
                                                                    "❌",
                                                                    "",
                                                                )
                                                                .replace(
                                                                    /\(Válido até:[^)]*\)/,
                                                                    "",
                                                                )
                                                            : "Não enviado"}
                                                    </span>
                                                    {getValidityDate(
                                                        doc,
                                                        docsStatus?.[doc],
                                                        entityData,
                                                        selectedWorker,
                                                        selectedEquipment,
                                                    ) && (
                                                            <span className="ms-2 text-muted">
                                                                | Validade:{" "}
                                                                {getValidityDate(
                                                                    doc,
                                                                    docsStatus?.[
                                                                    doc
                                                                    ],
                                                                    entityData,
                                                                    selectedWorker,
                                                                    selectedEquipment,
                                                                )}
                                                            </span>
                                                        )}
                                                </p>
                                                <div className="mt-2">
                                                    <input
                                                        type="file"
                                                        id={`file-${index}`}
                                                        className="d-none"
                                                        onChange={(e) => {
                                                            const file =
                                                                e.target
                                                                    .files[0];
                                                            if (file) {
                                                                if (
                                                                    entityData?.Nome
                                                                ) {
                                                                    setShowModal(
                                                                        true,
                                                                    );
                                                                    setDocType(
                                                                        doc,
                                                                    );
                                                                    setFile(
                                                                        file,
                                                                    );
                                                                } else if (
                                                                    selectedWorker
                                                                ) {
                                                                    console.log('Selected Worker:', selectedWorker); // <= AQUI!
                                                                    onUpload(
                                                                        doc,
                                                                        file,
                                                                        {
                                                                            idEntidade:
                                                                                selectedWorker.id,
                                                                            validade:
                                                                                new Date(
                                                                                    selectedWorker.data_validade ||
                                                                                    Date.now(),
                                                                                )
                                                                                    .toISOString()
                                                                                    .split(
                                                                                        "T",
                                                                                    )[0],
                                                                        },
                                                                    );
                                                                } else if (
                                                                    selectedEquipment
                                                                ) {
                                                                    console.log('Selected Equipment:', selectedEquipment); // <= AQUI!
                                                                    onUpload(
                                                                        doc,
                                                                        file,
                                                                        {
                                                                            idEntidade:
                                                                                selectedEquipment.id,
                                                                            validade: 
                                                                                new Date(
                                                                                    selectedEquipment.data_validade ||
                                                                                    Date.now(),
                                                                                )
                                                                                    .toISOString()
                                                                                    .split(
                                                                                        "T",
                                                                                    )[0],
                                                                        },
                                                                    );
                                                                }

                                                                else {
                                                                    if (
                                                                        entityData?.Nome
                                                                    ) {
                                                                        setShowModal(
                                                                            true,
                                                                        );
                                                                        setDocType(
                                                                            doc,
                                                                        );
                                                                        setFile(
                                                                            file,
                                                                        );
                                                                    } else {
                                                                        console.log(
                                                                            "Documento selecionado:",
                                                                            doc,
                                                                        );
                                                                        onUpload(
                                                                            doc,
                                                                            file,
                                                                        );
                                                                    }
                                                                }
                                                            }
                                                            e.target.value = "";
                                                        }}
                                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                    />
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() =>
                                                            document
                                                                .getElementById(
                                                                    `file-${index}`,
                                                                )
                                                                .click()
                                                        }
                                                    >
                                                        <i className="bi bi-upload me-1"></i>
                                                        Upload
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ),
                )}
            </div>
        </div>
    );
};

export default DocumentosList;