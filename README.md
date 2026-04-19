# School Management System

Okul yönetim sistemi, **Java 17** ve **Spring Boot 3.2** tabanlı, mikroservis mimarisiyle geliştirilmiş kapsamlı bir REST API platformudur. **React 18** tabanlı modern bir frontend ile birlikte gelir. Kimlik doğrulama, ders yönetimi, öğrenci kayıt işlemleri (Saga Pattern), not yönetimi ve kafeterya menüsü gibi temel okul fonksiyonlarını bağımsız servisler olarak sunar.

---

## İçindekiler

- [Mimari](#mimari)
- [Servisler — Amaç ve Sorumluluklar](#servisler--amaç-ve-sorumluluklar)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Servisler ve Portlar](#servisler-ve-portlar)
- [Veritabanı Kurulumu ve SQL Scriptleri](#veritabanı-kurulumu-ve-sql-scriptleri)
- [Kurulum ve Çalıştırma](#kurulum-ve-çalıştırma)
- [Ortam Değişkenleri](#ortam-değişkenleri)
- [API Referansı](#api-referansı)
- [Kimlik Doğrulama (JWT)](#kimlik-doğrulama-jwt)
- [Kafka Event Sistemi ve Dead Letter Queue](#kafka-event-sistemi-ve-dead-letter-queue)
- [Enrollment Saga Akışı](#enrollment-saga-akışı)
- [Redis Önbellekleme](#redis-önbellekleme)
- [Distributed Tracing (Zipkin)](#distributed-tracing-zipkin)
- [Merkezi Log Yönetimi (ELK Stack)](#merkezi-log-yönetimi-elk-stack)
- [Frontend](#frontend)
- [Hata Yönetimi](#hata-yönetimi)

---

## Mimari

```
                     ┌──────────────────────────────────┐
                     │          API GATEWAY              │
                     │         (port 8080)               │
                     │  JWT doğrulama + yönlendirme      │
                     └─────────────┬────────────────────┘
                                   │
         ┌─────────────────────────┼──────────────────────────┐
         │                         │                          │
┌────────▼────────┐    ┌───────────▼──────┐    ┌─────────────▼────┐
│  AUTH SERVICE   │    │  COURSE SERVICE  │    │ENROLLMENT SERVICE │
│   (port 8081)   │    │   (port 8082)    │    │   (port 8083)     │
│  auth_db :5433  │    │  course_db :5434 │    │enrollment_db:5435 │
│                 │    │  Redis Cache     │    │                   │
└─────────────────┘    └──────────────────┘    └──────────────────┘
                                   │                          │
                       ┌───────────▼──────┐                  │
                       │  GRADE SERVICE   │    ┌─────────────▼────┐
                       │   (port 8084)    │    │CAFETERIA SERVICE  │
                       │  grade_db :5436  │    │   (port 8085)     │
                       └──────────────────┘    │cafeteria_db :5437 │
                                               │   Redis Cache     │
                                               └──────────────────┘

          ┌────────────────────────────────────────────────┐
          │              EUREKA SERVER (8761)               │
          │           Service Discovery Registry            │
          └────────────────────────────────────────────────┘

          ┌────────────────────────────────────────────────┐
          │                APACHE KAFKA                     │
          │  enrollment-request-topic  (+ .DLT)            │
          │  enrollment-response-topic (+ .DLT)            │
          │  course-created-topic                           │
          │  grade-updated-topic                            │
          └────────────────────────────────────────────────┘

          ┌──────────────────────┐  ┌────────────────────────┐
          │   REDIS  (port 6379) │  │  ZIPKIN  (port 9411)   │
          │   Distributed Cache  │  │  Distributed Tracing   │
          └──────────────────────┘  └────────────────────────┘

          ┌─────────────────────────────────────────────────────────────┐
          │                     ELK STACK                               │
          │                                                             │
          │  Servisler ──TCP/5000──▶ LOGSTASH ──▶ ELASTICSEARCH :9200  │
          │                                              │              │
          │                                        KIBANA :5601         │
          └─────────────────────────────────────────────────────────────┘

          ┌────────────────────────────────────────────────┐
          │            REACT FRONTEND (port 5173)           │
          │  Vite + TailwindCSS + React Router + Axios      │
          └────────────────────────────────────────────────┘
```

**Mimari Desenler:**
- **Database-per-Service**: Her servisin kendi PostgreSQL veritabanı
- **Choreography-based Saga**: Dağıtık enrollment işlemleri için
- **API Gateway Pattern**: Tek giriş noktası, JWT doğrulama
- **Event-Driven Architecture**: Kafka ile asenkron mesajlaşma
- **Dead Letter Queue (DLQ)**: İşlenemeyen Kafka mesajları için hata yönetimi
- **Service Discovery**: Eureka ile dinamik servis keşfi
- **Distributed Caching**: Redis ile veritabanı yükü azaltma
- **Distributed Tracing**: Zipkin ile servisler arası istek takibi
- **Centralized Logging**: ELK Stack ile tüm servislerden merkezi log toplama ve görselleştirme

---

## Servisler — Amaç ve Sorumluluklar

Her servis tek bir iş alanına odaklanır. Bu bölüm her servisin **neden var olduğunu** ve **neyi yönettiğini** açıklar.

---

### Eureka Server — Servis Keşif Merkezi

**Neden yazıldı:** Mikroservis ortamında servisler sabit IP/port yerine isim üzerinden birbirini bulur. Eureka, tüm servislerin kendini kaydettirdiği merkezi bir adres defteridir.

**Ne yapar:**
- Tüm servislerin (`auth-service`, `course-service` vb.) kayıt olduğu registry'dir
- API Gateway, hangi servisin hangi IP/port'ta çalıştığını Eureka'ya sorarak öğrenir
- Bir servis kapanırsa Eureka onu kayıttan siler; bir servis eklense otomatik keşfedilir
- Health check mekanizmasıyla `heartbeat` ile canlı servisleri izler

**Kritik özellik:** Eureka olmazsa API Gateway `lb://course-service` gibi mantıksal adresleri fiziksel adrese çeviremez; tüm yönlendirme durur.

---

### API Gateway — Merkezi Giriş Kapısı

**Neden yazıldı:** Her servise doğrudan erişim yerine tek bir giriş noktası sağlamak için yazıldı. Kimlik doğrulama mantığını tüm servislere dağıtmak yerine bir merkezde toplar.

**Ne yapar:**
- Dışarıdan gelen tüm HTTP isteklerini karşılar (`localhost:8080`)
- `Authorization: Bearer <token>` header'ından JWT'yi doğrular (lokal, HTTP çağrısı yapmaz)
- Token geçerli ise `X-User-Id` ve `X-User-Role` header'larını oluşturur ve isteği downstream servise iletir
- `/api/auth/**` path'i JWT doğrulama dışındadır (login/register herkese açık)
- Geçersiz veya eksik token'da `401 Unauthorized` döner

**Kritik özellik:** Hiçbir downstream servis JWT doğrulaması yapmaz; tamamen Gateway'e güvenir. Bu sayede auth mantığı merkezi kalır.

---

### Auth Service — Kimlik ve Yetki Yönetimi

**Neden yazıldı:** Kullanıcı kayıt/giriş işlemlerini ve JWT token üretimini tek bir yerden yönetmek için yazıldı.

**Ne yapar:**
- Yeni kullanıcıları sisteme kayıt eder (`ADMIN` / `TEACHER` / `STUDENT` rolleriyle)
- Şifreleri **BCrypt** ile hash'ler; asla düz metin saklamaz
- Başarılı girişte **HS256 JWT token** üretir (24 saat geçerli)
- Token içine `userId`, `email`, `role`, `firstName`, `lastName` embed eder
- Kendi veritabanında (`auth_db`) yalnızca kullanıcı bilgilerini tutar

**Kritik özellik:** Diğer servisler kullanıcı bilgisi için Auth Service'e HTTP çağrısı yapmaz; tüm gerekli veriler JWT içinde taşınır.

---

### Course Service — Ders Yönetimi ve Kontenjan Kontrolü

**Neden yazıldı:** Derslerin CRUD işlemlerini ve en kritik iş kuralı olan kontenjan yönetimini sağlamak için yazıldı. Enrollment Saga'sının "kapasite" tarafıdır.

**Ne yapar:**
- Ders oluşturma, güncelleme, kapatma ve listeleme (sayfalama ile)
- Kafka'dan gelen `RESERVE` mesajlarını alarak kontenjan ayırır (`enrolledCount` +1)
- Kafka'dan gelen `RELEASE` mesajlarını alarak kontenjanı serbest bırakır (`enrolledCount` -1)
- Eş zamanlı kayıt isteklerinde **PESSIMISTIC_WRITE** kilidiyle race condition'ı önler
- `enrolledCount == capacity` olduğunda dersin durumunu otomatik `FULL` yapar
- Ders oluşturulduğunda `CourseCreatedEvent` Kafka'ya yayınlar
- **Redis Cache:** `getCourseById` ve `getCoursesByTeacher` sonuçlarını 5 dakika önbellekler

**Kritik özellik:** Enrollment Service hiçbir zaman doğrudan veritabanına yazmaz; kontenjan değişikliği her zaman Course Service üzerinden Kafka mesajlaşmasıyla gerçekleşir.

---

### Enrollment Service — Öğrenci Kayıt Orchestrator'ı

**Neden yazıldı:** Öğrencinin derse kaydolması birden fazla servisi etkiler (enrollment kaydı + kurs kapasitesi). Bu dağıtık işlemi koordine eden Saga'yı yönetmek için yazıldı.

**Ne yapar:**
- Öğrencinin derse kayıt isteğini alır ve `PENDING` durumunda bir enrollment kaydı oluşturur
- Her kayıt için benzersiz bir `sagaId` (UUID) üretir
- Kafka'ya `RESERVE` mesajı gönderir → Course Service kontenjanı kontrol eder
- Course Service'ten gelen onay/red yanıtını (`enrollment-response-topic`) işler
  - Onay gelirse enrollment `CONFIRMED` yapılır
  - Red gelirse enrollment `FAILED` yapılır ve `failureReason` kaydedilir
- Öğrenci kaydı iptal ederse Kafka'ya `RELEASE` mesajı gönderir (kompansasyon)
- **DLQ:** Yanıt mesajları işlenemezse 3 retry sonrası `enrollment-response-topic.DLT`'ye gönderilir

**Kritik özellik:** Enrollment Service hiçbir zaman kontenjanı kendisi değiştirmez; yalnızca Saga mesajlaşması aracılığıyla Course Service'e iş yaptırır.

---

### Grade Service — Not Yönetimi

**Neden yazıldı:** Öğretmenlerin not girişini ve otomatik harf notu hesaplamasını merkezi bir servis olarak sunmak için yazıldı.

**Ne yapar:**
- Öğretmenin girdiği sayısal notu (0–100) alır
- Harf notunu Java tarafında hesaplar (AA, BA, BB, ... FF) ve veritabanına kaydeder
- Aynı öğrencinin aynı dersteki notu güncellenebilir (upsert davranışı)
- Not girildiğinde/güncellendiğinde `GradeUpdatedEvent` Kafka'ya yayınlar
- Öğrenci bazlı ve ders bazlı not sorgusunu destekler

**Kritik özellik:** Her `(studentId, courseId)` çifti için yalnızca bir not kaydı olabilir (DB `UNIQUE` constraint). İkinci girişte yeni kayıt oluşmaz, mevcutu güncellenir.

---

### Cafeteria Service — Kafeterya Menü Yönetimi

**Neden yazıldı:** Okul kafeteryasının haftalık/günlük menüsünü yönetmek için yazıldı. Diğer servislerden tamamen bağımsız, kendi başına çalışan bir CRUD servisidir.

**Ne yapar:**
- Menü öğesi ekleme ve silme
- Günlük menü sorgusu (`?date=YYYY-MM-DD`)
- Haftalık menü sorgusu (`?weekStart=YYYY-MM-DD` → `weekStart + 6 gün`)
- `BREAKFAST`, `LUNCH`, `DINNER`, `SNACK` öğün tipi sınıflandırması
- Vejetaryen seçenek işaretleme
- **Redis Cache:** Günlük ve haftalık menü sorguları 1 saat önbelleklenir; menü eklendiğinde/silindiğinde cache temizlenir

**Kritik özellik:** Kafka veya diğer servislere hiçbir bağımlılığı yoktur. Eureka'ya kayıt olur ve API Gateway üzerinden erişilir, ancak tamamen özerk çalışır.

---

## Teknoloji Yığını

| Katman | Teknoloji | Versiyon |
|--------|-----------|----------|
| Dil | Java | 17 |
| Framework | Spring Boot | 3.2.0 |
| Cloud | Spring Cloud | 2023.0.0 |
| Build | Apache Maven | — |
| Veritabanı | PostgreSQL | 15 |
| DB Migration | Flyway | Spring Boot yönetimli |
| Message Broker | Apache Kafka | 7.5.0 (Confluent) |
| Cache | Redis | 7 (Alpine) |
| Tracing | Zipkin + Micrometer Brave | — |
| Log Toplama | Logstash | 8.12.0 |
| Log Depolama | Elasticsearch | 8.12.0 |
| Log Görselleştirme | Kibana | 8.12.0 |
| Log Encoder | logstash-logback-encoder | 7.4 |
| Service Discovery | Netflix Eureka | — |
| API Gateway | Spring Cloud Gateway | — |
| ORM | JPA / Hibernate | — |
| JWT | JJWT | 0.11.5 |
| Mapping | MapStruct | 1.5.5.Final |
| Boilerplate | Lombok | 1.18.42 |
| Containerization | Docker / Docker Compose | — |
| **Frontend** | React | **18.2.0** |
| UI Build | Vite | 5.1.4 |
| Styling | Tailwind CSS | 3.4.1 |
| HTTP Client | Axios | 1.6.7 |
| İkonlar | Lucide React | 0.344.0 |

---

## Servisler ve Portlar

| Servis | Port | DB Port | Veritabanı | Kafka | Redis | Tracing |
|--------|------|---------|------------|-------|-------|---------|
| API Gateway | 8080 | — | — | — | — | ✓ |
| Auth Service | 8081 | 5433 | auth_db | — | — | ✓ |
| Course Service | 8082 | 5434 | course_db | ✓ | ✓ | ✓ |
| Enrollment Service | 8083 | 5435 | enrollment_db | ✓ | — | ✓ |
| Grade Service | 8084 | 5436 | grade_db | ✓ | — | ✓ |
| Cafeteria Service | 8085 | 5437 | cafeteria_db | — | ✓ | ✓ |
| Eureka Server | 8761 | — | — | — | — | ✓ |
| Kafka UI | 8090 | — | — | — | — | — |
| Redis | 6379 | — | — | — | — | — |
| Zipkin UI | 9411 | — | — | — | — | — |
| Elasticsearch | 9200 | — | — | — | — | — |
| Logstash (TCP) | 5000 | — | — | — | — | — |
| Kibana UI | 5601 | — | — | — | — | — |
| React Frontend | 5173 | — | — | — | — | — |

---

## Veritabanı Kurulumu ve SQL Scriptleri

> **Önemli:** Docker Compose ile çalıştırıldığında Flyway migration'ları otomatik çalışır. Aşağıdaki SQL'ler manuel kurulum veya referans amacıyla verilmiştir.

### Ön Hazırlık — Tüm Veritabanlarını ve Kullanıcıyı Oluşturun

Docker olmadan manuel kurulum yapıyorsanız önce bu script'i çalıştırın:

```sql
-- PostgreSQL süper kullanıcısıyla bağlanarak çalıştırın
CREATE USER school_user WITH PASSWORD 'school_pass';

CREATE DATABASE auth_db       OWNER school_user;
CREATE DATABASE course_db     OWNER school_user;
CREATE DATABASE enrollment_db OWNER school_user;
CREATE DATABASE grade_db      OWNER school_user;
CREATE DATABASE cafeteria_db  OWNER school_user;

GRANT ALL PRIVILEGES ON DATABASE auth_db       TO school_user;
GRANT ALL PRIVILEGES ON DATABASE course_db     TO school_user;
GRANT ALL PRIVILEGES ON DATABASE enrollment_db TO school_user;
GRANT ALL PRIVILEGES ON DATABASE grade_db      TO school_user;
GRANT ALL PRIVILEGES ON DATABASE cafeteria_db  TO school_user;
```

---

### 1. auth_db — Kullanıcılar Tablosu

**Flyway dosyası:** `auth-service/src/main/resources/db/migration/V1__create_users_table.sql`

```sql
\c auth_db

CREATE TABLE users (
    id         BIGSERIAL    PRIMARY KEY,
    email      VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    first_name VARCHAR(80)  NOT NULL,
    last_name  VARCHAR(80)  NOT NULL,
    role       VARCHAR(20)  NOT NULL,           -- ADMIN | TEACHER | STUDENT
    enabled    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role  ON users (role);
```

**Test verisi (opsiyonel — şifreler bcrypt ile hash'lenmiş olmalı):**
```sql
-- Şifre: admin1234  (BCrypt hash)
INSERT INTO users (email, password, first_name, last_name, role)
VALUES ('admin@school.com',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
        'Admin', 'User', 'ADMIN');
```

---

### 2. course_db — Dersler Tablosu

**Flyway dosyası:** `course-service/src/main/resources/db/migration/V1__create_courses_table.sql`

```sql
\c course_db

CREATE TABLE courses (
    id             BIGSERIAL    PRIMARY KEY,
    code           VARCHAR(20)  NOT NULL UNIQUE,     -- örn: CS101
    name           VARCHAR(150) NOT NULL,
    description    TEXT,
    teacher_id     BIGINT       NOT NULL,
    capacity       INTEGER      NOT NULL CHECK (capacity > 0),
    enrolled_count INTEGER      NOT NULL DEFAULT 0
                                        CHECK (enrolled_count >= 0),
    status         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',   -- DRAFT | ACTIVE | FULL | CLOSED
    credit_hours   INTEGER      NOT NULL CHECK (credit_hours BETWEEN 1 AND 6),
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_enrolled_not_exceed_capacity
        CHECK (enrolled_count <= capacity)
);

CREATE INDEX idx_courses_teacher_id ON courses (teacher_id);
CREATE INDEX idx_courses_status     ON courses (status);
CREATE INDEX idx_courses_code       ON courses (code);
```

**Test verisi (opsiyonel):**
```sql
INSERT INTO courses (code, name, description, teacher_id, capacity, credit_hours, status)
VALUES
    ('CS101', 'Programlamaya Giriş',   'Temel programlama kavramları',   1, 30, 3, 'ACTIVE'),
    ('MATH201', 'İleri Matematik',     'Diferansiyel ve integral hesap', 2, 25, 4, 'ACTIVE'),
    ('ENG101', 'Akademik İngilizce',   'Akademik yazım ve okuma',        3, 40, 3, 'ACTIVE'),
    ('PHY101', 'Fizik I',              'Mekanik ve termodinamik',        1, 35, 4, 'ACTIVE');
```

---

### 3. enrollment_db — Kayıtlar Tablosu

**Flyway dosyası:** `enrollment-service/src/main/resources/db/migration/V1__create_enrollments_table.sql`

```sql
\c enrollment_db

CREATE TABLE enrollments (
    id             BIGSERIAL   PRIMARY KEY,
    student_id     BIGINT      NOT NULL,
    course_id      BIGINT      NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING | CONFIRMED | FAILED | CANCELLED
    saga_id        VARCHAR(36) NOT NULL UNIQUE,             -- UUID — dağıtık işlem takibi
    failure_reason TEXT,                                    -- FAILED durumunda doldurulur
    created_at     TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_student_course UNIQUE (student_id, course_id)
);

CREATE INDEX idx_enrollments_student_id ON enrollments (student_id);
CREATE INDEX idx_enrollments_course_id  ON enrollments (course_id);
CREATE INDEX idx_enrollments_saga_id    ON enrollments (saga_id);
CREATE INDEX idx_enrollments_status     ON enrollments (status);
```

> **Not:** `saga_id` her enrollment isteğinde üretilen benzersiz UUID'dir. Kafka mesajları arasında dağıtık işlemi takip etmek için kullanılır.

---

### 4. grade_db — Notlar Tablosu

**Flyway dosyası:** `grade-service/src/main/resources/db/migration/V1__create_grades_table.sql`

```sql
\c grade_db

CREATE TABLE grades (
    id           BIGSERIAL    PRIMARY KEY,
    student_id   BIGINT       NOT NULL,
    course_id    BIGINT       NOT NULL,
    teacher_id   BIGINT       NOT NULL,
    score        NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
    letter_grade VARCHAR(2),       -- Otomatik hesaplanır: AA BA BB CB CC DC DD FD FF
    feedback     TEXT,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_student_course UNIQUE (student_id, course_id)
);

CREATE INDEX idx_grades_student_id ON grades (student_id);
CREATE INDEX idx_grades_course_id  ON grades (course_id);
CREATE INDEX idx_grades_teacher_id ON grades (teacher_id);
```

**Harf notu hesaplama mantığı (referans):**
```
score >= 90 → AA  |  score >= 85 → BA  |  score >= 80 → BB
score >= 75 → CB  |  score >= 70 → CC  |  score >= 65 → DC
score >= 60 → DD  |  score >= 50 → FD  |  score  < 50 → FF
```

---

### 5. cafeteria_db — Menü Tablosu

**Flyway dosyası:** `cafeteria-service/src/main/resources/db/migration/V1__create_menu_items_table.sql`

```sql
\c cafeteria_db

CREATE TABLE menu_items (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    menu_date   DATE         NOT NULL,
    day_of_week VARCHAR(15)  NOT NULL,  -- MONDAY, TUESDAY, ...
    meal_type   VARCHAR(15)  NOT NULL,  -- BREAKFAST | LUNCH | DINNER | SNACK
    vegetarian  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_items_date      ON menu_items (menu_date);
CREATE INDEX idx_menu_items_meal_type ON menu_items (meal_type);
```

**Test verisi (opsiyonel):**
```sql
INSERT INTO menu_items (name, description, menu_date, day_of_week, meal_type, vegetarian)
VALUES
    ('Mercimek Çorbası', 'Geleneksel Türk mercimek çorbası', CURRENT_DATE, TO_CHAR(CURRENT_DATE, 'DAY'), 'LUNCH', TRUE),
    ('Izgara Tavuk',     'Sebze garnitürlü ızgara tavuk',   CURRENT_DATE, TO_CHAR(CURRENT_DATE, 'DAY'), 'LUNCH', FALSE),
    ('Sütlaç',           'Fırın sütlaç',                    CURRENT_DATE, TO_CHAR(CURRENT_DATE, 'DAY'), 'LUNCH', TRUE);
```

---

### Flyway Konfigürasyon Notu

Her servisin `application.yml` dosyasında Flyway şu şekilde yapılandırılmıştır:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate      # Flyway şemayı yönetir, Hibernate sadece doğrular
  flyway:
    enabled: true             # Uygulama başlarken migration'lar otomatik çalışır
    locations: classpath:db/migration
```

Migration dosyaları `V{version}__{description}.sql` formatında isimlendirilir.

---

## Kurulum ve Çalıştırma

### Ön Gereksinimler

| Araç | Versiyon | Amaç |
|------|---------|-------|
| Docker Desktop | — | Backend altyapı |
| Java | 17+ | Yerel geliştirme |
| Maven | 3.8+ | Build |
| Node.js | 18+ | Frontend |
| npm | 9+ | Frontend paket yönetimi |

---

### Seçenek A — Tam Docker ile Çalıştırma (Önerilen)

```bash
# 1. Backend servislerini derle
cd backend/auth-service    && mvn clean install -DskipTests
cd ../course-service       && mvn clean install -DskipTests
cd ../enrollment-service   && mvn clean install -DskipTests
cd ../grade-service        && mvn clean install -DskipTests
cd ../cafeteria-service    && mvn clean install -DskipTests
cd ../eureka-server        && mvn clean install -DskipTests
cd ../api-gateway          && mvn clean install -DskipTests

# 2. Tüm stack'i başlat
cd ..
docker-compose up --build
```

**Başlama sırası (otomatik, health check'ler bekler):**
```
Redis + Zipkin + Zookeeper → Kafka → PostgreSQL'ler → Elasticsearch → Logstash → Kibana
    → Eureka (8761) → Servisler → API Gateway (8080)
```

> **Not:** ELK bileşenleri bellek yoğundur. Docker Desktop'a en az **6 GB RAM** ayırmanız önerilir.

Yaklaşık 3–5 dakika sürer.

---

### Seçenek B — Hibrit (Altyapı Docker, Servisler Yerel)

```bash
# Sadece altyapıyı başlat (ELK dahil)
cd backend
docker-compose up zookeeper kafka kafka-ui redis zipkin \
    elasticsearch logstash kibana \
    auth-db course-db enrollment-db grade-db cafeteria-db eureka-server

# Her servisi ayrı terminalde başlat
cd auth-service    && mvn spring-boot:run
cd course-service  && mvn spring-boot:run
# ... diğerleri
```

---

### Frontend Başlatma

```bash
cd frontend
npm install
npm run dev
```

Uygulama `http://localhost:5173` adresinde açılır. `/api` istekleri otomatik olarak `http://localhost:8080`'e proxy'lenir.

---

### Doğrulama Kontrolleri

| Kontrol | URL |
|---------|-----|
| Eureka dashboard | http://localhost:8761 |
| Kafka UI | http://localhost:8090 |
| Zipkin UI (tracing) | http://localhost:9411 |
| Kibana (log görselleştirme) | http://localhost:5601 |
| Elasticsearch health | http://localhost:9200/_cluster/health |
| API Gateway health | http://localhost:8080/actuator/health |
| React frontend | http://localhost:5173 |

---

### Durdurma

```bash
docker-compose down          # Container'lar durur, veriler korunur
docker-compose down -v       # Container + tüm veritabanı verileri silinir
```

---

## Ortam Değişkenleri

| Değişken | Varsayılan | Servis | Açıklama |
|----------|-----------|--------|----------|
| `JWT_SECRET` | `school-management-secret-key-256-bits-long` | Gateway, Auth | JWT imzalama anahtarı |
| `JWT_EXPIRATION` | `86400000` | Auth | Token geçerlilik süresi (ms = 24 saat) |
| `SPRING_DATASOURCE_URL` | Servis bazlı | Tüm servisler | JDBC bağlantı URL'i |
| `SPRING_DATASOURCE_USERNAME` | `school_user` | Tüm servisler | DB kullanıcı adı |
| `SPRING_DATASOURCE_PASSWORD` | `school_pass` | Tüm servisler | DB şifresi |
| `SPRING_KAFKA_BOOTSTRAP_SERVERS` | `kafka:29092` | Course, Enrollment, Grade | Kafka broker adresi |
| `SPRING_DATA_REDIS_HOST` | `localhost` | Course, Cafeteria | Redis sunucu adresi |
| `SPRING_DATA_REDIS_PORT` | `6379` | Course, Cafeteria | Redis port |
| `MANAGEMENT_ZIPKIN_TRACING_ENDPOINT` | `http://zipkin:9411/api/v2/spans` | Tüm servisler | Zipkin span gönderim adresi |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | `http://eureka-server:8761/eureka/` | Tüm servisler | Eureka adresi |
| `LOGSTASH_HOST` | `localhost` | Tüm servisler | Logstash TCP sunucu adresi |
| `LOGSTASH_PORT` | `5000` | Tüm servisler | Logstash TCP port |

> **Güvenlik:** Üretimde `JWT_SECRET` mutlaka güçlü, rastgele bir 256-bit değerle değiştirilmelidir.

---

## API Referansı

Tüm istekler **API Gateway** (`http://localhost:8080`) üzerinden yapılır.  
`/api/auth/**` hariç tüm endpoint'ler `Authorization: Bearer <token>` header'ı gerektirir.

---

### Auth Service

#### Kayıt Ol
```
POST /api/auth/register
```
**Request Body:**
```json
{
  "email": "john@school.com",
  "password": "securePass123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT"
}
```
> `role` değerleri: `ADMIN` | `TEACHER` | `STUDENT`

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "userId": 1,
  "email": "john@school.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT"
}
```

#### Giriş Yap
```
POST /api/auth/login
```
**Request Body:**
```json
{
  "email": "john@school.com",
  "password": "securePass123"
}
```
**Response (200):** Auth kayıt yanıtıyla aynı yapı.

---

### Course Service

| Method | Endpoint | Açıklama | Cache |
|--------|----------|----------|-------|
| `POST` | `/api/courses` | Yeni ders oluştur | Cache temizler |
| `GET` | `/api/courses/{id}` | Ders detayı | ✓ 5 dk |
| `GET` | `/api/courses` | Tüm dersler (sayfalama) | — |
| `GET` | `/api/courses/available` | Boş kontenjanı olan dersler | — |
| `GET` | `/api/courses/teacher/{teacherId}` | Öğretmene ait dersler | ✓ 5 dk |
| `PUT` | `/api/courses/{id}` | Ders güncelle | Cache temizler |
| `DELETE` | `/api/courses/{id}/close` | Dersi kapat | Cache temizler |

**Ders Oluşturma Request:**
```json
{
  "code": "CS101",
  "name": "Programlamaya Giriş",
  "description": "Temel programlama kavramları",
  "teacherId": 5,
  "capacity": 30,
  "creditHours": 3
}
```

**CourseResponse:**
```json
{
  "id": 1,
  "code": "CS101",
  "name": "Programlamaya Giriş",
  "teacherId": 5,
  "capacity": 30,
  "enrolledCount": 12,
  "availableSeats": 18,
  "status": "ACTIVE",
  "creditHours": 3,
  "createdAt": "2026-04-18T10:30:00"
}
```

**Ders Durum (Status) Değerleri:**

| Status | Açıklama |
|--------|----------|
| `DRAFT` | Taslak, henüz aktif değil |
| `ACTIVE` | Kayıt açık |
| `FULL` | Kontenjan doldu |
| `CLOSED` | Kapatılmış |

---

### Enrollment Service

| Method | Endpoint | Açıklama | Response |
|--------|----------|----------|----------|
| `POST` | `/api/enrollments` | Derse kayıt ol (asenkron Saga) | `EnrollmentResponse` (202) |
| `GET` | `/api/enrollments/{id}` | Kayıt detayı | `EnrollmentResponse` |
| `GET` | `/api/enrollments/student/{studentId}` | Öğrencinin kayıtları | `List<EnrollmentResponse>` |
| `GET` | `/api/enrollments/course/{courseId}` | Dersteki kayıtlar | `List<EnrollmentResponse>` |
| `DELETE` | `/api/enrollments/{id}` | Kayıt iptal (kompansasyon) | `EnrollmentResponse` |

**Kayıt Request:**
```json
{
  "studentId": 12,
  "courseId": 3
}
```

**EnrollmentResponse:**
```json
{
  "id": 42,
  "studentId": 12,
  "courseId": 3,
  "status": "PENDING",
  "sagaId": "550e8400-e29b-41d4-a716-446655440000",
  "failureReason": null,
  "createdAt": "2026-04-18T14:00:00",
  "updatedAt": "2026-04-18T14:00:01"
}
```

**Enrollment Status Değerleri:**

| Status | Açıklama |
|--------|----------|
| `PENDING` | Kafka'da işleniyor |
| `CONFIRMED` | Onaylandı, kontenjan ayrıldı |
| `FAILED` | Kontenjan dolduğu için reddedildi |
| `CANCELLED` | Öğrenci tarafından iptal edildi |

---

### Grade Service

| Method | Endpoint | Açıklama | Response |
|--------|----------|----------|----------|
| `POST` | `/api/grades` | Not gir / güncelle (upsert) | `GradeResponse` |
| `GET` | `/api/grades/{id}` | Not detayı | `GradeResponse` |
| `GET` | `/api/grades/student/{studentId}` | Öğrencinin notları | `List<GradeResponse>` |
| `GET` | `/api/grades/course/{courseId}` | Dersteki notlar | `List<GradeResponse>` |

**Not Giriş Request:**
```json
{
  "studentId": 12,
  "courseId": 3,
  "teacherId": 5,
  "score": 87.50,
  "feedback": "Çok iyi bir çalışma, devam edin."
}
```

**GradeResponse:**
```json
{
  "id": 15,
  "studentId": 12,
  "courseId": 3,
  "teacherId": 5,
  "score": 87.50,
  "letterGrade": "BA",
  "feedback": "Çok iyi bir çalışma, devam edin.",
  "createdAt": "2026-04-18T15:00:00",
  "updatedAt": "2026-04-18T15:00:00"
}
```

**Harf Notu Skalası:**

| Puan Aralığı | Harf Notu |
|-------------|-----------|
| >= 90 | AA |
| >= 85 | BA |
| >= 80 | BB |
| >= 75 | CB |
| >= 70 | CC |
| >= 65 | DC |
| >= 60 | DD |
| >= 50 | FD |
| < 50 | FF |

---

### Cafeteria Service

| Method | Endpoint | Açıklama | Cache |
|--------|----------|----------|-------|
| `POST` | `/api/cafeteria/menu` | Menü öğesi ekle | Cache temizler |
| `GET` | `/api/cafeteria/menu/weekly?weekStart=YYYY-MM-DD` | Haftalık menü | ✓ 1 saat |
| `GET` | `/api/cafeteria/menu/daily?date=YYYY-MM-DD` | Günlük menü | ✓ 1 saat |
| `DELETE` | `/api/cafeteria/menu/{id}` | Menü öğesi sil | Cache temizler |

**Menü Ekle Request:**
```json
{
  "name": "Mercimek Çorbası",
  "description": "Geleneksel Türk mercimek çorbası",
  "menuDate": "2026-04-21",
  "mealType": "LUNCH",
  "vegetarian": true
}
```

> `mealType` değerleri: `BREAKFAST` | `LUNCH` | `DINNER` | `SNACK`

---

## Kimlik Doğrulama (JWT)

### Akış

```
İstemci              API Gateway              Auth Service
   │                      │                       │
   │─── POST /api/auth/login ──────────────────▶  │
   │                      │                       │ BCrypt doğrula
   │                      │◀── JWT Token ──────── │ Token üret
   │◀── JWT Token ─────── │                       │
   │                      │                       │
   │─── GET /api/courses ▶│                       │
   │   Authorization:      │                       │
   │   Bearer <token>      │                       │
   │                      │ JWT'yi lokal doğrula  │
   │                      │ (HTTP çağrısı yok)    │
   │                      │                       │
   │                      │── X-User-Id ─────────▶ Course Service
   │                      │── X-User-Role ────────▶ Course Service
   │◀── Yanıt ──────────  │◀───────────────────── │
```

### JWT Token Yapısı

**Payload:**
```json
{
  "sub": "1",
  "email": "john@school.com",
  "role": "STUDENT",
  "firstName": "John",
  "lastName": "Doe",
  "iat": 1713456789,
  "exp": 1713543189
}
```

- **Algoritma:** HS256
- **Süre:** 24 saat (86400000 ms)
- **Anahtar:** `JWT_SECRET` ortam değişkeni

### Roller

| Rol | Erişim |
|-----|--------|
| `ADMIN` | Tüm endpoint'ler |
| `TEACHER` | Kendi dersleri, not girişi |
| `STUDENT` | Ders listesi, kayıt, notlarını görme |

---

## Kafka Event Sistemi ve Dead Letter Queue

### Topic'ler

| Topic | Yayınlayan | Tüketen | Amaç |
|-------|-----------|---------|------|
| `enrollment-request-topic` | Enrollment Service | Course Service | Kontenjan rezervasyon/iptal |
| `enrollment-request-topic.DLT` | DLQ Recoverer | — | İşlenemeyen request mesajları |
| `enrollment-response-topic` | Course Service | Enrollment Service | Onay/red yanıtı |
| `enrollment-response-topic.DLT` | DLQ Recoverer | — | İşlenemeyen response mesajları |
| `course-created-topic` | Course Service | — | Yeni ders bildirimi |
| `grade-updated-topic` | Grade Service | — | Not güncelleme bildirimi |

### Dead Letter Queue (DLQ) Akışı

Bir Kafka consumer mesajı işleyemediğinde sonsuz döngüye girmek yerine DLQ mekanizması devreye girer:

```
Consumer mesajı alır
        │
        ▼
  İşleme başarısız
        │
   [retry 1/3] ── 2 saniye bekle ──▶ [retry 2/3] ── 2 saniye bekle ──▶ [retry 3/3]
        │                                                                     │
        │                                                              Tüm retry'lar tükendi
        │                                                                     │
        ▼                                                                     ▼
   Hata loglanır                                                  Mesaj .DLT topic'ine yazılır
                                                                  Orijinal mesaj ack edilir
```

**Konfigürasyon:**
- **Retry sayısı:** 3
- **Retry aralığı:** 2 saniye (`FixedBackOff`)
- **DLT topic adı:** Otomatik → `{originalTopic}.DLT`
- **Serializasyon:** Orijinal mesajla aynı format

DLT'deki mesajlar Kafka UI (`http://localhost:8090`) üzerinden incelenebilir ve manuel olarak yeniden işlenebilir.

### Event Şemaları

**EnrollmentRequestEvent:**
```json
{
  "sagaId": "550e8400-e29b-41d4-a716-446655440000",
  "courseId": 3,
  "studentId": 12,
  "action": "RESERVE"
}
```
> `action`: `RESERVE` (kayıt) | `RELEASE` (iptal/kompansasyon)

**EnrollmentResponseEvent:**
```json
{
  "sagaId": "550e8400-e29b-41d4-a716-446655440000",
  "courseId": 3,
  "studentId": 12,
  "approved": true,
  "reason": null
}
```

**CourseCreatedEvent:**
```json
{
  "courseId": 5,
  "courseCode": "CS101",
  "courseName": "Programlamaya Giriş",
  "teacherId": 8,
  "capacity": 30,
  "creditHours": 3,
  "occurredAt": "2026-04-18T10:30:00"
}
```

**GradeUpdatedEvent:**
```json
{
  "gradeId": 42,
  "studentId": 12,
  "courseId": 3,
  "score": 87.50,
  "letterGrade": "BA",
  "occurredAt": "2026-04-18T14:00:00"
}
```

### Kafka Konfigürasyonu

- **Consumer offset:** `earliest` — consumer yeniden başlarsa baştan okur
- **Acknowledge modu:** Manuel — başarılı işlemden sonra acknowledge edilir
- **Trusted packages:** `com.school.*` — JSON deserialization güvenliği
- **Partition sayısı:** 3 (tüm topic'ler)

---

## Enrollment Saga Akışı

Öğrenci kayıt işlemi **Choreography-based Saga** ile yönetilir.

### Başarılı Kayıt

```
Öğrenci          Enrollment Svc        Kafka           Course Svc
   │                   │                 │                  │
   │── POST /enroll ──▶│                 │                  │
   │                   │ 1. PENDING oluş │                  │
   │                   │ 2. sagaId üret  │                  │
   │                   │── RESERVE ─────▶│                  │
   │                   │                 │── request ──────▶│
   │                   │                 │    3. Kilitle    │
   │                   │                 │    4. Kontenjan? │
   │                   │                 │    5. +1 count   │
   │                   │                 │◀─ approved:true ─│
   │                   │◀── response ────│                  │
   │                   │ 6. CONFIRMED    │                  │
   │◀── 202 ACCEPTED ──│                 │                  │
```

### Başarısız Kayıt (Dolu Kontenjan)

```
Öğrenci          Enrollment Svc        Kafka           Course Svc
   │                   │                 │                  │
   │── POST /enroll ──▶│── RESERVE ─────▶│── request ──────▶│
   │                   │                 │   Kapasite dolu  │
   │                   │                 │◀─ approved:false ─│
   │                   │◀── response ────│                  │
   │                   │ FAILED + reason │                  │
   │◀── FAILED ────────│                 │                  │
```

### Kayıt İptali (Kompansasyon)

```
Öğrenci          Enrollment Svc        Kafka           Course Svc
   │                   │                 │                  │
   │── DELETE /id ─────│                 │                  │
   │                   │ CANCELLED       │                  │
   │                   │── RELEASE ─────▶│── request ──────▶│
   │                   │                 │   -1 count       │
   │                   │                 │   FULL→ACTIVE    │
   │◀── 200 OK ────────│                 │                  │
```

### Pessimistic Locking

Course Service, eş zamanlı kayıt isteklerinde **PESSIMISTIC_WRITE** kilidi kullanır:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT c FROM Course c WHERE c.id = :id")
Optional<Course> findByIdWithLock(@Param("id") Long id);
```

Bu sayede aynı anda gelen birden fazla istek kontenjan aşımına yol açamaz.

---

## Redis Önbellekleme

Sık sorgulanan ancak nadiren değişen verileri Redis'te önbellekleme, veritabanı yükünü azaltır.

### Önbelleklenen Veriler

| Servis | Cache Adı | Cache Key | TTL | Tetikleyen Method |
|--------|-----------|-----------|-----|-------------------|
| Course | `course` | `courseId` | 5 dk | `getCourseById(id)` |
| Course | `coursesByTeacher` | `teacherId` | 5 dk | `getCoursesByTeacher(teacherId)` |
| Cafeteria | `dailyMenu` | `date` | 1 saat | `getDailyMenu(date)` |
| Cafeteria | `weeklyMenu` | `weekStart` | 1 saat | `getWeeklyMenu(weekStart)` |

### Cache Geçersizleştirme (Eviction)

Veri değiştiğinde ilgili cache'ler otomatik temizlenir:

| Operasyon | Temizlenen Cache'ler |
|-----------|---------------------|
| `createCourse` | `course`, `coursesByTeacher` |
| `updateCourse` | `course`, `coursesByTeacher` |
| `closeCourse` | `course`, `coursesByTeacher` |
| `addMenuItem` | `dailyMenu`, `weeklyMenu` |
| `deleteMenuItem` | `dailyMenu`, `weeklyMenu` |

### Teknik Detaylar

- **Serializer:** `GenericJackson2JsonRedisSerializer` — JSON olarak saklanır
- **`LocalDate` desteği:** `JavaTimeModule` ile tarih nesneleri doğru serileştirilir
- **Varsayılan TTL:** 5 dakika (course), 1 saat (cafeteria)
- **Önbellek stratejisi:** Cache-aside (uygulama katmanında yönetilir)

---

## Distributed Tracing (Zipkin)

Tüm servisler **Micrometer Tracing** + **Zipkin** entegrasyonu ile her HTTP isteğinin sistemdeki yolculuğunu görselleştirir.

### Ne Sağlar

- Bir isteğin hangi servislerden geçtiğini ve her serviste ne kadar süre harcandığını gösterir
- Mikroservis ortamında hata ayıklamayı kolaylaştırır: hata hangi serviste oluştu?
- Kafka mesajlarının trace'i de otomatik olarak propagate edilir

### Zipkin UI

**`http://localhost:9411`** adresinde erişilebilir.

```
Örnek Trace: POST /api/enrollments
│
├── api-gateway          [12ms]  JWT doğrulama + yönlendirme
├── enrollment-service   [45ms]  PENDING kayıt oluşturma
│   └── kafka producer   [8ms]   enrollment-request-topic'e yayın
├── course-service       [38ms]  Kontenjan kontrolü + rezervasyon
│   └── kafka producer   [6ms]   enrollment-response-topic'e yayın
└── enrollment-service   [15ms]  CONFIRMED durumuna geçiş
```

### Konfigürasyon

```yaml
management:
  tracing:
    sampling:
      probability: 1.0   # Tüm istekler trace edilir (üretimde 0.1 önerilir)
  zipkin:
    tracing:
      endpoint: http://zipkin:9411/api/v2/spans
```

> **Üretim notu:** `sampling.probability: 1.0` tüm trafiği trace eder. Yüksek trafikli ortamlarda `0.1` (% 10 örnekleme) kullanılması önerilir.

---

## Merkezi Log Yönetimi (ELK Stack)

Tüm backend servisleri **Elasticsearch + Logstash + Kibana** entegrasyonu ile yapılandırılmış JSON formatında merkezi log yönetimine sahiptir.

### Mimari

```
Her Spring Boot Servisi
        │
        │  logstash-logback-encoder (JSON)
        │  TCP bağlantısı (:5000)
        ▼
   LOGSTASH (:5000)
        │  pipeline filtreler + zenginleştirir
        ▼
ELASTICSEARCH (:9200)
   index: school-logs-{service}-{tarih}
        │
        ▼
   KIBANA (:5601)
   Log arama, görselleştirme, dashboard
```

### Bileşenler

| Bileşen | Port | Amaç |
|---------|------|------|
| Elasticsearch | 9200 | Log verilerini saklar ve indeksler |
| Logstash | 5000 (TCP) | Servislerden logları alır, işler, ES'e gönderir |
| Kibana | 5601 | Log arama, filtreleme ve görselleştirme UI |

### Log Formatı

Her log kaydı aşağıdaki JSON alanlarını içerir:

```json
{
  "@timestamp": "2026-04-18T14:30:00.000Z",
  "level": "INFO",
  "logger_name": "com.school.enrollment.service.EnrollmentService",
  "message": "Enrollment created with sagaId: 550e8400-...",
  "service": "enrollment-service",
  "thread_name": "http-nio-8083-exec-1",
  "traceId": "abc123",
  "spanId": "def456"
}
```

> `traceId` ve `spanId` Micrometer Brave tarafından otomatik eklenir; Zipkin trace'leriyle çapraz sorgulama yapılabilir.

### Elasticsearch İndeks Yapısı

Her servis için ayrı günlük indeks oluşturulur:

```
school-logs-auth-service-2026.04.18
school-logs-course-service-2026.04.18
school-logs-enrollment-service-2026.04.18
school-logs-grade-service-2026.04.18
school-logs-cafeteria-service-2026.04.18
school-logs-api-gateway-2026.04.18
school-logs-eureka-server-2026.04.18
```

### Kibana'ya İlk Giriş

1. `http://localhost:5601` adresini açın
2. **Stack Management → Index Patterns** bölümüne gidin
3. `school-logs-*` pattern'i ile index pattern oluşturun, `@timestamp` alanını zaman alanı olarak seçin
4. **Discover** ekranında tüm servislerin loglarını arayabilirsiniz

**Örnek Kibana sorguları:**

```
# Belirli servise ait ERROR loglar
service: "enrollment-service" AND level: "ERROR"

# Belirli sagaId ile ilgili tüm loglar
message: "550e8400-e29b-41d4-a716-446655440000"

# Son 15 dakikadaki tüm WARN ve ERROR
level: ("WARN" OR "ERROR")
```

### Teknik Detaylar

- **Kütüphane:** `net.logstash.logback:logstash-logback-encoder:7.4`
- **Appender:** `LogstashTcpSocketAppender` — her servis Logstash'e TCP üzerinden JSON gönderir
- **Async buffer:** 512 mesajlık kuyruk; Logstash geçici olarak ulaşılamaz olsa servis engellenmez (`neverBlock: true`)
- **Yeniden bağlanma:** Bağlantı koptuğunda 10 saniyede bir yeniden dener
- **Keep-alive:** 5 dakikada bir bağlantı canlı tutulur
- **Logstash pipeline:** TCP girdi → tarih normalleştirme → Elasticsearch çıktı

### Konfigürasyon

Her servisin `application.yml` dosyasında:

```yaml
logstash:
  host: ${LOGSTASH_HOST:localhost}
  port: ${LOGSTASH_PORT:5000}
```

Her servisin `logback-spring.xml` dosyasında tanımlanan `ASYNC_LOGSTASH` appender bu property'leri okur.

### Ortam Değişkenleri

| Değişken | Varsayılan | Açıklama |
|----------|-----------|----------|
| `LOGSTASH_HOST` | `localhost` | Logstash sunucu adresi |
| `LOGSTASH_PORT` | `5000` | Logstash TCP dinleme portu |

---

## Frontend

### Teknoloji Yığını

| Paket | Versiyon | Amaç |
|-------|---------|-------|
| React | 18.2.0 | UI framework |
| React Router | 6.22.3 | Client-side routing |
| Axios | 1.6.7 | HTTP istekleri + JWT interceptor |
| Tailwind CSS | 3.4.1 | Utility-first styling |
| Lucide React | 0.344.0 | İkonlar |
| React Hot Toast | 2.4.1 | Bildirimler |
| Vite | 5.1.4 | Build tool + dev server |

### Sayfa Yapısı

```
frontend/src/
├── api/
│   └── axios.js          → JWT interceptor, 401 yönlendirme
├── context/
│   └── AuthContext.jsx   → Global auth state (user, login, logout)
├── components/
│   ├── Layout.jsx        → Sidebar + Outlet wrapper
│   ├── Sidebar.jsx       → Role bazlı dinamik navigasyon
│   └── ProtectedRoute.jsx → Auth guard
└── pages/
    ├── Login.jsx         → Split-screen login
    ├── Register.jsx      → Kayıt formu + şifre güç göstergesi
    ├── Dashboard.jsx     → Role bazlı dashboard (3 farklı görünüm)
    ├── Courses.jsx       → Ders listesi, arama, filtre, kayıt/kapat
    ├── Enrollments.jsx   → Kayıt tablosu + iptal (sadece STUDENT)
    ├── Grades.jsx        → Not görüntüleme (STUDENT) / not girişi (TEACHER)
    └── Cafeteria.jsx     → Haftalık takvim görünümü + menü yönetimi
```

### Role Bazlı Erişim

| Sayfa | STUDENT | TEACHER | ADMIN |
|-------|---------|---------|-------|
| Dashboard | Kendi kayıt ve notları | Kendi dersleri | Tüm dersler özet |
| Dersler | Görüntüle + kayıt ol | Görüntüle + ders oluştur | Tüm kontrol |
| Kayıtlarım | ✓ | — | — |
| Notlar | Kendi notlarını gör | Not gir/güncelle | Not gir/güncelle |
| Kafeterya | Menüyü gör | Menüyü gör | Menü ekle/sil |

### Frontend Çalıştırma

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # Üretim build'i
npm run preview  # Build önizleme
```

> Vite proxy konfigürasyonu: `/api/**` → `http://localhost:8080`

---

## Hata Yönetimi

Her servis `@RestControllerAdvice` ile global hata yönetimi uygular:

| Hata Tipi | HTTP Kodu | Servis |
|-----------|----------|--------|
| `DuplicateEmailException` | 409 Conflict | Auth |
| `InvalidCredentialsException` | 401 Unauthorized | Auth |
| `DuplicateCourseCodeException` | 409 Conflict | Course |
| `CourseNotFoundException` | 404 Not Found | Course |
| `CourseCapacityException` | 400 Bad Request | Course |
| `DuplicateEnrollmentException` | 409 Conflict | Enrollment |
| `EnrollmentNotFoundException` | 404 Not Found | Enrollment |
| `GradeNotFoundException` | 404 Not Found | Grade |
| `MenuItemNotFoundException` | 404 Not Found | Cafeteria |
| `@Valid` ihlalleri | 400 Bad Request | Tüm servisler |

**Hata Yanıt Yapısı:**
```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Bu e-posta adresi zaten kayıtlı",
  "timestamp": "2026-04-18T14:30:00"
}
```

---

## Proje Yapısı

```
school_management_system/
├── README.md
├── backend/
│   ├── docker-compose.yml
│   ├── logstash/
│   │   ├── config/logstash.yml
│   │   └── pipeline/logstash.conf
│   ├── eureka-server/
│   ├── api-gateway/
│   │   └── src/main/java/com/school/gateway/
│   │       └── filter/AuthenticationFilter.java
│   ├── auth-service/
│   │   └── src/main/java/com/school/auth/
│   │       ├── controller/AuthController.java
│   │       ├── service/AuthService.java
│   │       └── security/JwtService.java
│   ├── course-service/
│   │   └── src/main/java/com/school/course/
│   │       ├── config/{KafkaConsumerConfig,KafkaTopicConfig,RedisCacheConfig}.java
│   │       ├── service/{CourseService,CourseCapacityService}.java
│   │       └── kafka/{CourseEventProducer,EnrollmentRequestConsumer}.java
│   ├── enrollment-service/
│   │   └── src/main/java/com/school/enrollment/
│   │       ├── config/{KafkaConsumerConfig,KafkaTopicConfig}.java
│   │       ├── service/EnrollmentService.java
│   │       ├── saga/EnrollmentSaga.java
│   │       └── kafka/{EnrollmentEventProducer,EnrollmentResponseConsumer}.java
│   ├── grade-service/
│   │   └── src/main/java/com/school/grade/
│   │       ├── service/GradeService.java
│   │       └── kafka/GradeEventProducer.java
│   └── cafeteria-service/
│       └── src/main/java/com/school/cafeteria/
│           ├── config/RedisCacheConfig.java
│           └── service/CafeteriaService.java
└── frontend/
    ├── vite.config.js     (/api proxy → :8080)
    └── src/
        ├── api/axios.js
        ├── context/AuthContext.jsx
        ├── components/{Layout,Sidebar,ProtectedRoute}.jsx
        └── pages/{Login,Register,Dashboard,Courses,Enrollments,Grades,Cafeteria}.jsx
```
