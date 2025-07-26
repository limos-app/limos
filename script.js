// Clase para gestionar los comensales
class ComensalManager {
    constructor() {
        this.comensales = JSON.parse(localStorage.getItem('comensales')) || [];
        this.currentId = this.comensales.length > 0 ? Math.max(...this.comensales.map(c => c.id)) + 1 : 1;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderTable();
        this.updateStats();
    }

    setupEventListeners() {
        // Formulario principal
        document.getElementById('comensalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.agregarComensal();
        });

        // Búsqueda y filtros
        document.getElementById('searchInput').addEventListener('input', () => {
            this.filtrarComensales();
        });

        document.getElementById('filterDieta').addEventListener('change', () => {
            this.filtrarComensales();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.limpiarFiltros();
        });

        // Modal
        const modal = document.getElementById('editModal');
        const closeBtn = document.querySelector('.close');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Formulario de edición
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.actualizarComensal();
        });
    }

    agregarComensal() {
        const formData = new FormData(document.getElementById('comensalForm'));
        const comensal = {
            id: this.currentId++,
            nombre: formData.get('nombre'),
            habitacion: parseInt(formData.get('habitacion')),
            dieta: formData.get('dieta'),
            alergias: formData.get('alergias'),
            observaciones: formData.get('observaciones'),
            fechaRegistro: new Date().toISOString()
        };

        this.comensales.push(comensal);
        this.guardarEnLocalStorage();
        this.renderTable();
        this.updateStats();
        this.mostrarNotificacion('Comensal agregado exitosamente', 'success');
        
        // Limpiar formulario
        document.getElementById('comensalForm').reset();
    }

    editarComensal(id) {
        const comensal = this.comensales.find(c => c.id === id);
        if (!comensal) return;

        // Llenar el formulario de edición
        document.getElementById('editId').value = comensal.id;
        document.getElementById('editNombre').value = comensal.nombre;
        document.getElementById('editHabitacion').value = comensal.habitacion;
        document.getElementById('editDieta').value = comensal.dieta;
        document.getElementById('editAlergias').value = comensal.alergias || '';
        document.getElementById('editObservaciones').value = comensal.observaciones || '';

        // Mostrar modal
        document.getElementById('editModal').style.display = 'block';
    }

    actualizarComensal() {
        const id = parseInt(document.getElementById('editId').value);
        const comensalIndex = this.comensales.findIndex(c => c.id === id);
        
        if (comensalIndex === -1) return;

        this.comensales[comensalIndex] = {
            ...this.comensales[comensalIndex],
            nombre: document.getElementById('editNombre').value,
            habitacion: parseInt(document.getElementById('editHabitacion').value),
            dieta: document.getElementById('editDieta').value,
            alergias: document.getElementById('editAlergias').value,
            observaciones: document.getElementById('editObservaciones').value,
            fechaActualizacion: new Date().toISOString()
        };

        this.guardarEnLocalStorage();
        this.renderTable();
        this.updateStats();
        this.mostrarNotificacion('Comensal actualizado exitosamente', 'success');
        
        // Cerrar modal
        document.getElementById('editModal').style.display = 'none';
    }

    eliminarComensal(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este comensal?')) {
            this.comensales = this.comensales.filter(c => c.id !== id);
            this.guardarEnLocalStorage();
            this.renderTable();
            this.updateStats();
            this.mostrarNotificacion('Comensal eliminado exitosamente', 'success');
        }
    }

    filtrarComensales() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const filterDieta = document.getElementById('filterDieta').value;
        
        const comensalesFiltrados = this.comensales.filter(comensal => {
            const matchesSearch = comensal.nombre.toLowerCase().includes(searchTerm) ||
                                comensal.habitacion.toString().includes(searchTerm);
            const matchesDieta = !filterDieta || comensal.dieta === filterDieta;
            
            return matchesSearch && matchesDieta;
        });

        this.renderTable(comensalesFiltrados);
    }

    limpiarFiltros() {
        document.getElementById('searchInput').value = '';
        document.getElementById('filterDieta').value = '';
        this.renderTable();
    }

    renderTable(comensalesToRender = this.comensales) {
        const tbody = document.getElementById('comensalesTableBody');
        tbody.innerHTML = '';

        if (comensalesToRender.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                        No se encontraron comensales
                    </td>
                </tr>
            `;
            return;
        }

        comensalesToRender.forEach(comensal => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${comensal.nombre}</strong></td>
                <td><span class="dieta-badge" style="background: #e2e8f0; color: #4a5568;">Habitación ${comensal.habitacion}</span></td>
                <td><span class="dieta-badge dieta-${comensal.dieta}">${this.getDietaDisplayName(comensal.dieta)}</span></td>
                <td>${comensal.alergias ? `<span style="color: #e53e3e; font-weight: 600;">${comensal.alergias}</span>` : '<span style="color: #666;">Sin alergias</span>'}</td>
                <td>${comensal.observaciones ? `<span style="font-style: italic;">${comensal.observaciones}</span>` : '<span style="color: #666;">Sin observaciones</span>'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="comensalManager.editarComensal(${comensal.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-delete" onclick="comensalManager.eliminarComensal(${comensal.id})">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    getDietaDisplayName(dieta) {
        const dietas = {
            'normal': 'Normal',
            'baja-sodio': 'Baja Sodio',
            'diabetica': 'Diabética',
            'sin-gluten': 'Sin Gluten',
            'vegetariana': 'Vegetariana',
            'blanda': 'Blanda'
        };
        return dietas[dieta] || dieta;
    }

    updateStats() {
        const total = this.comensales.length;
        document.getElementById('totalComensales').textContent = total;

        // Actualizar estadísticas por dieta
        const statsByDieta = {};
        this.comensales.forEach(comensal => {
            statsByDieta[comensal.dieta] = (statsByDieta[comensal.dieta] || 0) + 1;
        });

        // Mostrar estadísticas adicionales si hay datos
        const statsDiv = document.querySelector('.stats');
        if (total > 0) {
            let statsHTML = `<p>Total de comensales: <span id="totalComensales">${total}</span></p>`;
            statsHTML += '<div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">';
            
            Object.entries(statsByDieta).forEach(([dieta, count]) => {
                const displayName = this.getDietaDisplayName(dieta);
                const percentage = ((count / total) * 100).toFixed(1);
                statsHTML += `
                    <span class="dieta-badge dieta-${dieta}" style="font-size: 0.7rem;">
                        ${displayName}: ${count} (${percentage}%)
                    </span>
                `;
            });
            statsHTML += '</div>';
            statsDiv.innerHTML = statsHTML;
        }
    }

    guardarEnLocalStorage() {
        localStorage.setItem('comensales', JSON.stringify(this.comensales));
    }

    mostrarNotificacion(mensaje, tipo = 'info') {
        // Crear notificación
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;

        // Estilos según tipo
        if (tipo === 'success') {
            notification.style.background = 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
        } else if (tipo === 'error') {
            notification.style.background = 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)';
        } else {
            notification.style.background = 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)';
        }

        notification.innerHTML = `
            <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${mensaje}
        `;

        document.body.appendChild(notification);

        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Método para exportar datos
    exportarDatos() {
        const dataStr = JSON.stringify(this.comensales, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `comensales_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.mostrarNotificacion('Datos exportados exitosamente', 'success');
    }

    // Método para importar datos
    importarDatos(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    this.comensales = data;
                    this.currentId = this.comensales.length > 0 ? Math.max(...this.comensales.map(c => c.id)) + 1 : 1;
                    this.guardarEnLocalStorage();
                    this.renderTable();
                    this.updateStats();
                    this.mostrarNotificacion('Datos importados exitosamente', 'success');
                } else {
                    throw new Error('Formato inválido');
                }
            } catch (error) {
                this.mostrarNotificacion('Error al importar datos', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Agregar estilos CSS para las animaciones de notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Inicializar la aplicación
let comensalManager;

document.addEventListener('DOMContentLoaded', () => {
    comensalManager = new ComensalManager();
    
    // Agregar funcionalidad de exportar/importar
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn-secondary';
    exportBtn.innerHTML = '<i class="fas fa-download"></i> Exportar Datos';
    exportBtn.onclick = () => comensalManager.exportarDatos();
    
    const importBtn = document.createElement('button');
    importBtn.className = 'btn-secondary';
    importBtn.innerHTML = '<i class="fas fa-upload"></i> Importar Datos';
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            comensalManager.importarDatos(e.target.files[0]);
        }
    };
    
    importBtn.onclick = () => fileInput.click();
    
    // Agregar botones al header
    const header = document.querySelector('header');
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'margin-top: 20px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;';
    buttonContainer.appendChild(exportBtn);
    buttonContainer.appendChild(importBtn);
    buttonContainer.appendChild(fileInput);
    header.appendChild(buttonContainer);
});

// Función global para acceder desde HTML
window.comensalManager = null;
document.addEventListener('DOMContentLoaded', () => {
    window.comensalManager = comensalManager;
}); 