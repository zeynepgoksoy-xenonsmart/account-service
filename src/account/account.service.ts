import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
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
    try {
      // Email benzersizliği kontrolü
      const existingAccount = await this.prisma.account.findUnique({
        where: { email: createAccountDto.email },
      });

      if (existingAccount && !existingAccount.deletedAt) {
        throw new RpcException({
          code: 6, // ALREADY_EXISTS
          message: 'Email already exists',
        });
      }

      // Create account
      const account = await this.prisma.account.create({
        data: {
          email: createAccountDto.email,
          name: createAccountDto.name,
          password: createAccountDto.password,
        },
      });

      // Create account parameters if provided
      if (createAccountDto.phoneNumber || createAccountDto.postalCode) {
        const parametersToCreate: Array<{
          accountId: string;
          name: string;
          data: { value: string };
          isActive: boolean;
        }> = [];

        if (createAccountDto.phoneNumber) {
          parametersToCreate.push({
            accountId: account.id,
            name: 'phoneNumber',
            data: { value: createAccountDto.phoneNumber },
            isActive: true,
          });
        }

        if (createAccountDto.postalCode) {
          parametersToCreate.push({
            accountId: account.id,
            name: 'postalCode',
            data: { value: createAccountDto.postalCode },
            isActive: true,
          });
        }

        if (parametersToCreate.length > 0) {
          await this.prisma.accountParameter.createMany({
            data: parametersToCreate as any,
          });
        }
      }

      const response = this.toResponseDto(account);
      return response;
    } catch (error) {
      throw error;
    }
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
      throw new RpcException({
        code: 5, // NOT_FOUND
        message: `Account with id ${accountId} not found`,
      });
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
      throw new RpcException({
        code: 5, // NOT_FOUND
        message: `Account with id ${id} not found`,
      });
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
      throw new RpcException({
        code: 5, // NOT_FOUND
        message: `Account with id ${id} not found`,
      });
    }

    // Email değişiyorsa, benzersizlik kontrolü
    if (updateAccountDto.email && updateAccountDto.email !== account.email) {
      const existingAccount = await this.prisma.account.findUnique({
        where: { email: updateAccountDto.email },
      });

      if (existingAccount && !existingAccount.deletedAt) {
        throw new RpcException({
          code: 6, // ALREADY_EXISTS
          message: 'Email already exists',
        });
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
      throw new RpcException({
        code: 5, // NOT_FOUND
        message: `Account with id ${id} not found`,
      });
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
    try {
      const createdAt = account.createdAt instanceof Date 
        ? account.createdAt.toISOString() 
        : account.createdAt 
          ? new Date(account.createdAt).toISOString()
          : new Date().toISOString();
      
      const updatedAt = account.updatedAt instanceof Date 
        ? account.updatedAt.toISOString() 
        : account.updatedAt 
          ? new Date(account.updatedAt).toISOString()
          : new Date().toISOString();
      
      const deletedAt = account.deletedAt 
        ? (account.deletedAt instanceof Date 
            ? account.deletedAt.toISOString() 
            : new Date(account.deletedAt).toISOString())
        : null;

      return {
        id: account.id,
        email: account.email,
        name: account.name,
        createdAt,
        updatedAt,
        deletedAt,
      };
    } catch (error) {
      console.error('***************** Error in toResponseDto:', error, account);
      throw error;
    }
  }
}

