// Clase principal para gestionar las comidas
class MealManager {
    constructor() {
        this.initials = [];
        this.options = [];
        this.selectedPerson = null;
        this.mealsData = {};
        
        // Cargar configuración desde config.js
        this.config = window.LIMOS_CONFIG || {};
        this.backendBaseUrl = this.config.backendBaseUrl || 'http://localhost:4000';
        this.startDate = this.config.startDate || '2025-08-01';
        this.daysToGenerate = this.config.daysToGenerate || 120;
        this.maxYears = this.config.maxYears || 10;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.updateCurrentDate();
        await this.loadInitials();
        await this.loadOptions();
        this.renderInitials();
        this.updateIncompleteBadgesForToday().catch(err => console.warn('Badges init failed', err));
    }

    setupEventListeners() {
        // Botones principales - solo agregar si existen
        const loadDataBtn = document.getElementById('loadDataBtn');
        if (loadDataBtn) {
            loadDataBtn.addEventListener('click', () => this.loadData());
        }

        const saveDataBtn = document.getElementById('saveDataBtn');
        if (saveDataBtn) {
            saveDataBtn.addEventListener('click', () => this.saveToBackend());
        }

        const saveMealsBtn = document.getElementById('saveMealsBtn');
        if (saveMealsBtn) {
            saveMealsBtn.addEventListener('click', () => this.saveMeals());
        }

        const clearMealsBtn = document.getElementById('clearMealsBtn');
        if (clearMealsBtn) {
            clearMealsBtn.addEventListener('click', () => this.clearMeals());
        }

        // Botones opcionales - solo agregar si existen
        const testConnectionBtn = document.getElementById('testConnectionBtn');
        if (testConnectionBtn) {
            testConnectionBtn.addEventListener('click', () => this.testBackendConnection());
        }

        const todayBtn = document.getElementById('todayBtn');
        if (todayBtn) {
            todayBtn.addEventListener('click', () => this.showTodaySummary());
        }

        const previewSheetBtn = document.getElementById('previewSheetBtn');
        if (previewSheetBtn) {
            previewSheetBtn.addEventListener('click', () => this.showSheetPreview());
        }

        // Configuración - solo agregar si existe
        const backendBaseUrlInput = document.getElementById('backendBaseUrl');
        if (backendBaseUrlInput) {
            backendBaseUrlInput.addEventListener('input', (e) => {
                this.backendBaseUrl = e.target.value;
                this.saveConfig();
            });
        }

        // Modales - solo agregar si existen
        const confirmYes = document.getElementById('confirmYes');
        if (confirmYes) {
            confirmYes.addEventListener('click', () => this.handleConfirm());
        }

        const confirmNo = document.getElementById('confirmNo');
        if (confirmNo) {
            confirmNo.addEventListener('click', () => this.hideConfirmModal());
        }
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
            console.log('Iniciando carga de personas desde backend...');
            this.showLoading('Cargando comensales...');

            let ok = false;
            try {
                const res = await fetch(this.backendBaseUrl + '/api/people');
                if (res.ok) {
                    const people = await res.json();
                    this.initials = people.map(p => ({
                        initials: p.initials,
                        name: p.name,
                        resident: !!p.resident,
                        regimen: p.regimen || ''
                    }));
                    ok = true;
                }
            } catch (e) {
                console.warn('Fallo backend, usando archivo locales como respaldo', e);
            }

            if (!ok) {
                // Respaldo: cargar desde archivo local
                const response = await fetch('iniciales.txt');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
            }

            this.hideLoading();
            this.showNotification('Comensales cargados', 'success');
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
        this.showLoading('Cargando opciones...');
        try {
            // 1) Intentar backend
            if (this.backendBaseUrl) {
                const res = await fetch(this.backendBaseUrl + '/api/options');
                if (res.ok) {
                    const arr = await res.json();
                    if (Array.isArray(arr) && arr.length) {
                        this.options = arr;
                        this.hideLoading();
                        this.showNotification('Opciones cargadas', 'success');
                        return;
                    }
                }
            }
            // 2) Intentar archivo local como respaldo
            const response = await fetch('opciones.txt');
            const text = await response.text();
            this.options = text.split('\n').filter(line => line.trim()).map(line => line.trim());
            this.hideLoading();
            this.showNotification('Opciones cargadas', 'success');
        } catch (error) {
            this.hideLoading();
            console.warn('Fallo carga de opciones, usando predeterminadas:', error);
            // 3) Opciones por defecto
            this.options = ['Si', 'Régimen', 'Vianda', 'Temprano', 'Tarde', 'Sandwich', 'No'];
            this.showNotification('Usando opciones predeterminadas', 'info');
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

        // Orden personalizado: residentes (A-Z) -> no residentes (A-Z) -> Huesped1, Huesped2 -> Invitados, Plan
        const normalize = (s) => (s || '').toString().toLowerCase().replace(/\s+/g, '');
        const computeGroup = (p) => {
            const norm = normalize(p.initials);
            if (norm === 'huesped1') return { group: 3, rank: 1 };
            if (norm === 'huesped2') return { group: 3, rank: 2 };
            if (norm === 'invitados') return { group: 4, rank: 1 };
            if (norm === 'plan') return { group: 4, rank: 2 };
            if (p.resident) return { group: 1, rank: 0 };
            return { group: 2, rank: 0 };
        };
        const displayName = (p) => (p.name && p.name.trim()) || p.initials;
        const collator = new Intl.Collator('es', { sensitivity: 'base' });
        const sorted = [...this.initials].sort((a, b) => {
            const ga = computeGroup(a);
            const gb = computeGroup(b);
            if (ga.group !== gb.group) return ga.group - gb.group;
            if (ga.group === 3 || ga.group === 4) return ga.rank - gb.rank;
            const comp = collator.compare(displayName(a), displayName(b));
            if (comp !== 0) return comp;
            return collator.compare(a.initials, b.initials);
        });

        sorted.forEach(person => {
            const button = document.createElement('button');
            button.className = 'initial-btn';
            button.textContent = person.initials;
            button.dataset.initials = person.initials;
            
            button.addEventListener('click', (ev) => {
                if (button.classList.contains('selected')) {
                    this.deselectPerson();
                } else {
                    this.selectPerson(person, ev.currentTarget);
                }
            });
            container.appendChild(button);
        });
    }

    selectPerson(person, buttonEl) {
        // Deseleccionar botón anterior
        document.querySelectorAll('.initial-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Seleccionar nuevo botón y ocultar los demás
        const clickedBtn = buttonEl;
        clickedBtn.classList.add('selected');
        document.querySelectorAll('.initial-btn').forEach(btn => {
            if (btn !== clickedBtn) {
                btn.style.display = 'none';
            }
        });

        this.selectedPerson = person;
        
        // Mostrar sección de comidas
        document.getElementById('mealsSection').style.display = 'block';
        
        // Generar días y comidas
        this.generateMeals();

        // Cargar comidas existentes desde el backend para el rango visible
        const from = this.startDate;
        const endDate = new Date(this.startDate);
        endDate.setDate(endDate.getDate() + this.daysToGenerate - 1);
        const to = endDate.toISOString().split('T')[0];
        this.loadMealsFromBackend(from, to, person.initials).catch(err => {
            console.warn('No se pudo cargar comidas previas:', err);
        });
        
        // Habilitar botón de guardar
        document.getElementById('saveMealsBtn').disabled = false;
    }

    deselectPerson() {
        // Deseleccionar todos los botones
        document.querySelectorAll('.initial-btn').forEach(btn => {
            btn.classList.remove('selected');
            btn.style.display = '';
        });

        this.selectedPerson = null;
        // No mostramos el nombre seleccionado en la UI de cabecera
        
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

                // Guardado local inmediato como respaldo
                try {
                    localStorage.setItem('mealsData', JSON.stringify(this.mealsData));
                } catch {}

                // Guardado automático en backend
                this.autoSaveSelection(this.selectedPerson.initials, date, meal, option);

                // Actualizar badge del día de hoy si corresponde
                const todayIso = this.getTodayIso();
                if (date === todayIso) {
                    this.updateBadgeForInitials(this.selectedPerson.initials);
                }
            });
        });
    }

    getTodayIso() {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    async updateIncompleteBadgesForToday() {
        try {
            const iso = this.getTodayIso();
            if (!this.backendBaseUrl) return;
            const res = await fetch(this.backendBaseUrl + `/api/meals?from=${iso}&to=${iso}`);
            if (!res.ok) return;
            const rows = await res.json();
            const have = {};
            rows.forEach(r => {
                if (!have[r.initials]) have[r.initials] = { A: false, C: false };
                if (r.mealType === 'A') have[r.initials].A = true;
                if (r.mealType === 'C') have[r.initials].C = true;
            });
            // For each resident, show badge if not both
            this.initials.forEach(p => {
                if (!p.resident) { this.setBadge(p.initials, false); return; }
                const status = have[p.initials] || { A: false, C: false };
                const incomplete = !(status.A && status.C);
                this.setBadge(p.initials, incomplete);
            });
        } catch (e) {
            console.warn('updateIncompleteBadgesForToday error', e);
        }
    }

    updateBadgeForInitials(initials) {
        const iso = this.getTodayIso();
        const day = this.mealsData[initials]?.[iso] || {};
        const complete = !!(day.almuerzo) && !!(day.cena);
        this.setBadge(initials, !complete);
    }

    setBadge(initials, show) {
        const btn = document.querySelector(`.initial-btn[data-initials="${CSS.escape(initials)}"]`);
        if (!btn) return;
        let badge = btn.querySelector('.badge-alert');
        if (show) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'badge-alert';
                badge.textContent = '!';
                btn.appendChild(badge);
            }
        } else {
            if (badge && badge.parentNode) badge.parentNode.removeChild(badge);
        }
    }

    async autoSaveSelection(initials, date, mealKey, value) {
        if (!this.backendBaseUrl) {
            console.warn('Backend Base URL no configurado, se omite guardado remoto');
            return;
        }
        const mealType = mealKey === 'almuerzo' ? 'A' : 'C';
        const payload = { records: [{ initials, date, mealType, value }] };
        try {
            const res = await fetch(this.backendBaseUrl + '/api/meals/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || ('HTTP ' + res.status));
            }
            // No notificación para no saturar; dejar trazas en consola
            console.debug('Guardado OK', initials, date, mealType, value);
        } catch (error) {
            console.error('Error guardando selección:', error);
            this.showNotification('Error al guardar en servidor. Se guardó localmente.', 'error');
        }
    }

    async loadMealsFromBackend(from, to, initials) {
        if (!this.backendBaseUrl) return;
        const url = new URL(this.backendBaseUrl + '/api/meals');
        url.searchParams.set('from', from);
        url.searchParams.set('to', to);
        if (initials) url.searchParams.set('initials', initials);
        const res = await fetch(url.toString());
        if (!res.ok) return;
        const rows = await res.json();
        // Volcar a estructura interna y marcar UI
        rows.forEach(r => {
            if (!this.mealsData[r.initials]) this.mealsData[r.initials] = {};
            if (!this.mealsData[r.initials][r.date]) this.mealsData[r.initials][r.date] = {};
            const mealKey = r.mealType === 'A' ? 'almuerzo' : 'cena';
            this.mealsData[r.initials][r.date][mealKey] = r.value;
            if (this.selectedPerson && this.selectedPerson.initials === r.initials) {
                const container = document.querySelector(`.meal-options[data-date="${r.date}"][data-meal="${mealKey}"]`);
                if (container) {
                    container.querySelectorAll('.meal-option-btn').forEach(b => b.classList.remove('selected'));
                    const btn = Array.from(container.querySelectorAll('.meal-option-btn')).find(b => b.dataset.option === r.value);
                    if (btn) btn.classList.add('selected');
                }
            }
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
        
        // Habilitar botón de guardar en servidor
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

    async saveToBackend() {
        if (!this.backendBaseUrl) {
            this.showNotification('Configura el Backend Base URL primero', 'error');
            return;
        }
        if (Object.keys(this.mealsData).length === 0) {
            this.showNotification('No hay datos para guardar', 'error');
            return;
        }
        try {
            this.showLoading('Guardando en el servidor...');
            const payload = this.prepareBackendPayload();
            const res = await fetch(this.backendBaseUrl + '/api/meals/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error('Error ' + res.status + ': ' + text);
            }
            this.hideLoading();
            this.showNotification('Datos guardados en el servidor', 'success');
        } catch (error) {
            this.hideLoading();
            this.showNotification('Error al guardar: ' + error.message, 'error');
            console.error('Error saving to backend:', error);
        }
    }

    prepareBackendPayload() {
        // Convertir la estructura interna a un arreglo de registros normalizados
        const records = [];
        Object.keys(this.mealsData).forEach(initials => {
            const byDate = this.mealsData[initials];
            Object.keys(byDate).forEach(dateStr => {
                const day = byDate[dateStr];
                if (day.almuerzo) {
                    records.push({ initials, date: dateStr, mealType: 'A', value: day.almuerzo });
                }
                if (day.cena) {
                    records.push({ initials, date: dateStr, mealType: 'C', value: day.cena });
                }
            });
        });
        return { startDate: this.startDate, records };
    }

    async testBackendConnection() {
        try {
            this.showLoading('Probando conexión...');
            const res = await fetch(this.backendBaseUrl + '/api/health');
            this.hideLoading();
            if (res.ok) {
                this.showNotification('Conexión exitosa con el backend', 'success');
            } else {
                this.showNotification('Backend respondió con estado ' + res.status, 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('Error de conexión: ' + error.message, 'error');
        }
    }

    async showTodaySummary() {
        try {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const iso = `${yyyy}-${mm}-${dd}`;

            const res = await fetch(this.backendBaseUrl + `/api/meals?from=${iso}&to=${iso}`);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const rows = await res.json();

            const includeValue = (v) => v && v !== 'No' && v !== 'Vianda';
            const tagFor = (v) => v === 'Régimen' ? '(R)' : v === 'Temprano' ? '(12)' : v === 'Tarde' ? '(T)' : '';

            const byMeal = { A: [], C: [] };
            rows.forEach(r => {
                if (!includeValue(r.value)) return;
                byMeal[r.mealType] = byMeal[r.mealType] || [];
                byMeal[r.mealType].push({ initials: r.initials, tag: tagFor(r.value) });
            });

            const renderList = (arr) => {
                if (!arr || arr.length === 0) return '<em>Sin anotados</em>';
                const sorted = arr.slice().sort((a,b) => a.initials.localeCompare(b.initials));
                return sorted.map(x => `${x.initials}${x.tag ? ' ' + x.tag : ''}`).join(', ');
            };

            const countA = (byMeal.A || []).length;
            const countC = (byMeal.C || []).length;
            const dateStr = today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            const content = `
                <div>
                    <h4 style="margin-bottom: 10px;">${dateStr}</h4>
                    <div style="margin-bottom: 12px;"><strong>Almuerzo (${countA})</strong><br/>${renderList(byMeal.A)}</div>
                    <div><strong>Cena (${countC})</strong><br/>${renderList(byMeal.C)}</div>
                </div>
            `;

            this.showPreviewModal('Hoy - Resumen de comensales', content);
        } catch (err) {
            console.error('Error mostrando resumen de hoy:', err);
            this.showNotification('No se pudo cargar el resumen de hoy', 'error');
        }
    }

    prepareSheetData() {
        // Conservamos esta función para la vista previa local en UI
        const sheetData = { headers: ['Fecha', 'Comida'], meals: [] };
        this.initials.forEach(person => { sheetData.headers.push(person.initials); });
        const today = new Date(this.startDate);
        for (let i = 0; i < this.daysToGenerate; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const almuerzoRow = [dateStr, 'A'];
            this.initials.forEach(person => {
                const mealData = this.mealsData[person.initials]?.[dateStr]?.almuerzo || '';
                almuerzoRow.push(mealData);
            });
            sheetData.meals.push(almuerzoRow);
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

    async testGoogleSheetsConnection() {}

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