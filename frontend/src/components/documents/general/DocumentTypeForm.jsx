import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
    Box, Paper, Typography, TextField, Select, MenuItem, 
    Checkbox, IconButton, Button, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow 
} from '@mui/material';

import LayoutBase from '../base/LayoutBase'; 
import trash from '../../../assets/img/trash.png';
import edit from '../../../assets/img/edit.png';
import SpecificValuesModal from './SpecificValuesModal';

// --- CONFIGURACIÓN E INICIALIZACIÓN ---
const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const initialField = { 
    id: generateTempId(), fieldName: '', fieldType: 'char', specificValues: [], 
    fieldLength: 0, fieldPrecision: 0, isRequired: false, fieldOrder: 0, isNew: false,
};

// --- DICCIONARIO DE ESTILOS (MUI SX) ---
const styles = {
    pageWrapper: { backgroundColor: '#f1efef', minHeight: '100vh', padding: '40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap', boxSizing: 'border-box' },
    cardContainer: { padding: '35px 30px', borderRadius: '12px', width: '100%', maxWidth: '1350px', margin: '0 auto' },
    mainTitle: { color: '#421d83', mb: 4, fontWeight: 600, textAlign: 'center' },
    formGroup: { mb: 3 },
    label: { fontWeight: 'bold', mb: 1, color: '#191c16' },
    requiredAsterisk: { color: '#ff4d4f' },
    textInput: { backgroundColor: '#f9f9f9', '& .MuiOutlinedInput-root.Mui-focused': { backgroundColor: 'white' } },
    sectionSubtitle: { color: '#421d83', mb: 2, fontWeight: 600, borderBottom: '2px solid #8b56ed', pb: 1, fontSize: '1.1rem' },
    addButtonBox: { display: 'flex', justifyContent: 'flex-start', pb: 2 },
    addButton: { backgroundColor: '#421d83a3', textTransform: 'none', fontWeight: 'bold', borderRadius: '8px', '&:hover': { backgroundColor: '#8b56ed' } },
    tableContainer: { borderRadius: '8px', overflowX: 'auto', mb: 2 },
    tableHeadRow: { backgroundColor: '#e6e6fa' },
    tableHeadCell: { color: '#421d83', fontWeight: 'bold' },
    fixedRow: { backgroundColor: '#f0f4f8', borderBottom: '2px solid #ddd' },
    fixedInput: { input: { fontWeight: 'bold', color: '#555', cursor: 'not-allowed', backgroundColor: '#e9ecef' } },
    disabledInput: { backgroundColor: '#e9ecef', cursor: 'not-allowed' },
    disabledCheckbox: { '&.Mui-disabled': { color: 'rgba(0, 0, 0, 0.38)' } },
    saveButtonBox: { display: 'flex', justifyContent: 'center', mt: 3 },
    saveButton: { backgroundColor: '#421d83', color: 'white', padding: '12px 30px', borderRadius: '8px', fontSize: '1em', fontWeight: 'bold', textTransform: 'none', boxShadow: '0 4px 10px rgba(40, 167, 69, 0.2)', '&:hover': { backgroundColor: '#8b56ed' } },
    
    // Estilos dinámicos basados en estado
    dynamicRow: (isDragging) => ({
        backgroundColor: isDragging ? '#e3f2fd' : 'inherit',
        display: isDragging ? 'table' : 'table-row',
        boxShadow: isDragging ? '0 4px 8px rgba(0,0,0,0.1)' : 'none',
        '& td': { borderBottom: '1px solid #eee' }
    }),
    dynamicInput: (isDisabled) => ({
        backgroundColor: isDisabled ? '#f5f5f5' : 'white',
        cursor: isDisabled ? 'not-allowed' : 'text'
    }),
    trashIcon: (isDisabled) => ({
        width: 22, height: 22, 
        filter: isDisabled 
            ? 'invert(80%) sepia(0%) saturate(100%) hue-rotate(0deg) brightness(120%) contrast(90%)' 
            : 'invert(24%) sepia(85%) saturate(3000%) hue-rotate(338deg) brightness(70%) contrast(80%)'
    })
};

