// DOM Elements
const signupContainer = document.getElementById("signup-container");
const signinContainer = document.getElementById("signin-container");
const todosContainer = document.getElementById("todos-container");
const todoInput = document.getElementById("input");
const todosList = document.getElementById("todos-list");

// API Configuration
const API_BASE_URL = "http://localhost:3001";
const axiosConfig = (token) => ({
    headers: { Authorization: `Bearer ${token}` }
});

// Navigation functions
function moveToSignup() {
    signupContainer.style.display = "block";
    signinContainer.style.display = "none";
    todosContainer.style.display = "none";
}

function moveToSignin() {
    signinContainer.style.display = "block";
    signupContainer.style.display = "none";
    todosContainer.style.display = "none";
}

function showTodoApp() {
    signinContainer.style.display = "none";
    signupContainer.style.display = "none";
    todosContainer.style.display = "block";
    getTodos();
}

// Auth functions
async function signup() {
    const username = document.getElementById("signup-username").value.trim();
    const password = document.getElementById("signup-password").value.trim();

    if (!username || !password) {
        alert("Please enter both username and password");
        return;
    }

    try {
        const response = await axios.post(`${API_BASE_URL}/signup`, { username, password });
        alert(response.data.message);
        moveToSignin();
    } catch (error) {
        alert(error.response?.data?.message || "Signup failed. Please try again.");
    }
}

async function signin() {
    const username = document.getElementById("signin-username").value.trim();
    const password = document.getElementById("signin-password").value.trim();

    try {
        const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("username", response.data.username);
        showTodoApp();
    } catch (error) {
        alert(error.response?.data?.message || "Login failed. Please check your credentials.");
    }
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    moveToSignin();
}

// Todo functions
async function getTodos() {
    const token = localStorage.getItem("token");
    if (!token) {
        logout();
        return;
    }

    try {
        const response = await axios.get(`${API_BASE_URL}/todos`, axiosConfig(token));
        renderTodos(response.data);
    } catch (error) {
        if (error.response?.status === 401) {
            logout();
        } else {
            console.error("Error fetching todos:", error);
        }
    }
}

function renderTodos(todos) {
    todosList.innerHTML = "";

    if (todos.length === 0) {
        todosList.innerHTML = "<p>No todos found. Add one to get started!</p>";
        return;
    }

    todos.forEach(todo => {
        const todoElement = document.createElement("div");
        todoElement.className = `todo-item ${todo.done ? "done" : ""}`;
        
        // Checkbox
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = todo.done;
        checkbox.addEventListener("change", () => toggleTodoDone(todo.id, !todo.done));

        // Todo title input
        const input = document.createElement("input");
        input.type = "text";
        input.value = todo.title;
        input.readOnly = true;

        // Edit/Save button
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => {
            if (input.readOnly) {
                input.readOnly = false;
                input.focus();
                editBtn.textContent = "Save";
            } else {
                updateTodo(todo.id, input.value.trim()).then(() => {
                    input.readOnly = true;
                    editBtn.textContent = "Edit";
                });
            }
        });

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "delete-btn";
        deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

        // Timestamp
        const timeElement = document.createElement("small");
        timeElement.textContent = formatDate(todo.createdAt);

        todoElement.append(checkbox, input, editBtn, deleteBtn, timeElement);
        todosList.appendChild(todoElement);
    });
}

async function addTodo() {
    const title = todoInput.value.trim();
    if (!title) return;

    const token = localStorage.getItem("token");
    if (!token) {
        logout();
        return;
    }

    try {
        await axios.post(`${API_BASE_URL}/todos`, { title }, axiosConfig(token));
        todoInput.value = "";
        await getTodos();
    } catch (error) {
        console.error("Error adding todo:", error);
        alert(error.response?.data?.message || "Failed to add todo");
    }
}

async function updateTodo(id, title) {
    if (!title) {
        alert("Todo title cannot be empty");
        return;
    }

    const token = localStorage.getItem("token");
    try {
        await axios.put(`${API_BASE_URL}/todos/${id}`, { title }, axiosConfig(token));
        await getTodos();
    } catch (error) {
        console.error("Error updating todo:", error);
    }
}

async function deleteTodo(id) {
    if (!confirm("Are you sure you want to delete this todo?")) return;
    
    const token = localStorage.getItem("token");
    try {
        await axios.delete(`${API_BASE_URL}/todos/${id}`, axiosConfig(token));
        await getTodos();
    } catch (error) {
        console.error("Error deleting todo:", error);
    }
}

async function toggleTodoDone(id, done) {
    const token = localStorage.getItem("token");
    try {
        await axios.patch(`${API_BASE_URL}/todos/${id}/done`, { done }, axiosConfig(token));
        await getTodos();
    } catch (error) {
        console.error("Error toggling todo status:", error);
    }
}

// Helper function
function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Event listeners
function setupEventListeners() {
    // Enter key for adding todos
    todoInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") addTodo();
    });

    // Signup form submit
    document.getElementById("signup-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        signup();
    });

    // Signin form submit
    document.getElementById("signin-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        signin();
    });
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    
    if (localStorage.getItem("token")) {
        showTodoApp();
    } else {
        moveToSignin();
    }
});