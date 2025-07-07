const Attendance = {
    students: {
        'beginner-a': [
            { id: 1, name: '김민수', phone: '010-1234-5678' },
            { id: 2, name: '이지은', phone: '010-2345-6789' },
            { id: 3, name: '박준혁', phone: '010-3456-7890' },
            { id: 4, name: '최서연', phone: '010-4567-8901' },
            { id: 5, name: '정하늘', phone: '010-5678-9012' }
        ],
        'beginner-b': [
            { id: 6, name: '강지우', phone: '010-6789-0123' },
            { id: 7, name: '윤서아', phone: '010-7890-1234' },
            { id: 8, name: '임도현', phone: '010-8901-2345' },
            { id: 9, name: '한예린', phone: '010-9012-3456' }
        ],
        'intermediate-a': [
            { id: 10, name: '조민준', phone: '010-0123-4567' },
            { id: 11, name: '신유진', phone: '010-1234-5678' },
            { id: 12, name: '오승현', phone: '010-2345-6789' },
            { id: 13, name: '장수빈', phone: '010-3456-7890' }
        ],
        'advanced-a': [
            { id: 14, name: '홍지민', phone: '010-4567-8901' },
            { id: 15, name: '서준호', phone: '010-5678-9012' },
            { id: 16, name: '김다은', phone: '010-6789-0123' }
        ]
    },

    init() {
        this.setTodayDate();
        this.bindEvents();
    },

    setTodayDate() {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        document.getElementById('attendance-date').value = formattedDate;
    },

    bindEvents() {
        const loadButton = document.getElementById('load-attendance');
        const saveButton = document.getElementById('save-attendance');
        const printButton = document.getElementById('print-attendance');
        const loadHistoryButton = document.getElementById('load-history');

        loadButton.addEventListener('click', () => this.loadAttendance());
        saveButton.addEventListener('click', () => this.saveAttendance());
        printButton.addEventListener('click', () => this.printAttendance());
        loadHistoryButton.addEventListener('click', () => this.loadHistory());
    },

    loadAttendance() {
        const selectedClass = document.getElementById('class-select').value;
        const selectedDate = document.getElementById('attendance-date').value;

        if (!selectedClass || !selectedDate) {
            alert('날짜와 반을 선택해주세요.');
            return;
        }

        const students = this.students[selectedClass] || [];
        this.renderAttendanceTable(students, selectedClass, selectedDate);
        this.updateStats();
    },

    renderAttendanceTable(students, className, date) {
        const container = document.getElementById('attendance-table-container');
        const tbody = document.getElementById('attendance-tbody');
        const classNameElement = document.getElementById('selected-class-name');
        const dateElement = document.getElementById('selected-date');

        classNameElement.textContent = this.getClassDisplayName(className);
        dateElement.textContent = date;

        tbody.innerHTML = '';

        students.forEach((student, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${student.name}</td>
                <td>
                    <input type="radio" name="attendance_${student.id}" value="present" id="present_${student.id}" checked>
                    <label for="present_${student.id}">출석</label>
                </td>
                <td>
                    <input type="radio" name="attendance_${student.id}" value="late" id="late_${student.id}">
                    <label for="late_${student.id}">지각</label>
                </td>
                <td>
                    <input type="radio" name="attendance_${student.id}" value="absent" id="absent_${student.id}">
                    <label for="absent_${student.id}">결석</label>
                </td>
                <td>
                    <input type="text" placeholder="비고" id="note_${student.id}" class="note-input">
                </td>
            `;
            tbody.appendChild(row);
        });

        container.style.display = 'block';
        this.bindAttendanceEvents();
    },

    bindAttendanceEvents() {
        const radioButtons = document.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => this.updateStats());
        });
    },

    updateStats() {
        const totalStudents = document.querySelectorAll('input[name^="attendance_"]').length / 3;
        const presentStudents = document.querySelectorAll('input[value="present"]:checked').length;
        const lateStudents = document.querySelectorAll('input[value="late"]:checked').length;
        const absentStudents = document.querySelectorAll('input[value="absent"]:checked').length;

        document.getElementById('total-students').textContent = totalStudents;
        document.getElementById('present-students').textContent = presentStudents;
        document.getElementById('late-students').textContent = lateStudents;
        document.getElementById('absent-students').textContent = absentStudents;
    },

    getClassDisplayName(className) {
        const classNames = {
            'beginner-a': '초급 A반',
            'beginner-b': '초급 B반',
            'beginner-c': '초급 C반',
            'intermediate-a': '중급 A반',
            'intermediate-b': '중급 B반',
            'intermediate-c': '중급 C반',
            'advanced-a': '고급 A반',
            'advanced-b': '고급 B반'
        };
        return classNames[className] || className;
    },

    saveAttendance() {
        const attendanceData = this.collectAttendanceData();
        
        localStorage.setItem('attendance_' + Date.now(), JSON.stringify(attendanceData));
        alert('출석이 저장되었습니다.');
    },

    collectAttendanceData() {
        const selectedClass = document.getElementById('class-select').value;
        const selectedDate = document.getElementById('attendance-date').value;
        const attendanceData = {
            class: selectedClass,
            date: selectedDate,
            students: []
        };

        const students = this.students[selectedClass] || [];
        students.forEach(student => {
            const attendance = document.querySelector(`input[name="attendance_${student.id}"]:checked`).value;
            const note = document.getElementById(`note_${student.id}`).value;
            
            attendanceData.students.push({
                id: student.id,
                name: student.name,
                attendance: attendance,
                note: note
            });
        });

        return attendanceData;
    },

    printAttendance() {
        const printWindow = window.open('', '_blank');
        const selectedClass = document.getElementById('selected-class-name').textContent;
        const selectedDate = document.getElementById('selected-date').textContent;
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>출석표 - ${selectedClass}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .center { text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>J-Violin 학원 출석표</h1>
                        <h2>${selectedClass}</h2>
                        <h3>${selectedDate}</h3>
                    </div>
                    ${document.querySelector('.attendance-table').outerHTML}
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    },

    loadHistory() {
        const selectedMonth = document.getElementById('history-month').value;
        if (!selectedMonth) {
            alert('조회할 월을 선택해주세요.');
            return;
        }

        const historyData = this.generateSampleHistory(selectedMonth);
        this.renderHistory(historyData);
    },

    generateSampleHistory(month) {
        const sampleData = [
            { date: `${month}-01`, class: '초급 A반', attendance: '100%', note: '모든 학생 출석' },
            { date: `${month}-02`, class: '중급 A반', attendance: '85%', note: '1명 결석' },
            { date: `${month}-03`, class: '고급 A반', attendance: '90%', note: '1명 지각' },
            { date: `${month}-04`, class: '초급 B반', attendance: '95%', note: '양호' },
            { date: `${month}-05`, class: '중급 B반', attendance: '80%', note: '2명 결석' }
        ];
        return sampleData;
    },

    renderHistory(data) {
        const tbody = document.getElementById('history-tbody');
        tbody.innerHTML = '';

        data.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.date}</td>
                <td>${record.class}</td>
                <td>${record.attendance}</td>
                <td>${record.note}</td>
            `;
            tbody.appendChild(row);
        });
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Attendance;
}