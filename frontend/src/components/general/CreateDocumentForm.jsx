import React, { useState, useMemo } from 'react';
import LayoutBase from '../base/LayoutBase'; 
import '../../styles/general/documentTypeForm.css'; 
import DocumentFieldsModal from './DocumentFieldsModal';


// --- Tipos de Documentos con Campos Dinámicos ---
const MOCK_DOCUMENT_TYPES = [
    {
        id: 'rif',
        name: 'Registro de Identificación Fiscal (RIF)',
        fields: [
            // Campo de Valores Específicos: Se convierte en un <select>
            { name: 'Prefijo RIF', typeId: 'specific-values', specificValues: ['V', 'J', 'G', 'E'] },
            // Campo de Número Entero: Se convierte en un <input type="number">
            { name: 'Número RIF', typeId: 'integer', length: 9 }, 
            { name: 'Razón Social', typeId: 'text-short', length: 100 },
            // Campo de Texto Largo: Se convierte en un <textarea>
            { name: 'Dirección Fiscal', typeId: 'text-long', length: 500 }, 
        ]
    },
    {
        id: 'invoice',
        name: 'Factura de Venta',
        fields: [
            { name: 'Número de Factura', typeId: 'text-short', length: 20 },
            { name: 'Fecha de Emisión', typeId: 'date' },
            // Campo de Número Decimal (con precisión 2): Se convierte en <input type="number" step="0.01">
            { name: 'Monto Neto', typeId: 'decimal', precision: 2 }, 
            { name: 'IVA (16%)', typeId: 'decimal', precision: 2 },
            { name: 'Método de Pago', typeId: 'specific-values', specificValues: ['Transferencia', 'Punto de Venta', 'Efectivo'] },
        ]
    },
    {
        id: 'hr-contract',
        name: 'Contrato Laboral',
        fields: [
            { name: 'Cédula de Identidad', typeId: 'integer', length: 8 },
            { name: 'Fecha de Ingreso', typeId: 'date' },
            { name: 'Puesto', typeId: 'text-short', length: 50 },
            { name: 'Salario Base', typeId: 'decimal', precision: 2 },
        ]
    }
];

// --- Empresas Asociadas  ---
const MOCK_COMPANIES = [
    { id: '1', name: 'ACME C.A.' },
    { id: '2', name: 'Gipsy Solutions' },
    { id: '3', name: 'Industrias Vega' },
];


const CreateDocumentForm = () => {

    const [selectedDocTypeId, setSelectedDocTypeId] = useState('');
    const [selectedCompanyId, setSelectedCompanyId] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);

    const currentDocType = useMemo(() => {
        return MOCK_DOCUMENT_TYPES.find(dt => dt.id === selectedDocTypeId);
    }, [selectedDocTypeId]);

    const currentCompany = useMemo(() => {
        return MOCK_COMPANIES.find(dt => dt.id === selectedCompanyId);
    }, [selectedCompanyId]);

    const handleContinue = (e) => {
        e.preventDefault();
        if (selectedDocTypeId && selectedCompanyId) {
            setIsModalOpen(true); // Abre el modal
        } else {
            alert('Por favor, seleccione el Tipo de Documento y la Empresa Asociada.');
        }
    };
    
    // Función que se ejecuta cuando el modal ha completado la creación
    const handleSaveDocument = (documentData) => {
        console.log("==> Proceso de Creación Completado <==");
        console.log("Tipo de Documento:", documentData.docTypeName);
        console.log("Campos Rellenados:", documentData.fieldsData);
        console.log("Archivo Adjunto:", documentData.attachment);
        alert(`Documento de tipo "${documentData.docTypeName}" registrado con éxito.`);
    };


    return (
        <LayoutBase>
            <div className="document-type-wrapper-page">
                <div className="cardContainerDocType document-create-card">
                    
                    <h2 className="main-title">Creación de Documento</h2>
                    <form className="document-create-form" onSubmit={handleContinue}>
                        
                        <div className="form-section">
                            
                            {/* Primer campo: Tipo de Documento (Select) */}
                            <div className="form-group-doc-type">
                                <label htmlFor="docType" className="form-label">Tipo de Documento:</label>
                                <select 
                                    id="docType"
                                    className="table-select"
                                    value={selectedDocTypeId}
                                    onChange={(e) => setSelectedDocTypeId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Seleccione un Tipo de Documento</option>
                                    {MOCK_DOCUMENT_TYPES.map(docType => (
                                        <option key={docType.id} value={docType.id}>
                                            {docType.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Segundo campo: Empresa Asociada (Select) */}
                            <div className="form-group-doc-type">
                                <label htmlFor="company" className="form-label">Empresa Asociada al Documento:</label>
                                <select 
                                    id="company"
                                    className="table-select"
                                    value={selectedCompanyId}
                                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Seleccione una Empresa</option>
                                    {MOCK_COMPANIES.map(company => (
                                        <option key={company.id} value={company.id}>
                                            {company.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Botón de Siguiente/Continuar */}
                        <div className="form-footer-buttons">
                            <button type="submit" className="save-document-type-button continue-button-doc">
                                Siguiente
                            </button>
                        </div>
                    </form>
                </div>
                
                {/* Renderizado Condicional del Modal */}
                {currentDocType && currentCompany && (
                    <DocumentFieldsModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        company={currentCompany}
                        documentType={currentDocType}
                        onSaveDocument={handleSaveDocument}
                    />
                )}
            </div>
        </LayoutBase>
    );
};

export default CreateDocumentForm;