import { asyncHandler } from '../utils/asyncHandler.js';
import { processWhatsappOrder, buildWhatsappSummary } from './orderController.js';

export const createStoreWhatsappOrder = asyncHandler(async (req, res) => {
  const order = await processWhatsappOrder(req.body, req.storeId);
  res.status(201).json({
    success: true,
    message: 'Order request received',
    data: { order, whatsappMessage: buildWhatsappSummary(order) },
  });
});

export default { createStoreWhatsappOrder };
