import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountResponseDto } from './dto/account-response.dto';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Yeni bir account oluşturur (Saga'nın ilk adımı)
   */
  async create(createAccountDto: CreateAccountDto): Promise<AccountResponseDto> {
    // Email benzersizliği kontrolü
    const existingAccount = await this.prisma.account.findUnique({
      where: { email: createAccountDto.email },
    });

    if (existingAccount && !existingAccount.deletedAt) {
      throw new ConflictException('Email already exists');
    }

    const account = await this.prisma.account.create({
      data: createAccountDto,
    });

    return this.toResponseDto(account);
  }

  /**
   * Saga compensation: Account'u soft delete yapar
   * Workspace oluşturulurken hata olursa orchestrator bu endpoint'i çağırır
   */
  async compensate(accountId: string): Promise<AccountResponseDto> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException(`Account with id ${accountId} not found`);
    }

    if (account.deletedAt) {
      // Zaten silinmişse tekrar silmeye gerek yok
      return this.toResponseDto(account);
    }

    const deletedAccount = await this.prisma.account.update({
      where: { id: accountId },
      data: { deletedAt: new Date() },
    });

    return this.toResponseDto(deletedAccount);
  }

  /**
   * ID'ye göre account getirir (soft delete edilmemiş)
   */
  async findById(id: string): Promise<AccountResponseDto> {
    const account = await this.prisma.account.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!account) {
      throw new NotFoundException(`Account with id ${id} not found`);
    }

    return this.toResponseDto(account);
  }

  /**
   * Tüm active accountları getirir
   */
  async findAll(): Promise<AccountResponseDto[]> {
    const accounts = await this.prisma.account.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return accounts.map(account => this.toResponseDto(account));
  }

  /**
   * Account bilgilerini günceller
   */
  async update(id: string, updateAccountDto: UpdateAccountDto): Promise<AccountResponseDto> {
    const account = await this.prisma.account.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!account) {
      throw new NotFoundException(`Account with id ${id} not found`);
    }

    // Email değişiyorsa, benzersizlik kontrolü
    if (updateAccountDto.email && updateAccountDto.email !== account.email) {
      const existingAccount = await this.prisma.account.findUnique({
        where: { email: updateAccountDto.email },
      });

      if (existingAccount && !existingAccount.deletedAt) {
        throw new ConflictException('Email already exists');
      }
    }

    const updatedAccount = await this.prisma.account.update({
      where: { id },
      data: updateAccountDto,
    });

    return this.toResponseDto(updatedAccount);
  }

  /**
   * Account'u kalıcı olarak siler (hard delete - opsiyonel)
   */
  async delete(id: string): Promise<void> {
    const account = await this.prisma.account.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!account) {
      throw new NotFoundException(`Account with id ${id} not found`);
    }

    await this.prisma.account.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Prisma model'den DTO'ya dönüştürme helper
   */
  private toResponseDto(account: any): AccountResponseDto {
    return {
      id: account.id,
      email: account.email,
      name: account.name,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      deletedAt: account.deletedAt,
    };
  }
}

