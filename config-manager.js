// Gestor de configuración
class ConfigManager {
    constructor() {
        this.config = window.LIMOS_CONFIG || {};
        this.selectedInitials = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCurrentConfig();
        this.updateStatus();
        this.loadPeople();
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
        const createBtn = document.getElementById('personCreateBtn');
        if (createBtn) createBtn.addEventListener('click', () => this.createPerson());
        const updateBtn = document.getElementById('personUpdateBtn');
        if (updateBtn) updateBtn.addEventListener('click', () => this.updatePerson());
        const deleteBtn = document.getElementById('personDeleteBtn');
        if (deleteBtn) deleteBtn.addEventListener('click', () => this.deletePerson());

        // Modales
        document.getElementById('confirmYes').addEventListener('click', () => this.handleConfirm());
        document.getElementById('confirmNo').addEventListener('click', () => this.hideConfirmModal());
    }

    loadCurrentConfig() {
        document.getElementById('backendBaseUrl').value = this.config.backendBaseUrl || 'http://localhost:4000';
        document.getElementById('startDate').value = this.config.startDate || '2025-08-01';
        document.getElementById('daysToGenerate').value = this.config.daysToGenerate || 120;
        document.getElementById('maxYears').value = this.config.maxYears || 10;
    }

    saveConfig() {
        const newConfig = {
            backendBaseUrl: document.getElementById('backendBaseUrl').value.trim(),
            startDate: document.getElementById('startDate').value.trim(),
            daysToGenerate: parseInt(document.getElementById('daysToGenerate').value, 10),
            maxYears: parseInt(document.getElementById('maxYears').value, 10)
        };

        if (!newConfig.backendBaseUrl || !newConfig.startDate || !newConfig.daysToGenerate || !newConfig.maxYears) {
            this.showNotification('Todos los campos son requeridos', 'error');
            return;
        }

        this.config = { ...this.config, ...newConfig };
        localStorage.setItem('limosConfig', JSON.stringify(this.config));
        this.updateConfigFile();
        this.updateStatus();
        this.showNotification('Configuración guardada correctamente', 'success');
    }

