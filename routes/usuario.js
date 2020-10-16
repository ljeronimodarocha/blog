const express = require('express')
const { model } = require('mongoose')
const router = express.Router()
const mongoose = require('mongoose')
const { route } = require('./admin')
require('../models/Usuario')
const Usuario = mongoose.model('usuarios')
const bcrypt = require('bcryptjs')
const passport = require('passport')
    
router.get("/registro", (req, res) => {
    res.render("../views/usuario/registro")
})

router.post("/registro", (req, res) => {
    var erros = []
    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({ texto: "Nome invalido" })
    }
    if (!req.body.email || typeof req.body.email == undefined || req.body.email == null) {
        erros.push({ texto: "E-mail invalido" })
    }
    if (!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null) {
        erros.push({ texto: "Senha invalido" })
    } if (req.body.senha.length < 4) {
        erros.push({ texto: "Senha muito curta" })
    }
    if (!req.body.senha2 || typeof req.body.senha2 == undefined || req.body.senha2 == null) {
        erros.push({ texto: "senha2 invalido" })
    }
    if (req.body.senha != req.body.senha2) {
        erros.push({ texto: "As senhas são diferentes, tente novamente!" })
    }
    if (erros.length > 0) {
        res.render('../views/usuario/registro', { erros: erros })
    } else {
        Usuario.findOne({ email: req.body.email }).lean().then((usuario) => {
            if (usuario) {
                req.flash("error_msg", "Já existe uma conta com esse e-mail")
                res.redirect("/usuarios/registro")
            } else {
                var salt = bcrypt.genSaltSync(10);
                var hash = bcrypt.hashSync(req.body.senha, salt);
                const novoUsuario = new Usuario({
                    nome: req.body.nome,
                    email: req.body.email,
                    senha: hash
                })
                novoUsuario.save().then(() => {
                    req.flash("success_msg", "Usuário salvo com sucesso")
                    res.redirect("/usuarios/registro")
                }).catch((err) => {
                    req.flash("error_msg", "Erro ao salvar o novo usuário")
                    res.redirect("/usuarios/registro")
                })
            }
        }).catch((err) => {
            req.flash("error_msg", "Erro ao cadastrar usuário!")
            res.redirect("/usuarios/registro")
        })
    }
})

router.get("/login", (req, res) => {
    res.render("../views/usuario/login")
})
router.post('/login', (req, res, next) => {
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/usuarios/login",
        failureFlash: true
    })(req, res, next)
})

router.get('/logout', (req, res) => {
    req.logout()
    req.flash("success_msg", "Deslogado com sucesso")
    res.redirect("/")
})
module.exports = router