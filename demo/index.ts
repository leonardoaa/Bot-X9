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
  authTimeout: 60, //wait only 60 seconds to get a connection with the host account device
  blockCrashLogs: true,
  disableSpins: true,
  useChrome: true,
  headless: true,
  hostNotificationLang: NotificationLanguage.PTBR,
  logConsole: false,
  popup: true,
  qrTimeout: 0, //0 means it will wait forever for you to scan the qr code
}).then((client) => start(client));

function start(client) {
  const badWords = [
    //lista de palavras proíbidas
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

  const onAdded = client.onAddedToGroup(async (message) => {
    //await client.sendYoutubeLink(message.id, "https://youtu.be/0WxDrVUrSvI");
    await client.sendText(
      message.id,
      `Obrigado por me adicionar ao grupo *${message.formattedTitle.toUpperCase()}* 😁😎`
    );
  });

  const deletedMessageRecovery = client.onMessageDeleted(async (message) => {
    if (message.type === "image") {
      const filename = `${message.t}.${mime.extension(message.mimetype)}`;
      const mediaData = await decryptMedia(message);

      await client.sendImage(
        message.from,
        `data:${message.mimetype};base64,${mediaData.toString("base64")}`,
        filename,
        `@${message.author} Apagou essa imagem 🧐`
      );
    }

    if (message.type === "audio") {
      const filename = `${message.t}.${mime.extension(message.mimetype)}`;
      const mediaData = await decryptMedia(message);
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

    if (message.type === "ptt") {
      const filename = `${message.t}.${mime.extension(message.mimetype)}`;
      const mediaData = await decryptMedia(message);
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

    if (message.type === "chat") {
      await client.sendText(
        message.from,
        `@${message.author} Apagou a seguinte mensagem:\n *${message.body}*  🧐 `
      );
    }

    if (message.type === "document" || message.type === "video") {
      const filename = `${message.t}.${mime.extension(message.mimetype)}`;
      const mediaData = await decryptMedia(message);
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
    if (message.type === "sticker") {
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
        if (message.type === "image") {
          console.log(message.caption);
          const metadata = {
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
        if (message.type === "video") {
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
      const arrayMsg = message.body.split(" ");
      arrayMsg.forEach((wordOfMsg) => {
        badWords.forEach((element) => {
          const word = wordOfMsg.toLowerCase();
          if (word == element) {
            sender = message.sender.id;
            user = message.from;
            isBadWord = true;
          }
        });
      });
      if (isBadWord === true) {
        await client.sendTextWithMentions(
          user,
          `@${sender} Digitou um palavrão. Por favor, acalme-se 😅. Caso continue os administradores tomarão as providências. 🤨 `
        );
      }
    }
  });

  const menu = client.onMessage(async (message) => {
    if (message.type === "chat" && message.chat.isGroup) {
      if (message.body.toLowerCase() === "!menu") {
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
      if (message.body.toLowerCase() === "!l") {
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
      if (message.body.toLowerCase() === "!a") {
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
      if (participantChangedEvent.who !== "558581213559@c.us") {
        switch (participantChangedEvent.action) {
          case "remove":
            await client.sendText(
              participantChangedEvent.chat,
              `Adeus 🖐 @${participantChangedEvent.who}, vai-te embora, ninguém te adora 😂😁😎🤡.`
            );
            break;
          case "add":
            if (participantChangedEvent.by === "invite") {
              //função para expulsar usuário caso não responda em 30 segundos
              await client.sendText(
                participantChangedEvent.chat,
                `Seja bem vindo @${participantChangedEvent.who}. Que legal! Você foi convidado por algúem. Você pode nos contar quem foi?\nLeia a descrição do grupo 👁😃 para ficar por dentro das regras `
              );
            } else {
              await client.sendText(
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
