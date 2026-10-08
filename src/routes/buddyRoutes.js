const express = require('express');
const buddyController = require('../controllers/buddyController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('student', 'admin'));

router.get('/', buddyController.list);
router.get('/incoming', buddyController.listIncoming);
router.get('/lookup', buddyController.lookup);
router.post('/', buddyController.create);
router.post('/:id/respond', buddyController.respond);
router.delete('/:id', buddyController.remove);

module.exports = router;
