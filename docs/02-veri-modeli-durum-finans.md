# 02 — Veritabanı ERD, Araç Durum Akışı, Finansal Veri Modeli

---

## 5. Veritabanı ERD ve Tablo İlişkileri

### 5.1 Genel kurallar (tüm tablolar)

| Konu | Kural |
|---|---|
| Birincil anahtar | `id uuid` (UUIDv7 — zaman sıralı, index dostu). Kullanıcıya gösterilen numaralar ayrı: `order_no` (örn. `2026-000123`). |
| Zaman | Tüm zaman damgaları `timestamptz`, UTC saklanır. "İş günü" (`business_date date`) gereken yerde ayrıca saklanır ve Europe/Istanbul'a göre hesaplanır (gün sonu, gider tarihi). |
| Denetim alanları | `created_at`, `updated_at`; değiştirilebilir tablolarda `created_by_id`, `updated_by_id`. |
| Para | `*_kurus integer` (750,00 TL = `75000`). Toplamlar SQL'de `bigint`. **Float asla kullanılmaz.** Para birimi sabit TRY (ayarlarda tek değer). |
| Soft delete | Sadece **referans/ana veri**: `customers`, `vehicles`, `services`, `employees`, `users`, `campaigns`, `expense_categories`, `payment_methods` → `deleted_at` / `is_active`. |
| Silinemez (append-only) | `payments`, `cash_transactions`, `account_transactions`, `expenses`, `vehicle_status_history`, `audit_logs`, `consent_events`, `outbound_messages`. Düzeltme = ters kayıt. Uygulama katmanına ek olarak **PostgreSQL trigger** ile `UPDATE` (tutar alanları) ve `DELETE` engellenir. |
| Enum | PostgreSQL enum yerine Prisma enum (migration ile yönetilir). Kullanıcının yönetebileceği listeler (ödeme yöntemi, gider kategorisi, araç tipi) **tablo**dur, enum değil. |
| Gizli bilgiler | Entegrasyon token'ları `integration_settings.secret_encrypted` (AES-256-GCM, anahtar `.env`'de `APP_ENCRYPTION_KEY`). Takip/anket/abonelik token'ları **sadece hash** olarak saklanır. |

### 5.2 Önerilen tablolar (V1) ve dokümandaki öneriyle farklar

| Doküman önerisi | Karar | Gerekçe |
|---|---|---|
| Users, Roles, Permissions | ✅ + `role_permissions`, `user_roles`, `user_sessions` | Çoktan çoğa ilişkiler ve sunucu tarafı oturum. |
| Employees | ✅ ama **Users'tan ayrı** | Her personel sisteme giriş yapmaz ama performans raporunda yer alır. `employees.user_id` isteğe bağlı. |
| Customers, Vehicles, CustomerVehicles | ✅ | Plaka `vehicles.plate_normalized` UNIQUE. |
| Services, ServicePrices | ✅ + `vehicle_types` | Fiyat araç tipine göre ve tarihli (geçmiş korunur). |
| VehicleOrders, VehicleOrderItems, VehicleStatusHistory | ✅ + `vehicle_order_assignments` | Çoklu personel (E-02). |
| Payments, PaymentMethods | ✅ | İade dahil tek tablo, `type` ile. |
| Expenses, ExpenseCategories | ✅ | |
| CashTransactions | ✅ + `cash_day_closes` | Gün sonu sayımı ve fark kaydı. |
| CustomerAccounts, AccountTransactions | ✅ | Kurumsal cari. |
| Campaigns, CampaignCoupons, CampaignRedemptions | ✅ + `campaign_services` | |
| CustomerSegments | ✅ (kural tabanlı, JSON tanım) | Üyeler saklanmaz, gönderim anında hesaplanır; gönderilen liste `outbound_messages`'ta kalır. |
| MarketingConsents | ✅ + `consent_events` | Mevcut durum + değiştirilemez olay geçmişi (kanıt). |
| EmailTemplates, WhatsAppTemplates | ✅ (iki ayrı tablo) | Doğaları farklı: e-posta serbest içerik, WhatsApp Meta onaylı şablon aynası. |
| EmailCampaigns | ➡ `broadcasts` (kanal alanıyla) | E-posta ve WhatsApp toplu gönderimi aynı yaşam döngüsüne sahip. |
| EmailMessages, WhatsAppMessages | ➡ **tek `outbound_messages`** + `message_events` | Frekans sınırı, "bu müşteriye son 7 günde kaç pazarlama mesajı gitti" sorgusu ve outbox deseni tek tabloyla doğru çalışır. Kanal özgü alanlar `jsonb`. |
| MarketingAutomations, AutomationExecutions | ✅ | |
| Surveys, SurveyQuestions, SurveyResponses | ✅ + `survey_invitations`, `survey_answers` | Davet (token, zamanlama) ile yanıt ayrı. |
| CustomerFeedback | ➡ `feedback_cases` | Şikâyet yaşam döngüsü (açık → iletişime geçildi → çözüldü). |
| Notifications | ✅ (panel içi) | |
| AuditLogs | ✅ | |
| BusinessSettings | ✅ (`business_settings` tek satır tipli) + `integration_settings` | |
| WebsiteContents | ✅ + `website_faqs`, `website_testimonials` | |
| TrackingTokens | ✅ | |
| — | ➕ `customer_notes` | Müşteri notları tarihli ve yazarlı olmalı. |
| — | ➕ `uploads` | Logo/site görselleri meta verisi. |
| — | ➕ `order_number_sequences` (veya PG sequence) | Yıl bazlı sıra numarası. |

