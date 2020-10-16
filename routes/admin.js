const express = require('express')
//const { models } = require('mongoose')
const router = express.Router()
const mongoose = require('mongoose')
const e = require('express')
require("../models/Categoria")
require("../models/Postagem")
require("../models/Usuario")
const Categoria = mongoose.model("categorias")
const Postagem = mongoose.model("postagens")
const Usuario = mongoose.model("usuarios")
const { eAdmin } = require('../helpers/eAdmin')
const { route } = require('./usuario')
const email = require('../sendEmail/send')
const bcrypt = require('bcryptjs')

router.get('/', eAdmin, (req, res) => {
    res.render('../views/admin/index')
})
router.get('/posts', eAdmin, (req, res) => {
    res.send("Pagina de posts")
})
router.get('/categorias', eAdmin, (req, res) => {
    Categoria.find().lean().sort({ date: 'desc' }).then((categorias) => {
        res.render('../views/admin/categorias', { categorias: categorias })
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao lista as categorias")
        res.redirect("/admin")
    })
})
router.get('/categorias/add', eAdmin, (req, res) => {
    res.render('../views/admin/addcategorias')
})
router.post('/categorias/nova', eAdmin, (req, res) => {
    var erros = []
    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({ texto: "Nome invalido" })
    }
    if (!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null) {
        erros.push({ texto: "Slug invalido" })
    }
    if (erros.length > 0) {
        res.render('../views/admin/addcategorias', { erros: erros })
    } else {
        const novaCategoria = {
            nome: req.body.nome,
            slug: req.body.slug
        }
        new Categoria(novaCategoria).save().then(() => {
            req.flash("success_msg", "Categoria criada com sucesso")
            res.redirect('/admin/categorias')
        }).catch((err) => {
            req.flash("error_msg", "Erro ao salvar categoria")
        })
    }

})
router.get('/categorias/edit/:id', eAdmin, (req, res) => {
    Categoria.findOne({ _id: req.params.id }).lean().then((categoria) => {
        res.render('../views/admin/editCategorias', { categoria: categoria })
    }).catch((err) => {
        req.flash("error_msg", "Está categoria não existe")
        res.redirect("/admin/categorias")
    })
})
router.post('/categorias/edit', eAdmin, (req, res) => {
    var erros = []
    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({ texto: "Nome invalido" })
    }
    if (!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null) {
        erros.push({ texto: "Slug invalido" })
    }
    if (erros.length > 0) {
        res.render('../views/admin/addcategorias', { erros: erros })
    } else {
        Categoria.findOne({ _id: req.body.id }).then((categoria) => {
            categoria.nome = req.body.nome
            categoria.slug = req.body.slug
            categoria.save().then(() => {
                req.flash("success_msg", "Categoria editada com sucesso")
                res.redirect("/admin/categorias")
            }).catch((err => {
                req.flash("error_msg", "Erro interno ao editar a categoria")
                res.redirect("/admin/categorias")
            }))
        }).catch((err) => {
            console.log(err);
            req.flash("error_msg", "Erro ao editar a categoria")
            res.redirect("/admin/categorias")
        })
    }
})
router.post('/categorias/deletar', eAdmin, (req, res) => {
    Categoria.deleteOne({ _id: req.body.id }).then(() => {
        req.flash("success_msg", "Categoria deletada com sucesso!")
        res.redirect('/admin/categorias')
    }).catch((err) => {
        req.flash("error_msg", "Erro ao deletar categoria: " + err)
        res.redirect('/admin/categorias')
    })
})
router.get('/postagens', eAdmin, (req, res) => {
    Postagem.find().lean().populate("categoria").sort({ data: "DESC" }).then((postagens) => {
        res.render('../views/admin/postagens', { postagens })
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao listar as postagem!")
        res.redirect('/admin')
    })
})
router.get('/postagens/add', eAdmin, (req, res) => {
    Categoria.find().lean().then((categorias) => {
        res.render('../views/admin/addpostagens', { categorias: categorias })
    }).catch((err) => {
        req.flash("error_msg", "Erro ao carregar as categorias")
        res.redirect('/admin')
    })
})
router.post('/postagens/nova', eAdmin, (req, res) => {
    var erros = []
    if (!req.body.titulo || typeof req.body.titulo == undefined || req.body.titulo == null) {
        erros.push({ texto: "Título inválido" })
    }
    if (!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null) {
        erros.push({ texto: "Slug inválido" })
    }
    if (!req.body.descricao || typeof req.body.descricao == undefined || req.body.descricao == null) {
        erros.push({ texto: "Descrição inválida" })
    }
    if (!req.body.conteudo || typeof req.body.conteudo == undefined || req.body.conteudo == null) {
        erros.push({ texto: "Conteúdo inválido" })
    }
    if (req.body.categoria == "0") {
        erros.push({ texto: "Categoria inválida, registre uma categoria" })
    }
    if (erros.length > 0) {
        Categoria.find().lean().then((categorias) => {
            res.render('../views/admin/addpostagens', { erros, categorias })
        }).catch((err) => {
            req.flash("error_msg", "Erro ao carregar as categorias")
            res.redirect("/admin/postagens/add")
        })
    } else {
        const novaPostagem = {
            titulo: req.body.titulo,
            slug: req.body.slug,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            categoria: req.body.categoria,
        }
        new Postagem(novaPostagem).save().then(() => {
            req.flash("success_msg", "Postagem criada com sucesso")
            res.redirect("/admin/postagens")
        }).catch((err) => {
            req.flash("error_msg", "Erro ao salvar a postagem")
            res.redirect("/admin/postagens")
        })
    }
})
router.get('/postagem/edit/:id', eAdmin, (req, res) => {
    Postagem.findOne({ _id: req.params.id }).lean().then((postagem) => {
        Categoria.find().lean().then((categorias) => {
            res.render("../views/admin/editpostagens", { categorias, postagem })
        }).catch((err) => {
            console.log(err);
            req.flash("error_msg", "Erro ao carregar o lista")
            res.redirect("/admin/postagens")
        })

    }).catch((err) => {
        req.flash("error_msg", "Erro ao carregar o formulário de edição.")
        res.redirect("/admin/postagens")
    })
})
router.post('/postagem/edit', eAdmin, (req, res) => {
    Postagem.findOne({ _id: req.body.id }).then((postagem) => {
        postagem.titulo = req.body.titulo,
            postagem.slug = req.body.slug,
            postagem.descricao = req.body.descricao,
            postagem.conteudo = req.body.conteudo,
            postagem.categoria = req.body.categoria

        postagem.save().then(() => {
            req.flash('success_msg', "Postagem editada com sucesso!")
            res.redirect("/admin/postagens")
        }).catch((err) => {
            req.flash('error_msg', 'Erro ao editar postagem')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Erro ao salvar a edição')
        res.redirect("/admin/postagens")
    })
})
router.get('/postagens/deletar/:id', eAdmin, (req, res) => {
    Postagem.remove({ _id: req.params.id }).then(() => {
        req.flash('success_msg', 'Postagem deletado com sucesso!')
        res.redirect("/admin/postagens")
    }).catch((err) => {
        req.flash('error_msg', 'Erro ao deletar Postagem!')
        res.redirect("/admin/postagens")
    })
})
router.get('/usuarios', eAdmin, (req, res) => {
    Usuario.find().lean().then((usuarios) => {
        res.render("../views/admin/permissao/usuarios", { usuarios })
    }).catch((err) => {
        req.flash('error_msg', 'Erro ao listar os usuários')
    })
})
router.get('/usuarios/edit/:id', eAdmin, (req, res) => {
    Usuario.findById({ _id: req.params.id }).lean().then((usuario) => {
        res.render('../views/admin/permissao/editusuarios', { usuario })
    }).catch((err) => {
        console.log(err);
        req.flash('error_msg', 'Usuário não encontrado')
        res.redirect('/admin/usuarios')
    })
})
router.post('/usuarios/edit', eAdmin, (req, res) => {
    Usuario.findById({ _id: req.body.id }).then((usuario) => {
        usuario.nome = req.body.nome,
            usuario.email = req.body.email
        usuario.save().then(() => {
            req.flash('success_msg', 'Usuario editado com sucesso')
            res.redirect('/admin/usuarios')
        }).catch((err) => {
            req.flash('error_msg', 'Erro ao editar usuário')
            res.redirect('/admin/usuarios')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Erro ao encontrar usuário')
        res.redirect('/admin/usuarios')
    })
})
router.get('/usuarios/admin/:id', eAdmin, (req, res) => {
    Usuario.findById({ _id: req.params.id }).then((usuario) => {
        if (usuario.eAdmin == 0) {
            usuario.eAdmin = 1
        } else {
            usuario.eAdmin = 0
        }
        usuario.save().then(() => {
            req.flash('success_msg', 'Usuario editado com sucesso')
            res.redirect('/admin/usuarios')
        }).catch((err) => {
            req.flash('error_msg', 'Erro ao editar usuário')
            res.redirect('/admin/usuarios')
        })
    }).catch((err) => {
        console.log(err);
        req.flash('error_msg', 'Erro ao encontrar usuário')
        res.redirect('/admin/usuarios')
    })
})
router.get('/usuarios/resetPass/:id', eAdmin, (req, res) => {
    var salt = bcrypt.genSaltSync(10);
    senhaRandom = Math.random().toString(36).slice(-10);
    var hash = bcrypt.hashSync(senhaRandom, salt);
    Usuario.findById({ _id: req.params.id }).then((usuario) => {
        usuario.senha = hash
        usuario.save().then(() => {
            req.flash('success_msg', 'Senha alterada com sucesso')
            email.enviarEmail({
                to: usuario.email,
                subject: 'Senha alterada com sucesso',
                text: `Sua senha foi alterada com sucesso. Use a senha a seguir: ${senhaRandom})`
            })
            res.redirect('/admin/usuarios')
        }).catch((err) => {
            req.flash('error_msg', 'Erro ao alterada senha')
            res.redirect('/admin/usuarios')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Erro ao encontrar usuário')
        res.redirect('/admin/usuarios')
    })
})

module.exports = router