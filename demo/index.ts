import {
  create,
  Client,
  decryptMedia,
  ev,
  NotificationLanguage,
} from "../src/index";
const fs = require("fs");
const mime = require("mime-types");
const ON_DEATH = (fn) => process.on("exit", fn);
let globalClient: Client;
const express = require("express");
const ytdl = require('ytdl-core');
const axios = require('axios');
import Ffmpeg from 'fluent-ffmpeg';
import unixTime from "./utils/unixTime";

const app = express();
app.use(express.json({ limit: "200mb" }));

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

});

ev.on("sessionData.**", async (sessionData, sessionId) => {

});

ev.on("sessionDataBase64.**", async (sessionData, sessionId) => {

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
    'palavrao1',
    'palavrao2',
    '...'
  ];

  const ytb = client.onMessage(async (message) => {
    if (message.type === "chat") {
      if (message.body.includes('https://youtu') ||
        message.body.includes('https://www.youtu') ||
        message.body.includes('http://youtu') ||
        message.body.includes('http://www.youtu') ||
        message.body.includes('www.youtu')) {
        let ytid = message.body
        let { videoDetails: inf } = await ytdl.getInfo(ytid)
        let dur = `${('0' + (inf.lengthSeconds / 60).toFixed(0)).slice(-2)}:${('0' + (inf.lengthSeconds % 60)).slice(-2)}`
        let estimasi = inf.lengthSeconds / 200
        let est = estimasi.toFixed(0)
        let path = `./media/mp3.mp3`

        client.sendFileFromUrl(message.from, `${inf.thumbnails[3].url}`, ``,
          `Título   : *${inf.title}*\n` +
          `Canal : *${inf.ownerChannelName}*\n` +
          `Duração  : *${dur}*\n` +
          `subido para o youtube em: *${inf.uploadDate}*\n` +
          `Quantidade de views    : *${inf.viewCount}*\n\n`)
        let stream = ytdl(ytid, { quality: 'highestaudio' })
        client.sendText(
          message.from,
          `Estimativa de tempo para baixar: ${Number(est)>=1?'*Mais de um minuto*':'*Menos de um minuto*'}\ninformações do vídeo:`
        );
        client.sendText(
          message.from,
          `*ATENÇÃO! AGUARDE* O AUDIO ESTÁ SENDO ENVIADO`
        );
        Ffmpeg({ source: stream })
          .setFfmpegPath('./bin/ffmpeg')
          .on('error', (err) => {
            console.log('Um erro ocorreu ao converter video ' + err.message)
          })
          .on('end', () => {
            client.sendFile(message.from, path, `${inf.title}.mp3`, inf.title).then()
          })
          .saveToFile(path)
      }
    }
  });

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
        `@${message.author.replace('@c.us', '')} Apagou essa imagem 🧐`
      );
    }
    if (message.type === "audio") { //Verifica se a mensagem apagada foi um áudio
      const filename = `${message.t}.${mime.extension(message.mimetype)}`;  //atribui um nome ao arquivo apagado
      const mediaData = await decryptMedia(message); //descriptografa o áudio, convertendo para base64
      await client.sendText(
        message.from,
        `@${message.author.replace('@c.us', '')}} Apagou o seguinte áudio enviado:🧐 `
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
        `@${message.author.replace('@c.us', '')}} Apagou o seguinte áudio gravado:🧐`
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
        `@${message.author.replace('@c.us', '')}} Apagou a seguinte mensagem:\n *${message.body}*  🧐 `
      );
    }
    if (message.type === "document" || message.type === "video") {  //Verifica se a mensagem apagada uma imagem ou vídeo
      const filename = `${message.t}.${mime.extension(message.mimetype)}`; //atribui um nome ao arquivo apagado
      const mediaData = await decryptMedia(message); //descriptografa o documento ou vídeo, convertendo para base64
      if (message.type === "video") {
        await client.sendText(
          message.from,
          `@${message.author.replace('@c.us', '')}} apagou o seguinte vídeo 🧐 `
        );
      } else {
        await client.sendText(
          message.from,
          `@${message.author.replace('@c.us', '')}} Apagou o seguinte arquivo 🧐 `
        );
      }
      await client.sendFile(
        message.from,
        `data:${message.mimetype};base64,${mediaData.toString("base64")}`,
        filename
      );
    }
    if (message.type === "sticker") { //Verifica se a mensagem apagada foi uma figurinha/sticker
      const mediaData = await decryptMedia(message)
      await client.sendText(
        message.from,
        `@${message.author.replace('@c.us', '')} Apagou a seguinte figurinha 🧐 `
      );
      await client.sendImageAsSticker(message.from, mediaData)
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
            .then(async () => {
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
    if (message.type === "chat") { //Verifica se a mensagem é do tipo chat 
      if (message.body.toLowerCase() === "!menu" || (message.body.toLowerCase() === "menu")) { //Caso a mensagem digitada seja "!menu" dispara a lista de funcionalidades "Disparadas" 
        if (message.chat.isGroup) { //verifica se a mensagem veio de um grupo
          await client.sendText(message.from, "OK!😁");
          await client.sendText(
            message.from,
            "Esse é o *Menu de ações* 🙋‍♂️😌\nDigite *!L* - *Obter link do grupo*\nDigite *!A* - *Marcar todos os administradores*"
          );
        } else {// verifica se a mensagem veio de um chat privado
          await client.sendText(
            message.from,
            `Esse é o Menú aqui do privado 🙋‍♂️:\n`+
            `*1 - Me envie um video ou imagem que irei transformar em figurinha*😀\n`+
            `*2 - Compartilhe ou me envie um link de musica do youtube que irei transformar em MP3* 🎵🎶\n`+
            `*3 - Quer saber informações sobre o tempo? me envie "!T sua cidade" ex: !T fortaleza (sem acento!)* ⛈🌦⛱`
          );
          await client.sendText(
            message.from,
            `Ações que posso fazer caso você me adicione em um grupo:\n`+
            `*1 - Dar tchau caso alguém saia do grupo*\n`+
            `*2 - Dar boas vindas caso alguém entre no grupo*\n`+
            `*3 - Alertar caso alguém fale palavrão*\n`+
            `*4 - E o principal, recuperar qualquer mensagem apagada no grupo, informando também quem falou*\n`+
            `Fora isso há também o menú de ações que pode ser utilizado enviando *!menu*\n`+
            `Quer que eu seja o bot/robô administrador do seu grupo? basta me adicionar nele. Só isso! 🙋‍♂️`
          );
        }
      }
    }
  });

  const getLinkGroup = client.onMessage(async (message) => {
    if (message.type === "chat") {
      if (message.body.toLowerCase() === "!l") { // Faz parte do Menu, envia o link do grupo caso a mensagem digitada seja "!L"
        try {
          await client.sendText('Para utilizar esse recurso preciso ser administrador 🙋‍♂️');
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

  const isCallVerification = client.onIncomingCall(async call => {
    // ketika seseorang menelpon nomor bot
    if (!call.isGroup) {
      await client.sendText(call.peerJid, `⛔ Você foi bloqueado. Para evitar incômodo.`)
        .then(async () => {
          client.contactBlock(call.peerJid)
        })
    }
  })

  const getWeather = client.onMessage(async (message) => {
    if (message.type === "chat") {
      if (message.body.toLowerCase().includes('!t')) {
        // Faz parte do Menu, envia o link do grupo caso a mensagem digitada seja "!L"
        try {

          const API_URL = 'https://api.openweathermap.org/data/2.5/weather';
          const API_KEY = 'd55bf564bc5d6479644aa543df154f0b';
          const LOCATION = message.body.substring(3);
          const LANG = 'pt_br';
          const FULL_API_URL = `${API_URL}?q=${LOCATION}&appid=${API_KEY}&lang=${LANG}`;

          axios
            .get(FULL_API_URL)
            .then(async response => {

              const kelvins = 273.15;
              // Obtem os dados de temperatura e demais
              const tempActual = response.data.main.temp;
              const thermalSensation = response.data.main.feels_like;
              const tempMin = response.data.main.temp_min;
              const tempMax = response.data.main.temp_max;
              const humidity = response.data.main.humidity;
              const windSpeed = response.data.wind.speed;
              const cityName = response.data.name;
              const countryName = response.data.sys.country;
              const date = unixTime(response.data.dt);

              // Converte as temperaturas de Kelvins para Celsius
              const tempCelsius = tempActual - kelvins;
              const thermalSensationCelsius = thermalSensation - kelvins;
              const tempMinCelsius = tempMin - kelvins
              const tempMaxCelsius = tempMax - kelvins;

              // Convertendo para KM por Hora
              const windSpeedKPH = windSpeed * 3.6;

              // Construindo a frase para ser enviado
              const weatherDisplay =
                `*${cityName}-${countryName}* \n` +
                `Temperadura Atual: ${tempCelsius.toFixed(1)}ºC \n ` +
                `Sensação Térmica: ${thermalSensationCelsius.toFixed(1)}ºC \n ` +
                `Temperatura Min: ${tempMinCelsius.toFixed(1)}ºC \n ` +
                `Temperatura Max: ${tempMaxCelsius.toFixed(1)}ºC \n ` +
                `Humidade: ${humidity}% \n ` +
                `Vento: ${windSpeedKPH.toFixed(1)}km/h \n ` +
                `Condições: ${response.data.weather[0].description} \n ` +
                `Data Ultima Atualização: ${date}`;
              await client.sendText(message.from, weatherDisplay);
            })
            .catch(async error => await client.sendText(message.from, `⚠ Cidade não encontrada! ⚠\nPor Favor verifique a ortografia (Não utilize acentos) ou se é uma Cidade existente`));

        } catch (error) {
          console.log("error:", error);
        }
      }
    }
  });

}