**Toplam V1 tablo sayısı ≈ 45.** Gereksiz tablo yok; her biri bir ekran veya bir rapor tarafından kullanılıyor.

### 5.3 ERD — Kimlik, yetki, personel

```mermaid
erDiagram
  USERS ||--o{ USER_ROLES : ""
  ROLES ||--o{ USER_ROLES : ""
  ROLES ||--o{ ROLE_PERMISSIONS : ""
  PERMISSIONS ||--o{ ROLE_PERMISSIONS : ""
  USERS ||--o{ USER_SESSIONS : ""
  USERS |o--o| EMPLOYEES : "opsiyonel giriş hesabı"
  USERS ||--o{ AUDIT_LOGS : "actor"
  USERS ||--o{ NOTIFICATIONS : ""

  USERS {
    uuid id PK
    string email UK
    string phone
    string full_name
    string password_hash "argon2id"
    bool is_active
    timestamptz last_login_at
    int failed_login_count
    timestamptz locked_until
    timestamptz password_changed_at
  }
  ROLES { uuid id PK  string key UK "owner|manager|staff|custom"  string name  bool is_system }
  PERMISSIONS { uuid id PK  string key UK "orders.create, finance.reports.view ..."  string group }
  USER_SESSIONS { uuid id PK  uuid user_id FK  string token_hash UK  timestamptz expires_at  timestamptz revoked_at  string ip  string user_agent }
  EMPLOYEES { uuid id PK  uuid user_id FK "nullable, unique"  string full_name  string phone  bool is_active  date hired_at }
  AUDIT_LOGS { uuid id PK  uuid actor_user_id FK  string action  string entity  uuid entity_id  jsonb before  jsonb after  string ip  timestamptz created_at }
```

### 5.4 ERD — Müşteri, araç, katalog, araç kabul

```mermaid
erDiagram
  CUSTOMERS ||--o{ CUSTOMER_VEHICLES : ""
  VEHICLES ||--o{ CUSTOMER_VEHICLES : ""
  VEHICLE_TYPES ||--o{ VEHICLES : "varsayılan tip"
  CUSTOMERS ||--o{ CUSTOMER_NOTES : ""
  CUSTOMERS ||--o{ VEHICLE_ORDERS : ""
  VEHICLES ||--o{ VEHICLE_ORDERS : ""
  VEHICLE_TYPES ||--o{ VEHICLE_ORDERS : "uygulanan tip (snapshot)"
  SERVICES ||--o{ SERVICE_PRICES : ""
  VEHICLE_TYPES ||--o{ SERVICE_PRICES : ""
  VEHICLE_ORDERS ||--|{ VEHICLE_ORDER_ITEMS : ""
  SERVICES ||--o{ VEHICLE_ORDER_ITEMS : ""
  VEHICLE_ORDERS ||--o{ VEHICLE_STATUS_HISTORY : ""
  VEHICLE_ORDERS ||--o{ VEHICLE_ORDER_ASSIGNMENTS : ""
  EMPLOYEES ||--o{ VEHICLE_ORDER_ASSIGNMENTS : ""
  VEHICLE_ORDERS ||--o{ TRACKING_TOKENS : ""

  CUSTOMERS {
    uuid id PK
    string full_name
    string phone_e164 "nullable, index"
    string email "nullable"
    enum type "INDIVIDUAL|CORPORATE"
    string company_name "nullable"
    string tax_no "nullable"
    bool whatsapp_operational_optin
    timestamptz kvkk_notice_at
    timestamptz first_visit_at "denormalize"
    timestamptz last_visit_at "denormalize, index"
    int visit_count "denormalize"
    timestamptz deleted_at
    timestamptz anonymized_at
  }
  VEHICLES {
    uuid id PK
    string plate_normalized UK "06ABC123"
    string plate_display "06 ABC 123"
    bool is_foreign_plate
    string brand
    string model
    uuid vehicle_type_id FK
  }
  CUSTOMER_VEHICLES { uuid id PK  uuid customer_id FK  uuid vehicle_id FK  bool is_primary  timestamptz linked_at  timestamptz unlinked_at }
  VEHICLE_TYPES { uuid id PK  string name "Otomobil, SUV, Ticari, Motosiklet"  int sort_order  bool is_active }
  SERVICES { uuid id PK  string name  text description  int duration_minutes  bool discountable  bool show_on_website  bool is_active  int sort_order  decimal vat_rate }
  SERVICE_PRICES { uuid id PK  uuid service_id FK  uuid vehicle_type_id FK "nullable=tüm tipler"  int price_kurus  timestamptz valid_from  timestamptz valid_to }
  VEHICLE_ORDERS {
    uuid id PK
    string order_no UK
    uuid customer_id FK
    uuid vehicle_id FK
    uuid vehicle_type_id FK
    string customer_name_snapshot
    string plate_snapshot
    enum status "WAITING|TAKEN_IN|WASHING|READY|DELIVERED|CANCELLED"
    enum payment_status "UNPAID|PARTIAL|PAID (türetilmiş, cache)"
    enum settlement "DIRECT|ACCOUNT"
    int subtotal_kurus
    int manual_discount_kurus
    int campaign_discount_kurus
    int total_kurus
    int paid_kurus "cache, ödemelerden türetilir"
    int estimated_minutes
    timestamptz accepted_at
    timestamptz work_started_at
    timestamptz ready_at
    timestamptz delivered_at
    timestamptz cancelled_at
    string cancel_reason
    text notes
    uuid created_by_id FK
  }
  VEHICLE_ORDER_ITEMS { uuid id PK  uuid order_id FK  uuid service_id FK  string service_name_snapshot  int unit_price_kurus  int quantity  int discount_kurus  int line_total_kurus  decimal vat_rate }
  VEHICLE_STATUS_HISTORY { uuid id PK  uuid order_id FK  enum from_status  enum to_status  uuid changed_by_id FK  string reason  timestamptz created_at }
  VEHICLE_ORDER_ASSIGNMENTS { uuid id PK  uuid order_id FK  uuid employee_id FK  timestamptz assigned_at }
  TRACKING_TOKENS { uuid id PK  uuid order_id FK  string token_hash UK  timestamptz expires_at  timestamptz revoked_at  timestamptz last_viewed_at  int view_count }
```

