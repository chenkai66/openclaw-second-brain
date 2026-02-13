---
title: Node.js Backend Development with Express
created: 2026-02-11
updated: 2026-02-11
tags: ["nodejs", "backend", "javascript", "express", "api"]
summary: Node.js backend development with Express framework authentication and database integration
ai_refined: true
---

# Node.js Backend Development with Express

## Express Framework Basics

### Basic Setup

```javascript
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});

// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Route Organization

```javascript
// routes/users.js
const express = require('express');
const router = express.Router();

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;

// app.js
app.use('/api/users', require('./routes/users'));
```

## Middleware

### Custom Middleware

```javascript
// Logging middleware
const logger = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
};

app.use(logger);
```

### Error Handling Middleware

```javascript
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

app.use(errorHandler);
```

### Authentication Middleware

```javascript
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/protected', auth, (req, res) => {
  res.json({ user: req.user });
});
```

## Database Integration

### MongoDB with Mongoose

```javascript
const mongoose = require('mongoose');

// Connect
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Middleware
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model('User', userSchema);

// CRUD operations
const createUser = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

const findUser = async (id) => {
  return await User.findById(id);
};
```

### PostgreSQL with Prisma

```prisma
// schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}
```

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const user = await prisma.user.create({
  data: { email, name }
});

const users = await prisma.user.findMany({
  include: { posts: true }
});
```

## API Design

### RESTful API

```javascript
// GET /api/posts - Get all posts
// GET /api/posts/:id - Get single post
// POST /api/posts - Create post
// PUT /api/posts/:id - Update post
// DELETE /api/posts/:id - Delete post

router.get('/posts', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  const posts = await Post.find()
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });
  
  const count = await Post.countDocuments();
  
  res.json({
    posts,
    totalPages: Math.ceil(count / limit),
    currentPage: page
  });
});
```

### Input Validation

```javascript
const { body, validationResult } = require('express-validator');

router.post('/users',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Create user
  }
);
```

## Authentication

### JWT Authentication

```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await User.create({
    email,
    password: hashedPassword
  });
  
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  res.json({ token, user });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  res.json({ token, user });
});
```

## File Upload

### Multer

```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  }
});

router.post('/upload', upload.single('image'), (req, res) => {
  res.json({ file: req.file });
});
```

## Caching

### Redis

```javascript
const redis = require('redis');
const client = redis.createClient();

const cache = (duration) => {
  return async (req, res, next) => {
    const key = req.originalUrl;
    
    const cached = await client.get(key);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.originalJson = res.json;
    res.json = (data) => {
      client.setex(key, duration, JSON.stringify(data));
      res.originalJson(data);
    };
    
    next();
  };
};

router.get('/posts', cache(300), async (req, res) => {
  const posts = await Post.find();
  res.json(posts);
});
```

## Performance Optimization

### Compression

```javascript
const compression = require('compression');
app.use(compression());
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Cluster Mode

```javascript
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  app.listen(3000);
}
```

## Testing

### Jest + Supertest

```javascript
const request = require('supertest');
const app = require('../app');

describe('User API', () => {
  test('GET /api/users', async () => {
    const response = await request(app)
      .get('/api/users')
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
  });
  
  test('POST /api/users', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        name: 'Test User',
        email: 'test@example.com'
      })
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
  });
});
```

## Deployment

### PM2

```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start app.js

# Cluster mode
pm2 start app.js -i max

# View status
pm2 status

# View logs
pm2 logs
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
```

> Node.js enables JavaScript developers to build high-performance server-side applications.
