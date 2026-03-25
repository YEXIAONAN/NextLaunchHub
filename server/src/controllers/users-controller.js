import { searchHelpers, searchRequesters } from '../services/users-service.js';
import { success } from '../utils/response.js';

export async function getRequestersController(req, res) {
  const data = await searchRequesters(req.query.keyword || '');
  res.json(success(data));
}

export async function getHelpersController(req, res) {
  const data = await searchHelpers(req.query.keyword || '');
  res.json(success(data));
}
