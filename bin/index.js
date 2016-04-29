#!/usr/bin/env node

const fs = require('fs');

const chalk = require('chalk');
const npmEmail = require('npm-email');
const ConfigStore = require('configstore');
const inquirer = require('inquirer');
const ncl = require('npm-cli-login/lib/login')

const pkg = require('../package.json');
const conf = new ConfigStore(pkg.name);

var tokens = Object.keys(conf.all).filter(k => k.startsWith('@'));

inquirer
    // Try to use existing token first
    .prompt([{
        type: 'list',
        name: 'user',
        message: 'Select user:',
        choices: tokens.concat([
            tokens.length && new inquirer.Separator(),
            { name: 'Sign in with the new one', value: null }
        ]).filter(Boolean)
    }])
    .then(res => {
        if (res.user !== null) {
            return conf.get(res.user);
        }

        // Try to log in with another token
        return npmLogin()
            // Store user and token for the futher usage
            .then(res => {
                conf.set(`@${res.user}`, res);
                return res;
            });
    })
    // Switch token
    .then(obj => {
        var cred = normalizeCredentials(obj);
        return new Promise((resolve, reject) => {
            ncl.readFile({configPath: cred.configPath}, function (err, contents) {
                if (err) return reject(new Error(err));

                newContents = ncl.generateFileContents({
                    scope: cred.scope,
                    registry: cred.registry,
                    quotes: cred.quotes
                }, contents, {token: obj.token});

                fs.writeFile(cred.configPath, newContents.concat('').join('\n'), (err, res) => {
                    if (err) return reject(err);
                    resolve(obj);
                });
            });
        });
    })
    .then(obj => {
        console.log('Relogged in as %s', chalk.bold(obj.user));
    })
    .catch(err => {
        console.error('Error:', chalk.red(err));
    });

function npmLogin() {
    var emailPromise;
    return inquirer
        .prompt([
            {type: 'input', name: 'user', message: 'Username:',
                validate: v => (emailPromise = getEmail(v)) && true},
            {type: 'password', name: 'pass', message: 'Password:'},
            {type: 'input', name: 'email', message: 'Email:',
                default: _ => emailPromise,
                filter: v => v.trim(),
                validate: v => /^\S+@\S+$/.test(v.trim())}
        ])
        .then(res =>
            loginAsync(res)
                .catch(() => npmLogin())
        );
}

function loginAsync(obj) {
    var cred = normalizeCredentials(obj);

    return new Promise(function(resolve, reject) {
        ncl.login(cred, function(err, data) {
            if (err) return reject(err);
            if (!data.ok) return reject(new Error('Not ok: ' + JSON.stringify(data)));

            delete obj.pass;
            delete obj.email;
            obj.token = data.token;
            resolve(obj);
        });
    });
}

/**
 * Process arguments!
 * @param {Object} cred - NPM credentials
 * @returns {Object} - Normalized NPM credentials
 */
function normalizeCredentials(cred) {
    return ncl.processArguments(cred.user, cred.pass, cred.email,
        cred.registry, cred.scope, cred.quotes, cred.configPath);
}

function getEmail(login) {
    return new Promise((resolve, reject) => {
        npmEmail(login, (err, email) => {
            if (err) return reject(err);
            resolve(email);
        });
    });
}
