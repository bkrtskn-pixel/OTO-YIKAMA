# 01 — Kapsam Analizi, Eksik Gereksinimler, Teknik Mimari, Klasör Yapısı

> KUZHAN Oto Yıkama Management System — Mimari Analiz v0.1 (onay bekliyor)
> Bu doküman kodlamaya başlamadan önce onaylanması gereken kararları içerir.

---

## 1. Kapsam Analizi

### 1.1 Ürünün özü

Sistem üç farklı kullanıcı yüzeyinden oluşur; hepsi **tek bir backend ve tek bir veritabanı** üzerinde çalışır:

| Yüzey | Kullanıcı | Nitelik |
|---|---|---|
| **Yönetim paneli** (`/panel`) | İşletme sahibi, yönetici, personel | Giriş gerektirir, RBAC, PWA olarak kurulabilir |
| **Müşteri sayfaları** (`/takip/:token`, `/anket/:token`, `/abonelik/:token`) | Müşteri | Hesapsız, tek kullanımlık / süreli token |
| **Tanıtım sitesi** (`/`, `/hizmetler`, …) | Ziyaretçi | Herkese açık, SEO, içerik panelden yönetilir |

Arka planda bir **worker** süreci (mesaj kuyruğu, zamanlanmış otomasyonlar, anket gönderimi, yedekleme tetikleri) çalışır.

### 1.2 Modüllerin gerçek ağırlığı

Dokümandaki 18 V1 maddesi aynı büyüklükte değil. Gerçekçi ağırlık dağılımı:

| Ağırlık | Modüller | Neden |
|---|---|---|
| **Çekirdek (en kritik)** | Araç kabul/takip, müşteri-araç ilişkisi, hizmet/fiyat, ödeme/kasa | Günlük kullanım buradadır. Burası yavaş veya hatalıysa sistem kullanılmaz. Finansal doğruluk geri dönüşü zor hatalar üretir. |
| **Yüksek** | Raporlama, RBAC + audit, WhatsApp operasyonel bildirim | Raporlar çekirdek verinin doğru modellenmesine bağlıdır. WhatsApp dış bağımlılık + Meta onay süreci içerir. |
| **Orta** | Kampanya/kupon, anket + şikâyet takibi, takip sayfası, web sitesi + içerik yönetimi | İş kuralları net tanımlanırsa orta karmaşıklıkta. |
| **Orta-yüksek (hukuki risk)** | E-posta pazarlama, WhatsApp pazarlama, geri kazanım otomasyonu, izin/İYS | Teknik olarak orta, ama KVKK/İYS/Meta politikası nedeniyle yanlış yapılırsa işletmeye idari para cezası riski taşır. |

### 1.3 Kapsam sınırı (V1'de **yok**)

Doküman ile birebir uyumlu: kamera plaka okuma, fotoğraflı kabul/hasar, hasar diyagramı, QR teslim, stok, çok şube, robot entegrasyonu, yapay zekâ analizleri, sadakat, online randevu, abonelik. Bunlar için **arayüzde hiçbir buton, menü veya "yakında" ekranı** olmayacak.

### 1.4 Kapsam dışında olup dokümanda hiç geçmeyen ama sorulması gereken konu

**Fatura / e-Arşiv / ÖKC (yazar kasa) entegrasyonu.** Doküman finans modülü istiyor ama yasal fiş/fatura kesimi hakkında hiçbir şey söylemiyor. Önerim: V1 bir **ön muhasebe ve operasyon** sistemidir, **resmi muhasebe/e-fatura sistemi değildir.** Yasal belge mevcut POS/ÖKC veya mali müşavir üzerinden kesilmeye devam eder. Sistem "belge kesildi mi / belge no" alanını tutabilir. (Bkz. Karar K-06.)

---

## 2. Eksik ve Çelişkili Gereksinimler

Her madde: **sorun → öneri**. Onay gerektirenler README'deki karar listesine taşındı.

### 2.1 Operasyon

