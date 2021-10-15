//import { ClientRequest } from 'http';
import {
  create,
  Client,
  decryptMedia,
  ev,
  smartUserAgent,
  NotificationLanguage,
} from "../src/index";
//const mime = require('mime-types');
const fs = require("fs");
const mime = require("mime-types");
//const uaOverride = 'WhatsApp/2.16.352 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Safari/605.1.15';
//const tosBlockGuaranteed = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/79.0.3945.88 Safari/537.36";
const ON_DEATH = (fn) => process.on("exit", fn);
let globalClient: Client;
const express = require("express");

const app = express();
app.use(express.json({ limit: "200mb" })); //add the limit option so we can send base64 data through the api

const PORT = 8082;

ON_DEATH(async function () {
  console.log("killing session");
  if (globalClient) await globalClient.kill();
});

ev.on("qr.**", async (qrcode, sessionId) => {
  const imageBuffer = Buffer.from(
    qrcode.replace("data:image/png;base64,", ""),
    "base64"
  );
  fs.writeFileSync(
    `qr_code${sessionId ? "_" + sessionId : ""}.png`,
    imageBuffer
  );
});

ev.on("STARTUP.**", async (data, sessionId) => {
  if (data === "SUCCESS") console.log(`${sessionId} started!`);
});

ev.on("**", async (data, sessionId, namespace) => {
  //console.log("\n----------")
  //console.log('EV', data, sessionId, namespace)
  //console.log("----------")
});

ev.on("sessionData.**", async (sessionData, sessionId) => {
  //console.log("\n----------")
  //console.log('sessionData', sessionId, sessionData)
  //console.log("----------")
});

ev.on("sessionDataBase64.**", async (sessionData, sessionId) => {
  //console.log("\n----------")
  //console.log('sessionData', sessionId, sessionData)
  //console.log("----------")
});

create({
  sessionId: "",
  authTimeout: 60, //Tempo aguardado para se conectar ao whatsapp
  blockCrashLogs: true,
  disableSpins: true,
  useChrome: true,
  headless: true, //Caso true não irá mostrar a janela do chrome
  hostNotificationLang: NotificationLanguage.PTBR,
  logConsole: false,
  popup: true,
  qrTimeout: 0, //Estando 0, o código QR não possuirá um tempo de vida
}).then((client) => start(client));

