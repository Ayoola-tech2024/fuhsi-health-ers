const express = require('express');
const buddyController = require('../controllers/buddyController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('student', 'admin'));

router.get('/', buddyController.list);
router.post('/', buddyController.create);
router.delete('/:id', buddyController.remove);

module.exports = router;
