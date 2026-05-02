import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { JwtPayload } from '../types';

export class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  async login(email: string, password: string): Promise<{
    token: string;
    user: { id: string; name: string; email: string; role: string };
  }> {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      throw new Error('Credenciais inválidas');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    } as jwt.SignOptions);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;
      return decoded;
    } catch (error) {
      throw new Error('Token inválido ou expirado');
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const passwordValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!passwordValid) {
      throw new Error('Senha atual incorreta');
    }

    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(newPassword, salt);

    await userRepository.updatePassword(userId, newHash);
  }
}

export const authService = new AuthService();
