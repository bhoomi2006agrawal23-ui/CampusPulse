import { Router } from 'express';
import { CertificateController } from '../controllers/certificate.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Public safe verification (no authentication required)
router.get('/verify/:certificateId', CertificateController.verifyCertificate);

// Authenticated student retrieves personal certificates
router.get('/', authenticate, CertificateController.getMyCertificates);
router.get('/me', authenticate, CertificateController.getMyCertificates);

export default router;
