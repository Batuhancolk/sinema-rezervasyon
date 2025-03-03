# Sinema Rezervasyon Sistemi
https://www.youtube.com/@batuhancolk adresinden projenin çalışır halini izleyebilirsiniz.

Bu proje, kullanıcıların film rezervasyonu yapabilmesini sağlayan bir sinema yönetim sistemi oluşturur. Sistem, kullanıcıların filme ait seansları görüntülemesi, koltuk seçimi yapması ve rezervasyonlarını tamamlamasına olanak tanır. 
Ayrıca, admin paneli üzerinden film ekleme, silme ve düzenleme.Seans ekleme,silme.Seans bilgilerine göre koltuk ekleme,silme gibi işlemleri yapılabilir.Rezervasyon bilgilerini görüntüleyebilir, dolu koltukları boşaltma gibi işlemleri 
yapmayı sağlar.

## Kullanılan Teknolojiler
- **Backend:** Node.js, Express.js
- **Veritabanı:** MySQL
- **Şablon Motoru:** EJS
- **Kimlik Doğrulama:** Express-session, bcrypt
- **Mail Gönderimi:** Nodemailer
- **Çevresel Değişkenler:** dotenv

## Açıklama
**Kullanıcılar**
Kayıt Olma: Kullanıcılar sisteme kaydolabilir.
Giriş Yapma: Mevcut kullanıcılar giriş yapabilir.
Film Detayları Görüntüleme: Kullanıcılar filmlerin detaylarına erişebilir.
Seanslar ve Koltuk Seçimi: Kullanıcılar filmler için seansları ve koltukları seçebilir.
Rezervasyon Yapma: Seçilen koltuklarla rezervasyon yapılabilir.
Mail Gönderimi: Rezervasyon tamamlandığında, kullanıcılara e-posta gönderilir.
**Admin**
Admin Girişi: Admin kullanıcıları giriş yapabilir.
Film Ekleme ve Silme: Adminler yeni filmler ekleyebilir veya mevcut filmleri silebilir.
Seans ve Koltuk Ekleme: Adminler her film için seans ve koltuk bilgilerini yönetebilir.

## Proje Kurulumu

1. **Depoyu Klonlayın:**
   ```bash
   git clone https://github.com/Batuhancolk/sinema-rezervasyon.git

2. **Gerekli Bağımlılıkları Yükleyin**
   ```bash
   npm install

3. **Çevresel Değişkenleri Ayarlayın**
   ```bash
   	DB_HOST=localhost
	DB_USER=root
	DB_PASSWORD=your_password
	DB_NAME=cinema_db
	SESSION_SECRET=your_session_secret
	EMAIL_USERNAME=your_email_username
	EMAIL_PASSWORD=your_email_password
	SMTP_HOST=smtp.mailtrap.io
	SMTP_PORT=587

4. **MySQL Veritabanı Yapısı**

# Sinema Veritabanı

## films Tablosu

| **Column**       | **Type**       | **Nullable** | **Default** | **Description**                      |
|------------------|----------------|--------------|-------------|--------------------------------------|
| id               | INT            | NO           | NULL        | Film ID (Primary Key)               |
| title            | VARCHAR(255)    | NO           | NULL        | Film başlığı                        |
| description      | TEXT           | NO           | NULL        | Film açıklaması                     |
| poster_url       | VARCHAR(255)    | YES          | NULL        | Film poster URL'si                  |

## reservations Tablosu

| **Column**       | **Type**       | **Nullable** | **Default** | **Description**                      |
|------------------|----------------|--------------|-------------|--------------------------------------|
| id               | INT            | NO           | NULL        | Rezervasyon ID (Primary Key)        |
| reserved_at      | TIMESTAMP      | YES          | CURRENT_TIMESTAMP | Rezervasyon tarihi                 |
| seat_id          | INT            | YES          | NULL        | Rezervasyon yapılan koltuk ID'si    |
| session_id       | INT            | YES          | NULL        | Seans ID'si (Film seansı)           |
| user_id          | INT            | YES          | NULL        | Rezervasyonu yapan kullanıcı ID'si |

## seats Tablosu

| **Column**       | **Type**       | **Nullable** | **Default** | **Description**                      |
|------------------|----------------|--------------|-------------|--------------------------------------|
| id               | INT            | NO           | NULL        | Koltuk ID (Primary Key)             |
| seat_number      | INT            | NO           | NULL        | Koltuk numarası                     |
| is_reserved      | TINYINT        | YES          | 0           | Koltuğun rezerve edilip edilmediği   |
| session_id       | INT            | YES          | NULL        | Seans ID'si                         |

## sessions Tablosu

| **Column**       | **Type**       | **Nullable** | **Default** | **Description**                      |
|------------------|----------------|--------------|-------------|--------------------------------------|
| id               | INT            | NO           | NULL        | Seans ID (Primary Key)              |
| session_time     | TIME           | NO           | NULL        | Seans saati                         |
| film_id          | INT            | YES          | NULL        | Film ID (Film ile ilişkilendirilmiş) |

## users Tablosu

| **Column**       | **Type**       | **Nullable** | **Default** | **Description**                      |
|------------------|----------------|--------------|-------------|--------------------------------------|
| id               | INT            | NO           | NULL        | Kullanıcı ID (Primary Key)           |
| username         | VARCHAR(50)    | NO           | NULL        | Kullanıcı adı                        |
| email            | VARCHAR(100)   | NO           | NULL        | Kullanıcı e-posta adresi             |
| password         | VARCHAR(255)   | NO           | NULL        | Kullanıcı şifresi                   |
| created_at       | TIMESTAMP      | YES          | CURRENT_TIMESTAMP | Kullanıcı oluşturulma tarihi       |

---

## Tablolar Arası İlişkiler

- **users → reservations**: Her kullanıcı, bir veya daha fazla rezervasyon yapabilir. `user_id` alanı, `reservations` tablosunda `users` tablosundaki `id` ile ilişkilidir.
- **films → sessions**: Her film, bir veya daha fazla seansla ilişkilidir. `film_id` alanı, `sessions` tablosunda `films` tablosundaki `id` ile ilişkilidir.
- **sessions → seats**: Her seans, bir veya daha fazla koltukla ilişkilidir. `session_id` alanı, `seats` tablosunda `sessions` tablosundaki `id` ile ilişkilidir.
- **reservations → seats**: Her rezervasyon bir koltuğu işaret eder. `seat_id` alanı, `reservations` tablosunda `seats` tablosundaki `id` ile ilişkilidir.

   
*******************************************************************************************************************************************************************************
Proje de hata yönetimi ve eksiklikleri mevcuttur,güncellemeler gelecektir.

Bu README dosyası, projenin kurulumunu, kullanımını ve kodun önemli kısımlarını ayrıntılı olarak açıklar. Umarım faydalı olur!
Hazırlayan: Batuhan Çolak
İletişim: batuhancolk@gmail.com || www.batuhancolk.com



