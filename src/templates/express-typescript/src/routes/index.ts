import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Mount route modules
 */
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);

export default router;