**Kısıtlar ve indexler (önemli olanlar):**

- `vehicles.plate_normalized` UNIQUE.
- `customer_vehicles (customer_id, vehicle_id)` UNIQUE WHERE `unlinked_at IS NULL`.
- `customers.phone_e164` index (UNIQUE değil — aynı telefonla iki kayıt birleştirme aracıyla çözülür; UNIQUE yapmak sahada yanlış veri girildiğinde kabulü kilitler). Kabul ekranı aynı telefonlu müşteriyi **önerir**.
- `vehicle_orders (status, accepted_at)`, `(customer_id, accepted_at)`, `(delivered_at)` indexleri.
- Kısmi index: "aktif araçlar" `WHERE status NOT IN ('DELIVERED','CANCELLED')`.
- Aynı araç için aynı anda **birden fazla aktif kabul** engellenir: `UNIQUE (vehicle_id) WHERE status NOT IN ('DELIVERED','CANCELLED')`.
- `CHECK (total_kurus = subtotal_kurus - manual_discount_kurus - campaign_discount_kurus AND total_kurus >= 0)`.

### 5.5 ERD — Finans

```mermaid
erDiagram
  VEHICLE_ORDERS ||--o{ PAYMENTS : ""
  CUSTOMER_ACCOUNTS ||--o{ PAYMENTS : "cari tahsilat"
  PAYMENT_METHODS ||--o{ PAYMENTS : ""
  PAYMENTS ||--o| PAYMENTS : "refund_of"
  PAYMENTS ||--o| CASH_TRANSACTIONS : "nakit ise"
  EXPENSES ||--o| CASH_TRANSACTIONS : "nakit ödendiyse"
  EXPENSE_CATEGORIES ||--o{ EXPENSES : ""
  PAYMENT_METHODS ||--o{ EXPENSES : ""
  EXPENSES ||--o| EXPENSES : "reversal_of"
  CASH_DAY_CLOSES ||--o{ CASH_TRANSACTIONS : "kapanış düzeltmesi"
  CUSTOMERS ||--o| CUSTOMER_ACCOUNTS : ""
  CUSTOMER_ACCOUNTS ||--o{ ACCOUNT_TRANSACTIONS : ""
  VEHICLE_ORDERS ||--o| ACCOUNT_TRANSACTIONS : "cariye yazıldı"
  PAYMENTS ||--o| ACCOUNT_TRANSACTIONS : "cari tahsilat"

  PAYMENT_METHODS { uuid id PK  string name  enum kind "CASH|CARD|BANK_TRANSFER|OTHER"  bool is_active  int sort_order }
  PAYMENTS {
    uuid id PK
    enum type "PAYMENT|REFUND"
    uuid order_id FK "nullable"
    uuid account_id FK "nullable"
    uuid payment_method_id FK
    int amount_kurus "her zaman > 0; yönü type belirler"
    uuid refund_of_id FK "nullable"
    timestamptz received_at
    date business_date
    uuid received_by_id FK
    string idempotency_key UK
    string note
  }
  CASH_TRANSACTIONS {
    uuid id PK
    enum direction "IN|OUT"
    enum source "PAYMENT|REFUND|EXPENSE|MANUAL|OPENING|CLOSE_ADJUSTMENT|REVERSAL"
    int amount_kurus
    uuid payment_id FK
    uuid expense_id FK
    uuid reversal_of_id FK
    date business_date
    string description
    uuid created_by_id FK
  }
  CASH_DAY_CLOSES { uuid id PK  date business_date UK  int expected_kurus  int counted_kurus  int difference_kurus  string note  uuid closed_by_id FK  timestamptz closed_at }
  EXPENSE_CATEGORIES { uuid id PK  string name  bool is_active }
  EXPENSES { uuid id PK  uuid category_id FK  uuid payment_method_id FK  int amount_kurus  date expense_date  string description  uuid reversal_of_id FK  uuid created_by_id FK }
  CUSTOMER_ACCOUNTS { uuid id PK  uuid customer_id FK,UK  int credit_limit_kurus  int payment_term_days  bool is_active }
  ACCOUNT_TRANSACTIONS { uuid id PK  uuid account_id FK  enum direction "DEBIT|CREDIT"  int amount_kurus  uuid order_id FK  uuid payment_id FK  uuid reversal_of_id FK  date business_date  string description }
```

