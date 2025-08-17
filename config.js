// Configuración de LIMOS (almacenamiento en backend)
// Este archivo se guarda en GitHub para persistir la configuración
window.LIMOS_CONFIG = {
    // URL base del backend (API)
    backendBaseUrl: 'http://localhost:4000',

    // Configuración de la aplicación
    // Fecha de inicio para la planificación
    startDate: '2025-08-01',
    // Cantidad de días a mostrar por bloque (evitar renderizar 10 años de una)
    daysToGenerate: 120,
    // Límite máximo de años permitidos
    maxYears: 10,

    // Versión de la configuración
    version: '2.0'
};

// Función para actualizar la configuración
window.updateLimosConfig = function(newConfig) {
    Object.assign(window.LIMOS_CONFIG, newConfig);
    console.log('Configuración actualizada:', window.LIMOS_CONFIG);
};