function start(client) {
  const badWords = [
    //lista de palavras indesejadas
    "acefalo",
    "anal",
    "anus",
    "arombado",
    "baba-ovo",
    "babaca",
    "babaovo",
    "bacanal",
    "bacura",
    "teu cu",
    "piroca",
    "pomba",
    "fdp",
    "bunda",
    "porra",
    "caralho",
    "vtnc",
    "puta",
    "rapariga",
    "Babaca",
    "pau",
    "tarraqueta",
    "foda",
    "foder",
    "Carai",
    "cagando",
    "fuder",
    "trouxa",
    "cu",
    "buceta",
    "priquito",
    "puto",
    "viado",
  ];

  
  const onAdded = client.onAddedToGroup(async (message) => {  //Ao ser adicionado em um grupo dispara uma frase
    await client.sendText(
      message.id,
      `Obrigado por me adicionar ao grupo *${message.formattedTitle.toUpperCase()}* 😁😎`
    );
  });

  const deletedMessageRecovery = client.onMessageDeleted(async (message) => {
    if (message.type === "image") { //Verifica se a mensagem apagada foi uma imagem
      const filename = `${message.t}.${mime.extension(message.mimetype)}`; //atribui um nome ao arquivo apagado
      const mediaData = await decryptMedia(message); //descriptografa a imagem, convertendo para base64
      await client.sendImage(
        message.from,
        `data:${message.mimetype};base64,${mediaData.toString("base64")}`,
        filename,
        `@${message.author} Apagou essa imagem 🧐`
      );
    }

    if (message.type === "audio") { //Verifica se a mensagem apagada foi um áudio
      const filename = `${message.t}.${mime.extension(message.mimetype)}`;  //atribui um nome ao arquivo apagado
      const mediaData = await decryptMedia(message); //descriptografa o áudio, convertendo para base64
      await client.sendText(
        message.from,
        `@${message.author} Apagou o seguinte áudio enviado:🧐 `
      );
      await client.sendAudio(
        message.from,
        `data:${message.mimetype};base64,${mediaData.toString("base64")}`,
        filename
      );
    }

    if (message.type === "ptt") { //Verifica se a mensagem apagada foi um áudio gravado
      const filename = `${message.t}.${mime.extension(message.mimetype)}`; //atribui um nome ao arquivo apagado
      const mediaData = await decryptMedia(message); //descriptografa o audio gravado, denominado como PTT, convertendo para base64
      await client.sendText(
        message.from,
        `@${message.author} Apagou o seguinte áudio gravado:🧐`
      );
      await client.sendPtt(
        message.from,
        `data:${message.mimetype};base64,${mediaData.toString("base64")}`,
        filename
      );
    }

    if (message.type === "chat") {  //Verifica se a mensagem apagada apenas texto
      await client.sendText(
        message.from,
        `@${message.author} Apagou a seguinte mensagem:\n *${message.body}*  🧐 `
      );
    }

    if (message.type === "document" || message.type === "video") {  //Verifica se a mensagem apagada uma imagem ou vídeo
      const filename = `${message.t}.${mime.extension(message.mimetype)}`; //atribui um nome ao arquivo apagado
      const mediaData = await decryptMedia(message); //descriptografa o documento ou vídeo, convertendo para base64
      if (message.type === "video") {
        await client.sendText(
          message.from,
          `@${message.author} apagou o seguinte vídeo 🧐 `
        );
      } else {
        await client.sendText(
          message.from,
          `@${message.author} Apagou o seguinte arquivo 🧐 `
        );
      }
      await client.sendFile(
        message.from,
        `data:${message.mimetype};base64,${mediaData.toString("base64")}`,
        filename
      );
    }
    if (message.type === "sticker") { //Verifica se a mensagem apagada foi uma figurinha/sticker
      await client.sendText(
        message.from,
        `@${message.author} Apagou uma figurinha. Ainda não consigo mostrar figurinhas apagadas 😔`
      );
    }
  });

  const convertToStick = client.onMessage(async (message) => { 
    if (!message.chat.isGroup) {
      if (message.mimetype) {
        const mediaData = await decryptMedia(message);
        if (message.type === "image") { //Verifica se o que foi enviado foi uma imagem. Caso sim, converte para uma figurinha
          const metadata = { //metadata de todas as figurinhas que são geradas pelo bot
            author: "Bot X9",
            keepScale: true,
            cropPosition: "entropy",
            pack: "Bot X9",
          };
          await client.sendText(
            message.from,
            "Transformando imagem em figurinha...aguarde"
          );
          client
            .sendImageAsSticker(message.from, mediaData, metadata)
            .then(async (sticker) => {
              await client.sendText(message.from, `Pronto 😁`);
            });
        }
        if (message.type === "video") { //Verifica se o que foi enviado foi um vídeo. Caso sim, converte para uma figurinha animada
          await client.sendText(
            message.from,
            "Transformando video em figurinha...aguarde"
          );
          await client.sendMp4AsSticker(message.from, mediaData);
          await client.sendText(message.from, `Pronto 😁`);
        }
      }
    }
  });

  const isBadWordVerify = client.onMessage(async (message) => {
    if (message.type === "chat") {
      let user;
      let isBadWord;
      let sender;
      const arrayMsg = message.body.split(" "); //A cada mensagem de um integrante do grupo o bot  transforma em um ARRAY
      arrayMsg.forEach((wordOfMsg) => { //Percorre o ARRAY de palavras da frase
        badWords.forEach((element) => { // Percorre o array de palavrões
          const word = wordOfMsg.toLowerCase();
          if (word == element) { //Verifica se alguma palavra consta na lista de palavrões e colhe as informações do integrante(Sender)
            sender = message.sender.id;
            user = message.from;
            isBadWord = true;
          }
        });
      });
      if (isBadWord === true) { //Emite uma mensagem alertando que um integrante digitou um palavrão
        await client.sendTextWithMentions(
          user,
          `@${sender} Digitou um palavrão. Por favor, acalme-se 😅. Caso continue os administradores tomarão as providências. 🤨 `
        );
      }
    }
  });

  const menu = client.onMessage(async (message) => {
    if (message.type === "chat" && message.chat.isGroup) { //Verifica se a mensagem é do tipo chat e se veio de um grupo
      if (message.body.toLowerCase() === "!menu") { //Caso a mensagem digitada seja "!menu" dispara a lista de funcionalidades "Disparadas" 
        await client.sendText(message.from, "OK!😁");
        await client.sendText(
          message.from,
          "Esse é o *Menu de ações* 🙋‍♂️😌\nDigite *!L* - *Obter link do grupo*\nDigite *!A* - *Marcar todos os administradores*"
        );
      }
    }
  });

  const getLinkGroup = client.onMessage(async (message) => {
    if (message.type === "chat") {
      if (message.body.toLowerCase() === "!l") { // Faz parte do Menu, envia o link do grupo caso a mensagem digitada seja "!L"
        try {
          client.getGroupInviteLink(message.from).then(async (resposta) => {
            await client.sendText(message.from, resposta);
          });
        } catch (error) {
          console.log(error);
        }
      }
    }
  });

  const getAdmins = client.onMessage(async (message) => {

    if (message.type === "chat") {
      if (message.body.toLowerCase() === "!a") { //Faz parte do menu, chama atenção de todos os administradores caso a mensagem digitada seja "!A"
        try {
          client.getGroupAdmins(message.from).then(async (admins) => {
            await client.sendText(message.from, "Marcando administradores:");
            admins.forEach(async (admin) => {
              await client.sendText(message.from, `@+${admin.slice(0, -5)}`);
            });
          });
        } catch (error) {
          console.log(error);
        }
      }
    }
  });

  const onAddOrRemoveInGroup = client.onGlobalParticipantsChanged(
    async (participantChangedEvent) => {
      if (participantChangedEvent.who !== "558581213559@c.us") { //Verifica se um novo integrante foi adicionado ou removido de um grupo, e também se o número adicionado é diferente do utilizado para o bot
        switch (participantChangedEvent.action) {
          case "remove":
            await client.sendText( //Verifica se o novo integrante foi removido, caso sim retorna uma mensagem
              participantChangedEvent.chat,
              `Adeus 🖐 @${participantChangedEvent.who}, vai-te embora, ninguém te adora 😂😁😎🤡.`
            );
            break;
          case "add":
            if (participantChangedEvent.by === "invite") { //Verifica se o novo integrante foi convidado por link, caso sim retorna uma mensagem
              await client.sendText(
                participantChangedEvent.chat,
                `Seja bem vindo @${participantChangedEvent.who}. Que legal! Você foi convidado por algúem. Você pode nos contar quem foi?\nLeia a descrição do grupo 👁😃 para ficar por dentro das regras `
              );
            } else {
              await client.sendText(  //Verifica se o novo integrante foi adicionado por outro integrante, caso sim retorna uma mensagem
                participantChangedEvent.chat,
                `Seja bem vindo @${participantChangedEvent.who}. Leia a descrição do grupo 👁😃 para ficar por dentro das regras `
              );
            }
            break;
        }
      }
    }
  );
}