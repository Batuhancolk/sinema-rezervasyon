const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const app = express();
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
require('dotenv').config();


//Veritabanı bağlantısı
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
db.connect((err) => {
    if (err) {
        console.log("Veritabanı Bağlantı Hatası!", err);
        return;
    }
    console.log("✅ Veritabanı Bağlantısı Başarılı");

});

//Post işlemleri için body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Kullanıcı yönetimi için session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.use(cookieParser());

//EJS için
app.set("view engine", "ejs");
app.get("views");


//-------------------------------------------------------- MAIL AYARLARI --------------------------------------------------------

const emailSettings = {
    email: {
        username: process.env.EMAIL_USERNAME,
        password: process.env.EMAIL_PASSWORD
    }
}

var transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    secureConnection: false,
    port: parseInt(process.env.SMTP_PORT),
    auth: {
        user: emailSettings.email.username,
        pass: emailSettings.email.password
    }
});

transporter.verify((err) => {
    if (err) {
        console.log("Email Gönderimi İçin Bağlantı Hatası!", err);
    } else {
        console.log("Email Gönderim Sistemi Başarılı Şekilde Çalışıyor!");
    }
})



//Rotalar

//-------------------------------------------------------- USERS --------------------------------------------------------

app.get("/film-details/:filmid", async (req, res) => {
    const filmid = req.params.filmid;
    try {
        const [film,] = await db.promise().execute("SELECT * FROM films WHERE id=?", [filmid]);
        res.render("users/film-details", {
            film: film[0],
            user: req.session.user,
            admin: req.session.admin
        })

    } catch (error) {
        console.log(error);

    }
})

//Kayıt ol
app.get("/register", async (req, res) => {
    try {
        return res.render("users/register");

    } catch (error) {
        console.log(error);
    }
});

app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10); //Parola hashleme
    try {
        const [user,] = await db.promise().execute("SELECT * FROM users WHERE email=? AND username=?", [email, username]);
        if (user.length > 0) {
            console.log("Kullanıcı adı veya Email ile daha önceden Kayıt olunmuş!");
            return res.redirect("login");
        }
        await db.promise().execute("INSERT INTO users(username,password,email) VALUES (?,?,?)", [username, hashedPassword, email]);

        console.log("Kayıt başarılı! Giriş Yapabilirsiniz!");
        return res.redirect("login");



    } catch (error) {
        console.log(error);
    }
})

//Giriş Yap
app.get("/login", async (req, res) => {
    try {
        return res.render("users/login");
    } catch (error) {
        console.log(error);
    }

});
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const [user,] = await db.promise().execute("SELECT * FROM  users WHERE email=?", [email]);
        if (!user[0]) {
            console.log("Kullanıcı bulunamadı!")
            return res.render("users/login");
        };
        //Kullanıcı bulunursa parola kontrolü
        const match = await bcrypt.compare(password, user[0].password);
        if (match) {
            req.session.user = user[0];
            console.log("Şifre doğru , giriş yapıldı!");
            return res.redirect("/");
        }
        console.log("Şifre Hatalı!")
        return res.redirect("login");

    } catch (error) {
        console.log(error);
    }
})

//Çıkış Yap
app.get("/logout", async (req, res) => {
    try {
        await req.session.destroy();
        return res.redirect("/");

    } catch (error) {
        console.log(error);
    }
})

//Seanslar
app.get("/seanslar/:filmid", async (req, res) => {
    const filmid = req.params.filmid;
    try {
        const [filmResult] = await db.promise().execute("SELECT title FROM films WHERE id=?", [filmid]);
        filmName = filmResult[0].title;
        console.log("Seçilen Filmin adı: " + filmName);
        const [filmsSession] = await db.promise().execute("SELECT * FROM sessions WHERE film_id=?", [filmid]);
        res.render("users/sessions", {
            filmsSession: filmsSession,
            filmName: filmName,
            filmid: filmid
        });


    } catch (error) {
        console.log(error)
    }
    //Bölümün açıklaması: Bilet bilgilerinde seans bilgilerini gösterebilmek için filmResult ile bir sorgu oluşturup veritabanından bilgiyi alıyoruz ve gönderiyoruz.
})

