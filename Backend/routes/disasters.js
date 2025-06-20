const express = require('express');
const router = express.Router();
const { createDisaster,getDisasters,updateDisaster,deleteDisaster,getNearbyResources,postResource,getSocialMedia,createReport,getOfficialUpdates, getReports, getNearbyHospitals } = require('../controllers/disastersController');

router.post('/', createDisaster);
router.get('/', getDisasters);
router.put('/:id', updateDisaster);
router.delete('/:id', deleteDisaster);
router.get('/:id/resources', getNearbyResources);
router.post('/:id/resources', postResource);
router.get('/:id/social-media', getSocialMedia);
// router.post('/:id/verify-image', verifyImage);
router.post('/:id/reports', createReport);
router.get('/:id/reports', require('../controllers/disastersController').getReports);
router.get('/:id/official-updates', getOfficialUpdates);
router.get('/:id/nearby-hospitals', getNearbyHospitals);

module.exports = router;
