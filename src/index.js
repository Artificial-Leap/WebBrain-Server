import { Client, GatewayIntentBits, Events } from "discord.js";
import { config } from "./configLoader.js";
import handleMessage, {
  handleBoredMessage,
  getImagePrompt,
} from "./chatter.js";
import database from "./database.js";
import should_respond from "./conversation_manager.js";
import painter from "./painter.js";

new database();

const available_channels = { "1065344514723680286": null };
setInterval(async () => {
  for (let i = 0; i < available_channels.length; i++) {
    const channel = client.channels.cache.get(available_channels[i]);
    if (channel) {
      const lastMessage = await channel.messages.fetch({ limit: 1 });
      console.log(
        lastMessage.createdTimestamp,
        Date.now() - 1000 * 60 * 10,
        lastMessage.createdTimestamp > Date.now() - 1000 * 60 * 10
      );
      if (lastMessage.createdTimestamp > Date.now() - 1000 * 60 * 10) {
        channel.sendTyping();
        const resp = await handleBoredMessage();
        channel.send(resp);
      }
    }
  }
}, 1000); //60000);

const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, (interaction) => {
  if (!interaction.isButton()) return;
  console.log(interaction);

  /*
    Add Button:
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId("go_to_site")
      .setLabel("Click me!")
      .setStyle(ButtonStyle.Primary)
  );
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('Some title')
    .setURL('https://google.com')
    .setDescription('Some description here');

  message.channel.send({ content: 'I think you should,', ephemeral: true, embeds: [embed], components: [row] });
  */
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) {
    //is not command
    let msg = message.content.toLowerCase().trim();
    //replace all Mentioned user ids with the username
    message.mentions.users.forEach((user) => {
      msg = msg.replace(user.id, user.username);
    });
    msg = msg.replace("<@", "");
    msg = msg.replace(">", "");
    console.log(msg);

    const author = message.author;
    const channel = message.channel;

    //get old messages from this channel
    const messages = await channel.messages.fetch({ limit: 20 });
    //remove links from messages
    messages.forEach((msg) => {
      msg.content = msg.content.replace(/https?:\/\/\S+/g, "");
    });
    //remove empty messages
    messages.filter((msg) => msg.content.length > 0);
    //replace all Mentioned user ids with the username in the messages
    messages.forEach((msg) => {
      msg.mentions.users.forEach((user) => {
        msg.content = msg.content.replace(user.id, user.username);
        msg.content = msg.content.replace("<@", "");
        msg.content = msg.content.replace(">", "");
      });
    });

    const hasMentionToOtherUser =
      message.mentions.users.size > 0 && !message.mentions.has(client.user);
    if (
      should_respond(
        author.username,
        msg,
        channel.id,
        message.mentions.has(client.user),
        hasMentionToOtherUser
      )
    ) {
      if (
        msg.includes("generate") ||
        msg.includes("make") ||
        msg.includes("create")
      ) {
        channel.send("On to it! Generating "); //find the target generation (for example : can you make a black tshirt, get only the black tshirt)
        //generate the image
        const prompt = await getImagePrompt(msg);
        channel.send("Input prompt: " + prompt);
        const resp = await painter.instance.generateImage(prompt);
        console.log(resp);
        channel.send(resp);
      } else {
        channel.sendTyping();
        const resp = await handleMessage(author.username, messages);
        channel.send(resp);
      }
    }
  } else {
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "ping") {
      message.reply("Pong!");
    }
  }
});

client.login(config.bot_token);
