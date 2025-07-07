const Gallery = {
    init() {
        this.bindEvents();
        this.loadGalleryContent();
    },

    bindEvents() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabType = e.target.getAttribute('data-tab');
                this.switchTab(tabType);
            });
        });
        
        // 비디오 카드 클릭 이벤트
        const videoCards = document.querySelectorAll('.video-card');
        videoCards.forEach(card => {
            card.addEventListener('click', () => {
                this.showVideoModal(card);
            });
        });
        
        // 사진 카드 클릭 이벤트
        const photoCards = document.querySelectorAll('.photo-card');
        photoCards.forEach(card => {
            card.addEventListener('click', () => {
                this.showPhotoModal(card);
            });
        });
    },

    switchTab(tabType) {
        // 탭 버튼 활성화 상태 변경
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabType}"]`).classList.add('active');
        
        // 갤러리 섹션 표시/숨김
        const sections = document.querySelectorAll('.gallery-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });
        
        document.getElementById(`${tabType}-section`).style.display = 'block';
    },

    loadGalleryContent() {
        // 실제 구현 시 서버에서 갤러리 데이터를 가져오는 로직
        console.log('갤러리 콘텐츠 로딩 중...');
    },

    showVideoModal(card) {
        const title = card.querySelector('h3').textContent;
        const description = card.querySelector('p').textContent;
        
        // 실제 구현 시 동영상 모달을 표시하는 로직
        alert(`동영상: ${title}\n${description}\n\n동영상이 준비되면 여기서 재생됩니다.`);
    },

    showPhotoModal(card) {
        const title = card.querySelector('h3').textContent;
        const date = card.querySelector('p').textContent;
        
        // 실제 구현 시 사진 갤러리 모달을 표시하는 로직
        alert(`사진: ${title}\n${date}\n\n사진이 준비되면 여기서 확대해서 볼 수 있습니다.`);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Gallery;
}