    async updateConfigFile() {
        try {
            // Crear el contenido del archivo config.js
            const configContent = `// Configuración de LIMOS (almacenamiento en backend)
// Este archivo se guarda en GitHub para persistir la configuración
window.LIMOS_CONFIG = {
    backendBaseUrl: '${this.config.backendBaseUrl}',
    startDate: '${this.config.startDate}',
    daysToGenerate: ${this.config.daysToGenerate},
    maxYears: ${this.config.maxYears},
    version: '2.0'
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
        const baseUrl = document.getElementById('backendBaseUrl').value.trim();
        if (!baseUrl) {
            this.showNotification('Configura Backend Base URL primero', 'error');
            return;
        }
        try {
            this.showLoading('Probando conexión con el backend...');
            const res = await fetch(baseUrl + '/api/health');
            this.hideLoading();
            if (res.ok) {
                this.showNotification('Conexión exitosa con el backend', 'success');
                document.getElementById('statusConnection').textContent = 'Conectado';
                document.getElementById('statusConnection').className = 'status-value success';
            } else {
                throw new Error('El backend respondió con estado ' + res.status);
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('Error de conexión: ' + error.message, 'error');
            document.getElementById('statusConnection').textContent = 'Error';
            document.getElementById('statusConnection').className = 'status-value error';
            console.error('Connection test error:', error);
        }
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
        const backendStatus = document.getElementById('statusBackend');
        if (this.config.backendBaseUrl) {
            backendStatus.textContent = this.config.backendBaseUrl;
            backendStatus.className = 'status-value success';
        } else {
            backendStatus.textContent = 'No configurado';
            backendStatus.className = 'status-value error';
        }

        document.getElementById('statusStartDate').textContent = this.config.startDate || '-';
        document.getElementById('statusDays').textContent = String(this.config.daysToGenerate || '-');
        document.getElementById('statusMaxYears').textContent = String(this.config.maxYears || '-');
    }

    // Gestión de comensales
    async loadPeople() {
        try {
            const baseUrl = (this.config.backendBaseUrl || '').trim();
            if (!baseUrl) return;
            const res = await fetch(baseUrl + '/api/people');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const people = await res.json();
            const list = document.getElementById('peopleList');
            if (!list) return;
            list.innerHTML = '';
            people.forEach(p => {
                const item = document.createElement('div');
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.alignItems = 'center';
                item.style.padding = '6px 8px';
                item.style.borderBottom = '1px solid #eee';
                const regText = p.hasRegimen ? (p.regimenType ? `(R: ${p.regimenType})` : '(R)') : '';
                item.innerHTML = `<span><strong>${p.initials}</strong> - ${p.name || ''} ${p.resident ? '(Residente)' : ''} ${regText ? ' ' + regText : ''}</span>`;
                item.addEventListener('click', () => {
                    document.getElementById('personInitials').value = p.initials || '';
                    document.getElementById('personName').value = p.name || '';
                    document.getElementById('personResident').value = p.resident ? 'true' : 'false';
                    document.getElementById('personHasRegimen').value = p.hasRegimen ? 'true' : 'false';
                    document.getElementById('personRegimenType').value = p.regimenType || '';
                    this.selectedInitials = p.initials || null;
                    this.selectedPersonId = p.id || null;
                });
                list.appendChild(item);
            });
        } catch (err) {
            console.warn('No se pudieron cargar comensales:', err);
        }
    }

    async createPerson() {
        const baseUrl = (this.config.backendBaseUrl || '').trim();
        if (!baseUrl) return this.showNotification('Configura Backend Base URL', 'error');
        const body = {
            initials: document.getElementById('personInitials').value.trim(),
            name: document.getElementById('personName').value.trim(),
            resident: document.getElementById('personResident').value === 'true',
            regimen: document.getElementById('personRegimen').value.trim()
        };
        if (!body.initials || !body.name) return this.showNotification('Iniciales y Nombre son requeridos', 'error');
        const res = await fetch(baseUrl + '/api/people', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) return this.showNotification('Error creando comensal', 'error');
        this.showNotification('Comensal creado', 'success');
        this.loadPeople();
    }

    async updatePerson() {
        const baseUrl = (this.config.backendBaseUrl || '').trim();
        if (!baseUrl) return this.showNotification('Configura Backend Base URL', 'error');
        const currentInputInitials = document.getElementById('personInitials').value.trim();
        const initialsKey = this.selectedInitials || currentInputInitials;
        const body = {
            initials: currentInputInitials,
            name: document.getElementById('personName').value.trim(),
            resident: document.getElementById('personResident').value === 'true',
            hasRegimen: document.getElementById('personHasRegimen').value === 'true',
            regimenType: document.getElementById('personRegimenType').value.trim()
        };
        if (!body.initials || !body.name) return this.showNotification('Iniciales y Nombre son requeridos', 'error');
        // Preferir actualizar por id si está disponible
        const endpoint = this.selectedPersonId ? (`/api/people/id/${this.selectedPersonId}`) : (`/api/people/${encodeURIComponent(initialsKey)}`);
        const res = await fetch(baseUrl + endpoint, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) {
            if (res.status === 404) {
                // Si no existe, intentamos crearlo automáticamente
                const createRes = await fetch(baseUrl + '/api/people', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                if (!createRes.ok) {
                    const txt = await createRes.text().catch(() => '');
                    return this.showNotification('Error guardando cambios: ' + (txt || 'no se pudo crear'), 'error');
                }
            } else {
                const txt = await res.text().catch(() => '');
                return this.showNotification('Error guardando cambios' + (txt ? ': ' + txt : ''), 'error');
            }
        }
        this.showNotification('Cambios guardados', 'success');
        this.selectedInitials = body.initials;
        if (!this.selectedPersonId) {
            // buscar id refrescando lista
            await this.loadPeople();
        } else {
            await this.loadPeople();
        }
    }

    async deletePerson() {
        const baseUrl = (this.config.backendBaseUrl || '').trim();
        if (!baseUrl) return this.showNotification('Configura Backend Base URL', 'error');
        const inputInitials = document.getElementById('personInitials').value.trim();
        const initialsKey = this.selectedInitials || inputInitials;
        if (!initialsKey) return this.showNotification('Indica iniciales a eliminar', 'error');
        this.showConfirmModal('Eliminar comensal', '¿Estás seguro de eliminar al comensal y sus comidas?', async () => {
            const endpoint = this.selectedPersonId ? (`/api/people/id/${this.selectedPersonId}`) : (`/api/people/${encodeURIComponent(initialsKey)}`);
            const res = await fetch(baseUrl + endpoint, { method: 'DELETE' });
            if (!res.ok) {
                const txt = await res.text().catch(() => '');
                return this.showNotification('Error eliminando comensal' + (txt ? ': ' + txt : ''), 'error');
            }
            this.showNotification('Comensal eliminado', 'success');
            this.selectedInitials = null;
            this.selectedPersonId = null;
            this.loadPeople();
        });
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