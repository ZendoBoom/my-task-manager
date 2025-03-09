let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
const taskList = document.getElementById('task-list');

// Темы
function toggleTheme() {
    const body = document.body;
    const toggle = document.querySelector('.theme-toggle');

    if (body.classList.contains('light-theme')) {
        body.classList.replace('light-theme', 'dark-theme');
        toggle.innerHTML = '<i class="fas fa-moon"></i>';
        toggle.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.replace('dark-theme', 'light-theme');
        toggle.innerHTML = '<i class="fas fa-sun"></i>';
        toggle.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) document.body.classList.add(savedTheme + '-theme');
});

// Фильтры
document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        loadTasks();
    });
});

// Проверка периода
function isWithinPeriod(deadline, days) {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);
    return deadline <= futureDate;
}

// Загрузка задач
function loadTasks() {
    taskList.innerHTML = '';
    const selectedFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';

    tasks.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        const deadlineA = new Date(a.deadline).getTime();
        const deadlineB = new Date(b.deadline).getTime();
        return deadlineA - deadlineB;
    });

    tasks.forEach(task => {
        const taskDeadline = new Date(task.deadline);
        let isValid = false;

        switch (selectedFilter) {
            case 'all': isValid = true; break;
            case 'day': isValid = isWithinPeriod(taskDeadline, 1); break;
            case 'week': isValid = isWithinPeriod(taskDeadline, 7); break;
            case 'month': isValid = isWithinPeriod(taskDeadline, 30); break;
            case 'year': isValid = isWithinPeriod(taskDeadline, 365); break;
        }

        if (isValid) renderTask(task);
    });
}

// Визуализация задачи
function renderTask(task) {
    const div = document.createElement('div');
    div.className = `task-item ${task.status}`;
    div.dataset.taskId = task.id; // Для идентификации
    div.innerHTML = `
        <div class="task-content">
            <div class="task-title">
                <i class="far fa-star favorite-star ${task.isFavorite ? 'selected' : ''}" 
                   onclick="toggleFavorite(${task.id})"></i>
                <span style="color: ${task.color};
                    font-weight: ${task.textStyle === 'bold' ? 'bold' : 'normal'};
                    font-style: ${task.textStyle === 'italic' ? 'italic' : 'normal'};
                    text-decoration: ${task.textStyle === 'underline' ? 'underline' : 'none'};">
                    ${task.title}
                </span>
            </div>
            <div>Дедлайн: ${new Date(task.deadline).toLocaleDateString('ru-RU')}</div>
        </div>
        <div class="task-actions">
            <button class="status-btn green" onclick="handleStatus(${task.id}, 'completed', 'green')">
                <i class="fas fa-check-circle"></i>
            </button>
            <button class="status-btn yellow" onclick="handleStatus(${task.id}, 'in_progress', 'yellow')">
                <i class="fas fa-clock"></i>
            </button>
            <button class="status-btn red" onclick="handleStatus(${task.id}, 'pending', 'red')">
                <i class="fas fa-times-circle"></i>
            </button>
        </div>
    `;
    taskList.appendChild(div);
}

// Избранное
function toggleFavorite(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    tasks[taskIndex].isFavorite = !tasks[taskIndex].isFavorite;
    localStorage.setItem('tasks', JSON.stringify(tasks));
    loadTasks();
}

// Обработка статуса
function handleStatus(taskId, newStatus, color) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    // Меняем фон задачи
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    taskElement.style.backgroundColor =
        color === 'green' ? '#d4edda' :
            color === 'yellow' ? '#fff3cd' :
                '#f8d7da';

    // Для галочки и крестика показываем модальное окно
    if (['green', 'red'].includes(color)) {
        showModalOptions(taskId, newStatus);
    } else {
        // Для часов просто меняем статус
        tasks[taskIndex].status = newStatus;
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
}

