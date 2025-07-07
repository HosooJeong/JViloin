const Contact = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const contactForm = document.getElementById('contact-form');
        const faqItems = document.querySelectorAll('.faq-item');

        contactForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            question.addEventListener('click', () => this.toggleFAQ(item));
        });
    },

    handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const inquiryData = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            inquiryType: formData.get('inquiry-type'),
            studentAge: formData.get('student-age'),
            experience: formData.get('experience'),
            message: formData.get('message'),
            privacyAgree: formData.get('privacy-agree'),
            timestamp: new Date().toISOString()
        };

        if (!this.validateForm(inquiryData)) {
            return;
        }

        this.saveInquiry(inquiryData);
        this.showSuccessMessage();
        e.target.reset();
    },

    validateForm(data) {
        if (!data.name || !data.phone || !data.inquiryType || !data.message) {
            alert('필수 항목을 모두 입력해주세요.');
            return false;
        }

        if (!data.privacyAgree) {
            alert('개인정보 수집 및 이용에 동의해주세요.');
            return false;
        }

        if (!this.validatePhone(data.phone)) {
            alert('올바른 전화번호 형식을 입력해주세요.');
            return false;
        }

        if (data.email && !this.validateEmail(data.email)) {
            alert('올바른 이메일 형식을 입력해주세요.');
            return false;
        }

        return true;
    },

    validatePhone(phone) {
        const phoneRegex = /^010-\d{4}-\d{4}$/;
        return phoneRegex.test(phone);
    },

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    saveInquiry(data) {
        const inquiries = JSON.parse(localStorage.getItem('inquiries') || '[]');
        inquiries.push(data);
        localStorage.setItem('inquiries', JSON.stringify(inquiries));
    },

    showSuccessMessage() {
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
            <div class="success-content">
                <h3>문의가 성공적으로 전송되었습니다!</h3>
                <p>빠른 시일 내에 연락드리겠습니다.</p>
                <button onclick="this.parentElement.parentElement.remove()">확인</button>
            </div>
        `;
        
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
            if (successMessage.parentElement) {
                successMessage.remove();
            }
        }, 5000);
    },

    toggleFAQ(item) {
        const answer = item.querySelector('.faq-answer');
        const toggle = item.querySelector('.faq-toggle');
        
        if (answer.style.display === 'block') {
            answer.style.display = 'none';
            toggle.textContent = '+';
            item.classList.remove('active');
        } else {
            document.querySelectorAll('.faq-item').forEach(faqItem => {
                faqItem.querySelector('.faq-answer').style.display = 'none';
                faqItem.querySelector('.faq-toggle').textContent = '+';
                faqItem.classList.remove('active');
            });
            
            answer.style.display = 'block';
            toggle.textContent = '-';
            item.classList.add('active');
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Contact;
}