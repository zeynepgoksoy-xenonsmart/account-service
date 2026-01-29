import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountResponseDto } from './dto/account-response.dto';

@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  /**
   * POST /accounts
   * Yeni bir account oluşturur
   * Saga orchestrator bu endpoint'i çağırarak süreci başlatır
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAccountDto: CreateAccountDto): Promise<AccountResponseDto> {
    return this.accountService.create(createAccountDto);
  }

  /**
   * POST /accounts/:id/compensate
   * Saga compensation endpoint'i
   * Workspace oluşturulurken hata olursa orchestrator bu endpoint'i çağırır
   * Account'u soft delete yapar
   */
  @Post(':id/compensate')
  @HttpCode(HttpStatus.OK)
  async compensate(@Param('id') id: string): Promise<AccountResponseDto> {
    return this.accountService.compensate(id);
  }

  /**
   * GET /accounts
   * Tüm active accountları listeler
   */
  @Get()
  async findAll(): Promise<AccountResponseDto[]> {
    return this.accountService.findAll();
  }

  /**
   * GET /accounts/:id
   * ID'ye göre account getirir
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AccountResponseDto> {
    return this.accountService.findById(id);
  }

  /**
   * PATCH /accounts/:id
   * Account bilgilerini günceller
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accountService.update(id, updateAccountDto);
  }

  /**
   * DELETE /accounts/:id
   * Account'u soft delete yapar
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.accountService.delete(id);
  }
}