//KoltukSeçim
app.get("/koltuk-secim/:sessionid/:filmid", async (req, res) => {
    const sessionid = req.params.sessionid;
    const filmid = req.params.filmid;
    try {
        const [filmResult] = await db.promise().execute("SELECT title FROM films WHERE id=?", [filmid]);
        filmName = filmResult[0].title;
        console.log("Koltuk Seçiminde ki Filmin adı: " + filmName);


        const [sessionName] = await db.promise().execute("SELECT session_time FROM sessions WHERE id=?", [sessionid]);
        sessionInfo = sessionName[0].session_time;
        console.log(sessionInfo);
        const [seats] = await db.promise().execute("SELECT * FROM seats WHERE session_id=?", [sessionid]);
        res.render("users/seats", {
            seats: seats,
            sessionid: sessionid,
            sessionInfo: sessionInfo,
            filmName: filmName,
            user: req.session.user,
            admin: req.session.admin
        })

    } catch (error) {
        console.log(error);

    }
    //Bölümün açıklaması: Bilet bilgilerinde seans bilgilerini gösterebilmek için sessionName ile bir sorgu oluşturup veritabanından bilgiyi alıyoruz ve gönderiyoruz


})

//Rezervasyon Tamamlama
app.post("/rezervasyon-tamamla", async (req, res) => {
    const sessionid = req.body.sessionid;
    const filmName = req.body.filmName;
    const sessionInfo = req.body.sessionInfo;
    console.log("session id: " + sessionid);
    if (!req.session.user) {
        console.log("Giriş Yapılması Gerekiyor!");
        return res.redirect("/login");
    }
    const userId = req.session.user.id;
    console.log("user id : " + userId);
    console.log(req.body.seats);
    const selectedSeats = Array.isArray(req.body.seats) ? req.body.seats : [req.body.seats]; // Tek seçimde diziye çevir
    if (!selectedSeats || selectedSeats.length === 0) {
        return res.send("Lütfen en az bir koltuk seçiniz!");
    }
    try {
        for (const seatId of selectedSeats) {
            await db.promise().execute("UPDATE seats SET is_reserved=? WHERE id=?", [1, seatId]);
            await db.promise().execute("INSERT INTO reservations (user_id,session_id,seat_id) VALUES (?,?,?)", [userId, sessionid, seatId]);


        }
        //Mail Gönderim
        transporter.sendMail({
            from: emailSettings.email.username,
            to: req.session.user.email,
            subject: "Rezervasyon Bilgileri",
            html: `
                        <p>${req.session.user.username} Hoşgeldiniz!</p>
                        </br>
                        <h3>Rezervasyon Bilgileriniz</h3>
                        </br>
                        <p>Film Adı: ${filmName} </br>
                        Saat: ${sessionInfo} </br>
                        Rezervasyon Yapılan Koltuk/Koltuklar: ${selectedSeats}
                        </p>
                        İyi Eğlenceler ${req.session.user.username}
                        `
        });
        console.log("Rezervasyon Kaydı Tamamlandı");
        res.render("users/rezervasyon-tamamla", {
            user: req.session.user.username,
            userEmail: req.session.user.email,
            seats: selectedSeats,
            filmName: filmName,
            sessionInfo: sessionInfo
        });

    } catch (error) {
        console.log(error);
    }

});

// 

//-------------------------------------------------------- ADMİN --------------------------------------------------------

//Admin giriş
app.get("/admin-login", (req, res) => {

    try {
        return res.render("admin/admin-login");

    } catch (error) {
        console.log(error);
    }

});
app.post("/admin-login", async (req, res) => {
    const { adminemail, adminpassword } = req.body;
    try {
        const [admin,] = await db.promise().execute("SELECT * FROM users where email=?", [adminemail]);
        if (!admin[0]) {
            console.log("Admin Bulunamadı!");
            return res.render("admin/admin-login");

        }
        //Parola Kontrolü
        const adminMatch = await bcrypt.compare(adminpassword, admin[0].password);
        if (adminMatch) {
            req.session.admin = admin[0];
            console.log("Admin Şifresi Doğru Giriş yapıldı!");
            return res.redirect("/");
        }
        console.log("Şifre Hatalı");
        return res.redirect("admin-login");


    } catch (error) {
        console.log(error);

    }
});

//Admin Kontrol Bölümü
app.get("/adminControlPage", async (req, res) => {
    if (!req.session.admin) {
        console.log("Admin Girişi Yapılması Gerekiyor!");
        return res.redirect("/admin-login");
    }
    res.render("admin/admin-control");

})


//Film listesi-Film Ekleme-Film Kaldırma
app.get("/adminFilmsList", async (req, res) => {
    if (!req.session.admin) {
        console.log("Admin Girişi Yapılması Gerekiyor!");
        return res.redirect("/admin-login");
    }
    try {
        const [session] = await db.promise().execute("SELECT * FROM  sessions");
        const [films] = await db.promise().execute("SELECT * FROM films");
        return res.render("admin/film-list", {
            films: films,
            session: session,
            action: req.query.action
        });

    } catch (error) {

    }
});

