import { redisClient } from './redis';

const BLOCKCHAIR_API_URL = 'https://api.blockchair.com';
const CACHE_KEY = 'crypto:rates';

export class CryptoRatesService {
  /**
   * Fetch current prices for BTC, ETH, etc. from Blockchair
   */
  async fetchRates() {
    try {
      // Example for Bitcoin and Ethereum
      // Blockchair API provides separate endpoints, e.g., /bitcoin/stats
      const btcResponse = await fetch(`${BLOCKCHAIR_API_URL}/bitcoin/stats`);
      const btcData = await btcResponse.json();
      const btcPrice = btcData.data.market_price_usd;

      const ethResponse = await fetch(`${BLOCKCHAIR_API_URL}/ethereum/stats`);
      const ethData = await ethResponse.json();
      const ethPrice = ethData.data.market_price_usd;

      const rates = {
        BTC: btcPrice,
        ETH: ethPrice,
        timestamp: new Date().toISOString()
      };

      // Store in Redis (cache for 60 seconds)
      await redisClient.setEx(CACHE_KEY, 60, JSON.stringify(rates));
      
      console.log('Crypto rates updated:', rates);
      return rates;
    } catch (error) {
      console.error('Error fetching crypto rates from Blockchair:', error);
      // fallback to cached data
      const cached = await redisClient.get(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    }
  }

  async getRates() {
    const cached = await redisClient.get(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    return this.fetchRates();
  }

  /**
   * Start a worker to poll every 60 seconds
   */
  startPolling() {
    console.log('Starting Crypto Rates polling...');
    this.fetchRates();
    setInterval(() => {
      this.fetchRates();
    }, 60 * 1000);
  }
}

export const cryptoRatesService = new CryptoRatesService();
