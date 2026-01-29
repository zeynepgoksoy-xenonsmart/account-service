# Account Service - Saga Pattern Entegrasyonu

Bu servis, Saga Orchestrator pattern ile workspace-service ile entegre çalışmak üzere tasarlanmıştır.

## Mimari

```
Orchestrator
    │
    ├─── 1. POST /accounts (Account Service)
    │         └─── Başarılı: Account oluşturuldu
    │
    ├─── 2. POST /workspaces (Workspace Service)
    │         ├─── Başarılı: İşlem tamamlandı ✓
    │         └─── Başarısız: Compensation başlatılır
    │
    └─── 3. POST /accounts/:id/compensate (Account Service)
              └─── Account soft delete yapılır
```

## Endpointler

### 1. Account Oluşturma (Saga Başlangıç)
```http
POST /accounts
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securePassword123"
}

Response 201:
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-01-28T10:00:00Z",
  "updatedAt": "2026-01-28T10:00:00Z",
  "deletedAt": null
}
```

### 2. Compensation Endpoint (Rollback)
```http
POST /accounts/:id/compensate

Response 200:
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-01-28T10:00:00Z",
  "updatedAt": "2026-01-28T10:00:00Z",
  "deletedAt": "2026-01-28T10:05:00Z"  // Soft delete timestamp
}
```

### 3. Diğer Endpointler

#### Tüm Accountları Listele
```http
GET /accounts
```

#### Tek Account Getir
```http
GET /accounts/:id
```

#### Account Güncelle
```http
PATCH /accounts/:id
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

#### Account Sil (Soft Delete)
```http
DELETE /accounts/:id
```

## Saga Orchestrator Örnek Akışı

### Başarılı Senaryo
```javascript
async function createUserWithWorkspace(userData) {
  let accountId = null;
  
  try {
    // Adım 1: Account oluştur
    const accountResponse = await fetch('http://account-service:3001/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    const account = await accountResponse.json();
    accountId = account.id;
    
    // Adım 2: Workspace oluştur
    const workspaceResponse = await fetch('http://workspace-service:3002/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId: account.id,
        name: `${userData.name}'s Workspace`
      })
    });
    
    if (!workspaceResponse.ok) {
      throw new Error('Workspace creation failed');
    }
    
    return { success: true, accountId };
    
  } catch (error) {
    // Compensation: Account'u geri al
    if (accountId) {
      await fetch(`http://account-service:3001/accounts/${accountId}/compensate`, {
        method: 'POST'
      });
    }
    
    return { success: false, error: error.message };
  }
}
```

### Başarısız Senaryo (Workspace Hatası)
```javascript
// Workspace service'te hata oluştu
// Orchestrator otomatik olarak compensation'ı tetikler

1. Account oluşturuldu (id: abc-123) ✓
2. Workspace oluşturma başarısız ✗
3. Compensate: POST /accounts/abc-123/compensate
   → Account soft delete yapıldı (deletedAt set edildi)
```

## Soft Delete Stratejisi

Account tablosunda `deletedAt` alanı kullanılır:
- `deletedAt = null`: Aktif account
- `deletedAt = timestamp`: Silinmiş account

Tüm sorgular soft delete kontrolü yapar:
```sql
SELECT * FROM accounts WHERE deletedAt IS NULL
```

## Veritabanı Kurulumu

1. `.env` dosyası oluşturun (`.env.example` dosyasından kopyalayın):
```bash
cp .env.example .env
```

2. `.env` dosyasında `DATABASE_URL`'i ayarlayın:
```
DATABASE_URL="postgresql://username:password@localhost:5432/account_db?schema=public"
```

3. Prisma migration'larını çalıştırın:
```bash
npx prisma migrate dev
```

4. Prisma Client'ı generate edin:
```bash
npx prisma generate
```

## Çalıştırma

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

Servis varsayılan olarak `http://localhost:3001` adresinde çalışır.

## Test

### Account Oluşturma Testi
```bash
curl -X POST http://localhost:3001/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "password123"
  }'
```

### Compensation Testi
```bash
# Önce bir account oluşturun ve id'yi alın
curl -X POST http://localhost:3001/accounts/{account-id}/compensate
```

### Account Sorgulama
```bash
curl http://localhost:3001/accounts/{account-id}
```

## Workspace Service ile Entegrasyon

Workspace service'in aşağıdaki endpoint'lere sahip olması beklenir:

- `POST /workspaces` - Workspace oluşturma (accountId gerektirir)
- `POST /workspaces/:id/compensate` - Workspace compensation (opsiyonel)

Orchestrator bu iki servisi koordine eder ve hata durumunda gerekli compensation işlemlerini yönetir.

## Geliştirme Notları

- Her mikroservisin kendi PostgreSQL veritabanı vardır
- Servisler arası iletişim HTTP REST API üzerinden yapılır
- Saga orchestrator merkezi koordinasyon sağlar
- Soft delete ile veri kaybı önlenir ve audit trail korunur
- Transaction yönetimi saga pattern ile sağlanır

## Sonraki Adımlar

1. Workspace service'i benzer şekilde hazırlayın
2. Saga orchestrator servisini oluşturun
3. Event sourcing veya mesaj kuyruğu (RabbitMQ, Kafka) entegrasyonu ekleyin
4. İzleme ve loglama (distributed tracing) ekleyin
5. Retry mekanizması ve idempotency kontrolü ekleyin

