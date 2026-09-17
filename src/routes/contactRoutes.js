const express = require('express');
const contactController = require('../controllers/contactController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', contactController.list);
router.post('/', contactController.create);
router.patch('/:id', contactController.update);
router.delete('/:id', contactController.remove);

module.exports = router;
