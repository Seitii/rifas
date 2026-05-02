import path from 'path';
import fs from 'fs';
import { raffleRepository } from '../repositories/raffle.repository';
import { raffleNumberRepository } from '../repositories/raffle-number.repository';
import { CreateRaffleDto, Raffle, RaffleNumber, RaffleStats } from '../types';

export class RaffleService {
  async getAllRaffles(params?: { page?: number; limit?: number; status?: string }): Promise<{
    data: Raffle[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = params?.page || 1;
    const limit = params?.limit || 20;

    const result = await raffleRepository.findAll({ page, limit, status: params?.status });

    return {
      ...result,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  async getRaffleById(id: string): Promise<Raffle & { stats: RaffleStats }> {
    const raffle = await raffleRepository.findById(id);

    if (!raffle) {
      throw new Error('Rifa não encontrada');
    }

    const stats = await raffleRepository.getStats(id);

    return { ...raffle, stats };
  }

  async createRaffle(
    data: CreateRaffleDto,
    createdBy: string,
    imagePaths?: string[]
  ): Promise<Raffle> {
    if (data.total_numbers < 1 || data.total_numbers > 100000) {
      throw new Error('Total de números deve estar entre 1 e 100.000');
    }

    if (data.price_per_number <= 0) {
      throw new Error('Preço por número deve ser maior que zero');
    }

    const drawDate = new Date(data.draw_date);
    if (isNaN(drawDate.getTime()) || drawDate <= new Date()) {
      throw new Error('Data do sorteio deve ser uma data futura válida');
    }

    const raffle = await raffleRepository.create({
      ...data,
      image_url: imagePaths && imagePaths.length > 0 ? imagePaths[0] : undefined,
      images: imagePaths,
      created_by: createdBy,
    });

    return raffle;
  }

  async updateRaffle(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      draw_date: string;
      status: string;
      winner_number: number;
      whatsapp_number: string;
    }>,
    imagePaths?: string[]
  ): Promise<Raffle> {
    const raffle = await raffleRepository.findById(id);

    if (!raffle) {
      throw new Error('Rifa não encontrada');
    }

    const updateData: any = { ...data };

    if (imagePaths) {
      // Remover imagens antigas se existirem
      if (raffle.images && raffle.images.length > 0) {
        for (const oldImg of raffle.images) {
          const oldImagePath = path.join(process.cwd(), oldImg);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
      } else if (raffle.image_url) {
        const oldImagePath = path.join(process.cwd(), raffle.image_url);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      updateData.image_url = imagePaths.length > 0 ? imagePaths[0] : undefined;
      (updateData as any).images = imagePaths;
    }

    const updated = await raffleRepository.update(id, updateData);

    if (!updated) {
      throw new Error('Erro ao atualizar rifa');
    }

    return updated;
  }

  async deleteRaffle(id: string): Promise<void> {
    const raffle = await raffleRepository.findById(id);

    if (!raffle) {
      throw new Error('Rifa não encontrada');
    }

    const stats = await raffleRepository.getStats(id);

    if (stats.purchased > 0) {
      throw new Error('Não é possível excluir uma rifa com números vendidos');
    }

    // Remover imagens se existirem
    if (raffle.images && raffle.images.length > 0) {
      for (const img of raffle.images) {
        const imagePath = path.join(process.cwd(), img);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }
    } else if (raffle.image_url) {
      const imagePath = path.join(process.cwd(), raffle.image_url);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await raffleRepository.delete(id);
  }

  async getRaffleNumbers(raffleId: string): Promise<RaffleNumber[]> {
    const raffle = await raffleRepository.findById(raffleId);

    if (!raffle) {
      throw new Error('Rifa não encontrada');
    }

    return raffleNumberRepository.findByRaffleId(raffleId);
  }

  async getRaffleStats(raffleId: string): Promise<RaffleStats> {
    const raffle = await raffleRepository.findById(raffleId);

    if (!raffle) {
      throw new Error('Rifa não encontrada');
    }

    return raffleRepository.getStats(raffleId);
  }
}

export const raffleService = new RaffleService();
