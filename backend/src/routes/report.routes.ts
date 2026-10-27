import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';

const router = Router();

// Universal system metrics for administrators
router.get('/system-overview', authenticate, requireAdmin, ReportController.getSystemMetrics);

export default router;
