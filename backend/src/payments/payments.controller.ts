import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('packs')
  getPacks() {
    return { packs: this.paymentsService.getPacks() };
  }

  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  async createCheckoutSession(
    @Request() req: any,
    @Body('packId') packId: string,
  ) {
    const userId: string = req.user.userId;
    const userEmail: string = req.user.email;
    return this.paymentsService.createCheckoutSession(userId, userEmail, packId);
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature?: string,
  ) {
    // NestJS rawBody desteği varsa req.rawBody, yoksa req.body
    const payload = req.rawBody || req.body;
    return this.paymentsService.handleWebhook(payload, signature);
  }

  @Post('simulate-success')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async simulateSuccess(
    @Request() req: any,
    @Body('packId') packId: string,
  ) {
    const userId: string = req.user.userId;
    return this.paymentsService.simulateSuccess(userId, packId);
  }
}