app.get("/addFilm", async (req, res) => {
    if (!req.session.admin) {
        console.log("Admin Girişi Yapılması Gerekiyor!");
        return res.redirect("/admin-login");
    }
    try {
        const sessionTimes = ["11:00", "14:00", "18:00", "20:00", "21:00"]
        let seats = [];
        for (let i = 1; i <= 40; i++) {
            seats.push(i);
        } //1den40a kadar koltuk üretir

        return res.render("admin/film-add", {
            sessionTimes: sessionTimes,
            seats: seats
        });

    } catch (error) {
        console.log(error)
    }
});
app.post("/addFilm", async (req, res) => {
    if (!req.session.admin) {
        console.log("Admin Girişi Yapılması Gerekiyor!");
        return res.redirect("/admin-login");
    }
    const { filmtitle, filmdescription, poster } = req.body;

    try {
        const [resultFilm] = await db.promise().execute("INSERT INTO films(title,description,poster_url) VALUES(?,?,?)", [filmtitle, filmdescription, poster]);
        const filmid = resultFilm.insertId;
        //Her Film eklendiğinde belirli seanslarda ekleniyor
        const sessionTimes = req.body.sessiontime;
        const seatNumber = req.body.seatno;
        for (const time of sessionTimes) { // await işlemler de foreach yerine 
            const [resultSession] = await db.promise().execute("INSERT INTO sessions(film_id,session_time) VALUES(?,?)", [filmid, time])

            const sessionid = resultSession.insertId;

            for (const seat of seatNumber) {
                await db.promise().execute("INSERT INTO seats(session_id,seat_number) VALUES(?,?)", [sessionid, seat]);

            }


        }


        //Her film eklendiğinde Koltuk ekleme işlemi


        res.redirect("/adminFilmsList?action=add");
        //?action=add kullanmanın amacı film ekledikten sonra başarı mesajı göndermek için


    } catch (error) {
        console.log(error);

    }
})


app.get("/deleteFilm/:filmid", async (req, res) => {
    if (!req.session.admin) {
        console.log("Admin Girişi Yapılması Gerekiyor!");
        return res.redirect("/admin-login");
    };
    const filmid = req.params.filmid;

    try {
        const [film] = await db.promise().execute("SELECT * FROM films WHERE id=?", [filmid]);
        res.render("admin/film-delete", {
            film: film[0]
        })
    } catch (error) {
        console.log(error);
    }

})
app.post("/deleteFilm/:filmid", async (req, res) => {
    if (!req.session.admin) {
        console.log("Admin Girişi Yapılması Gerekiyor!");
        return res.redirect("/admin-login");
    }
    const filmid = req.params.filmid;
    try {
        await db.execute("DELETE FROM films WHERE id=?", [filmid]);
        res.redirect("/adminFilmsList?action=delete");

    } catch (error) {
        console.log(error);
    }

});


//Seanslar Listesi-Seans Ekle-Seans Kaldırma
app.get("/addSession/:filmid", async (req, res) => {
    if (!req.session.admin) {
        console.log("Admin Girişi Yapılması Gerekiyor!");
        return res.redirect("/admin-login");
    }
    const filmdid = req.params.filmid;
    try {
        const [session] = await db.promise().execute("SELECT * FROM sessions WHERE film_id=?", [filmdid]);
        return res.render("admin/session-add", {
            session: session[0].film_id,
            sessions: session

        });

    } catch (error) {
        console.log(error);
    }
});

app.post("/addSession/:filmid", async (req, res) => {
    if (!req.session.admin) {
        console.log("Admin Girişi Yapılması Gerekiyor!");
        return res.redirect("/admin-login");
    }
    const session = req.body.session;
    const filmid = req.params.filmid;
    try {
        await db.promise().execute("INSERT INTO sessions(film_id,session_time) VALUES(?,?)", [filmid, session]);
        res.redirect(`/addSession/${filmid}`);

    } catch (error) {
        console.log(error);

    }
})

