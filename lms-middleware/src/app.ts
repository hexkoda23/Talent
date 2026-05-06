import path from 'path';
import express from 'express';
import routes from './routes';

const app = express();

// Middleware
app.use(express.json());

// Serve static files from the frontend build directory
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Routes
app.use('/api/v1', routes);

// Handle React routing, return all requests to React app
app.use((req, res, next) => {
  // If the request is for the API, don't serve the index.html
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'LMS Middleware is running' });
});

export default app;
