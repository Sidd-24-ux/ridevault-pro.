import { Router } from 'express';
import {
  chatAssistant,
  ridingGearPackAssistant,
  sizeRecommendationEngine,
  imageSearchProductDetect
} from '../controllers/ai.controller';

const router = Router();

router.post('/chat', chatAssistant);
router.post('/pack', ridingGearPackAssistant);
router.post('/size', sizeRecommendationEngine);
router.post('/image-search', imageSearchProductDetect);

export default router;
