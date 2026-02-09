import { Controller } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountResponseDto } from './dto/account-response.dto';
import { GrpcMethod } from '@nestjs/microservices';
import {
  CreateAccountRequest,
  CompensateAccountRequest,
  GetAccountRequest,
  UpdateAccountRequest,
  DeleteAccountRequest,
  ListAccountsRequest,
} from './dto/grpc-requests.dto';

@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  /**
   * CreateAccount
   * Yeni bir account oluşturur
   * Saga orchestrator bu metodu çağırarak süreci başlatır
   */
  @GrpcMethod('AccountService', 'CreateAccount')
  async create(data: CreateAccountRequest): Promise<AccountResponseDto> {
    try {
      const createDto: CreateAccountDto = {
        email: data.email,
        name: data.name,
        password: data.password,
        phoneNumber: data.phoneNumber,
        postalCode: data.postalCode,
      };
      const result = await this.accountService.create(createDto);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * CompensateAccount
   * Saga compensation endpoint'i
   * Workspace oluşturulurken hata olursa orchestrator bu metodu çağırır
   * Account'u soft delete yapar
   */
  @GrpcMethod('AccountService', 'CompensateAccount')
  async compensate(data: CompensateAccountRequest): Promise<AccountResponseDto> {
    return this.accountService.compensate(data.accountId);
  }

  /**
   * ListAccounts
   * Tüm active accountları listeler
   */
  @GrpcMethod('AccountService', 'ListAccounts')
  async findAll(data: ListAccountsRequest): Promise<AccountResponseDto[]> {
    return this.accountService.findAll();
  }

  /**
   * GetAccount
   * ID'ye göre account getirir
   */
  @GrpcMethod('AccountService', 'GetAccount')
  async findOne(data: GetAccountRequest): Promise<AccountResponseDto> {
    return this.accountService.findById(data.accountId);
  }

  /**
   * UpdateAccount
   * Account bilgilerini günceller
   */
  @GrpcMethod('AccountService', 'UpdateAccount')
  async update(data: UpdateAccountRequest): Promise<AccountResponseDto> {
    const updateDto: UpdateAccountDto = {
      email: data.email,
      name: data.name,
      password: data.password,
    };
    return this.accountService.update(data.accountId, updateDto);
  }

  /**
   * DeleteAccount
   * Account'u soft delete yapar
   */
  @GrpcMethod('AccountService', 'DeleteAccount')
  async remove(data: DeleteAccountRequest): Promise<void> {
    return this.accountService.delete(data.accountId);
  }
}

