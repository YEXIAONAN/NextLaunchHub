import {
  createDictionary,
  getAdminDictionaries,
  getDictionaries,
  updateDictionary
} from '../services/dictionaries-service.js';
import { success } from '../utils/response.js';

export async function getDictionariesController(req, res) {
  const data = await getDictionaries(req.user, req.query.dictType || req.query.dict_type);
  res.json(success(data));
}

export async function getAdminDictionariesController(req, res) {
  const data = await getAdminDictionaries(req.user, {
    dictType: req.query.dictType || req.query.dict_type,
    status: req.query.status
  });
  res.json(success(data));
}

export async function createDictionaryController(req, res) {
  const data = await createDictionary(req.user, {
    dictType: req.body.dictType || req.body.dict_type,
    dictLabel: req.body.dictLabel || req.body.dict_label,
    dictValue: req.body.dictValue || req.body.dict_value,
    sortNo: req.body.sortNo || req.body.sort_no,
    status: req.body.status
  });

  res.json(success(data, '字典项创建成功'));
}

export async function updateDictionaryController(req, res) {
  const data = await updateDictionary(req.user, Number(req.params.id), {
    dictType: req.body.dictType || req.body.dict_type,
    dictLabel: req.body.dictLabel || req.body.dict_label,
    dictValue: req.body.dictValue || req.body.dict_value,
    sortNo: req.body.sortNo || req.body.sort_no,
    status: req.body.status
  });

  res.json(success(data, '字典项更新成功'));
}
