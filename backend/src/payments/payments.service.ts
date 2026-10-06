import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { MarketService } from '../market/market.service';
import { findTokenPack, TOKEN_PACKS_CATALOG } from '../market/market-catalog';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;

  constructor(private readonly marketService: MarketService) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey && stripeKey.trim() !== '') {
      this.stripe = new Stripe(stripeKey);
      this.logger.log('Stripe initialized with configured secret key.');
    } else {
      this.logger.warn(
        'STRIPE_SECRET_KEY not set. Operating in simulated test payment mode.',
      );
    }
  }

  /**
   * Stripe Checkout Session oluşturur.
   */
  async createCheckoutSession(
    userId: string,
    userEmail: string,
    packId: string,
  ) {
    const pack = findTokenPack(packId);
    if (!pack) {
      throw new BadRequestException('Böyle bir token paketi bulunamadı.');
    }

    const totalTokens = pack.tokens + pack.bonus;
    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:3000';

    // Eğer Stripe anahtarı tanımlıysa gerçek Stripe Checkout oturumu aç
    if (this.stripe) {
      try {
        const session = await this.stripe.checkout.sessions.create({
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: `${pack.name} — ${totalTokens.toLocaleString('tr-TR')} Token`,
                  description:
                    pack.bonus > 0
                      ? `${pack.tokens} token + ${pack.bonus} hediye token`
                      : `${pack.tokens} token`,
                },
                unit_amount: Math.round(pack.priceEur * 100), // Cents
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          customer_email: userEmail,
          client_reference_id: userId,
          metadata: {
            userId,
            packId: pack.id,
            tokens: String(totalTokens),
            priceEur: String(pack.priceEur),
          },
          success_url: `${frontendUrl}/market?payment=success&session_id={CHECKOUT_SESSION_ID}&pack_id=${pack.id}`,
          cancel_url: `${frontendUrl}/market?payment=cancelled`,
        });

        this.logger.log(
          `Created Stripe checkout session ${session.id} for user ${userId}, pack ${pack.id}`,
        );

        return {
          checkoutUrl: session.url,
          sessionId: session.id,
          isSimulated: false,
        };
      } catch (err: any) {
        this.logger.error(`Failed to create Stripe session: ${err.message}`, err.stack);
        throw new BadRequestException(`Stripe oturumu oluşturulamadı: ${err.message}`);
      }
    }

    // Stripe anahtarı henüz girilmemişse güvenli simülasyon modu URL'i döner
    this.logger.log(
      `Returning simulated test payment URL for pack ${pack.id} (user: ${userId})`,
    );

    return {
      checkoutUrl: `${frontendUrl}/market?payment=success&test_simulated=1&pack_id=${pack.id}&tokens=${totalTokens}`,
      sessionId: `sim_${Date.now()}_${userId.slice(0, 8)}`,
      isSimulated: true,
      message: 'STRIPE_SECRET_KEY henüz tanımlanmadığı için test modunda simüle edildi.',
    };
  }

  /**
   * Stripe Webhook isteğini doğrular ve bakiyeyi artırır.
   */
  async handleWebhook(rawBody: Buffer | string, signature?: string) {
    let event: Stripe.Event;

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (this.stripe && webhookSecret && signature) {
      try {
        event = this.stripe.webhooks.constructEvent(
          rawBody,
          signature,
          webhookSecret,
        );
      } catch (err: any) {
        this.logger.error(`Webhook signature verification failed: ${err.message}`);
        throw new BadRequestException(`Geçersiz webhook imzası: ${err.message}`);
      }
    } else {
      // Test / development modu payload ayrıştırması
      try {
        event = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf8'));
      } catch (e) {
        throw new BadRequestException('Webhook içeriği okunamadı.');
      }
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || session.client_reference_id;
      const tokens = session.metadata?.tokens ? parseInt(session.metadata.tokens, 10) : 0;
      const packId = session.metadata?.packId;
      const priceEur = session.metadata?.priceEur ? parseFloat(session.metadata.priceEur) : undefined;

      if (!userId || tokens <= 0) {
        this.logger.warn(`Checkout session missing userId or valid tokens: ${session.id}`);
        return { received: true, processed: false };
      }

      await this.marketService.creditTokens(
        userId,
        tokens,
        'STRIPE_PURCHASE',
        {
          stripeSessionId: session.id,
          packId,
          priceEur,
          customerEmail: session.customer_details?.email,
          paymentStatus: session.payment_status,
        },
      );

      this.logger.log(
        `Successfully processed Stripe purchase for user ${userId}: +${tokens} tokens (Session: ${session.id})`,
      );

      return { received: true, processed: true, tokens, userId };
    }

    return { received: true, ignored: true, type: event.type };
  }

  /**
   * Geliştirme ve test ortamı için anında test paketi tamamlama.
   * Gerçek para olmadan uçtan uca akışı test etmeyi sağlar.
   */
  async simulateSuccess(userId: string, packId: string) {
    const pack = findTokenPack(packId);
    if (!pack) {
      throw new BadRequestException('Geçersiz token paketi.');
    }

    const totalTokens = pack.tokens + pack.bonus;
    const result = await this.marketService.creditTokens(
      userId,
      totalTokens,
      'STRIPE_PURCHASE',
      {
        testSimulated: true,
        packId: pack.id,
        priceEur: pack.priceEur,
        packName: pack.name,
      },
    );

    return {
      success: true,
      pack,
      tokensAdded: totalTokens,
      newBalance: result.tokenBalance,
    };
  }

  getPacks() {
    return TOKEN_PACKS_CATALOG;
  }
}
