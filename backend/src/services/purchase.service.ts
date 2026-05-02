import { raffleRepository } from '../repositories/raffle.repository';
import { raffleNumberRepository } from '../repositories/raffle-number.repository';
import { purchaseRepository } from '../repositories/purchase.repository';
import { Purchase, ReserveNumbersDto } from '../types';

export class PurchaseService {
  async reserveNumbers(data: ReserveNumbersDto): Promise<{
    success: boolean;
    purchase?: Purchase;
    whatsappUrl?: string;
    message?: string;
    conflicted?: number[];
  }> {
    const raffle = await raffleRepository.findById(data.raffle_id);

    if (!raffle) {
      throw new Error('Rifa não encontrada');
    }

    if (raffle.status !== 'active') {
      throw new Error('Esta rifa não está mais ativa');
    }

    if (!data.numbers || data.numbers.length === 0) {
      throw new Error('Selecione pelo menos um número');
    }

    // Validar números dentro do range
    const invalidNumbers = data.numbers.filter(
      n => n < 1 || n > raffle.total_numbers || !Number.isInteger(n)
    );

    if (invalidNumbers.length > 0) {
      throw new Error(`Números inválidos: ${invalidNumbers.join(', ')}`);
    }

    // Remover duplicatas
    const uniqueNumbers = [...new Set(data.numbers)];

    // Tentar reservar com controle de concorrência (SELECT FOR UPDATE)
    const reserveResult = await raffleNumberRepository.reserveNumbers(
      data.raffle_id,
      uniqueNumbers,
      data.buyer_name,
      data.buyer_phone
    );

    if (!reserveResult.success) {
      return {
        success: false,
        conflicted: reserveResult.conflicted,
        message: `Os números ${reserveResult.conflicted.join(', ')} já foram reservados ou comprados. Por favor, selecione outros.`,
      };
    }

    // Criar registro de compra pendente
    const totalAmount = uniqueNumbers.length * Number(raffle.price_per_number);

    const purchase = await purchaseRepository.create({
      raffle_id: data.raffle_id,
      buyer_name: data.buyer_name,
      buyer_phone: data.buyer_phone,
      numbers: uniqueNumbers,
      total_amount: totalAmount,
    });

    // Vincular purchase_id aos números reservados
    await raffleNumberRepository.confirmPurchase(
      data.raffle_id,
      uniqueNumbers,
      purchase.id,
      data.buyer_name,
      data.buyer_phone
    );

    // Atualizar status da compra para confirmed
    const confirmedPurchase = await purchaseRepository.updateStatus(purchase.id, 'confirmed');

    // Gerar mensagem e URL do WhatsApp
    const whatsappUrl = this.generateWhatsAppUrl(raffle, data, uniqueNumbers, totalAmount);

    return {
      success: true,
      purchase: confirmedPurchase || purchase,
      whatsappUrl,
    };
  }

  private generateWhatsAppUrl(
    raffle: any,
    buyer: ReserveNumbersDto,
    numbers: number[],
    total: number
  ): string {
    const numbersFormatted = numbers
      .sort((a, b) => a - b)
      .map(n => String(n).padStart(String(raffle.total_numbers).length, '0'))
      .join(', ');

    const message = [
      `*PARTICIPAÇÃO NA RIFA*`,
      ``,
      `*Rifa:* ${raffle.title}`,
      ``,
      `*Nome:* ${buyer.buyer_name}`,
      `*Telefone:* ${buyer.buyer_phone}`,
      ``,
      `*Números escolhidos:*`,
      numbersFormatted,
      ``,
      `*Quantidade:* ${numbers.length} número(s)`,
      `*Valor por número:* R$ ${Number(raffle.price_per_number).toFixed(2)}`,
      `*Total a pagar:* R$ ${total.toFixed(2)}`,
      ``,
      `*Data do sorteio:* ${new Date(raffle.draw_date).toLocaleDateString('pt-BR')}`,
      ``,
      `_Aguardo a confirmação do pagamento!_`,
    ].join('\n');

    const encodedMessage = encodeURIComponent(message);
    const phone = raffle.whatsapp_number.replace(/\D/g, '');

    return `https://wa.me/${phone}?text=${encodedMessage}`;
  }

  async getAllPurchases(params?: {
    raffle_id?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Purchase[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = params?.page || 1;
    const limit = params?.limit || 50;

    const result = await purchaseRepository.findAll({ ...params, page, limit });

    return {
      ...result,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  async getPurchaseById(id: string): Promise<Purchase> {
    const purchase = await purchaseRepository.findById(id);

    if (!purchase) {
      throw new Error('Compra não encontrada');
    }

    return purchase;
  }

  async cancelPurchase(purchaseId: string): Promise<Purchase> {
    const purchase = await purchaseRepository.findById(purchaseId);

    if (!purchase) {
      throw new Error('Compra não encontrada');
    }

    if (purchase.status === 'cancelled') {
      throw new Error('Esta compra já foi cancelada');
    }

    // Liberar os números
    await raffleNumberRepository.releaseReservationByPhone(
      purchase.raffle_id,
      purchase.buyer_phone
    );

    const updated = await purchaseRepository.updateStatus(purchaseId, 'cancelled');

    if (!updated) {
      throw new Error('Erro ao cancelar compra');
    }

    return updated;
  }
}

export const purchaseService = new PurchaseService();