### 5.6 ERD — Kampanya, izin, mesajlaşma, otomasyon

```mermaid
erDiagram
  CAMPAIGNS ||--o{ CAMPAIGN_SERVICES : ""
  SERVICES ||--o{ CAMPAIGN_SERVICES : ""
  CAMPAIGNS ||--o{ CAMPAIGN_COUPONS : ""
  CAMPAIGNS ||--o{ CAMPAIGN_REDEMPTIONS : ""
  CAMPAIGN_COUPONS ||--o{ CAMPAIGN_REDEMPTIONS : ""
  VEHICLE_ORDERS ||--o| CAMPAIGN_REDEMPTIONS : "en fazla 1"
  CUSTOMERS ||--o{ CAMPAIGN_REDEMPTIONS : ""
  CUSTOMER_SEGMENTS ||--o{ CAMPAIGNS : "hedef"
  CUSTOMERS ||--o{ MARKETING_CONSENTS : "kanal başına 1"
  MARKETING_CONSENTS ||--o{ CONSENT_EVENTS : ""
  CUSTOMER_SEGMENTS ||--o{ BROADCASTS : ""
  CAMPAIGNS ||--o{ BROADCASTS : "opsiyonel"
  EMAIL_TEMPLATES ||--o{ BROADCASTS : ""
  WHATSAPP_TEMPLATES ||--o{ BROADCASTS : ""
  BROADCASTS ||--o{ OUTBOUND_MESSAGES : ""
  MARKETING_AUTOMATIONS ||--o{ AUTOMATION_EXECUTIONS : ""
  AUTOMATION_EXECUTIONS ||--o| OUTBOUND_MESSAGES : ""
  CUSTOMERS ||--o{ OUTBOUND_MESSAGES : ""
  VEHICLE_ORDERS ||--o{ OUTBOUND_MESSAGES : "operasyonel"
  OUTBOUND_MESSAGES ||--o{ MESSAGE_EVENTS : ""

  CAMPAIGNS { uuid id PK  string name  text description  enum discount_type "PERCENT|AMOUNT|FIXED_PRICE"  int discount_value "yüzde*100 veya kuruş"  timestamptz starts_at  timestamptz ends_at  uuid segment_id FK  bool requires_coupon  int total_limit  int per_customer_limit  int used_count  bool show_on_website  bool is_active }
  CAMPAIGN_COUPONS { uuid id PK  uuid campaign_id FK  string code UK  uuid customer_id FK "nullable=kişiye özel"  int max_uses  int used_count  timestamptz expires_at }
  CAMPAIGN_REDEMPTIONS { uuid id PK  uuid campaign_id FK  uuid coupon_id FK  uuid customer_id FK  uuid order_id FK,UK  int discount_kurus  enum status "APPLIED|VOIDED"  timestamptz created_at }
  CUSTOMER_SEGMENTS { uuid id PK  string name  jsonb rules "inactiveDays>=60, usedServiceIds, firstVisitOnly ..."  bool is_system }
  MARKETING_CONSENTS { uuid id PK  uuid customer_id FK  enum channel "EMAIL|WHATSAPP"  enum status "GRANTED|REVOKED|UNKNOWN"  timestamptz granted_at  timestamptz revoked_at  enum source "WEB_FORM|WHATSAPP_REPLY|IN_STORE|IMPORT|IYS"  enum iys_sync "PENDING|SYNCED|FAILED|NOT_REQUIRED" }
  CONSENT_EVENTS { uuid id PK  uuid consent_id FK  enum action "GRANT|REVOKE"  enum source  jsonb proof "ip, ua, form metni versiyonu, mesaj id"  uuid actor_user_id FK  timestamptz created_at }
  EMAIL_TEMPLATES { uuid id PK  string name  string subject  jsonb blocks "logo, başlık, metin, kampanya kartı, buton"  enum purpose "MARKETING|TRANSACTIONAL"  bool is_active }
  WHATSAPP_TEMPLATES { uuid id PK  string meta_name  string language  enum category "UTILITY|MARKETING|AUTHENTICATION"  enum meta_status "APPROVED|PENDING|REJECTED|PAUSED|DISABLED"  text body_preview  jsonb variable_mapping  enum usage "ORDER_ACCEPTED|ORDER_READY|SURVEY|MARKETING"  timestamptz synced_at }
  BROADCASTS { uuid id PK  enum channel  string name  uuid segment_id FK  uuid campaign_id FK  uuid template_id  timestamptz scheduled_at  enum status "DRAFT|SCHEDULED|RUNNING|COMPLETED|CANCELLED"  int recipient_count  uuid created_by_id FK }
  OUTBOUND_MESSAGES {
    uuid id PK
    enum channel "WHATSAPP|EMAIL"
    enum purpose "OPERATIONAL|MARKETING|SURVEY|TRANSACTIONAL"
    uuid customer_id FK
    uuid order_id FK
    uuid broadcast_id FK
    uuid automation_execution_id FK
    string recipient "telefon veya e-posta (snapshot)"
    string template_ref
    jsonb payload
    enum status "QUEUED|SENDING|SENT|DELIVERED|READ|FAILED|SKIPPED|CANCELLED"
    string skip_reason "NO_CONSENT|FREQUENCY_CAP|QUIET_HOURS|NO_PHONE|PROVIDER_DISABLED"
    string provider "meta|mock|smtp"
    string provider_message_id UK
    int attempt_count
    timestamptz next_attempt_at
    string last_error
    string idempotency_key UK
    timestamptz sent_at
  }
  MESSAGE_EVENTS { uuid id PK  uuid message_id FK  enum type "SENT|DELIVERED|READ|FAILED|CLICKED|BOUNCED|COMPLAINED|REPLIED"  jsonb raw  timestamptz occurred_at }
  MARKETING_AUTOMATIONS { uuid id PK  string name  enum trigger "INACTIVE_DAYS"  int threshold_days  enum channel  uuid template_id  uuid campaign_id FK  bool is_active }
  AUTOMATION_EXECUTIONS { uuid id PK  uuid automation_id FK  uuid customer_id FK  uuid anchor_order_id FK "son ziyaret"  enum status "SCHEDULED|SENT|SKIPPED|STOPPED"  string stop_reason  timestamptz scheduled_for }
```

