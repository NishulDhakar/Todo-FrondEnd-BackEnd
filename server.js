import express from "express";
import jwt from "jsonwebtoken";
import path from "path";
import cors from 'cors';

const JWT_TOKEN = "iamthebest";
const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: 'http://localhost:3001', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

// In-memory databases (consider using a real database in production)
const users = [];
const todos = [];

// Serve frontend
app.get("/", function(req, res) {
    res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

// Auth routes
app.post("/signup", function(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    if (username.length < 5) {
        return res.status(400).json({ message: "Username must have at least 5 characters" });
    }

    if (users.some(user => user.username === username)) {
        return res.status(400).json({ message: "Username already exists" });
    }

    users.push({ username, password });
    res.json({ message: "User created successfully" });
});

app.post("/login", function(req, res) {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ username }, JWT_TOKEN, { expiresIn: '1h' });
    res.json({ token, username, message: "Login successful" });
});

// Todo routes with enhanced error handling
app.get("/todos", authenticateToken, (req, res) => {
    try {
        const userTodos = todos.filter(todo => todo.username === req.user.username);
        res.json(userTodos);
    } catch (error) {
        res.status(500).json({ message: "Error fetching todos" });
    }
});

app.post("/todos", authenticateToken, (req, res) => {
    try {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ message: "Title is required" });
        }

        const newTodo = {
            id: Date.now().toString(),
            username: req.user.username,
            title,
            done: false,
            createdAt: new Date().toISOString()
        };

        todos.push(newTodo);
        res.status(201).json(newTodo);
    } catch (error) {
        res.status(500).json({ message: "Error creating todo" });
    }
});

app.put("/todos/:id", authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        const todoIndex = todos.findIndex(todo => 
            todo.id === id && todo.username === req.user.username
        );

        if (todoIndex === -1) {
            return res.status(404).json({ message: "Todo not found" });
        }

        todos[todoIndex].title = title;
        todos[todoIndex].updatedAt = new Date().toISOString();
        res.json(todos[todoIndex]);
    } catch (error) {
        res.status(500).json({ message: "Error updating todo" });
    }
});

app.patch("/todos/:id/done", authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const { done } = req.body;

        const todoIndex = todos.findIndex(todo => 
            todo.id === id && todo.username === req.user.username
        );

        if (todoIndex === -1) {
            return res.status(404).json({ message: "Todo not found" });
        }

        todos[todoIndex].done = done;
        todos[todoIndex].updatedAt = new Date().toISOString();
        res.json(todos[todoIndex]);
    } catch (error) {
        res.status(500).json({ message: "Error updating todo status" });
    }
});

app.delete("/todos/:id", authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const todoIndex = todos.findIndex(todo => 
            todo.id === id && todo.username === req.user.username
        );

        if (todoIndex === -1) {
            return res.status(404).json({ message: "Todo not found" });
        }

        const [deletedTodo] = todos.splice(todoIndex, 1);
        res.json(deletedTodo);
    } catch (error) {
        res.status(500).json({ message: "Error deleting todo" });
    }
});

// Enhanced authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Authentication token required" });
    }

    jwt.verify(token, JWT_TOKEN, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or expired token" });
        }
        req.user = user;
        next();
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
});
app.listen(3001, () => {
    console.log("Server running on http://localhost:3001");
});