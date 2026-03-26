import { Router } from 'express';
import {
  createDictionaryController,
  getAdminDictionariesController,
  updateDictionaryController
} from '../controllers/dictionaries-controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { HttpError } from '../utils/http-error.js';

const router = Router();

router.get('/', asyncHandler(getAdminDictionariesController));

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const dictType = req.body.dictType || req.body.dict_type;
    const dictLabel = req.body.dictLabel || req.body.dict_label;
    const dictValue = req.body.dictValue || req.body.dict_value;

    if (!dictType || !dictLabel || !dictValue) {
      throw new HttpError(400, '字典类型、字典名称和字典值不能为空');
    }

    await createDictionaryController(req, res);
  })
);

router.patch('/:id', asyncHandler(updateDictionaryController));

export default router;
