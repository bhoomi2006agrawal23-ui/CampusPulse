import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';

const router = Router();

// Strictly ADMIN ONLY access for security audit logs
router.get('/', authenticate, requireAdmin, AuditController.getAuditLogs);

export default router;
