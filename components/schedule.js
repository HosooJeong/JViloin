const Schedule = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.filterClasses(e.target.dataset.level);
                this.updateActiveButton(e.target);
            });
        });
    },

    filterClasses(level) {
        const classSlots = document.querySelectorAll('.class-slot');
        
        classSlots.forEach(slot => {
            if (level === 'all') {
                slot.style.display = 'table-cell';
            } else if (slot.classList.contains(level)) {
                slot.style.display = 'table-cell';
            } else {
                slot.style.display = 'none';
            }
        });
    },

    updateActiveButton(activeButton) {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Schedule;
}