// Модальное окно для выбора действия
function showModalOptions(taskId, newStatus) {
    const modal = document.getElementById('status-modal');
    modal.style.display = 'flex';

    const optionsDiv = document.getElementById('status-options');
    optionsDiv.innerHTML = `
        <button class="custom-btn" onclick="confirmAction(${taskId}, '${newStatus}', 'keep')">Оставить</button>
        <button class="custom-btn" onclick="confirmAction(${taskId}, '${newStatus}', 'recreate')">Пересоздать</button>
        <button class="custom-btn danger" onclick="confirmAction(${taskId}, '${newStatus}', 'delete')">Удалить</button>
    `;
}

// Подтверждение действия
function confirmAction(taskId, newStatus, action) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    if (action === 'keep') {
        tasks[taskIndex].status = newStatus;
    } else if (action === 'recreate') {
        tasks[taskIndex].status = newStatus;
        tasks[taskIndex].deadline = new Date().toISOString().split('T')[0];
    } else if (action === 'delete') {
        tasks.splice(taskIndex, 1);
    }

    localStorage.setItem('tasks', JSON.stringify(tasks));
    closeModal('status-modal');
    loadTasks();
}

// Модальное окно создания задачи
function openCreateTaskModal() {
    const modal = document.getElementById('create-task-modal');
    modal.style.display = 'flex';

    const deadlineInput = document.getElementById('deadline-modal');
    if (!deadlineInput._flatpickr) {
        flatpickr(deadlineInput, {
            dateFormat: "d.m.Y",
            enableTime: false,
            onOpen: function() {
                this.calendarContainer.style.position = "fixed";
                this.calendarContainer.style.top = "50%";
                this.calendarContainer.style.left = "50%";
                this.calendarContainer.style.transform = "translate(-50%, -50%)";
            }
        });
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
    if (modalId === 'create-task-modal') {
        document.getElementById('task-form-modal').reset();
        document.getElementById('date-field').style.display = 'none';
    }
}

// Создание задачи
document.getElementById('task-form-modal').addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('task-title-modal').value.trim();
    const color = document.getElementById('color-picker-modal').value;
    const period = document.getElementById('period-select').value;
    const textStyle = document.getElementById('text-style-modal').value;
    const isFavorite = document.getElementById('favorite-modal').checked;

    let deadline;
    if (period === 'custom') {
        const deadlineInput = document.getElementById('deadline-modal').value;
        if (!deadlineInput) {
            alert("Укажите дату!");
            return;
        }

        const parts = deadlineInput.split('.');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Месяцы с 0
        const year = parseInt(parts[2], 10);

        const selectedDate = new Date(year, month, day);
        if (selectedDate < new Date()) {
            alert("Дата не может быть в прошлом!");
            return;
        }

        deadline = selectedDate.toISOString().split('T')[0];
    } else {
        const now = new Date();
        switch (period) {
            case 'day': deadline = new Date(now.setDate(now.getDate() + 1)); break;
            case 'week': deadline = new Date(now.setDate(now.getDate() + 7)); break;
            case 'month': deadline = new Date(now.setMonth(now.getMonth() + 1)); break;
            case 'year': deadline = new Date(now.setFullYear(now.getFullYear() + 1)); break;
        }
        deadline = deadline.toISOString().split('T')[0];
    }

    if (!title) {
        alert("Укажите название задачи!");
        return;
    }

    const newTask = {
        id: Date.now(),
        title,
        color,
        period,
        deadline,
        textStyle,
        isFavorite,
        status: 'pending'
    };

    tasks.push(newTask);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    closeModal('create-task-modal');
    loadTasks();
});

// Показ/скрытие поля даты
document.getElementById('period-select').addEventListener('change', (e) => {
    const selectedPeriod = e.target.value;
    const dateField = document.getElementById('date-field');
    dateField.style.display = selectedPeriod === 'custom' ? 'block' : 'none';
});

// Загрузка при старте
loadTasks();
