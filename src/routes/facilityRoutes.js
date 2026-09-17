const express = require('express');
const facilityController = require('../controllers/facilityController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', facilityController.list);
router.post('/', requireRole('admin'), facilityController.create);

module.exports = router;
