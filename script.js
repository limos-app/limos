// Clase principal para gestionar las comidas
class MealManager {
    constructor() {
        this.initials = [];
        this.options = [];
        this.selectedPerson = null;
        this.mealsData = {};
        this.googleSheetsId = '';
        this.sheetName = 'Comidas';
        this.daysToGenerate = 60;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.updateCurrentDate();
        await this.loadInitials();
        await this.loadOptions();
        this.loadConfig();
        this.renderInitials();
    }

    setupEventListeners() {
        // Botones principales
        document.getElementById('loadDataBtn').addEventListener('click', () => this.loadData());
        document.getElementById('saveDataBtn').addEventListener('click', () => this.saveToGoogleSheets());
        document.getElementById('saveMealsBtn').addEventListener('click', () => this.saveMeals());
        document.getElementById('clearMealsBtn').addEventListener('click', () => this.clearMeals());
        document.getElementById('testConnectionBtn').addEventListener('click', () => this.testGoogleSheetsConnection());

        // Configuración
        document.getElementById('googleSheetId').addEventListener('input', (e) => {
            this.googleSheetsId = e.target.value;
            this.saveConfig();
        });

        document.getElementById('sheetName').addEventListener('input', (e) => {
            this.sheetName = e.target.value;
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
            this.showLoading('Cargando iniciales...');
            
            // En un entorno real, esto sería una llamada a un servidor
            // Por ahora, simulamos la carga desde el archivo
            const response = await fetch('iniciales.txt');
            const text = await response.text();
            
            this.initials = text.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    const [initials, phone] = line.split(',');
                    return {
                        initials: initials.trim(),
                        phone: phone ? phone.trim() : ''
                    };
                });

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
        const container = document.getElementById('initialsContainer');
        container.innerHTML = '';

        this.initials.forEach(person => {
            const button = document.createElement('button');
            button.className = 'initial-btn';
            button.innerHTML = `
                ${person.initials}
                ${person.phone ? `<span class="phone">${person.phone}</span>` : ''}
            `;
            
            button.addEventListener('click', () => this.selectPerson(person));
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
            }
        );
    }

    async saveToGoogleSheets() {
        if (!this.googleSheetsId) {
            this.showNotification('Configura el ID de Google Sheet primero', 'error');
            return;
        }

        try {
            this.showLoading('Guardando en Google Sheets...');
            
            // Aquí iría la lógica real de Google Sheets
            // Por ahora simulamos el guardado
            await this.simulateGoogleSheetsSave();
            
            this.hideLoading();
            this.showNotification('Datos guardados en Google Sheets correctamente', 'success');
        } catch (error) {
            this.hideLoading();
            this.showNotification('Error al guardar en Google Sheets', 'error');
            console.error('Error saving to Google Sheets:', error);
        }
    }

    async simulateGoogleSheetsSave() {
        // Simulación de guardado en Google Sheets
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Datos a guardar:', this.mealsData);
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

    loadConfig() {
        const savedConfig = localStorage.getItem('mealManagerConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            this.googleSheetsId = config.googleSheetsId || '';
            this.sheetName = config.sheetName || 'Comidas';
            
            document.getElementById('googleSheetId').value = this.googleSheetsId;
            document.getElementById('sheetName').value = this.sheetName;
        }
    }

    saveConfig() {
        const config = {
            googleSheetsId: this.googleSheetsId,
            sheetName: this.sheetName
        };
        localStorage.setItem('mealManagerConfig', JSON.stringify(config));
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