import app from './app';
import { env } from './config/env';
import { connectRedis } from './shared/clients/redis';
import { connectKafka } from './shared/clients/kafka';
import { cryptoRatesService } from './shared/clients/cryptoRates.service';

const startServer = async () => {
  try {
    await connectRedis();
    await connectKafka(); // Connect Kafka producer before accepting requests
    cryptoRatesService.startPolling(); // Start fetching crypto prices

    app.listen(env.PORT, () => {
      console.log(`Server is running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};
startServer();
