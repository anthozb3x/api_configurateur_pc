import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { swaggerOptions } from './config/swagger';

// Import routes
import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import componentRoutes from './routes/component.routes';
import merchantRoutes from './routes/merchant.routes';
import configurationRoutes from './routes/configuration.routes';
import userRoutes from './routes/user.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger documentation
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/components', componentRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/configurations', configurationRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is running' });
});

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || '')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((error: Error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

export default app;