const CreateDocumentType = () => {
    const location = useLocation();
    const navigate = useNavigate(); 
    const { folderId, folderName, isEditing } = location.state || {};

    const [isLoading, setIsLoading] = useState(false);
    const [documentTypeId, setDocumentTypeId] = useState(null);
    const [documentTypeName, setDocumentTypeName] = useState('');
    const [documentTypeAlias, setDocumentTypeAlias] = useState('');
    const [documentTypeDescription, setDocumentTypeDescription] = useState('');
    const [fields, setFields] = useState([initialField]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentField, setCurrentField] = useState(null);

    // --- EFECTOS Y MANEJADORES DE ESTADO ---
    useEffect(() => {
        const loadData = async () => {
            if (isEditing && folderName) {
                setIsLoading(true);
                try {
                    const params = new URLSearchParams({ id: folderId });
                    const response = await fetch(`${apiUrl}/documents/getDocTypeFull?${params.toString()}`);
                    if (!response.ok) throw new Error('Error al obtener datos');
                    
                    const data = await response.json();
                    setDocumentTypeId(data.id);
                    setDocumentTypeName(data.name);
                    setDocumentTypeAlias(data.alias);
                    setDocumentTypeDescription(data.description || '');

                    if (data.fields && data.fields.length > 0) {
                        const mappedFields = data.fields.map(f => ({
                            id: f.id || generateTempId(),
                            fieldName: f.name,
                            fieldType: f.type,
                            fieldLength: f.length || 0,
                            fieldPrecision: f.precision || 0,
                            specificValues: f.specificValues || [],
                            isRequired: f.isRequired === 1 || f.isRequired === true,
                            fieldOrder: f.fieldOrder || 0 
                        }));
                        mappedFields.sort((a, b) => a.fieldOrder - b.fieldOrder);
                        setFields(mappedFields);
                    }
                } catch (error) {
                    console.error("Error cargando documento:", error);
                    alert("No se pudo cargar la información.");
                } finally {
                    setIsLoading(false);
                }
            } else {
                setFields([initialField]);
            }
        };
        loadData();
    }, [isEditing, folderName]);

    const handleAddField = () => {
        setFields(prev => [...prev, { ...initialField, id: generateTempId(), isNew: true }]);
    };

    const handleRemoveField = (id) => {
        if (fields.length > 1) setFields(prev => prev.filter(f => f.id !== id));
        else alert("El documento debe tener al menos un campo personalizado.");
    };

    const handleFieldChange = (id, event) => {
        const { name, value, type, checked } = event.target;
        const valToUse = type === 'checkbox' ? checked : value;

        if (name === 'fieldType' && value === 'specificValues') {
            const fieldToEdit = fields.find(f => f.id === id);
            setCurrentField({ ...fieldToEdit, [name]: valToUse });
            setIsModalOpen(true);
        }

        setFields(prev => prev.map(f => {
            if (f.id === id) {
                const updatedField = { ...f, [name]: valToUse };
                if (name === 'fieldType' && value !== 'float') {
                    if (value === 'char') updatedField.fieldLength = 1;
                    else { updatedField.fieldLength = 0; updatedField.fieldPrecision = 0; }
                }
                return updatedField;
            }
            return f;
        }));
    };

    const handleOpenModalForEdit = (field) => {
        if (field.fieldType === 'specificValues') {
            setCurrentField(field);
            setIsModalOpen(true);
        }
    };

    const handleSaveSpecificValues = (fieldId, values) => {
        setFields(prev => prev.map(f => f.id === fieldId ? { ...f, specificValues: values } : f));
        setCurrentField(null);
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;
        const fixedFields = fields.filter(f => f.fieldName.trim().toLowerCase() === 'nombre del documento');
        const dynamicFields = fields.filter(f => f.fieldName.trim().toLowerCase() !== 'nombre del documento');
        const [movedField] = dynamicFields.splice(result.source.index, 1);
        dynamicFields.splice(result.destination.index, 0, movedField);
        setFields([...fixedFields, ...dynamicFields]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!documentTypeName.trim() || !documentTypeAlias.trim()) return alert("El nombre y el alias son obligatorios.");
        if (!fields.every(f => f.fieldName.trim() !== '')) return alert("Todos los campos deben tener un nombre.");

        const processedFields = fields.map(f => ({
            id: (typeof f.id === 'string' && f.id.startsWith('temp-')) ? null : f.id, 
            name: f.fieldName, 
            type: f.fieldType,
            precision: f.fieldType === 'float' ? (parseInt(f.fieldPrecision) || 0) : 0,
            length: f.fieldType === 'char' ? 1 : (['date', 'bool', 'specificValues'].includes(f.fieldType) ? 0 : parseInt(f.fieldLength) || 0),
            specificValues: f.specificValues,
            isRequired: f.isRequired ? 1 : 0 
        }));

        let finalFieldsPayload = [...processedFields];
        if (!processedFields.some(f => f.name.trim().toLowerCase() === "nombre del documento")) {
            finalFieldsPayload = [{ id: null, name: "Nombre del Documento", type: "text", length: 150, precision: 0, specificValues: [], isRequired: 1 }, ...processedFields];
        }

        finalFieldsPayload = finalFieldsPayload.map((f, index) => ({ ...f, fieldOrder: index + 1 }));

        setIsLoading(true);
        try {
            const url = isEditing ? `${apiUrl}/documents/editDocType` : `${apiUrl}/documents/createDocType`;
            const method = isEditing ? 'PUT' : 'POST';
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
                id: isEditing ? documentTypeId : null, name: documentTypeName, alias: documentTypeAlias, description: documentTypeDescription, fields: finalFieldsPayload 
            })});

            if (!response.ok) throw new Error(`Error ${response.status}`);
            alert('Tipo de Documento guardado correctamente.');
            navigate('/documents'); 
        } catch (error) {
            console.error(error);
            alert(`Error al guardar: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- RENDERIZADO ---
    return (
        <LayoutBase activePage="documentType">
            <Box sx={styles.pageWrapper}>
                <Paper elevation={3} sx={styles.cardContainer}>
                    <Typography variant="h5" component="h2" sx={styles.mainTitle}>
                        {isEditing ? 'Editar Tipo de Documento' : 'Creación de Tipo de Documento'} 
                    </Typography>
                    
                    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                        
                        <Box sx={styles.formGroup}>
                            <Typography variant="subtitle2" sx={styles.label}>Nombre del Tipo de Documento <span style={styles.requiredAsterisk}>*</span></Typography>
                            <TextField fullWidth size="small" value={documentTypeName} onChange={(e) => setDocumentTypeName(e.target.value)} placeholder="Ingrese el nombre completo" required sx={styles.textInput} />
                        </Box>

                        <Box sx={styles.formGroup}>
                            <Typography variant="subtitle2" sx={styles.label}>Alias (Siglas) <span style={styles.requiredAsterisk}>*</span></Typography>
                            <TextField fullWidth size="small" value={documentTypeAlias} onChange={(e) => setDocumentTypeAlias(e.target.value)} placeholder="Ingrese el alias" required sx={styles.textInput} />
                        </Box>

                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle2" sx={styles.label}>Descripción</Typography>
                            <TextField fullWidth multiline rows={3} value={documentTypeDescription} onChange={(e) => setDocumentTypeDescription(e.target.value)} placeholder="Breve descripción..." sx={styles.textInput} />
                        </Box>

                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" sx={styles.sectionSubtitle}>Campos del Documento</Typography>

                            <Box sx={styles.addButtonBox}>
                                <Button variant="contained" onClick={handleAddField} sx={styles.addButton}>+ Agregar Campo</Button>
                            </Box>

                            <TableContainer component={Paper} variant="outlined" sx={styles.tableContainer}>
                                <Table sx={{ minWidth: 650 }}>
                                    <TableHead sx={styles.tableHeadRow}>
                                        <TableRow>
                                            <TableCell sx={{ ...styles.tableHeadCell, width: '30%' }}>Nombre del Campo</TableCell>
                                            <TableCell sx={{ ...styles.tableHeadCell, width: '15%' }}>Tipo de Dato</TableCell>
                                            <TableCell sx={{ ...styles.tableHeadCell, width: '5%' }}>Longitud</TableCell>
                                            <TableCell sx={{ ...styles.tableHeadCell, width: '5%' }}>Precisión</TableCell>
                                            <TableCell align="center" sx={{ ...styles.tableHeadCell, width: '5%' }}>Obligatorio</TableCell>
                                            <TableCell align="center" sx={{ ...styles.tableHeadCell, width: '5%', minWidth: '80px' }}>Acción</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    
                                    {/* CUERPO 1: CAMPO FIJO */}
                                    <TableBody>
                                        <TableRow sx={styles.fixedRow}>
                                            <TableCell><TextField size="small" value="Nombre del Documento" disabled fullWidth sx={styles.fixedInput} /></TableCell>
                                            <TableCell><Select size="small" value="textarea" disabled fullWidth sx={styles.disabledInput}><MenuItem value="textarea">Texto Largo</MenuItem></Select></TableCell>
                                            <TableCell><TextField size="small" type="number" value={200} disabled fullWidth sx={{ input: styles.disabledInput }} /></TableCell>
                                            <TableCell><TextField size="small" type="number" value={0} disabled fullWidth sx={{ input: styles.disabledInput }} /></TableCell>
                                            <TableCell align="center"><Checkbox checked disabled sx={styles.disabledCheckbox} /></TableCell>
                                            <TableCell align="center"><IconButton disabled sx={{ opacity: 0.3 }}><img src={trash} alt="Bloqueado" style={styles.trashIcon(true)} /></IconButton></TableCell>
                                        </TableRow>
                                    </TableBody>

                                    {/* CUERPO 2: CAMPOS DINÁMICOS */}
                                    <DragDropContext onDragEnd={handleDragEnd}>
                                        <Droppable droppableId="dynamic-fields-body">
                                            {(provided) => (
                                                <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                                                    {fields
                                                        .filter(f => f.fieldName.trim().toLowerCase() !== 'nombre del documento')
                                                        .map((field, index) => {
                                                            const isPrecisionDisabled = field.fieldType !== 'float' && field.fieldType !== 'money';
                                                            const isLengthDisabled = ['char', 'date', 'bool', 'specificValues'].includes(field.fieldType);
                                                            const isDeleteDisabled = (fields.length < 2) || (!field.isNew && isEditing);

                                                            return (
                                                                <Draggable key={field.id} draggableId={field.id.toString()} index={index}>
                                                                    {(provided, snapshot) => (
                                                                        <TableRow ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} sx={styles.dynamicRow(snapshot.isDragging)}>
                                                                            <TableCell><TextField size="small" name="fieldName" value={field.fieldName} onChange={(e) => handleFieldChange(field.id, e)} placeholder="Nombre" required fullWidth sx={{ backgroundColor: 'white' }} /></TableCell>
                                                                            <TableCell>
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                                    <Select size="small" name="fieldType" value={field.fieldType} onChange={(e) => handleFieldChange(field.id, e)} fullWidth sx={{ backgroundColor: 'white' }}>
                                                                                        <MenuItem value="char">Caracter (1 Letra)</MenuItem>
                                                                                        <MenuItem value="date">Fecha (DD/MM/AAAA)</MenuItem>
                                                                                        <MenuItem value="bool">Marcar Sí o No</MenuItem>
                                                                                        <MenuItem value="money">Moneda</MenuItem>
                                                                                        <MenuItem value="int">Número Entero</MenuItem>
                                                                                        <MenuItem value="float">Número Decimal</MenuItem>
                                                                                        <MenuItem value="text">Texto Corto</MenuItem>
                                                                                        <MenuItem value="textarea">Texto Largo</MenuItem>
                                                                                        <MenuItem value="specificValues">Valores Específicos</MenuItem>
                                                                                    </Select>
                                                                                    {field.fieldType === 'specificValues' && (
                                                                                        <IconButton onClick={() => handleOpenModalForEdit(field)} sx={{ p: 0.5, borderRadius: '6px' }}><img src={edit} alt="Editar" style={{ width: 20, height: 20 }} /></IconButton>
                                                                                    )}
                                                                                </Box>
                                                                            </TableCell>
                                                                            <TableCell><TextField size="small" type="number" name="fieldLength" value={field.fieldLength} onChange={(e) => handleFieldChange(field.id, e)} disabled={isLengthDisabled} inputProps={{ min: 0 }} fullWidth sx={styles.dynamicInput(isLengthDisabled)} /></TableCell>
                                                                            <TableCell><TextField size="small" type="number" name="fieldPrecision" value={field.fieldPrecision} onChange={(e) => handleFieldChange(field.id, e)} disabled={isPrecisionDisabled} inputProps={{ min: 0 }} fullWidth sx={styles.dynamicInput(isPrecisionDisabled)} /></TableCell>
                                                                            <TableCell align="center"><Checkbox name="isRequired" checked={field.isRequired} onChange={(e) => handleFieldChange(field.id, e)} sx={{ '&.Mui-checked': { color: '#8b56ed' } }} /></TableCell>
                                                                            <TableCell align="center">
                                                                                <IconButton onClick={() => handleRemoveField(field.id)} disabled={isDeleteDisabled} sx={{ '&:hover': { backgroundColor: 'rgba(220, 53, 69, 0.1)' } }}>
                                                                                    <img src={trash} alt="Eliminar" style={styles.trashIcon(isDeleteDisabled)} />
                                                                                </IconButton>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )}
                                                                </Draggable>
                                                            );
                                                        })}
                                                    {provided.placeholder}
                                                </TableBody>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                </Table>
                            </TableContainer>
                        </Box>

                        <Box sx={styles.saveButtonBox}>
                            <Button type="submit" variant="contained" disabled={isLoading} sx={styles.saveButton}>
                                {isLoading ? 'Guardando cambios' : (isEditing ? 'Actualizar Tipo de Documento' : 'Guardar Tipo de Documento')}
                            </Button>
                        </Box>
                    </form>
                </Paper>
                
                {isModalOpen && currentField && (
                    <SpecificValuesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} field={currentField} onSaveValues={handleSaveSpecificValues} />
                )}
            </Box>
        </LayoutBase>
    );
};

export default CreateDocumentType;