import { downloadAttachment, uploadAttachment } from '../services/attachment-service.js';
import { success } from '../utils/response.js';

export async function uploadAttachmentController(req, res) {
  res.json(success(await uploadAttachment(req.user, Number(req.params.id), req.body), '附件上传成功'));
}

export async function downloadAttachmentController(req, res) {
  const { attachment, filePath } = await downloadAttachment(req.user, Number(req.params.attachmentId));
  res.type(attachment.mime_type);
  res.download(filePath, attachment.original_name);
}
