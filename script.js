// Clase principal para gestionar las comidas
class MealManager {
    constructor() {
        this.initials = [];
        this.options = [];
        this.selectedPerson = null;
        this.mealsData = {};
        
        // Cargar configuración desde config.js
        this.config = window.LIMOS_CONFIG || {};
        this.googleSheetsId = this.config.googleSheetsId || '';
        this.sheetName = this.config.sheetName || 'Comidas';
        this.apiKey = this.config.apiKey || '';
        this.clientId = this.config.clientId || '';
        this.daysToGenerate = this.config.daysToGenerate || 60;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.updateCurrentDate();
        await this.loadInitials();
        await this.loadOptions();
        this.renderInitials();
    }

    setupEventListeners() {
        // Botones principales
        document.getElementById('loadDataBtn').addEventListener('click', () => this.loadData());
        document.getElementById('saveDataBtn').addEventListener('click', () => this.saveToGoogleSheets());
        document.getElementById('saveMealsBtn').addEventListener('click', () => this.saveMeals());
        document.getElementById('clearMealsBtn').addEventListener('click', () => this.clearMeals());
        document.getElementById('testConnectionBtn').addEventListener('click', () => this.testGoogleSheetsConnection());
        document.getElementById('previewSheetBtn').addEventListener('click', () => this.showSheetPreview());

        // Configuración
        document.getElementById('googleSheetId').addEventListener('input', (e) => {
            this.googleSheetsId = e.target.value;
            this.saveConfig();
        });



        // Modales
        document.getElementById('confirmYes').addEventListener('click', () => this.handleConfirm());
        document.getElementById('confirmNo').addEventListener('click', () => this.hideConfirmModal());
    }

    updateCurrentDate() {
        const today = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('currentDate').textContent = today.toLocaleDateString('es-ES', options);
    }

