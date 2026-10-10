import express from 'express';
import { getMonitorAnalytics } from '../controllers/analytics.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/:monitorId', getMonitorAnalytics);

export default router;
