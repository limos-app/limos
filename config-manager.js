// Gestor de configuración
class ConfigManager {
    constructor() {
        this.config = window.LIMOS_CONFIG || {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCurrentConfig();
        this.updateStatus();
    }

    setupEventListeners() {
        // Formulario
        document.getElementById('configForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveConfig();
        });

        // Botones
        document.getElementById('testConfigBtn').addEventListener('click', () => this.testConnection());
        document.getElementById('resetConfigBtn').addEventListener('click', () => this.resetConfig());

        // Modales
        document.getElementById('confirmYes').addEventListener('click', () => this.handleConfirm());
        document.getElementById('confirmNo').addEventListener('click', () => this.hideConfirmModal());
    }

    loadCurrentConfig() {
        // Cargar configuración actual en los campos
        document.getElementById('googleSheetsId').value = this.config.googleSheetsId || '';
        document.getElementById('sheetName').value = this.config.sheetName || 'Comidas';
        document.getElementById('apiKey').value = this.config.apiKey || '';
        document.getElementById('clientId').value = this.config.clientId || '';
    }

    saveConfig() {
        const newConfig = {
            googleSheetsId: document.getElementById('googleSheetsId').value.trim(),
            sheetName: document.getElementById('sheetName').value.trim(),
            apiKey: document.getElementById('apiKey').value.trim(),
            clientId: document.getElementById('clientId').value.trim()
        };

        // Validar campos requeridos
        if (!newConfig.googleSheetsId || !newConfig.sheetName || !newConfig.apiKey || !newConfig.clientId) {
            this.showNotification('Todos los campos son requeridos', 'error');
            return;
        }

        // Actualizar configuración
        this.config = { ...this.config, ...newConfig };
        
        // Guardar en localStorage como respaldo
        localStorage.setItem('limosConfig', JSON.stringify(this.config));
        
        // Actualizar el archivo config.js (esto requeriría una implementación más compleja)
        this.updateConfigFile();
        
        this.updateStatus();
        this.showNotification('Configuración guardada correctamente', 'success');
    }

    async updateConfigFile() {
        try {
            // Crear el contenido del archivo config.js
            const configContent = `// Configuración de Google Sheets
// Este archivo se guarda en GitHub para persistir la configuración
window.LIMOS_CONFIG = {
    // ID del Google Sheet (obtener de la URL del sheet)
    googleSheetsId: '${this.config.googleSheetsId}',
    
    // Nombre de la hoja dentro del Google Sheet
    sheetName: '${this.config.sheetName}',
    
    // Credenciales de Google Cloud Console
    apiKey: '${this.config.apiKey}',
    clientId: '${this.config.clientId}',
    
    // Configuración de la aplicación
    daysToGenerate: 60,
    
    // Versión de la configuración
    version: '1.0'
};

// Función para actualizar la configuración
window.updateLimosConfig = function(newConfig) {
    Object.assign(window.LIMOS_CONFIG, newConfig);
    console.log('Configuración actualizada:', window.LIMOS_CONFIG);
};`;

            // En un entorno real, aquí se haría una llamada a GitHub API para actualizar el archivo
            // Por ahora, solo simulamos el guardado
            console.log('Configuración a guardar en GitHub:', configContent);
            
            this.showNotification('Configuración guardada localmente. Para persistir en GitHub, haz commit manual.', 'info');
            
        } catch (error) {
            console.error('Error al actualizar archivo de configuración:', error);
            this.showNotification('Error al guardar configuración', 'error');
        }
    }

    async testConnection() {
        const googleSheetsId = document.getElementById('googleSheetsId').value.trim();
        const apiKey = document.getElementById('apiKey').value.trim();

        if (!googleSheetsId || !apiKey) {
            this.showNotification('Configura Google Sheets ID y API Key primero', 'error');
            return;
        }

        try {
            this.showLoading('Probando conexión con Google Sheets...');
            
            // Inicializar la API de Google
            await this.initializeGoogleAPI();
            
            // Intentar leer el sheet para verificar acceso
            const response = await gapi.client.sheets.spreadsheets.get({
                spreadsheetId: googleSheetsId
            });

            this.hideLoading();
            
            if (response.status === 200) {
                this.showNotification('Conexión exitosa con Google Sheets', 'success');
                document.getElementById('statusConnection').textContent = 'Conectado';
                document.getElementById('statusConnection').className = 'status-value success';
            } else {
                throw new Error('Respuesta inesperada del servidor');
            }
            
        } catch (error) {
            this.hideLoading();
            this.showNotification('Error de conexión: ' + error.message, 'error');
            document.getElementById('statusConnection').textContent = 'Error';
            document.getElementById('statusConnection').className = 'status-value error';
            console.error('Connection test error:', error);
        }
    }

    async initializeGoogleAPI() {
        return new Promise((resolve, reject) => {
            gapi.load('client', async () => {
                try {
                    await gapi.client.init({
                        apiKey: document.getElementById('apiKey').value.trim(),
                        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
                    });
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    resetConfig() {
        this.showConfirmModal(
            'Restablecer configuración',
            '¿Estás seguro de que quieres restablecer toda la configuración? Esto eliminará todos los datos guardados.',
            () => {
                // Limpiar campos
                document.getElementById('googleSheetsId').value = '';
                document.getElementById('sheetName').value = 'Comidas';
                document.getElementById('apiKey').value = '';
                document.getElementById('clientId').value = '';
                
                // Limpiar configuración
                this.config = {};
                localStorage.removeItem('limosConfig');
                
                this.updateStatus();
                this.showNotification('Configuración restablecida', 'success');
            }
        );
    }

    updateStatus() {
        // Actualizar estado de Google Sheets ID
        const sheetsIdStatus = document.getElementById('statusSheetsId');
        if (this.config.googleSheetsId) {
            sheetsIdStatus.textContent = 'Configurado';
            sheetsIdStatus.className = 'status-value success';
        } else {
            sheetsIdStatus.textContent = 'No configurado';
            sheetsIdStatus.className = 'status-value error';
        }

        // Actualizar estado de API Key
        const apiKeyStatus = document.getElementById('statusApiKey');
        if (this.config.apiKey) {
            apiKeyStatus.textContent = 'Configurado';
            apiKeyStatus.className = 'status-value success';
        } else {
            apiKeyStatus.textContent = 'No configurado';
            apiKeyStatus.className = 'status-value error';
        }

        // Actualizar estado de Client ID
        const clientIdStatus = document.getElementById('statusClientId');
        if (this.config.clientId) {
            clientIdStatus.textContent = 'Configurado';
            clientIdStatus.className = 'status-value success';
        } else {
            clientIdStatus.textContent = 'No configurado';
            clientIdStatus.className = 'status-value error';
        }
    }

    // Métodos de UI
    showLoading(message = 'Procesando...') {
        document.getElementById('loadingMessage').textContent = message;
        document.getElementById('loadingModal').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loadingModal').style.display = 'none';
    }

    showConfirmModal(title, message, onConfirm) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmModal').style.display = 'block';
        this.confirmCallback = onConfirm;
    }

    hideConfirmModal() {
        document.getElementById('confirmModal').style.display = 'none';
        this.confirmCallback = null;
    }

    handleConfirm() {
        if (this.confirmCallback) {
            this.confirmCallback();
        }
        this.hideConfirmModal();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.configManager = new ConfigManager();
}); 