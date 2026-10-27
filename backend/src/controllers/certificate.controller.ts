import { Request, Response } from 'express';
import { CertificateService } from '../services/certificate.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class CertificateController {
  /**
   * GET /api/certificates or GET /api/certificates/me
   */
  static async getMyCertificates(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const certs = await CertificateService.getStudentCertificates(req.user.id);
      sendSuccess(res, { certificates: certs });
    } catch (err: any) {
      sendError(res, 'CERTIFICATE_ERROR', err.message || 'Failed to fetch certificates', 400);
    }
  }

  /**
   * GET /api/events/:eventId/certificates
   */
  static async getEventCertificates(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { eventId } = req.params;
      const certs = await CertificateService.getEventCertificates(eventId, req.user);
      sendSuccess(res, { certificates: certs });
    } catch (err: any) {
      const status = err.message.includes('FORBIDDEN') || err.message.includes('UNAUTHORIZED') ? 403 : 400;
      sendError(res, 'CERTIFICATE_ERROR', err.message, status);
    }
  }

  /**
   * POST /api/events/:eventId/certificates/generate
   */
  static async generateCertificate(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { eventId } = req.params;
      const cert = await CertificateService.generateCertificate(eventId, req.body, req.user);
      sendSuccess(res, { certificate: cert }, 201, 'Certificate generated successfully');
    } catch (err: any) {
      const status =
        err.message.includes('FORBIDDEN') || err.message.includes('UNAUTHORIZED')
          ? 403
          : err.message.includes('ALREADY_EXISTS')
          ? 409
          : 400;
      sendError(res, 'CERTIFICATE_ERROR', err.message, status);
    }
  }

  /**
   * POST /api/events/:eventId/certificates/bulk
   */
  static async bulkGenerateCertificates(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { eventId } = req.params;
      const certificateType = req.body.certificateType || 'Participation';
      const result = await CertificateService.bulkGenerateCertificates(eventId, certificateType, req.user);
      sendSuccess(res, result, 201, `Generated ${result.generatedCount} certificates`);
    } catch (err: any) {
      const status = err.message.includes('FORBIDDEN') || err.message.includes('UNAUTHORIZED') ? 403 : 400;
      sendError(res, 'CERTIFICATE_ERROR', err.message, status);
    }
  }

  /**
   * GET /api/certificates/verify/:certificateId - Public verification
   */
  static async verifyCertificate(req: Request, res: Response): Promise<void> {
    try {
      const { certificateId } = req.params;
      const verification = await CertificateService.verifyCertificate(certificateId);
      sendSuccess(res, verification, 200, 'Certificate authenticity verified');
    } catch (err: any) {
      const status = err.message.includes('NOT_FOUND') ? 404 : 400;
      sendError(res, 'INVALID_CERTIFICATE', err.message || 'Invalid certificate verification ID', status);
    }
  }
}
