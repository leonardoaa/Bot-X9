# Bot X9
Beta 0.0.1

Bot X9 é um bot cujo seu objetivo é administrar grupos no whatsapp, no entanto possui funcionalidades que funcionam no privado.

O bot é dividido em tarefas automáticas, privadas e disparadas.
#### Automáticas
* Dar boas vindas a um novo integrante do grupo
* Dar tchau a um integrante que sai do grupo
* Alertar caso algum integrante escreva um palavrão

#### Disparadas
As ações que podem ser desparadas pode ser encontradas utilizando o comando "!menu"
* "!A" Marca todos os administradores
* "!L" Mostra o link de convite para o grupo

#### Privadas
As ações privadas são utilizadas diretamente no chat privado do bot
* Enviar uma imagem para o bot irá está solicitando que ele transforme a mesma em figurinha
* Enviar um vídeo para o bot irá está solicitando que ele transforme o mesmo em figurinha animada

### 📋 Pré-requisitos
* NodeJs
* TypeScript

### 🔧 Instalação

O Processo de instalação é bem simples
(Entende-se que você possui o nodeJs, typescript e o git instalado)

```
git clone https://github.com/electron-userland/electron-builder.git
```
```
cd bot-x9
```
```
npm install
```
```
cd demo
```
Para testar basta executar 
```
ts-node index.ts
```
O bot iniciará a rotina de início, em seguida surgirá um qrcode para ser escaneado através do whatsapp a qual deseja utilizar.
Após isso estará em pleno funcionamento caso o processo ocorra normalmente.


## 🛠️ Construído com

* [NodeJs](https://nodejs.org/en/) - Utilizado para servir a aplicação
* [TypeScript](https://www.typescriptlang.org/) - Linguagem Utilizada para o desenvolvimento
* [Wa-automate](https://github.com/open-wa/wa-automate-nodejs) - Core da aplicação

## 📌 Versão

O projeto se encontra na versão beta 0.0.1

## ✒️ Autores

Todas as pessoas que Contribuíram para com o projeto

* **Eduardo Bezerra**
* * [Felipe Sartori](https://github.com/felipesartori)

## 📄 Licença

Este projeto está sob a licença MIT

## 🎁 Obrigado

* Conte a outras pessoas sobre este projeto 📢
* Contribua e tenha seu nome e perfil na lista 🤓
---
⌨️ com ❤️ por Eduardo Bezerra 😊
