import { Router, Request, Response } from 'express';
import { cryptoRatesService } from '../../shared/clients/cryptoRates.service';

const router = Router();

router.get('/rates', async (req: Request, res: Response) => {
  try {
    const rates = await cryptoRatesService.getRates();
    res.status(200).json(rates);
  } catch (error) {
    console.error('Error fetching crypto rates endpoint', error);
    res.status(500).json({ error: 'Failed to fetch crypto rates' });
  }
});

export default router;
