const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const authConfig = require('../../config/auth');
const crypto = require('crypto');
const mailer = require('../../modules/mailer')

const router = express.Router();

function generateToken(params = {}){
    return jwt.sign(params, authConfig.secret, {
        expiresIn: 86400,
    });
}

router.post('/register',async (req,res)=>{
    const {email} = req.body;

    try{
        if( await User.findOne({email})){
            return res.status(400).send({error: 'Esse usuário já foi utilizado'});
        }
     
        var user = User.create(req.body);
        console.log(user);
        return res.send(user);
        
    }catch(err){
        return res.status(400).send({error: 'Erro ao registrar usuário'})
    }
});

router.post('/authenticate',async (req,res)=>{

    const {email,password} = req.body;
    const user = await User.findOne({email}).select('+password');

    if(!user){
        return res.status(400).send({error: 'User not found'});
    }

    if(!await bcrypt.compare(password, user.password)){
        return res.status(400).send({error: "Invalid password"});
    }
    else
    {
        res.send({
            user,
            token:generateToken({id: user.id}),
        });
    }
});

router.post('/forgot_password', async (req,res)=>{
    const {email} = req.body;

    try{
        const user = await User.findOne({email});

        if (!user){
            return res.status(400).send({error: 'User not found'});
        } 

        const token = crypto.randomBytes(2).toString('hex');

        console.log(token);

        const now = new Date();
        now.setHours(now.getHours() + 1);



        await User.findByIdAndUpdate(user.id, {
            '$set': {
                passwordResetToken: token,
                passwordResetExpires: now,
            }
        });

      
        mailer.sendMail({
            to: email,
            from: "tartarotti.felipe@SpeechGrammarList.com",
            template: "auth/forgot_password",
            partialsDir: 'some/path',
            context:{token},
        },(err) => {
            if(err)
            return res.status(400).send({error: 'Cannot send forgotten password'});
            return res.send();
        })


    }catch(err){
        console.log(err);
        res.status(400).send({error: 'Erro on forgot password, try again'});
    }
});

router.post('/reset_password', async (req,res)=>{
    const {email,token,password} = req.body;

    try{
        const user = await User.findOne({email}).select('+passwordResetToken passwordResetExpires');

        if (!user){
            return res.status(400).send({error: 'User not found'});
        } 

        if (token != user.passwordResetToken){
            return res.status(400).send({error: 'Token Invalid'});
        } 

        const now = new Date();

        if(now > user.passwordResetExpires){
            return res.status(400).send({error: 'Token expired, generate a new one'})
        }

        user.password = password;

        await user.save();

        res.send();

    }catch(err){
        console.log(err);
        res.status(400).send({error: 'Erro on reset password, try again'});
    }
});

module.exports = app => app.use('/auth',router);