# npm-relogin

Simple CLI tool to relogin as fast as possible.

Especially useful when you have few scopes in NPM.

## How it works

<img src="https://cloud.githubusercontent.com/assets/2225579/15159126/a4ccfaf8-16fb-11e6-8f74-b7e05b9ca58b.gif" alt="how-it-works" width="500" />

Tool won't store password. Even encrypted or whatever.

Instead of storing raw password tool will get auth token from NPM and store it to configuration file for futher usage.
And whenever you'll need to switch to authorized user you'll have to just run `npm-relogin` to get this auth token.

Simple.

## Installation

`npm -g i npm-relogin`

## Configuration

Just run `npm-relogin` several times and enter your credentials.
Entered data except passwords will be stored in configuration file: `~/.config/configstore/npm-relogin.json`.

## Usage

Just run `npm-relogin` again and select needed user.
And you relogged in.
