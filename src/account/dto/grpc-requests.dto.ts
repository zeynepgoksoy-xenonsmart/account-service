import { IsEmail, IsString, MinLength, IsOptional, IsInt, Min } from 'class-validator';

/**
 * CreateAccountRequest DTO
 * Account oluşturma için gRPC request mesajı
 */
export class CreateAccountRequest {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(6)
  password: string;
}

/**
 * CompensateAccountRequest DTO
 * Saga compensation için gRPC request mesajı
 */
export class CompensateAccountRequest {
  @IsString()
  accountId: string;
}

/**
 * GetAccountRequest DTO
 * Account sorgulama için gRPC request mesajı
 */
export class GetAccountRequest {
  @IsString()
  accountId: string;
}

/**
 * UpdateAccountRequest DTO
 * Account güncelleme için gRPC request mesajı
 */
export class UpdateAccountRequest {
  @IsString()
  accountId: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

/**
 * DeleteAccountRequest DTO
 * Account silme için gRPC request mesajı
 */
export class DeleteAccountRequest {
  @IsString()
  accountId: string;
}

/**
 * ListAccountsRequest DTO
 * Account listeleme için gRPC request mesajı
 */
export class ListAccountsRequest {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