| # | Eksik / Çelişki | Öneri |
|---|---|---|
| E-01 | **"Yıkamaya alındı" ve "Yıkama devam ediyor" pratikte aynı an.** Personel iki ayrı butona basmaz; veri kirlenir, ortalama süre raporu bozulur. | İki durum da korunsun (dokümana sadık), ama `Bekliyor → Yıkama devam ediyor` doğrudan geçişe izin verilsin. Süre ölçümü "ilk yıkama durumuna geçiş" anından başlasın. Alternatif: tek "Yıkamada" durumu (K-07). |
| E-02 | **Bir araca birden fazla personel** bakar (biri iç, biri dış). Doküman tek "Personel" alanı varsayıyor; personel performans raporu buna göre yanlış olur. | `VehicleOrderAssignment` (çoktan çoğa) tablosu. Raporda araç başına eşit pay veya "katıldığı araç sayısı" gösterilir (K-08). |
| E-03 | **Telefon zorunlu mu?** Telefonsuz müşteri (yoldan geçen, nakit ödeyen) çok yaygın. | Telefon **isteğe bağlı**; yoksa WhatsApp/anket/takip linki gönderilmez, ekranda açıkça uyarı gösterilir. Plaka zorunlu. |
| E-04 | **Plaka sahibinin değişmesi / ortak araç** (aile, şirket aracı, satılan araç). | `Vehicle` plakaya göre tekil; `CustomerVehicle` ilişki tablosu (birden çok müşteri, aktif/pasif). Her araç kabul kaydı o anki müşteri ve aracı **ayrı ayrı** referanslar ve ad/plaka **snapshot**'ı saklar. |
| E-05 | **Yabancı / özel plakalar** (yabancı plaka, geçici plaka, kurumsal plaka formatları). | Normalizasyon: büyük harf, boşluk/tire/nokta temizleme, Türkçe karakter dönüşümü (`i→İ` sorunu dahil). Türk plaka formatı **doğrulanır ama zorunlu kılınmaz** — "Yabancı/özel plaka" işaretiyle serbest giriş. |
| E-06 | **İşlem sırasında hizmet ekleme/çıkarma** (müşteri sonradan motor yıkama istedi). | Teslim edilene kadar kalem eklenebilir/çıkarılabilir; ödemesi alınmış tutarın altına düşen değişiklik iade akışını zorunlu kılar. Her değişiklik audit log'a. |
| E-07 | **Fiyat elle değiştirilebilir mi?** Kabul ekranında "hizmet fiyatı" alanı var. | Liste fiyatı otomatik gelir. Elle fiyat değiştirme ve manuel indirim `orders.price_override` / `orders.manual_discount` yetkisine bağlı; personel için üst limit ayarlanabilir (örn. %10). |
| E-08 | **Teslim sonrası düzeltme** (yanlışlıkla "teslim edildi" basıldı). | Teslim/iptal terminal durumdur. Sadece `orders.correct_status` yetkisiyle, gerekçe zorunlu, audit log'lu "düzeltme" yapılabilir. |
| E-09 | **Sıra / kuyruk yönetimi** (kaç araç bekliyor, hangisi önce). | Liste varsayılan olarak kabul sırasına göre; tahmini bitiş = kuyruk + hizmet süresi. Ayrı bir "hat/bölme" modeli V1'de **yok** (gerekirse ileride). |
| E-10 | **Mevcut verinin aktarımı** (Excel/defter müşteri listesi). | Tek seferlik CSV içe aktarma aracı (müşteri + plaka + telefon). Pazarlama izni **aktarılmaz** (kanıt yoksa izin yoktur). K-13. |

### 2.2 Finans

