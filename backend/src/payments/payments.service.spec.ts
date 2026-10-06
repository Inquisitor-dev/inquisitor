import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { MarketService } from '../market/market.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let mockMarketService: any;

  beforeEach(() => {
    mockMarketService = {
      creditTokens: jest.fn().mockResolvedValue({ success: true, tokenBalance: 1900 }),
    };

    service = new PaymentsService(mockMarketService as unknown as MarketService);
  });

  describe('createCheckoutSession', () => {
    it('geçersiz paket id verildiğinde BadRequestException fırlatır', async () => {
      await expect(
        service.createCheckoutSession('user-1', 'test@test.com', 'invalid_pack'),
      ).rejects.toThrow(BadRequestException);
    });

    it('STRIPE_SECRET_KEY olmadığında simüle test modu URL döner', async () => {
      const result = await service.createCheckoutSession(
        'user-1',
        'test@test.com',
        'pack_pouch',
      );

      expect(result.isSimulated).toBe(true);
      expect(result.checkoutUrl).toContain('pack_id=pack_pouch');
      expect(result.checkoutUrl).toContain('payment=success');
    });
  });

  describe('simulateSuccess', () => {
    it('belirtilen paketin tokenlerini kullanıcıya ekler ve ledger kaydı oluşturur', async () => {
      const result = await service.simulateSuccess('user-1', 'pack_pouch');

      expect(result.success).toBe(true);
      expect(result.tokensAdded).toBe(900); // 800 + 100 bonus
      expect(mockMarketService.creditTokens).toHaveBeenCalledWith(
        'user-1',
        900,
        'STRIPE_PURCHASE',
        expect.objectContaining({
          packId: 'pack_pouch',
          testSimulated: true,
        }),
      );
    });
  });

  describe('handleWebhook', () => {
    it('checkout.session.completed olayını işler ve tokenleri kredilendirir', async () => {
      const payload = JSON.stringify({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            client_reference_id: 'user-1',
            metadata: {
              userId: 'user-1',
              packId: 'pack_chest',
              tokens: '2100',
              priceEur: '9.99',
            },
            payment_status: 'paid',
          },
        },
      });

      const result = await service.handleWebhook(payload);

      expect(result.received).toBe(true);
      expect(result.processed).toBe(true);
      expect(mockMarketService.creditTokens).toHaveBeenCalledWith(
        'user-1',
        2100,
        'STRIPE_PURCHASE',
        expect.objectContaining({
          stripeSessionId: 'cs_test_123',
          packId: 'pack_chest',
        }),
      );
    });
  });
});
