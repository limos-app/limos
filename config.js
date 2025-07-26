// Configuración de Google Sheets
// Este archivo se guarda en GitHub para persistir la configuración
window.LIMOS_CONFIG = {
    // ID del Google Sheet (obtener de la URL del sheet)
    googleSheetsId: '',
    
    // Nombre de la hoja dentro del Google Sheet
    sheetName: 'Comidas',
    
    // Credenciales de Google Cloud Console
    apiKey: '',
    clientId: '',
    
    // Configuración de la aplicación
    daysToGenerate: 60,
    
    // Versión de la configuración
    version: '1.0'
};

// Función para actualizar la configuración
window.updateLimosConfig = function(newConfig) {
    Object.assign(window.LIMOS_CONFIG, newConfig);
    // Aquí se podría implementar guardado automático en GitHub
    console.log('Configuración actualizada:', window.LIMOS_CONFIG);
}; 