| # | Eksik / Çelişki | Öneri |
|---|---|---|
| E-11 | **Ciro hangi anda tanınır?** Kabulde mi, hazırda mı, teslimde mi? Belirtilmemiş; raporlar buna göre değişir. | Ciro **teslim anında** tanınır (hizmet ifa edildi). Teslim edilmemiş araca alınan ödeme "alınan avans" olarak ayrı görünür. K-05. |
| E-12 | **KDV** hiç geçmiyor. | Fiyatlar KDV dahil girilir; her kalemde KDV oranı snapshot'ı saklanır; raporlarda "KDV hariç tahmini" ayrıca gösterilebilir. Resmi KDV beyanı sistem kapsamında değil. K-06. |
| E-13 | **İade ve iptal** akışı tanımsız. | İade = negatif yönlü, orijinal ödemeye bağlı ayrı bir `Payment(type=REFUND)` kaydı. Tahsilatı olan araç, net tahsilat sıfırlanmadan iptal edilemez. |
| E-14 | **Kart tahsilatı kasaya mı girer?** Doküman "kasa hareketleri" ile "kart tahsilatı"nı aynı listede veriyor. | **Fiziksel kasa sadece nakittir.** Kart ve havale "hesap/kanal bazlı tahsilat" olarak izlenir, kasa sayımına dahil edilmez. Gün sonu raporu ikisini ayrı gösterir. |
| E-15 | **POS komisyonu, banka masrafı, personel maaşı detayı** yok. | Bu veriler yoksa sistem "kâr" demez; "Gelir–gider farkı (girilen giderlere göre)" der. POS komisyonu gider olarak elle girilebilir. |
| E-16 | **Kampanya alanlarında çelişki**: "normal fiyat + indirimli fiyat + indirim yüzdesi" üçü birden. Kampanya birden fazla hizmete uygulanırsa tek "normal fiyat" anlamsız. | İndirim tipi: `YÜZDE`, `SABİT_TUTAR`, `SABİT_FİYAT` (hizmet bazında). Normal fiyat hizmetin güncel listesinden gelir, ekranda hesaplanmış olarak gösterilir. |
| E-17 | **Kampanya + manuel indirim birlikte kullanılabilir mi?** | Varsayılan: araç başına **en fazla 1 kampanya**; manuel indirim kampanya ile birleştirilemez (ayar ile açılabilir). |
| E-18 | **Fazla ödeme / para üstü** | Kalan tutardan fazla ödeme kaydedilemez. Para üstü sistemde tutulmaz (nakit alınan = hizmet tutarı). |
| E-19 | **Cari hesap ile normal alacak ayrımı** | Kurumsal müşteride araç "cariye yazılır" → alacak araçtan cari hesaba devredilir; tahsilat cari hesaba yapılır. Bireysel müşteride alacak araç kaydı üzerinde kalır. |

### 2.3 İletişim ve hukuk

