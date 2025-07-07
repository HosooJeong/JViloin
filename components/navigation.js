const Navigation = {
    init() {
        this.createNavigation();
        this.bindEvents();
    },

    createNavigation() {
        const nav = document.createElement('nav');
        nav.className = 'main-nav';
        
        // 현재 페이지가 pages 폴더 안에 있는지 확인
        const isInPagesFolder = window.location.pathname.includes('/pages/');
        const basePath = isInPagesFolder ? '../' : '';
        const pagesPath = isInPagesFolder ? '' : 'pages/';
        
        nav.innerHTML = `
            <div class="nav-container">
                <div class="logo">
                    <h1><a href="${basePath}index.html">J-Violin</a></h1>
                </div>
                <ul class="nav-menu">
                    <li><a href="${basePath}index.html" data-page="home">홈</a></li>
                    <li><a href="${pagesPath}about.html" data-page="about">학원소개</a></li>
                    <li><a href="${pagesPath}schedule.html" data-page="schedule">시간표</a></li>
                    <li><a href="${pagesPath}gallery.html" data-page="gallery">갤러리</a></li>
                    <li><a href="${pagesPath}board.html" data-page="board">게시판</a></li>
                    <li><a href="${pagesPath}contact.html" data-page="contact">문의</a></li>
                </ul>
                <div class="mobile-menu-toggle">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

        const header = document.querySelector('header') || document.createElement('header');
        header.innerHTML = '';
        header.appendChild(nav);
        
        if (!document.querySelector('header')) {
            document.body.insertBefore(header, document.body.firstChild);
        }
    },

    bindEvents() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const navMenu = document.querySelector('.nav-menu');

        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                mobileToggle.classList.toggle('active');
            });
        }

        this.setActiveNavItem();
    },

    setActiveNavItem() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-menu a');
        
        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href');
            if (linkPage === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Navigation;
}