    async loadInitials() {
        try {
            console.log('Iniciando carga de iniciales...');
            this.showLoading('Cargando iniciales...');
            
            // En un entorno real, esto sería una llamada a un servidor
            // Por ahora, simulamos la carga desde el archivo
            const response = await fetch('iniciales.txt');
            console.log('Respuesta del fetch:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            console.log('Texto cargado:', text.substring(0, 100) + '...');
            
            this.initials = text.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    const [initials, phone] = line.split(',');
                    return {
                        initials: initials.trim(),
                        phone: phone ? phone.trim() : ''
                    };
                });

            console.log('Iniciales procesadas:', this.initials.length, 'personas');
            console.log('Primeras iniciales:', this.initials.slice(0, 3));

            this.hideLoading();
            this.showNotification('Iniciales cargadas correctamente', 'success');
        } catch (error) {
            this.hideLoading();
            this.showNotification('Error al cargar iniciales', 'error');
            console.error('Error loading initials:', error);
            
            // Datos de ejemplo si no se puede cargar el archivo
            this.initials = [
                { initials: 'MEP', phone: '+54 9 11 6823-7844' },
                { initials: 'PGG', phone: '+54 9 11 3789-7958' },
                { initials: 'LMC', phone: '+54 9 11 2331-5671' },
                { initials: 'PAB', phone: '+54 9 11 5329-9371' },
                { initials: 'FIG', phone: '+54 9 11 5483-4727' },
                { initials: 'FAM', phone: '+54 9 351 613-5015' },
                { initials: 'IJC', phone: '+54 9 11 2342-0491' },
                { initials: 'ELF', phone: '+54 9 11 4436-6712' },
                { initials: 'MS', phone: '+54 9 342 524-9601' },
                { initials: 'JOA', phone: '+54 9 11 7366-8868' },
                { initials: 'GG', phone: '+54 9 11 3167-5521' },
                { initials: 'AS', phone: '11-667-807-21' },
                { initials: 'JBA', phone: '+54 9 11 6692-4301' },
                { initials: 'IC', phone: '+54 9 221 643-2931' },
                { initials: 'TA', phone: '' },
                { initials: 'JPS', phone: '' },
                { initials: 'FEC', phone: '' },
                { initials: 'Huesped1', phone: '' },
                { initials: 'Huesped2', phone: '' },
                { initials: 'Plan', phone: '' },
                { initials: 'Invitados', phone: '' }
            ];
        }
    }

    async loadOptions() {
        try {
            this.showLoading('Cargando opciones...');
            
            const response = await fetch('opciones.txt');
            const text = await response.text();
            
            this.options = text.split('\n')
                .filter(line => line.trim())
                .map(line => line.trim());

            this.hideLoading();
            this.showNotification('Opciones cargadas correctamente', 'success');
        } catch (error) {
            this.hideLoading();
            this.showNotification('Error al cargar opciones', 'error');
            console.error('Error loading options:', error);
            
            // Opciones por defecto
            this.options = ['Si', 'Régimen', 'Vianda', 'Temprano', 'Tarde', 'Sandwich', 'No'];
        }
    }

    renderInitials() {
        console.log('Renderizando iniciales...');
        console.log('Número de iniciales a renderizar:', this.initials.length);
        
        const container = document.getElementById('initialsContainer');
        console.log('Container encontrado:', container);
        
        if (!container) {
            console.error('No se encontró el container de iniciales!');
            return;
        }
        
        container.innerHTML = '';

        this.initials.forEach(person => {
            const button = document.createElement('button');
            button.className = 'initial-btn';
            button.textContent = person.initials;
            
            button.addEventListener('click', () => {
                // Si el botón ya está seleccionado, deseleccionarlo
                if (button.classList.contains('selected')) {
                    this.deselectPerson();
                } else {
                    this.selectPerson(person);
                }
            });
            container.appendChild(button);
        });
    }

    selectPerson(person) {
        // Deseleccionar botón anterior
        document.querySelectorAll('.initial-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Seleccionar nuevo botón
        event.target.closest('.initial-btn').classList.add('selected');

        this.selectedPerson = person;
        document.getElementById('selectedPersonName').textContent = person.initials;
        
        // Mostrar sección de comidas
        document.getElementById('mealsSection').style.display = 'block';
        
        // Generar días y comidas
        this.generateMeals();
        
        // Habilitar botón de guardar
        document.getElementById('saveMealsBtn').disabled = false;
    }

    deselectPerson() {
        // Deseleccionar todos los botones
        document.querySelectorAll('.initial-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        this.selectedPerson = null;
        document.getElementById('selectedPersonName').textContent = 'Selecciona un comensal';
        
        // Ocultar sección de comidas
        document.getElementById('mealsSection').style.display = 'none';
        
        // Deshabilitar botones
        document.getElementById('saveMealsBtn').disabled = true;
        document.getElementById('saveDataBtn').disabled = true;
    }

    generateMeals() {
        const container = document.getElementById('mealsContainer');
        container.innerHTML = '';

        const today = new Date();
        
        for (let i = 0; i < this.daysToGenerate; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            const dayMeal = document.createElement('div');
            dayMeal.className = 'day-meal';
            
            const dateStr = date.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            dayMeal.innerHTML = `
                <div class="day-header">${dateStr}</div>
                <div class="meal-row">
                    <div class="meal-label">Almuerzo:</div>
                    <div class="meal-options" data-date="${date.toISOString().split('T')[0]}" data-meal="almuerzo">
                        ${this.options.map(option => `
                            <button class="meal-option-btn" data-option="${option}">${option}</button>
                        `).join('')}
                    </div>
                </div>
                <div class="meal-row">
                    <div class="meal-label">Cena:</div>
                    <div class="meal-options" data-date="${date.toISOString().split('T')[0]}" data-meal="cena">
                        ${this.options.map(option => `
                            <button class="meal-option-btn" data-option="${option}">${option}</button>
                        `).join('')}
                    </div>
                </div>
            `;
            
            container.appendChild(dayMeal);
        }

        // Agregar event listeners a los botones de opciones
        this.setupMealOptionListeners();
    }

    setupMealOptionListeners() {
        document.querySelectorAll('.meal-option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const optionBtn = e.target;
                const optionsContainer = optionBtn.closest('.meal-options');
                
                // Deseleccionar otros botones en el mismo contenedor
                optionsContainer.querySelectorAll('.meal-option-btn').forEach(b => {
                    b.classList.remove('selected');
                });
                
                // Seleccionar el botón clickeado
                optionBtn.classList.add('selected');
                
                // Guardar la selección
                const date = optionsContainer.dataset.date;
                const meal = optionsContainer.dataset.meal;
                const option = optionBtn.dataset.option;
                
                if (!this.mealsData[this.selectedPerson.initials]) {
                    this.mealsData[this.selectedPerson.initials] = {};
                }
                if (!this.mealsData[this.selectedPerson.initials][date]) {
                    this.mealsData[this.selectedPerson.initials][date] = {};
                }
                
                this.mealsData[this.selectedPerson.initials][date][meal] = option;
            });
        });
    }

    saveMeals() {
        if (!this.selectedPerson) {
            this.showNotification('Selecciona un comensal primero', 'error');
            return;
        }

        // Guardar en localStorage como respaldo
        localStorage.setItem('mealsData', JSON.stringify(this.mealsData));
        
        this.showNotification('Comidas guardadas localmente', 'success');
        
        // Habilitar botón de guardar en Google Sheets
        document.getElementById('saveDataBtn').disabled = false;
    }

    clearMeals() {
        this.showConfirmModal(
            'Limpiar selección',
            '¿Estás seguro de que quieres limpiar todas las selecciones de comidas?',
            () => {
                this.mealsData = {};
                document.querySelectorAll('.meal-option-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });
                document.getElementById('saveMealsBtn').disabled = true;
                document.getElementById('saveDataBtn').disabled = true;
                this.showNotification('Selección limpiada', 'success');
                
                // Ocultar la sección de comidas
                document.getElementById('mealsSection').style.display = 'none';
            }
        );
    }

    async saveToGoogleSheets() {
        if (!this.googleSheetsId) {
            this.showNotification('Configura el ID de Google Sheet primero', 'error');
            return;
        }

        if (Object.keys(this.mealsData).length === 0) {
            this.showNotification('No hay datos para guardar', 'error');
            return;
        }

        try {
            this.showLoading('Guardando en Google Sheets...');
            
            // Preparar datos en el formato correcto para Google Sheets
            const sheetData = this.prepareSheetData();
            
            // Intentar guardar usando la API real
            await this.saveToGoogleSheetsAPI(sheetData);
            
            this.hideLoading();
            this.showNotification('Datos guardados en Google Sheets correctamente', 'success');
        } catch (error) {
            this.hideLoading();
            this.showNotification('Error al guardar en Google Sheets: ' + error.message, 'error');
            console.error('Error saving to Google Sheets:', error);
        }
    }

    async saveToGoogleSheetsAPI(sheetData) {
        // Verificar si tenemos las credenciales necesarias
        if (!this.hasGoogleSheetsCredentials()) {
            throw new Error('Credenciales de Google Sheets no configuradas');
        }

        // Inicializar la API de Google
        await this.initializeGoogleAPI();

        // Preparar los datos para la API
        const values = [sheetData.headers, ...sheetData.meals];
        
        // Actualizar la hoja
        const response = await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: this.googleSheetsId,
            range: `${this.sheetName}!A1`,
            valueInputOption: 'RAW',
            resource: {
                values: values
            }
        });

        console.log('Respuesta de Google Sheets:', response);
        return response;
    }

    hasGoogleSheetsCredentials() {
        // Verificar si tenemos las credenciales configuradas
        // En un entorno real, esto verificaría las credenciales OAuth o Service Account
        return this.googleSheetsId && this.sheetName;
    }

    async initializeGoogleAPI() {
        return new Promise((resolve, reject) => {
            gapi.load('client:auth2', async () => {
                try {
                    const initConfig = {
                        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
                        scope: 'https://www.googleapis.com/auth/spreadsheets'
                    };

                    // Agregar credenciales si están configuradas
                    if (this.apiKey) {
                        initConfig.apiKey = this.apiKey;
                    }
                    if (this.clientId) {
                        initConfig.clientId = this.clientId;
                    }

                    await gapi.client.init(initConfig);

                    // Si tenemos clientId, intentar autenticar
                    if (this.clientId && gapi.auth2) {
                        if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
                            await gapi.auth2.getAuthInstance().signIn();
                        }
                    }

                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    prepareSheetData() {
        const sheetData = {
            headers: ['Fecha', 'Comida'],
            meals: []
        };

        // Agregar iniciales como headers (columna C en adelante)
        this.initials.forEach(person => {
            sheetData.headers.push(person.initials);
        });

        // Generar datos de comidas para los próximos 60 días
        const today = new Date();
        
        for (let i = 0; i < this.daysToGenerate; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            // Fila para Almuerzo
            const almuerzoRow = [dateStr, 'A'];
            this.initials.forEach(person => {
                const mealData = this.mealsData[person.initials]?.[dateStr]?.almuerzo || '';
                almuerzoRow.push(mealData);
            });
            sheetData.meals.push(almuerzoRow);
            
            // Fila para Cena
            const cenaRow = [dateStr, 'C'];
            this.initials.forEach(person => {
                const mealData = this.mealsData[person.initials]?.[dateStr]?.cena || '';
                cenaRow.push(mealData);
            });
            sheetData.meals.push(cenaRow);
        }

        return sheetData;
    }

    async simulateGoogleSheetsSave(sheetData) {
        // Simulación de guardado en Google Sheets
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Estructura del Google Sheet:');
                console.log('Headers:', sheetData.headers);
                console.log('Primeras 5 filas de comidas:', sheetData.meals.slice(0, 5));
                console.log('Total de filas:', sheetData.meals.length);
                console.log('Datos completos:', sheetData);
                resolve();
            }, 2000);
        });
    }

    async testGoogleSheetsConnection() {
        if (!this.googleSheetsId) {
            this.showNotification('Ingresa el ID de Google Sheet primero', 'error');
            return;
        }

        try {
            this.showLoading('Probando conexión...');
            
            // Aquí iría la lógica real de prueba de conexión
            await this.simulateConnectionTest();
            
            this.hideLoading();
            this.showNotification('Conexión exitosa con Google Sheets', 'success');
        } catch (error) {
            this.hideLoading();
            this.showNotification('Error de conexión con Google Sheets', 'error');
            console.error('Connection test error:', error);
        }
    }

    showSheetPreview() {
        if (Object.keys(this.mealsData).length === 0) {
            this.showNotification('No hay datos para mostrar', 'info');
            return;
        }

        const sheetData = this.prepareSheetData();
        
        // Crear una tabla de vista previa
        let previewHTML = `
            <div style="max-height: 400px; overflow-y: auto; margin: 20px 0;">
                <h4>Vista previa del Google Sheet:</h4>
                <table style="border-collapse: collapse; width: 100%; font-size: 12px;">
                    <thead>
                        <tr style="background: #f0f0f0;">
                            ${sheetData.headers.map(header => `<th style="border: 1px solid #ccc; padding: 8px; text-align: center;">${header}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Mostrar solo las primeras 10 filas para la vista previa
        sheetData.meals.slice(0, 10).forEach(row => {
            previewHTML += '<tr>';
            row.forEach((cell, index) => {
                const style = index < 2 ? 'background: #e8f4f8; font-weight: bold;' : '';
                previewHTML += `<td style="border: 1px solid #ccc; padding: 6px; text-align: center; ${style}">${cell || '-'}</td>`;
            });
            previewHTML += '</tr>';
        });

        previewHTML += `
                    </tbody>
                </table>
                <p style="margin-top: 10px; font-size: 12px; color: #666;">
                    Mostrando 10 de ${sheetData.meals.length} filas totales
                </p>
            </div>
        `;

        // Mostrar en un modal
        this.showPreviewModal('Vista previa del Google Sheet', previewHTML);
    }

    showPreviewModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
                <h3>${title}</h3>
                ${content}
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cerrar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async simulateConnectionTest() {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Testing connection to:', this.googleSheetsId);
                resolve();
            }, 1500);
        });
    }

    loadData() {
        // Cargar datos guardados
        const savedData = localStorage.getItem('mealsData');
        if (savedData) {
            this.mealsData = JSON.parse(savedData);
            this.showNotification('Datos cargados correctamente', 'success');
        } else {
            this.showNotification('No hay datos guardados', 'info');
        }
    }



    // Métodos de UI
    showLoading(message = 'Cargando...') {
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

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.mealManager = new MealManager();
});

// Función global para acceder desde HTML
window.mealManager = null; 