`automation_executions (automation_id, customer_id, anchor_order_id)` UNIQUE → aynı "gelmeme dönemi" içinde aynı otomasyon aynı müşteriye **ikinci kez** gönderilemez.

### 5.7 ERD — Anket, şikâyet, site, ayarlar

```mermaid
erDiagram
  SURVEYS ||--|{ SURVEY_QUESTIONS : ""
  SURVEYS ||--o{ SURVEY_INVITATIONS : ""
  VEHICLE_ORDERS ||--o| SURVEY_INVITATIONS : "en fazla 1"
  SURVEY_INVITATIONS ||--o| SURVEY_RESPONSES : ""
  SURVEY_RESPONSES ||--|{ SURVEY_ANSWERS : ""
  SURVEY_QUESTIONS ||--o{ SURVEY_ANSWERS : ""
  SURVEY_RESPONSES ||--o| FEEDBACK_CASES : "düşük puan"
  USERS ||--o{ FEEDBACK_CASES : "atanan"

  SURVEYS { uuid id PK  string name  int send_delay_minutes  int min_days_between_surveys  int low_score_threshold  bool is_active }
  SURVEY_QUESTIONS { uuid id PK  uuid survey_id FK  string key "overall|cleanliness|staff|speed|value|nps|comment"  string label  enum type "RATING_1_5|NPS_0_10|TEXT"  bool required  int sort_order }
  SURVEY_INVITATIONS { uuid id PK  uuid survey_id FK  uuid order_id FK,UK  uuid customer_id FK  string token_hash UK  timestamptz scheduled_for  timestamptz sent_at  timestamptz expires_at  timestamptz opened_at  timestamptz responded_at  enum status "SCHEDULED|SENT|RESPONDED|EXPIRED|SKIPPED" }
  SURVEY_RESPONSES { uuid id PK  uuid invitation_id FK,UK  smallint overall_score "hızlı sorgu için"  smallint nps_score  text comment  timestamptz submitted_at }
  SURVEY_ANSWERS { uuid id PK  uuid response_id FK  uuid question_id FK  smallint value_int  text value_text }
  FEEDBACK_CASES { uuid id PK  uuid response_id FK  uuid order_id FK  uuid customer_id FK  enum status "OPEN|CONTACTED|RESOLVED|UNRESOLVED"  string[] topics  uuid assigned_to_id FK  text resolution_note  timestamptz contacted_at  timestamptz resolved_at }
```