app.get("/deleteSession/:sessionid", async (req, res) => {
    if (!req.session.admin) {
        console.log("Admin Girişi Yapılması Gerekiyor!");
        return res.redirect("/admin-login");
    };
    const sessionid = req.params.sessionid;
    try {
        const [session] = await db.promise().execute("SELECT * FROM sessions WHERE id=?", [sessionid]);
        console.log("silinecek seans bilgisi: " + session);
        res.render("admin/session-delete", {
            session: session[0],
        });

    } catch (error) {
        console.log(error);
    }

});
app.post("/deleteSession/:sessionid", async (req, res) => {
    if (!req.session.admin) {
        console.log("Admin Girişi Yapılması Gerekiyor!");
        return res.redirect("/admin-login");
    };
    const sessionid = req.params.sessionid;
    try {
        await db.execute("DELETE FROM sessions WHERE id=?", [sessionid]);
        res.redirect("/adminFilmsList?action=delete");

    } catch (error) {
        console.log(error);
    }

});

//Koltuklar Bölümü-Koltuk Ekleme-Koltuk Sil-Koltuk Boşalt
app.get("/seatsControl/:sessionid", async (req, res) => {
    if (!req.session.admin) {
        console.log("Admin Girişi Yapılması Gerekiyor!");
        return res.redirect("/admin-login");
    }
    const sessionid = req.params.sessionid;
    try {
        const [seats] = await db.promise().execute("SELECT * FROM seats WHERE session_id=?", [sessionid]);
        return res.render("admin/seats", {
            seats: seats,
            sessionid: sessionid
        });

    } catch (error) {
        console.log(error);
    }

});

app.get("/addSeats/:sessionid", async (req, res) => {
    if (!req.session.admin) {
        console.log("Admin Girişi Yapılması Gerekiyor!");
        return res.redirect("/admin-login");
    }
    const sessionid = req.params.sessionid;
    try {
        const [seats] = await db.promise().execute("SELECT * FROM seats WHERE session_id=?", [sessionid]);

        return res.render("admin/seats-add", {
            sessionid: sessionid,
            seats: seats
        });

    } catch (error) {
        console.log(error);
    }

})
app.post("/addSeats/:sessionid", async (req, res) => {
    if (!req.session.admin) {
        console.log("Admin Girişi Yapılması Gerekiyor!");
        return res.redirect("/admin-login");
    }
    const sessionid = req.params.sessionid;
    const seatno = req.body.seatno;
    try {
        await db.promise().execute("INSERT INTO seats (session_id,seat_number) VALUES(?,?)", [sessionid, seatno]);
        res.redirect("/adminFilmsList?action=add");

    } catch (error) {
        console.log(error);
    }

})

app.get("/deleteSeat/:seatid", async (req, res) => {
    if (!req.session.admin) {
        console.log("Admin Girişi Yapılması Gerekiyor!");
        return res.redirect("/admin-login");
    };
    const seatid = req.params.seatid;
    try {
        const [seat] = await db.promise().execute("SELECT * FROM seats WHERE seat_number=?", [seatid]);
        res.render("admin/session-delete");

    } catch (error) {
        console.log(error);
    }

});
app.post("/deleteSeat/:seatid", async (req, res) => {
    if (!req.session.admin) {
        console.log("Admin Girişi Yapılması Gerekiyor!");
        return res.redirect("/admin-login");
    };
    const seatid = req.params.seatid;
    try {
        await db.execute("DELETE FROM seats WHERE seat_number=?", [seatid]);
        res.redirect("/adminFilmsList?action=delete");

    } catch (error) {
        console.log(error);
    }

});

app.post("/emptySeat/:seatid", async (req, res) => {
    if (!req.session.admin) {
        console.log("Admin Girişi Yapılması Gerekiyor!");
        return res.redirect("/admin-login");
    };
    const seatid = req.params.seatid;
    try {
        await db.promise().execute("UPDATE seats SET is_reserved=0 WHERE seat_number=?", [seatid]);
        res.redirect("/adminFilmsList?action=update");

    } catch (error) {
        console.log(error);
    }

})

//Rezervasyonlar Listesi
app.get("/adminReservations", async (req, res) => {
    if (!req.session.admin) {
        console.log("Admin Girişi Yapılması Gerekiyor!");
        return res.redirect("/admin-login");
    }
    try {
        const [reservations] = await db.promise().execute("SELECT * FROM reservations")
        return res.render("admin/reservations-list", {
            reservations: reservations
        })

    } catch (error) {
        console.log(error);
    }
});



//Ana Sayfa
app.get("/", async (req, res) => {
    try {
        const [films,] = await db.promise().execute("SELECT * FROM films");
        res.render("users/index", {
            films: films,
            user: req.session.user,
            admin: req.session.admin
        });
    } catch (error) {
        console.log(error);
    }
});



//-------------------------------------------------------- SERVER --------------------------------------------------------
app.listen(3000, () => {
    console.log("✅ Sunucu 3000 Portunda Çalışıyor");
})
