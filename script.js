// Application Checklist Voyage
class TravelChecklist {
    constructor() {
        this.items = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.bindEvents();
        this.render();
        this.updateStats();
    }

    // Gestion du LocalStorage
    loadFromStorage() {
        const stored = localStorage.getItem('travelChecklist');
        if (stored) {
            try {
                this.items = JSON.parse(stored);
            } catch (e) {
                console.error('Erreur lors du chargement des données:', e);
                this.items = [];
            }
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('travelChecklist', JSON.stringify(this.items));
        } catch (e) {
            console.error('Erreur lors de la sauvegarde:', e);
        }
    }

    // Gestion des événements
    bindEvents() {
        // Formulaire d'ajout
        const form = document.getElementById('addItemForm');
        const input = document.getElementById('itemInput');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (text) {
                this.addItem(text);
                input.value = '';
                input.focus();
            }
        });

        // Filtres
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setFilter(btn.dataset.filter);
                this.updateFilterButtons(btn);
            });
        });

        // Bouton supprimer les terminés
        document.getElementById('clearCompleted').addEventListener('click', () => {
            this.clearCompleted();
        });
    }

    // CRUD Operations
    addItem(text) {
        const newItem = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.items.unshift(newItem);
        this.saveToStorage();
        this.render();
        this.updateStats();
    }

    toggleItem(id) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            item.completed = !item.completed;
            this.saveToStorage();
            this.render();
            this.updateStats();
        }
    }

    deleteItem(id) {
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
            // Animation de suppression
            const element = document.querySelector(`[data-id="${id}"]`);
            if (element) {
                element.classList.add('fade-out');
                setTimeout(() => {
                    this.items.splice(index, 1);
                    this.saveToStorage();
                    this.render();
                    this.updateStats();
                }, 300);
            } else {
                this.items.splice(index, 1);
                this.saveToStorage();
                this.render();
                this.updateStats();
            }
        }
    }

    clearCompleted() {
        const completedItems = this.items.filter(item => item.completed);
        if (completedItems.length === 0) {
            return;
        }

        if (confirm(`Supprimer ${completedItems.length} élément(s) terminé(s) ?`)) {
            // Animation pour tous les éléments terminés
            completedItems.forEach(item => {
                const element = document.querySelector(`[data-id="${item.id}"]`);
                if (element) {
                    element.classList.add('fade-out');
                }
            });

            setTimeout(() => {
                this.items = this.items.filter(item => !item.completed);
                this.saveToStorage();
                this.render();
                this.updateStats();
            }, 300);
        }
    }

    // Filtrage
    setFilter(filter) {
        this.currentFilter = filter;
        this.render();
    }

    updateFilterButtons(activeBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    getFilteredItems() {
        switch (this.currentFilter) {
            case 'active':
                return this.items.filter(item => !item.completed);
            case 'completed':
                return this.items.filter(item => item.completed);
            default:
                return this.items;
        }
    }

    // Rendu
    render() {
        const checklist = document.getElementById('checklist');
        const emptyState = document.getElementById('emptyState');
        const filteredItems = this.getFilteredItems();

        if (filteredItems.length === 0) {
            checklist.style.display = 'none';
            emptyState.style.display = 'block';
            this.updateEmptyState();
        } else {
            checklist.style.display = 'block';
            emptyState.style.display = 'none';
            
            checklist.innerHTML = filteredItems.map(item => this.createItemHTML(item)).join('');
            
            // Ajouter les événements aux nouveaux éléments
            this.bindItemEvents();
        }
    }

    createItemHTML(item) {
        return `
            <li class="checklist-item ${item.completed ? 'completed' : ''}" data-id="${item.id}">
                <input 
                    type="checkbox" 
                    class="item-checkbox" 
                    ${item.completed ? 'checked' : ''}
                    data-id="${item.id}"
                >
                <span class="item-text">${this.escapeHTML(item.text)}</span>
                <button class="item-delete" data-id="${item.id}" title="Supprimer">
                    ×
                </button>
            </li>
        `;
    }

    bindItemEvents() {
        // Checkboxes
        document.querySelectorAll('.item-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleItem(parseInt(e.target.dataset.id));
            });
        });

        // Boutons supprimer
        document.querySelectorAll('.item-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.deleteItem(parseInt(e.target.dataset.id));
            });
        });
    }

    updateEmptyState() {
        const emptyText = document.querySelector('.empty-text');
        const emptySubtext = document.querySelector('.empty-subtext');
        
        switch (this.currentFilter) {
            case 'active':
                emptyText.textContent = 'Aucun élément à faire';
                emptySubtext.textContent = 'Tous les éléments sont terminés !';
                break;
            case 'completed':
                emptyText.textContent = 'Aucun élément terminé';
                emptySubtext.textContent = 'Commencez par cocher quelques éléments';
                break;
            default:
                emptyText.textContent = 'Votre checklist est vide';
                emptySubtext.textContent = 'Ajoutez votre premier élément pour commencer';
        }
    }

    // Statistiques
    updateStats() {
        const total = this.items.length;
        const completed = this.items.filter(item => item.completed).length;
        const active = total - completed;

        // Compteurs
        document.getElementById('totalCount').textContent = total;
        document.getElementById('completedCount').textContent = completed;
        document.getElementById('allCount').textContent = total;
        document.getElementById('activeCount').textContent = active;
        document.getElementById('completedFilterCount').textContent = completed;

        // Barre de progression
        const progressFill = document.getElementById('progressFill');
        const percentage = total > 0 ? (completed / total) * 100 : 0;
        progressFill.style.width = `${percentage}%`;

        // Mettre à jour le bouton "Supprimer les terminés"
        const clearBtn = document.getElementById('clearCompleted');
        clearBtn.style.display = completed > 0 ? 'block' : 'none';
    }

    // Utilitaires
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    new TravelChecklist();
});

// Gestion du focus sur l'input
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('itemInput');
    if (input) {
        input.focus();
    }
});
