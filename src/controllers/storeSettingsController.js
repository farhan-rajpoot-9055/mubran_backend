import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPublicSettingsPayload } from './settingsController.js';

export const getStorePublicSettings = asyncHandler(async (req, res) => {
  const data = await buildPublicSettingsPayload(req.storeId);
  res.json({ success: true, data });
});

export default { getStorePublicSettings };
