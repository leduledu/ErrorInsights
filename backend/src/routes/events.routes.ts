import { Router } from 'express';
import { EventsController } from '../controllers/events.controller';

const router = Router();

router.get('/search', EventsController.searchErrorEvents);

router.get('/stats', EventsController.getErrorEventStats);

router.get('/browsers', EventsController.getBrowsers);

router.get('/urls', EventsController.getUrls);

router.get('/users', EventsController.getUsers);

router.get('/mock/start', EventsController.startMockErrors);

router.get('/:id', EventsController.getErrorEventById);

export { router as eventsRouter };
