import express from 'express';
import { getPublicStatus } from '../controllers/status.controller.js';

const router = express.Router();

router.get('/:companyName', getPublicStatus);

export default router;