Site/ayar tabloları (ilişkisi basit, diyagrama eklenmedi): `business_settings` (tek satır: ad, unvan, logo, renkler, adres, telefon, WhatsApp no, harita koordinatı, çalışma saatleri `jsonb`, sosyal medya, sessiz saatler, frekans sınırları, takip token süresi), `integration_settings` (provider, config `jsonb`, secret_encrypted, is_enabled, last_test_at, last_test_result), `website_content` (anahtar–değer bölümler: hero, hakkımızda, SEO meta), `website_faqs`, `website_testimonials` (sadece onaylı ankette "yayınlanabilir" işaretlenen veya elle girilen), `uploads`, `notifications`.

---

## 6. Araç Kabul ve Durum Geçiş Diyagramı

### 6.1 Araç kabul akışı (hedef: 30 saniyenin altında)

```mermaid
flowchart TD
  A[Plaka gir] --> B[Normalize et<br/>'06 abc-123' → '06ABC123']
  B --> C{Araç kayıtlı mı?}
  C -- Evet --> D[Bağlı müşteri(ler)i getir<br/>son hizmet, açık borç, notlar, izin durumu]
  C -- Hayır --> E[Yeni araç formu<br/>tip, marka/model opsiyonel]
  D --> F{Müşteri doğru mu?}
  F -- Evet --> H
  F -- Farklı kişi getirdi --> G[Telefonla ara / yeni müşteri oluştur<br/>araca bağla]
  E --> G2[Telefon ile müşteri ara<br/>yoksa yeni müşteri]
  G --> H
  G2 --> H
  H{Aracın aktif kaydı var mı?} -- Evet --> X[Engelle: 'Bu araç zaten işlemde' + kayda git]
  H -- Hayır --> I[Hizmet seç<br/>fiyat araç tipine göre otomatik]
  I --> J[Kupon / kampanya<br/>backend uygunluk kontrolü]
  J --> K[Manuel indirim<br/>yetki + limit kontrolü]
  K --> L[Personel ata · not · tahmini süre]
  L --> M[Kaydet — TEK TRANSACTION]
  M --> M1[vehicle_orders + items + status_history]
  M --> M2[campaign_redemption + used_count artışı]
  M --> M3[tracking_token]
  M --> M4[outbound_message ORDER_ACCEPTED<br/>status=QUEUED — outbox]
  M --> M5[audit_log]
  M --> N[Commit → worker mesajı gönderir<br/>hata olursa kabul ETKİLENMEZ]
  M --> P{Peşin ödeme var mı?}
  P -- Evet --> Q[Ödeme kaydı ayrı işlem olarak]
```

### 6.2 Durum makinesi

```mermaid
stateDiagram-v2
  [*] --> WAITING : Kabul edildi
  WAITING --> TAKEN_IN : Yıkamaya alındı
  WAITING --> WASHING : Doğrudan başlat (izinli kısayol)
  TAKEN_IN --> WASHING : Yıkama başladı
  WASHING --> READY : Hazır
  TAKEN_IN --> READY : Hazır (kısa işlemler)
  READY --> WASHING : Geri al / yeniden işlem (gerekçe zorunlu)
  READY --> DELIVERED : Teslim edildi
  WAITING --> CANCELLED : İptal (gerekçe)
  TAKEN_IN --> CANCELLED : İptal (gerekçe)
  WASHING --> CANCELLED : İptal (gerekçe + yetki)
  READY --> CANCELLED : İptal (gerekçe + yetki)
  DELIVERED --> [*]
  CANCELLED --> [*]
```

| Durum (kod) | Arayüz | Zaman damgası |
|---|---|---|
| `WAITING` | Bekliyor | `accepted_at` |
| `TAKEN_IN` | Yıkamaya alındı | `work_started_at` (ilk kez set edilir) |
| `WASHING` | Yıkama devam ediyor | `work_started_at` (henüz yoksa) |
| `READY` | Hazır | `ready_at` (son hazır olma anı) |
| `DELIVERED` | Teslim edildi | `delivered_at` |
| `CANCELLED` | İptal edildi | `cancelled_at` |

