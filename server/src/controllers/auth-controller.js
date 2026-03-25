import { login } from '../services/auth-service.js';
import { success } from '../utils/response.js';

export async function loginController(req, res) {
  const data = await login(req.body);
  res.json(success(data));
}