| # | Eksik / Çelişki | Öneri |
|---|---|---|
| E-20 | **"WhatsApp şablonları panelden yönetilebilsin"** — Meta Cloud API'de işletme başlatan mesajlar **Meta tarafından onaylanmış şablon** olmak zorunda. Panelde metni serbestçe değiştirmek mesajı göndermez. | Panel: Meta'daki onaylı şablonları senkronize eder, değişkenleri sistem alanlarına eşler, onay durumunu gösterir. Yeni metin = Meta'ya yeni şablon başvurusu (panelden gönderilebilir ama onay beklenir). |
| E-21 | **Meta, operasyonel mesaj için de müşterinin WhatsApp'tan mesaj almayı kabul etmesini (opt-in)** bekler. | Kabul ekranında "WhatsApp bildirim istiyor musunuz?" (varsayılan: evet, sözlü onay kaydı). Bu **pazarlama izni değildir.** |
| E-22 | **Anket mesajı hangi kategoride?** Meta, geri bildirim şablonlarını bazen "marketing" sınıflandırır (maliyet ve izin etkisi). Ticari elektronik ileti kapsamı da tartışmalı. | Anket içeriğinde **hiçbir tanıtım/kampanya ifadesi olmayacak**. Meta'nın verdiği kategori sistemde saklanır. Hukuki niteliği avukat/mali müşavir tarafından teyit edilmeli (K-11). |
| E-23 | **Aydınlatma metni müşteriye nasıl sunulacak?** Araç kabulü 30 saniyelik bir işlem; ıslak imza/tablet yok. | Kabul ekranında "Aydınlatma yapıldı" işareti + ilk WhatsApp mesajında aydınlatma metni linki + tabelada/sitede KVKK metni. Pazarlama izni için **ayrı, açık, kanıtlanabilir** onay (web formu veya WhatsApp'tan "EVET" yanıtı). |
| E-24 | **İYS entegrasyonu** gerçek bir API (İYS Marka/Entegratör hesabı) gerektirir. İşletmenin İYS kaydı var mı bilinmiyor. | V1: İYS'ye uygun veri modeli + `IysProvider` arayüzü + mock sağlayıcı + CSV dışa aktarım. Gerçek İYS API bağlantısı işletme hesabı açıldığında devreye alınır. |
| E-25 | **Yurt dışına veri aktarımı (KVKK m.9)** — WhatsApp (Meta) ve birçok e-posta servisi yurt dışında. | Aydınlatma metninde açıkça belirtilmeli; standart sözleşme/bildirim gereklilikleri hukuken teyit edilmeli. Sunucu Türkiye'de tutulabilir (öneri). |
| E-26 | **E-posta "teslimat ve tıklama istatistikleri"** SMTP ile alınamaz (SMTP sadece "gönderildi" der). | Tıklama: kendi yönlendirme linklerimizle ölçülür (SMTP'de de çalışır). Teslim/bounce: ancak webhook destekli servis sağlayıcıyla. Açılma oranı **raporlanmayacak** (Apple Mail Privacy vb. nedeniyle yanıltıcı). |

### 2.4 Ürün ve dağıtım

| # | Eksik / Çelişki | Öneri |
|---|---|---|
| E-27 | **"İşletmenin kendi sunucusu"**: dükkândaki bir bilgisayar mı, bulut VPS mi? WhatsApp webhook'u ve müşteri takip sayfası için **sabit, herkese açık HTTPS adresi** şart. | Önerilen: işletme başına Türkiye lokasyonlu bir VPS (2 vCPU / 4 GB RAM yeterli). Dükkânda internet kesilirse panel çalışmaz — bu kabul edilmeli (K-10). |
| E-28 | **Güncelleme dağıtımı**: KUZHAN 5–20 işletmeye kurulum yaparsa güncellemeler nasıl gidecek? | Sürümlenmiş Docker imajları (GitHub Container Registry, private). Her kurulum `docker compose pull && migrate && up` ile güncellenir. Lisans/uzaktan yönetim paneli V1'de **yok**. |
| E-29 | **Fiş yazıcı / barkod** gibi donanım belirtilmemiş. | V1'de donanım entegrasyonu yok. Araç kabul özeti tarayıcıdan yazdırılabilir (A5/termal uyumlu CSS) — talep edilirse. |
| E-30 | **Çalışma saatleri, tatil günleri** sadece web sitesi için geçiyor. | Ayrıca mesaj gönderim "sessiz saatleri" için de kullanılır (21:00–09:00 pazarlama/anket gönderilmez). |

---

## 3. Önerilen Teknik Mimari

### 3.1 Teknoloji kararları (gerekçeli)

| Katman | Seçim | Neden | Değerlendirilen alternatif / neden değil |
|---|---|---|---|
| Monorepo | **pnpm workspaces** (+ Turborepo sadece cache için, opsiyonel) | Paylaşılan tip/şema/iş kuralı paketleri tek yerde. | Nx: bu boyutta fazla ağır. Ayrı repolar: tip paylaşımı zorlaşır. |
| Frontend | **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui (Radix)** | Tek uygulamada hem SEO gerektiren tanıtım sitesi (SSR/SSG) hem panel. shadcn bileşenleri kodun içine kopyalanır, bağımlılık kilidi yoktur, erişilebilir. | İki ayrı uygulama (Vite SPA panel + Next site): iki build, iki deploy — gereksiz. |
| Form/veri | React Hook Form + Zod, TanStack Query, TanStack Table, Recharts | Zod şemaları backend ile paylaşılır → aynı validasyon iki tarafta. | |
| Backend | **NestJS + TypeScript, REST, `/api/v1`** | Modüler yapı (her iş modülü ayrı Nest modülü), guard/interceptor ile merkezi yetki ve audit, olgun test altyapısı. | Next.js API routes: worker, kuyruk, guard yapısı için yetersiz; panel ve iş mantığı birbirine karışır. Fastify çıplak: yapı disiplinini biz kurmak zorunda kalırız. |
| ORM | **Prisma** + gerektiğinde raw SQL (raporlar) | Tip güvenli, migration sistemi olgun. Rapor sorguları için `$queryRaw` (parametreli). | Drizzle: iyi ama ekip/ekosistem olgunluğu Prisma lehine. TypeORM: migration ve tip güvenliği zayıf. |
| Veritabanı | **PostgreSQL 16** | İlişkisel, transaction, `timestamptz`, partial index, `FOR UPDATE SKIP LOCKED`. | |
| Kuyruk / zamanlayıcı | **pg-boss (PostgreSQL üzerinde)** | **Redis gerekmez** → kurulum başına bir servis eksik. Retry, backoff, cron, tekil iş (singleton) destekler. Tek işletme hacmi (günde yüzlerce mesaj) için fazlasıyla yeterli. | BullMQ + Redis: daha popüler ama ekstra servis, ekstra yedekleme, ekstra arıza noktası. Hacim büyürse geçiş arayüz arkasında kolay. |
| Kimlik doğrulama | **Sunucu tarafı oturum** (opak token, httpOnly+Secure+SameSite=Lax cookie, DB'de hash'li) + **Argon2id** | Anında iptal edilebilir oturum (personel işten ayrıldı → tüm oturumlar kapanır). JWT'nin iptal sorunu yok. | JWT: bu senaryoda avantajı yok, riski var. Harici IdP (Keycloak/Auth0): gereksiz karmaşa. |
| Dosya | Yerel disk volume (sadece logo, site görselleri, e-posta görselleri) | Fotoğraflı kabul V1'de yok, dosya hacmi çok küçük. | S3/MinIO: V1 için gereksiz; arayüz arkasında, ileride eklenebilir. |
| Log | **pino** (JSON, stdout) + Docker log rotasyonu | Basit, hızlı, yapılandırılmış. | ELK/Loki: tek işletme için ağır. Opsiyonel olarak sonradan eklenebilir. |
| Hata takibi | **Sentry SDK** (DSN ortam değişkeniyle; boşsa kapalı). Kendi sunucusu isteyen için GlitchTip uyumlu. | | |
| Reverse proxy | **Nginx** (TLS, gzip, statik cache, rate limit, güvenlik başlıkları) + Certbot | | Caddy daha kolay ama doküman Nginx istiyor; Nginx yeterli. |
| Test | **Vitest** (unit), **Vitest + Testcontainers PostgreSQL** (integration), **Playwright** (E2E + mobil görünüm) | Gerçek PostgreSQL ile test → raw SQL raporlar ve kısıtlar gerçekten test edilir. | SQLite ile test: davranış farkı yüzünden yanıltıcı. |
| CI/CD | **GitHub Actions** → lint, typecheck, test, build, imajları GHCR'a push. Deploy: sunucuda tek komut/script. | | |
| PWA | Manifest + service worker (sadece panel için "ana ekrana ekle", statik varlık cache'i) | **Çevrimdışı veri yazma yok** — iki cihazda çakışan kasa kayıtları finansal hata üretir. Çevrimdışıyken panel "bağlantı yok" uyarısı verir. | |

### 3.2 Mantıksal mimari

```mermaid
flowchart LR
  subgraph İstemciler
    P[Yönetim Paneli<br/>/panel · PWA]
    S[Tanıtım Sitesi<br/>/ · SEO]
    M[Müşteri Sayfaları<br/>/takip · /anket · /abonelik]
  end

  N[Nginx<br/>TLS · rate limit · güvenlik başlıkları]

  subgraph Uygulama
    W[web<br/>Next.js]
    A[api<br/>NestJS /api/v1]
    K[worker<br/>NestJS · pg-boss]
  end

  DB[(PostgreSQL<br/>iş verisi + pg-boss kuyruğu)]
  FS[(uploads volume)]
  B[backup<br/>pg_dump cron]

  WA[Meta WhatsApp<br/>Cloud API]
  EM[SMTP / E-posta servisi]
  IYS[İYS API]

  P & S & M --> N
  N -->|/ | W
  N -->|/api, /webhooks| A
  W -->|SSR veri çekme| A
  A --> DB
  A --> FS
  K --> DB
  K --> WA
  K --> EM
  K --> IYS
  WA -->|webhook| N
  EM -->|webhook (destekliyorsa)| N
  B --> DB
```

**Neden `api` ve `worker` ayrı süreç?** Aynı kod tabanı, iki giriş noktası (`main.ts`, `worker.ts`). Toplu mesaj gönderimi veya rapor hesaplaması panelin yanıt süresini etkilemez; worker çökerse araç kabul çalışmaya devam eder.

### 3.3 Backend modül yapısı (NestJS)

Her iş modülü kendi `controller → service → repository` katmanına sahip; modüller arası iletişim **servis arayüzleri ve domain olayları** üzerinden (örn. `OrderStatusChanged` olayı → bildirim modülü dinler). Böylece "WhatsApp gönderilemedi" araç kabulünü asla bozmaz.

| Modül | Sorumluluk |
|---|---|
| `auth` | Giriş, oturum, parola politikası, rate limit, parola sıfırlama |
| `access` | Rol, yetki, `@RequirePermission()` guard |
| `audit` | Audit log interceptor + servis |
| `settings` | İşletme ayarları, entegrasyon ayarları (şifreli), marka |
| `customers` | Müşteri, araç, müşteri-araç ilişkisi, plaka normalizasyonu, notlar |
| `catalog` | Hizmetler, araç tipleri, fiyat geçmişi |
| `orders` | Araç kabul, kalemler, durum makinesi, personel ataması, takip token'ı |
| `finance` | Ödemeler, iadeler, ödeme yöntemleri, kasa, gün sonu, giderler, cari hesap |
| `campaigns` | Kampanya, kupon, kullanım doğrulama, segmentler |
| `consents` | Pazarlama izinleri, izin olay geçmişi, İYS senkronizasyonu |
| `messaging` | Outbox (OutboundMessage), şablonlar, kanal sağlayıcıları (WhatsApp/E-posta), webhook'lar, frekans sınırı |
| `marketing` | Toplu gönderimler (broadcast), geri kazanım otomasyonları |
| `surveys` | Anket tanımı, davetler, yanıtlar, şikâyet (feedback case) |
| `reports` | Dashboard ve tüm raporlar (salt okunur sorgu servisleri), dışa aktarma |
| `website` | Site içerikleri, SSS, yorumlar, SEO meta |
| `notifications` | Panel içi bildirimler (düşük puan, başarısız mesaj vb.) |
| `system` | Sağlık kontrolü, yedek durumu, sürüm bilgisi |

### 3.4 Çoklu işletme (ürünleştirme) modeli

**Karar önerisi: Kurulum başına tek işletme (single-tenant per deployment).**

- Her işletme: ayrı sunucu (veya ayrı compose projesi), **ayrı PostgreSQL veritabanı**, ayrı `.env`, ayrı alan adı.
- Veritabanında `tenant_id` kolonu **yok**. Veri karışması mimari olarak imkânsız.
- İşletmeye özgü her şey (logo, renk, hizmetler, şablonlar, entegrasyon anahtarları, site içeriği) veritabanında `settings` ve ilgili tablolarda; kod tüm işletmeler için aynıdır.
- Marka renkleri CSS değişkenleri olarak çalışma zamanında uygulanır → yeniden build gerekmez.
- İlk kurulum: `pnpm setup:business` (veya container içi komut) → işletme adı, sahip hesabı, varsayılan roller/hizmetler.

İleride çok-kiracılı SaaS'a geçmek gerekirse bu kararın maliyeti: tüm tablolara `business_id` + satır seviyesinde güvenlik. Bu bilerek ertelenen bir karardır; şu an doğru olan ayrı kurulumdur.

### 3.5 API tasarım ilkeleri

- Taban: `/api/v1`. Kırıcı değişiklikte `/api/v2`.
- Kaynak isimleri İngilizce, çoğul (`/orders`, `/customers`); arayüz metinleri Türkçe.
- Liste: `?page=&pageSize=&sort=&q=&status=&from=&to=` — sayfalama cevapta `{ data, meta: { total, page, pageSize } }`.
- Hata formatı: `{ error: { code: "ORDER_INVALID_TRANSITION", message: "Türkçe açıklama", details } }` — kod makine için, mesaj kullanıcı için.
- Para: API'de **kuruş cinsinden tamsayı** (`totalKurus: 75000`). Biçimlendirme sadece arayüzde (`750,00 ₺`).
- Tarih: API'de ISO-8601 UTC; "iş günü" parametreleri `YYYY-MM-DD` (Europe/Istanbul yorumlanır).
- Değiştiren isteklerde `Idempotency-Key` başlığı desteklenir (ödeme alma, araç kabul) → çift tıklama çift ödeme yaratmaz.
- OpenAPI (Swagger) dokümanı otomatik üretilir, `/api/docs` sadece geliştirme ortamında / yetkili kullanıcıya açık.

**Ana endpoint grupları (V1):**

| Grup | Örnek endpointler |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/password/change`, `POST /auth/password/reset-request`, `POST /auth/password/reset` |
| Kullanıcı/Rol | `GET/POST/PATCH /users`, `POST /users/:id/deactivate`, `GET/POST/PATCH /roles`, `GET /permissions`, `GET/POST/PATCH /employees` |
| Müşteri | `GET/POST/PATCH /customers`, `GET /customers/:id` (profil + metrikler), `GET /customers/:id/orders`, `GET /customers/:id/payments`, `POST /customers/:id/notes`, `GET/PUT /customers/:id/consents` |
| Araç | `GET /vehicles/lookup?plate=` (normalize edip müşteri(ler)i döner), `GET/PATCH /vehicles/:id`, `POST /vehicles/:id/customers` |
| Katalog | `GET/POST/PATCH /services`, `PUT /services/:id/prices`, `GET/POST/PATCH /vehicle-types` |
| Araç kabul | `POST /orders` (kabul), `GET /orders`, `GET /orders/:id`, `POST /orders/:id/items`, `DELETE /orders/:id/items/:itemId`, `POST /orders/:id/transitions` (`{ to: "READY" }`), `POST /orders/:id/assignments`, `POST /orders/:id/charge-to-account`, `POST /orders/:id/tracking-link` |
| Finans | `POST /orders/:id/payments`, `POST /payments/:id/refund`, `GET /payments`, `GET/POST/PATCH /payment-methods`, `GET /cash/transactions`, `POST /cash/transactions` (manuel giriş/çıkış), `POST /cash/day-close`, `GET /cash/day-close/:date`, `GET/POST /expenses`, `POST /expenses/:id/reverse`, `GET/POST/PATCH /expense-categories`, `GET/POST /accounts`, `GET /accounts/:id/statement?from=&to=`, `POST /accounts/:id/payments` |
| Kampanya | `GET/POST/PATCH /campaigns`, `POST /campaigns/:id/coupons` (toplu üret), `POST /campaigns/evaluate` (bir sipariş taslağı için uygunluk + indirim), `GET/POST/PATCH /segments`, `GET /segments/:id/preview` |
| Mesajlaşma | `GET /messages`, `POST /messages/:id/retry`, `GET/POST/PATCH /templates/email`, `GET /templates/whatsapp`, `POST /templates/whatsapp/sync`, `PATCH /templates/whatsapp/:id/mapping`, `POST /templates/email/:id/test` |
| Pazarlama | `GET/POST/PATCH /broadcasts`, `POST /broadcasts/:id/schedule`, `POST /broadcasts/:id/cancel`, `GET /broadcasts/:id/stats`, `GET/POST/PATCH /automations` |
| Anket | `GET/PATCH /surveys/:id`, `GET /survey-responses`, `GET/PATCH /feedback-cases/:id` |
| Rapor | `GET /dashboard?from=&to=`, `GET /reports/finance/*`, `GET /reports/operations/*`, `GET /reports/customers/*`, `GET /reports/staff/*`, `GET /reports/quality/*`, `GET /reports/:name/export?format=csv|xlsx|pdf` |
| Ayarlar/Site | `GET/PATCH /settings/business`, `GET/PUT /settings/integrations/:provider`, `POST /settings/integrations/:provider/test`, `GET/PATCH /website/content`, `GET/POST/PATCH /website/faqs`, `GET/POST/PATCH /website/testimonials`, `POST /uploads` |
| Sistem | `GET /audit-logs`, `GET /system/health`, `GET /system/backups` |
| **Public** (auth yok, rate limit sıkı) | `GET /public/site` (site içeriği), `GET /public/track/:token`, `GET /public/survey/:token`, `POST /public/survey/:token`, `GET/POST /public/unsubscribe/:token`, `POST /public/consent` (site izin formu), `GET /public/e/c/:token` (e-posta tıklama yönlendirme) |
| **Webhooks** | `GET/POST /webhooks/whatsapp`, `POST /webhooks/email/:provider` |

---

## 4. Klasör Yapısı

```text
kuzhan-oto-yikama/
├─ apps/
│  ├─ api/                         # NestJS — HTTP API + worker (iki giriş noktası)
│  │  ├─ src/
│  │  │  ├─ main.ts                # HTTP sunucusu
│  │  │  ├─ worker.ts              # pg-boss worker süreci
│  │  │  ├─ app.module.ts
│  │  │  ├─ common/                # guard, interceptor, filter, decorator, pipe
│  │  │  │  ├─ auth/               # SessionGuard, PermissionGuard, @RequirePermission
│  │  │  │  ├─ audit/              # AuditInterceptor
│  │  │  │  ├─ errors/             # AppError, hata kodları, global filter
│  │  │  │  └─ time/               # Europe/Istanbul yardımcıları, iş günü hesapları
│  │  │  ├─ infra/
│  │  │  │  ├─ prisma/             # PrismaService, transaction yardımcıları
│  │  │  │  ├─ queue/              # pg-boss sarmalayıcı
│  │  │  │  ├─ crypto/             # AES-256-GCM secret şifreleme, token üretimi
│  │  │  │  └─ storage/            # yerel dosya depolama
│  │  │  └─ modules/
│  │  │     ├─ auth/  access/  audit/  settings/
│  │  │     ├─ customers/  catalog/  orders/  finance/
│  │  │     ├─ campaigns/  consents/  messaging/  marketing/
│  │  │     ├─ surveys/  reports/  website/  notifications/  system/
│  │  │     │   (her biri: *.module.ts, *.controller.ts, *.service.ts,
│  │  │     │    *.repository.ts, dto/, domain/, *.spec.ts)
│  │  │     └─ messaging/providers/
│  │  │        ├─ whatsapp/  meta-cloud.provider.ts  mock.provider.ts
│  │  │        ├─ email/     smtp.provider.ts  mock.provider.ts  (api.provider.ts)
│  │  │        └─ iys/       iys.provider.ts  mock.provider.ts
│  │  ├─ prisma/
│  │  │  ├─ schema.prisma
│  │  │  ├─ migrations/
│  │  │  └─ seed/                  # dev seed (örnek veri) + prod seed (roller, yetkiler, varsayılanlar)
│  │  ├─ test/
│  │  │  ├─ integration/           # Testcontainers ile gerçek PostgreSQL
│  │  │  └─ fixtures/
│  │  └─ Dockerfile
│  │
│  └─ web/                         # Next.js — panel + site + müşteri sayfaları
│     ├─ src/
│     │  ├─ app/
│     │  │  ├─ (site)/             # /, /hakkimizda, /hizmetler, /fiyatlar, /kampanyalar,
│     │  │  │                      # /iletisim, /sss, /yorumlar, /kvkk, /gizlilik
│     │  │  ├─ (public)/           # /takip/[token], /anket/[token], /abonelik/[token]
│     │  │  ├─ panel/              # giriş gerektiren yönetim paneli
│     │  │  │  ├─ giris/
│     │  │  │  ├─ (app)/           # sidebar layout
│     │  │  │  │  ├─ page.tsx      # dashboard
│     │  │  │  │  ├─ araclar/  arac-kabul/  musteriler/  hizmetler/
│     │  │  │  │  ├─ finans/  kasa/  giderler/  cari/
│     │  │  │  │  ├─ raporlar/  kampanyalar/  pazarlama/  anketler/
│     │  │  │  │  ├─ personel/  ayarlar/  site-icerik/  sistem/
│     │  │  ├─ sitemap.ts  robots.ts  manifest.ts
│     │  ├─ components/
│     │  │  ├─ ui/                 # shadcn tabanlı temel bileşenler
│     │  │  ├─ panel/              # panel bileşenleri (DataTable, StatCard, DateRangeFilter…)
│     │  │  └─ site/               # site bileşenleri
│     │  ├─ lib/                   # api istemcisi, formatlayıcılar (TL, tarih), yetki yardımcıları
│     │  └─ styles/
│     ├─ e2e/                      # Playwright testleri (masaüstü + mobil profil)
│     └─ Dockerfile
│
├─ packages/
│  ├─ shared/                      # Ön yüz + arka yüz ortak saf TypeScript
│  │  ├─ src/
│  │  │  ├─ money.ts               # kuruş aritmetiği, yuvarlama, dağıtım
│  │  │  ├─ plate.ts               # plaka normalizasyonu ve doğrulama
│  │  │  ├─ order-status.ts        # durum makinesi tanımı (izinli geçişler)
│  │  │  ├─ permissions.ts         # yetki anahtarları sabitleri
│  │  │  ├─ schemas/               # Zod şemaları (DTO'lar)
│  │  │  └─ discount.ts            # kampanya indirim hesaplama (saf fonksiyon)
│  │  └─ test/
│  └─ config/                      # eslint, tsconfig, prettier ortak ayarları
│
├─ infra/
│  ├─ docker-compose.yml           # geliştirme (postgres + mailpit)
│  ├─ docker-compose.prod.yml      # production (nginx, web, api, worker, postgres, backup)
│  ├─ nginx/
│  │  ├─ nginx.conf
│  │  └─ conf.d/app.conf
│  ├─ backup/
│  │  ├─ backup.sh  restore.sh
│  └─ scripts/
│     ├─ install.sh  update.sh  setup-business.sh
│
├─ docs/                           # bu mimari dokümanlar + modül dokümanları + runbook'lar
├─ .github/workflows/ci.yml  release.yml
├─ .env.example
├─ pnpm-workspace.yaml
└─ README.md
```

**Kritik nokta:** İş kurallarının en hassas kısımları (`money`, `plate`, `order-status`, `discount`) `packages/shared` içinde **saf fonksiyonlar** olarak yazılır. Böylece hem arayüz anında hesap gösterir hem backend aynı kodla doğrular, hem de %100 unit test edilir. **Son söz her zaman backend'dedir**; arayüz hesabı sadece önizlemedir.
