import { globalSearch } from '../services/search-service.js';
import { success } from '../utils/response.js';

export async function globalSearchController(req, res) {
  res.json(success(await globalSearch(req.user, req.query.keyword || req.query.q)));
}
