const express = require('express')
const handlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const app = express()
const mongoose = require('mongoose')
const admin = require('./routes/admin')
const usuario = require('./routes/usuario')
const session = require('express-session')
const flash = require('connect-flash')
require('./models/Postagem')
require('./models/Categoria')
require('./models/Usuario')
const Postagem = mongoose.model("postagens")
const Categoria = mongoose.model("categorias")
const Usuario = mongoose.model('usuarios')
const passport = require('passport')
require('./config/auth')(passport)
const bcrypt = require('bcryptjs')
const eAdmin = require('./helpers/eAdmin')
const adminHelper = require('./helpers/admin_helper')
const helpers = require('handlebars-helpers')



//teste.enviarEmail(mailOptions2)

//Sessão
app.use(session({
    secret: "cursodenode",
    resave: true,
    saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
//midleware
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg")
    res.locals.error_msg = req.flash("error_msg")
    res.locals.error = req.flash("error")
    res.locals.user = req.user || null
    next()
})


//bodyParse
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())



//handlebars
// var hbs = handlebars.create({
//     defaultLayout: 'main',
//     helpers: {
//         teste: function (user) {
//             if (user) {
//                 return true;
//             } else {
//                 return false;
//             }
//         }
//     }
// });

app.engine('handlebars', handlebars.create({
    defaultLayout: 'main', helpers: {
        adminHelper: adminHelper
    }
}).engine);
// e o engine aqui /\
app.set('view engine', 'handlebars');
//Mongoose
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost/blogapp", { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log("conectado ao MongoDB");
}).catch((err) => {
    console.log("Erro ao se conectar: " + err);
})
//rotas principais
app.get('/', (req, res) => {
    Postagem.find().lean().populate("categoria").sort({ data: "desc" }).then((postagens) => {
        res.render("../views/index", { postagens })
    }).catch((err) => {
        req.flash("error_msg", "Erro ao carregar!")
        res.redirect("/404")
    })
})
app.get("/404", (req, rest) => {
    res.send("Erro 404!")
})
app.get("/postagem/:slug", (req, res) => {
    Postagem.findOne({ slug: req.params.slug }).lean().then((postagem) => {
        if (postagem) {
            res.render("../views/postagem/index", { postagem })
        } else {
            req.flash("error_msg", "Está postagem não foi encontrada")
            res.redirect("/")
        }
    }).catch((err) => {
        req.flash("error_msg", "Erro ao buscar postagem")
        res.redirect("/")
    })
})
app.get("/categorias", (req, res) => {
    Categoria.find().lean().then((categorias) => {
        res.render("../views/categoria/index", { categorias })
    }).catch((err) => {
        req.flash("error_msg", "Erro ao buscar as categorias")
        res.redirect("/")
    })
})
//teste
app.get("/categorias/:slug", (req, res) => {
    Categoria.findOne({ slug: req.params.slug }).lean().then((categoria) => {
        if (categoria) {
            Postagem.find({ categoria: categoria._id }).lean().sort({ data: "desc" }).then((postagens) => {
                res.render("../views/categoria/postagens", { postagens, categoria })
            }).catch((err) => {
                req.flash("error_msg", "Erro ao listas os posts")
                res.redirect("/")
            })
        } else {
            req.flash("error_msg", "Essa categoria não existe")
            res.redirect("/")
        }
    }).catch((err) => {
        req.flash("error_msg", "Erro ao carregar a categoria")
        res.redirect("/")
    })
})

//rotas
app.use('/admin', admin)
app.use('/usuarios', usuario)


//cria usuário admin
Usuario.findOne({ email: "admin@admin" }).lean().then((usuario) => {
    if (!usuario) {
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync("admin", salt);
        const novoUsuario = new Usuario({
            nome: "admin",
            email: "admin@admin",
            senha: hash,
            eAdmin: 1
        })
        novoUsuario.save().then(() => {

        }).catch((err) => {
            console.log("Erro: " + err);
        })
    }
})



//inicia o servidor
const PORT = 8080
app.listen(PORT, () => {
    console.log("Servidor rodando na porta: " + PORT);
})

