const Board = {
    currentBoard: 'notice',
    currentPage: 1,
    postsPerPage: 10,
    
    posts: {
        notice: [
            { id: 1, title: '2024년 정기 발표회 안내', author: '관리자', date: '2024-01-15', views: 125, content: '2024년 정기 발표회가 3월 15일에 개최됩니다. 모든 학생들의 참여를 부탁드립니다.' },
            { id: 2, title: '학원 휴무일 안내', author: '관리자', date: '2024-01-10', views: 89, content: '설 연휴 기간 동안 학원은 휴무입니다. 2월 9일부터 정상 운영됩니다.' },
            { id: 3, title: '새학기 개강 안내', author: '관리자', date: '2024-01-08', views: 156, content: '새학기가 2월 26일부터 시작됩니다. 시간표를 확인해주세요.' },
            { id: 4, title: '바이올린 대여 서비스 안내', author: '관리자', date: '2024-01-05', views: 78, content: '초급 학생들을 위한 바이올린 대여 서비스를 시작합니다.' },
            { id: 5, title: '마스터클래스 특별 수업 안내', author: '관리자', date: '2024-01-01', views: 203, content: '유명 바이올리니스트를 초청한 마스터클래스가 개최됩니다.' }
        ],
        free: [
            { id: 6, title: '연습실 예약 문의', author: '김학부모', date: '2024-01-14', views: 45, content: '개인 연습실 예약은 어떻게 하나요?' },
            { id: 7, title: '발표회 복장 관련 질문', author: '이학부모', date: '2024-01-12', views: 32, content: '발표회 때 어떤 복장을 입어야 하나요?' },
            { id: 8, title: '바이올린 관리 팁 공유', author: '박학부모', date: '2024-01-10', views: 67, content: '바이올린 관리에 대한 좋은 팁을 공유합니다.' },
            { id: 9, title: '학원 주차 관련 문의', author: '최학부모', date: '2024-01-08', views: 28, content: '학원 앞 주차 공간이 부족해서 문의드립니다.' },
            { id: 10, title: '수업 시간 변경 가능한가요?', author: '정학부모', date: '2024-01-06', views: 41, content: '개인 사정으로 수업 시간 변경이 필요합니다.' }
        ],
        qna: [
            { id: 11, title: '바이올린 구매 상담', author: '신학부모', date: '2024-01-13', views: 39, content: '초급자용 바이올린 구매 상담을 받고 싶습니다.' },
            { id: 12, title: '레슨 진도 관련 문의', author: '홍학부모', date: '2024-01-11', views: 52, content: '아이의 레슨 진도가 궁금합니다.' },
            { id: 13, title: '콩쿠르 준비 문의', author: '서학부모', date: '2024-01-09', views: 73, content: '바이올린 콩쿠르 준비를 위한 특별 지도가 가능한가요?' },
            { id: 14, title: '그룹 레슨 vs 개인 레슨', author: '장학부모', date: '2024-01-07', views: 64, content: '그룹 레슨과 개인 레슨의 차이점이 궁금합니다.' },
            { id: 15, title: '연습 시간 권장량', author: '윤학부모', date: '2024-01-05', views: 88, content: '초급자에게 권장하는 하루 연습 시간이 얼마나 되나요?' }
        ]
    },

    init() {
        this.bindEvents();
        this.loadBoard('notice');
    },

    bindEvents() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const writeBtn = document.getElementById('write-btn');
        const searchBtn = document.getElementById('search-btn');
        const closeButtons = document.querySelectorAll('.close');
        const cancelBtn = document.getElementById('cancel-btn');
        const postForm = document.getElementById('post-form');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchBoard(e.target.dataset.board);
            });
        });

        writeBtn.addEventListener('click', () => this.openWriteModal());
        searchBtn.addEventListener('click', () => this.searchPosts());
        cancelBtn.addEventListener('click', () => this.closeModals());
        postForm.addEventListener('submit', (e) => this.submitPost(e));

        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });
    },

    switchBoard(boardType) {
        this.currentBoard = boardType;
        this.currentPage = 1;
        
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-board="${boardType}"]`).classList.add('active');
        
        this.loadBoard(boardType);
    },

    loadBoard(boardType) {
        const boardTitles = {
            notice: '공지사항',
            free: '자유게시판',
            qna: 'Q&A'
        };
        
        document.getElementById('board-title').textContent = boardTitles[boardType];
        this.renderPosts();
        this.renderPagination();
    },

    renderPosts() {
        const tbody = document.getElementById('board-tbody');
        const posts = this.posts[this.currentBoard] || [];
        const startIndex = (this.currentPage - 1) * this.postsPerPage;
        const endIndex = startIndex + this.postsPerPage;
        const currentPosts = posts.slice(startIndex, endIndex);

        tbody.innerHTML = '';

        if (currentPosts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">게시글이 없습니다.</td></tr>';
            return;
        }

        currentPosts.forEach(post => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${post.id}</td>
                <td class="title-cell">
                    <a href="#" onclick="Board.viewPost(${post.id})">${post.title}</a>
                </td>
                <td>${post.author}</td>
                <td>${post.date}</td>
                <td>${post.views}</td>
            `;
            tbody.appendChild(row);
        });
    },

    renderPagination() {
        const totalPosts = this.posts[this.currentBoard].length;
        const totalPages = Math.ceil(totalPosts / this.postsPerPage);
        const pageNumbers = document.getElementById('page-numbers');
        
        pageNumbers.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.classList.add('page-number');
            if (i === this.currentPage) {
                pageBtn.classList.add('active');
            }
            pageBtn.addEventListener('click', () => this.goToPage(i));
            pageNumbers.appendChild(pageBtn);
        }

        document.getElementById('prev-page').disabled = this.currentPage === 1;
        document.getElementById('next-page').disabled = this.currentPage === totalPages;
    },

    goToPage(page) {
        this.currentPage = page;
        this.renderPosts();
        this.renderPagination();
    },

    viewPost(postId) {
        const post = this.findPost(postId);
        if (!post) return;

        post.views++;
        
        document.getElementById('view-title').textContent = '게시글 보기';
        document.getElementById('view-post-title').textContent = post.title;
        document.getElementById('view-author').textContent = `작성자: ${post.author}`;
        document.getElementById('view-date').textContent = `작성일: ${post.date}`;
        document.getElementById('view-count').textContent = `조회수: ${post.views}`;
        document.getElementById('view-content').textContent = post.content;

        document.getElementById('view-modal').style.display = 'block';
        this.renderPosts();
    },

    findPost(postId) {
        const allPosts = [...this.posts.notice, ...this.posts.free, ...this.posts.qna];
        return allPosts.find(post => post.id === postId);
    },

    openWriteModal() {
        document.getElementById('modal-title').textContent = '글쓰기';
        document.getElementById('post-form').reset();
        document.getElementById('post-modal').style.display = 'block';
    },

    closeModals() {
        document.getElementById('post-modal').style.display = 'none';
        document.getElementById('view-modal').style.display = 'none';
    },

    submitPost(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const newPost = {
            id: Date.now(),
            title: formData.get('title'),
            author: formData.get('author'),
            content: formData.get('content'),
            date: new Date().toISOString().split('T')[0],
            views: 0
        };

        this.posts[this.currentBoard].unshift(newPost);
        this.closeModals();
        this.renderPosts();
        this.renderPagination();
        
        alert('게시글이 등록되었습니다.');
    },

    searchPosts() {
        const searchType = document.getElementById('search-type').value;
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        
        if (!searchTerm) {
            alert('검색어를 입력하세요.');
            return;
        }

        const posts = this.posts[this.currentBoard];
        const filteredPosts = posts.filter(post => {
            switch (searchType) {
                case 'title':
                    return post.title.toLowerCase().includes(searchTerm);
                case 'content':
                    return post.content.toLowerCase().includes(searchTerm);
                case 'author':
                    return post.author.toLowerCase().includes(searchTerm);
                default:
                    return false;
            }
        });

        this.renderFilteredPosts(filteredPosts);
    },

    renderFilteredPosts(posts) {
        const tbody = document.getElementById('board-tbody');
        tbody.innerHTML = '';

        if (posts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">검색 결과가 없습니다.</td></tr>';
            return;
        }

        posts.forEach(post => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${post.id}</td>
                <td class="title-cell">
                    <a href="#" onclick="Board.viewPost(${post.id})">${post.title}</a>
                </td>
                <td>${post.author}</td>
                <td>${post.date}</td>
                <td>${post.views}</td>
            `;
            tbody.appendChild(row);
        });
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Board;
}