**Geçiş kuralları (backend'de zorunlu):**

1. Tanımsız geçiş → `409 ORDER_INVALID_TRANSITION`.
2. `DELIVERED` ve `CANCELLED` terminal. Düzeltme sadece `orders.correct_status` yetkisiyle, gerekçe zorunlu, audit log'lu, raporlara düzeltme olarak yansır.
3. **İptal:** net tahsilat (ödemeler − iadeler) > 0 ise iptal engellenir → önce iade. Kampanya kullanımı `VOIDED` yapılır, `used_count` geri alınır.
4. **Teslim ödeme durumundan bağımsızdır.** Ödenmemiş teslimde uyarı gösterilir (personel onaylar), kayıt alacak olarak kalır veya kurumsal müşteride cariye yazılır.
5. Her geçiş `vehicle_status_history`'ye yazılır (kim, ne zaman, gerekçe).
6. Eşzamanlılık: geçiş `UPDATE ... WHERE id = ? AND status = <beklenen>` ile yapılır; iki personel aynı anda basarsa ikincisi "kayıt güncellendi, yenileyin" alır.

**Yan etkiler (domain olayları → outbox):**

| Geçiş | Yan etki | Tekrar önleme |
|---|---|---|
| → `WAITING` (kabul) | "Araç kabul" WhatsApp mesajı (+ takip linki), müşteri `visit_count/last_visit_at` güncelle, devam eden geri kazanım otomasyonlarını **durdur** | `idempotency_key = order:{id}:ACCEPTED` |
| → `READY` | "Araç hazır" WhatsApp mesajı | `order:{id}:READY` — geri alıp tekrar hazır yapmak **otomatik ikinci mesaj göndermez**; panelden "tekrar gönder" butonu (bilinçli) |
| → `DELIVERED` | Anket daveti `scheduled_for = delivered_at + gecikme`; takip token süresi `delivered_at + 24 saat`; ciro tanınır | `survey_invitations.order_id` UNIQUE |
| → `CANCELLED` | Planlanmış mesajlar (QUEUED) iptal, takip token iptal | |

---

## 7. Finansal Veri Modeli ve Hesaplama Kuralları

### 7.1 Temel ilke: dört ayrı kavram asla karıştırılmaz

| Kavram | Tanım | Kaynak | Hangi tarihe göre |
|---|---|---|---|
| **Ciro (net satış)** | Teslim edilmiş, iptal edilmemiş araçların indirim sonrası toplamı | `vehicle_orders.total_kurus` WHERE `status=DELIVERED` | `delivered_at` (İstanbul günü) |
| **Brüt satış / İndirim** | Liste fiyatı toplamı; manuel + kampanya indirimleri ayrı | `subtotal_kurus`, `manual_discount_kurus`, `campaign_discount_kurus` | `delivered_at` |
| **Tahsilat** | Gerçekten alınan para − iadeler | `payments` (PAYMENT − REFUND) | `received_at` |
| **Alacak** | Teslim edilmiş ama tahsil edilmemiş tutar (araç bazlı) + cari hesap bakiyeleri | `total − net_paid` (DIRECT), `Σ DEBIT − Σ CREDIT` (ACCOUNT) | Anlık / tarih itibarıyla |
| **Alınan avans** | Henüz teslim edilmemiş araçlara alınan ödeme | aktif araçlardaki net ödeme | Anlık |
| **Gider** | Girilen giderler − ters kayıtlar | `expenses` | `expense_date` |

**Ödenmemiş hizmet asla tahsilat veya kasa gibi gösterilmez.** Dashboard'da "Günlük ciro" ve "Günlük tahsilat" yan yana ama ayrı kartlardır; altında "Bekleyen alacak" ayrı karttır.

### 7.2 Hesaplama kuralları

1. **Kuruş aritmetiği.** Tüm hesaplar tamsayı kuruşla. Yüzde indirim: `round_half_up(base × pct / 10000)`. İndirim kalemlere **en büyük kalan yöntemiyle** dağıtılır (kalem toplamları her zaman sipariş toplamına eşit olur; hizmet bazlı gelir raporu kuruşu kuruşuna tutar).
2. **Fiyat snapshot.** Kabulde: `service_name_snapshot`, `unit_price_kurus`, `vat_rate` kaleme yazılır. Hizmet fiyatı sonradan değişirse geçmiş kayıt değişmez. Fiyat değişikliği yeni `service_prices` satırıdır (`valid_from`).
3. **Ödeme durumu (türetilmiş):**
   - `net_paid = Σ PAYMENT − Σ REFUND` (siparişe bağlı)
   - `net_paid = 0` → `UNPAID`; `0 < net_paid < total` → `PARTIAL`; `net_paid = total` → `PAID`.
   - `settlement = ACCOUNT` → arayüzde "Cariye yazıldı" (sipariş kendi üzerinde alacak taşımaz).
   - Değer cache'lenir (`paid_kurus`, `payment_status`) ama **her ödeme işlemi aynı transaction'da yeniden hesaplar**; tutarlılık için gece kontrol işi (reconciliation) farkları raporlar.
4. **Fazla ödeme engeli:** `amount ≤ total − net_paid`. İade: `amount ≤ orijinal ödeme − o ödemeye yapılmış iadeler`.
5. **Örnek (dokümandaki):** Toplam 750 TL → 300 TL nakit (PAYMENT, CASH → kasaya IN 300) → 450 TL kart (PAYMENT, CARD, kasaya girmez) → `net_paid = 750`, `PAID`. Gün sonu: kasa +300, kart +450, tahsilat 750.
6. **Toplam değişikliği:** Ödemesi alınmış araçta kalem çıkarılıp toplam `net_paid`'in altına düşerse işlem engellenir → önce iade.
7. **Kampanya indirimi maliyeti** = `Σ campaign_discount_kurus` (teslim edilmiş araçlarda). Manuel indirimler ayrı raporlanır.
8. **İptal edilen araçlar** ciroya girmez; raporda ayrı adet ve "kaybedilen potansiyel tutar" olarak gösterilir.

### 7.3 Kasa (sadece nakit)

```
Beklenen kasa (gün) = Açılış devri
                    + Σ nakit tahsilat
                    − Σ nakit iade
                    − Σ nakit ödenen gider
                    ± Σ manuel giriş/çıkış (gerekçeli, yetkili)
```

- **Gün sonu:** Yetkili kişi sayılan tutarı girer → `difference = counted − expected`. Fark ≠ 0 ise gerekçe zorunlu, `CLOSE_ADJUSTMENT` kasa hareketi oluşur. Kapanmış güne yeni nakit hareketi **yazılamaz** (geç kayıt bir sonraki güne düşer veya yetkili "gün açma" işlemi, audit log'lu).
- Ertesi günün açılışı = önceki günün sayılan tutarı (kasada bırakılan para; bankaya yatırılan kısım "manuel çıkış: bankaya yatırıldı").
- Gün sonu raporu: nakit / kart / havale / diğer tahsilat, iadeler, nakit giderler, beklenen vs sayılan, o gün teslim edilip ödenmeyenler, o gün tahsil edilen eski alacaklar.

### 7.4 Cari hesap (kurumsal)

- Sipariş "cariye yaz" → `ACCOUNT_TRANSACTIONS DEBIT (order_id)`, sipariş `settlement = ACCOUNT`.
- Cari tahsilat → `PAYMENTS (account_id, order_id=NULL)` + `ACCOUNT_TRANSACTIONS CREDIT (payment_id)`.
- Bakiye = Σ DEBIT − Σ CREDIT. Ekstre: açılış bakiyesi (dönem öncesi) + dönem hareketleri + kapanış bakiyesi.
- Kredi limiti aşılırsa uyarı (engel değil, ayarlanabilir).
- V1'de cari tahsilatın tek tek siparişlere eşleştirilmesi (fatura kapatma) **yok**; bakiye bazlı çalışır. Gerekirse sonradan eklenebilir.

### 7.5 Silinemezlik ve düzeltme

| Hata | Düzeltme |
|---|---|
| Yanlış tutarlı ödeme | İade (REFUND) + doğru ödeme. Her ikisi de görünür. |
| Yanlış yönteme yazılan ödeme | Aynı: iade + yeni ödeme (gün kapanmadıysa tek tıkla "yöntem düzelt" = bu iki kaydı otomatik oluşturur). |
| Yanlış gider | `reverse` → aynı tutarda `reversal_of_id` ile ters kayıt. |
| Yanlış manuel kasa hareketi | Ters kasa hareketi (`REVERSAL`). |

Tümü audit log'a yazılır. Veritabanı trigger'ı finansal tablolarda `DELETE`'i ve tutar/tarih alanlarında `UPDATE`'i reddeder.

### 7.6 Kârlılık beyanı kuralı

Sistem raporlarda **"Kâr"** kelimesini kullanmaz. Kullanılan ifadeler:

- "Tahsilat − Gider (nakit bazlı fark)"
- "Ciro − Gider (girilen giderlere göre)"

Raporun altında uyarı: *"Bu tutar sadece sisteme girilen giderleri kapsar; vergi, amortisman, POS komisyonu gibi girilmemiş maliyetler dahil değildir. Muhasebe kârı değildir."*

### 7.7 Yetkiler (finans ilgili örnek anahtarlar)

`payments.create`, `payments.refund`, `orders.manual_discount` (limit parametreli), `orders.price_override`, `cash.manual_entry`, `cash.day_close`, `cash.reopen_day`, `expenses.create`, `expenses.reverse`, `accounts.manage`, `finance.reports.view`.

### 7.8 Varsayılan rol–yetki matrisi (işletme sahibi düzenleyebilir)

| Yetki grubu | Sahip | Yönetici | Personel |
|---|:-:|:-:|:-:|
| Araç kabul / durum / teslim | ✅ | ✅ | ✅ |
| Müşteri görüntüle (telefon dahil) | ✅ | ✅ | ✅ (sadece işlemdeki araçlar + arama) |
| Müşteri düzenle / birleştir | ✅ | ✅ | ❌ |
| Ödeme al | ✅ | ✅ | ✅ |
| İade, manuel kasa, gün sonu | ✅ | ✅ | ❌ |
| Manuel indirim | ✅ (sınırsız) | ✅ (%20) | ✅ (%0 varsayılan) |
| Gider | ✅ | ✅ (ekle) | ❌ |
| Finansal raporlar | ✅ | ❌ (açılabilir) | ❌ |
| Operasyon raporları | ✅ | ✅ | ❌ |
| Kampanya / pazarlama | ✅ | ✅ | ❌ |
| Personel ve rol yönetimi | ✅ | ❌ | ❌ |
| Entegrasyon ayarları | ✅ | ❌ | ❌ |
| Site içeriği | ✅ | ✅ | ❌ |
| Audit log | ✅ | ❌ | ❌ |

Sahip rolü silinemez, sistemde en az bir aktif sahip bulunmak zorundadır.
