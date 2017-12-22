const Discord = require("discord.js");
const YouTube = require("simple-youtube-api");
const ytdl = require("ytdl-core");
const fs = require("fs");
const reverse = require("reverse-string");
const moment = require("moment");
const ms = require("ms");
const toesay = require("./toesay.js");
const client = new Discord.Client({disableEveryone: true});

process.on("unhandledRejection", error => {
  throw error;
})

const {token, prefix, ver, apikey} = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

var spammedMessages = {};
var spamCount = {};

const youtube = new YouTube(process.env.YT_API_KEY);
const google = require("./google.js");

var ownerId = "373840252655370240";

var servers = new Map();
var guilds = {};
var members = {};

var matched = true;

var answers = [
  "Yes.",
  "No.",
  "Maybe, but don't let your dreams be dreams!",
  "Maybe, but lower than your usual maybe.",
  "Yes, that is definitely true.",
  "Probably.",
  "No, that is definitely false."
];

var ratings = [
  "⭐",
  "⭐⭐",
  "⭐⭐⭐",
  "⭐⭐⭐⭐",
  "⭐⭐⭐⭐⭐",
  "No stars"
];

var games = [
  "with myself",
  "derp",
  "asdf",
  "not streaming",
  "dot dot dot",
  "a",
  "discord.js-commando is shit",
  "this ytp is brought to you by bye",
  ":)",
  "what",
  "piro"
];

client.on("error", console.error);
client.on("warn", console.warn);
client.on("debug", console.info);
client.on("ready", () => {
  console.log(`
Tech-a-Bot (${ver}) details:
Username: ${client.user.username}
Tag: ${client.user.tag}
ID: ${client.user.id}
Discriminator: ${client.user.discriminator}
Version: ${ver}
Node Version: ${process.version}`);
  setRandomGame();
  client.setInterval(setRandomGame, 25000);
});

client.on("messageReactionAdd", (reaction, user) => {
  var guild = guilds[reaction.message.guild.id];
  if (!guild || guild.starboardChannel === null || user === client.user) return;
  if (reaction.emoji.name === "⭐") {
    if (user === reaction.message.author) {
      reaction.remove(user).then(() => reaction.message.channel.send(":no_entry_sign: You cannot star your messages."))
    } else {
   guild.starboard.push(reaction.message.content);
   const starredMsg = new Discord.RichEmbed()
    .setTitle("New Starred Message")
    .addField("User:", reaction.message.author.tag)
    .addField("Message:", reaction.message.content)
    .setFooter(`New ⭐. Occurred on ${reaction.message.createdAt}`)
    .setColor(0xFFA500)
   return reaction.message.guild.channels.get(guild.starboardChannel).send({embed: starredMsg});
    }
  }
});

client.on("message", async message => {
  if (message.author.bot) return;

  if (message.channel.type === "dm") return;

  if (!guilds[message.guild.id]) {
    guilds[message.guild.id] = {
      spamFiltering: false,
      warningsChannel: null,
      starboardChannel: null,
      starboard: []
    }
  }

  var cmd = message.content.split(" ")[0].slice(prefix.length).toLowerCase();
  var args = message.content.split(" ").slice(1);
  var url = args[0] ? args[0].replace(/<.+>/g, "$1") : "";
  var server = servers.get(message.guild.id);
  var guildData = guilds[message.guild.id];

  if (guildData.spamFiltering) {
    if (spammedMessages[message.author.id] !== message.content) {
      spamCount[message.author.id] = 0;
    }
    spammedMessages[message.author.id] = message.content;
    spamCount[message.author.id] += 1;

    if (spammedMessages[message.author.id] === message.content && spamCount[message.author.id] === 10) {
      if (guildData.warningsChannel === null) {
        message.delete();
        message.channel.send(":angry: I'm done with your spame. There is no provided channel to notify the staff, so i'm gonna let you off with a big warning here.");
        return;
      }
      message.delete();
      message.channel.send(":angry: That's it. I have notified the staff and they will check it soon I would say.");
      message.guild.channels.get(guildData.warningsChannel).send(`${message.author.toString()} has been spamming in the channel ${message.channel.toString()}.`);
    } else if (spammedMessages[message.author.id] && spamCount[message.author.id] > 10) {
      message.delete();
    } else if (spammedMessages[message.author.id] && spamCount[message.author.id] > 4) {
      message.delete();
      message.channel.send(`Please don't spam ${message.author.toString()}.`);
    }
  }

  matched = true;

  if (!message.content.startsWith(prefix)) return;

  switch (cmd) {
    case "ping":
      var oldMsg = await message.channel.send("⏰ Pinging servers and getting connection info...")
      oldMsg.delete();
      message.channel.send(`🏓 Pong! Can we do that again? But whatever. Message Latency is ${oldMsg.createdTimestamp - message.createdTimestamp} ms. API Latency is ${Math.round(client.ping)} ms`);
      break;
    case "eightball":
    case "8ball":
      var question = args.join(" ")
      var answer = answers[randomNumber(answers.length)];
      if (question) {
        const eballembed = new Discord.RichEmbed()
          .addField(question, `:8ball: ${answer}`)
          .setColor(0xFFA500)
          .setFooter(`Asked By: ${message.author.tag}`, message.author.displayAvatarURL)
        message.channel.send({embed: eballembed});
      } else {
        return message.channel.send(":no_entry_sign: Please give me a question to answer!");
      }
      break;
    case "help":
      const helpembed = new Discord.RichEmbed()
        .addField("Fun Commands:", "8ball/eightball\nmoneyflip\nroll\nembedsay\nrate\nkiss\nmeme\nreversesay", true)
        .addField("Music Commands:", "play\nstop/end\nskip\nqueue\nnp/nowplaying\nvolume/vol", true)
        .addField("Owner Only Commands:", "say\neval", true)
        .addField("Info Commands:", "time\nuptime\nserverinfo/guildinfo/sinfo\nuinfo/userinfo\navatar\nver/version\nabout/info\ngoogle\ninvite", true)
        .addField("Test Commands:", "die", true)
        .addField("Moderation Commands:", "purge\nkick\nban\nhackban\nspamfilter\nsetwarnings\nsetstarboard\nmute", true)
        .setColor(0xFFA500)
        .setTimestamp()
      message.channel.send({embed: helpembed});
      break;
    case "say":
      if (message.author.id !== ownerId) return;

      if (!args.join(" ")) return message.channel.send(":no_entry_sign: You provided nothing to say.");

      message.delete();
      message.channel.send(args.join(" "));
      break;
    case "play":
      var voiceChannel = message.member.voiceChannel;
      if (!voiceChannel) return message.channel.send(":no_entry_sign: You must be in a voice channel.");
      if (!url || !args.join(" ")) return message.channel.send(":no_entry_sign: Please enter a track, by URL, video ID, or keyword.");
      var perms = voiceChannel.permissionsFor(client.user);
      if (!perms.has("CONNECT")) return message.channel.send(":no_entry_sign: I have no permissions to connect to this voice channel.");
      if (!perms.has("SPEAK")) return message.channel.send(":no_entry_sign: I have no permissions to speak in this voice channel.");

      var playlistUrlRegEx = /^https:?\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/
      if (url.match(playlistUrlRegEx)) {
        var playlist = await youtube.getPlaylist(url);
        const vids = await playlist.getVideos();

      for (var vid of Object.values(vids)) {
        var v = await youtube.getVideoByID(vid.id);

        await handleVid(v, message, voiceChannel, true);
      } 
    } else {
      try {
        var video = await youtube.getVideo(url);
      } catch (error) {
        try {
          var video = await youtube.getVideoByID(args[0]);
        } catch (er) {
          try {
            var i = 0;
            var videos = await youtube.searchVideos(args.join(" "), 10);
            const ss = new Discord.RichEmbed()
              .setDescription(`**Song Selection:**\nThis is a selection for a song you would like to play. Provide a number between 1 and ${videos.length}.\n**NOTE:** You have 25 seconds to choose a song.\n**Songs:**\n${videos.map(vi => `**#${++i} >** ${vi.title}`).join("\n")}`)
              .setColor(0xFFA500)
              .setFooter(`Requested By: ${message.author.tag}`, message.author.displayAvatarURL)
            message.channel.send({embed: ss});
            try {
              var r = await message.channel.awaitMessages(q => q.author.id === message.author.id && q.content > 0 && q.content < 11, {
                maxMatches: 1,
                time: 25000,
                errors: ["time"]
              })
            } catch (timesup) {
              console.error(timesup);
              return message.channel.send(":no_entry_sign: No song entered after 25 seconds!");
            }
            var selected = parseInt(r.first().content);
            var video = await youtube.getVideoByID(videos[selected - 1].id);
          } catch (err) {
            message.channel.send(":no_entry_sign: No results found for that video.");
            return console.error(err.stack);
          }
      }
    }

      return handleVid(video, message, voiceChannel);
    }
    break;
    case "end":
    case "stop":
      if (!message.member.hasPermission("MUTE_MEMBERS")) return message.channel.send(":no_entry_sign: You need `Mute Members` to use this command.");
      if (!server) return message.channel.send(":no_entry_sign: No song is playing at the moment.");
      server.playing = false;
      server.queue = [];
      server.connection.dispatcher.end("The music has been stopped using the stop command.");
      break;
    case "skip":
        if (!server) return message.channel.send(":no_entry_sign: No song is playing at the moment.");
         if (message.author.id !== server.queue[0].requester.id) return message.channel.send(":no_entry_sign: You wanna skip this song? Gotta be the one who requested it!");
        server.connection.dispatcher.end("The music has been skipped using the skip command.")
      break;
    case "queue":
      if (!server) return message.channel.send(":no_entry_sign: No songs are enqueued at the moment.");
      let queueI = 0;
        const queueList = new Discord.RichEmbed()
          .setDescription("**Queue:**")
          .addField("Now Playing:", `${server.queue[0].title} (\`${server.queue[0].minutes}:${server.queue[0].seconds}\`)`)
          .addField("Current Queue:", server.queue.map(s => `**#${++queueI} >** ${s.title} (\`${s.minutes}:${s.seconds}\`)`).join("\n"))
          .setColor(0xFFA500)
          .setTimestamp();
        message.channel.send({embed: queueList});
      break;
    case "nowplaying":
    case "np":
      if (!server) return message.channel.send(":no_entry_sign: No song is playing at the moment.");
      message.channel.send(`:musical_note: Now Playing: **${server.queue[0].title}** (\`${server.queue[0].minutes}:${server.queue[0].seconds}\`)`);
      break;
    case "eval":
      if (message.author.id !== ownerId) return;
      try {
        var code = args.join(" ")
        let evaled = eval(code);

        if (typeof evaled !== "string") {
          evaled = require("util").inspect(evaled);
        }

        if (!code) return message.channel.send(":no_entry_sign: You must provide code to evaluate.");

        const embed = new Discord.RichEmbed()
          .addField(":arrow_down: Input:", `\`\`\`js\n${clean(code)}\`\`\``)
          .addField(":arrow_up: Output:", `\`\`\`js\n${clean(evaled)}\`\`\``)
          .setColor(3447003)
          .setFooter(`Evaled By: ${message.author.tag}`, message.author.displayAvatarURL)
        return message.channel.send({embed: embed});
      } catch (error) {
        const errorE = new Discord.RichEmbed()
          .addField(":arrow_down: Input:", `\`\`\`js\n${clean(code)}\`\`\``)
          .addField(":arrow_up: Output: (Error)", `\`\`\`js\n${clean(error)}\`\`\``)
          .setColor(0xff0000)
          .setFooter(`Evaled By: ${message.author.tag}`, message.author.displayAvatarURL)
        return message.channel.send({embed: errorE});
      }
      break;
    case "time":
      message.channel.send(`:alarm_clock: Current time: **${moment().format("hh:mm")}**`);
      break;
    case "purge":
      if (!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send(":no_entry_sign: You need `Manage Messages` to use this command.");
      message.delete();
      var count = parseInt(args[0]);
        if (isNaN(count)) return message.channel.send(":no_entry_sign: Please provide an amount of messages in numbers.");
        if (!count || count < 2 || count > 100) return message.channel.send(":no_entry_sign: Please provide an amount of messages, min 2, max 100.");
        message.channel.fetchMessages({limit: count}).then(ms => message.channel.bulkDelete(ms)).catch(err => {
          message.channel.send(":red_circle: Some messages could not be deleted because they are 14 days old or older.");
        })
      break;
    case "kick":
      if (!message.member.hasPermission("KICK_MEMBERS")) return message.channel.send(":no_entry_sign: You need `Kick Members` to use this command.");
      var user = message.mentions.users.first();
      var reason = args.slice(1).join(" ")
      if (message.mentions.users.size < 1) return message.channel.send(":no_entry_sign: Please mention a user.");
      if (user === message.author) return message.channel.send(":no_entry_sign: You cannot kick yourself.");
      if (user === client.user) return message.channel.send(":no_entry_sign: You cannot kick me.");
      if (reason.length === 0) reason = "None";
      message.channel.send(":red_circle: Do you want to kick " + user.tag + "? Confirm with `yes`. You have 25 seconds to respond with (y/n).");
      try {
        var yornoR = await message.channel.awaitMessages(c => c.author.id === message.author.id && c.content.toLowerCase() === "y" || c.content.toLowerCase() === "yes" || c.content.toLowerCase() === "n" || c.content.toLowerCase() === "no", {
          maxMatches: 1,
          time: 25000,
          errors: ["time"]
        });
        var cont = yornoR.first().content.toLowerCase();
        if (cont === "yes" || cont === "y") {
          if (!message.guild.member(user).kickable) return message.channel.send(":no_entry_sign: Failed to kick this user. They either have a higher role than me, or I don't have permissions to kick.");
          message.guild.member(user).kick(reason).then(() => {
            message.channel.send(":mans_shoe: Kicked " + user.tag + ".");
          })
        }
        if (cont === "no" || cont === "n") {
          return message.channel.send(":no_entry_sign: The moderator responded with `no`. The command has been cancelled.")
        }
    } catch (error) {
      console.error(error);
      return message.channel.send(":no_entry_sign: No response was entered. The command has been cancelled.")
    }

      break;
    case "vol":
    case "volume":
      if (!server) return message.channel.send(":no_entry_sign: No song is playing at the moment.");
      var vol = parseInt(args[0]);
      if (!vol || isNaN(vol)) return message.channel.send(`:loud_sound: Current volume: **${server.volume}%**`);
      else {
        if (!message.member.hasPermission("MOVE_MEMBERS")) return message.channel.send(":no_entry_sign: You need `Move Members` to change the volume.");
        if (vol > 10) return message.channel.send(":no_entry_sign: The new volume must be 10% or lower.");
        server.volume = vol;
        server.connection.dispatcher.setVolume(vol);
        server.connection.dispatcher.setVolumeLogarithmic(vol / 5);
        return message.channel.send(`:loud_sound: Successfully set the volume to **${vol}%**.`);
      }

      break;
      case "moneyflip":
        var money = ["Penny", "Nickel", "Dime", "Quarter", "Half Dollar", "Dollar"];
        var flipped = money[Math.floor(Math.random() * money.length)];
        message.channel.send(`:moneybag: The money that I flipped over to see was a **${flipped}**.`);
      break;
      case "ban":
      if (!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send(":no_entry_sign: You need `Ban Members` to use this command.");
      var banuser = message.mentions.users.first();
      var banreason = args.slice(1).join(" ")
      if (message.mentions.users.size < 1) return message.channel.send(":no_entry_sign: Please mention a user.");
      if (banuser === message.author) return message.channel.send(":no_entry_sign: You cannot ban yourself.");
      if (banuser === client.user) return message.channel.send(":no_entry_sign: You cannot ban me.");
      if (banreason.length === 0) banreason = "None";
      message.channel.send(":red_circle: Do you want to ban " + banuser.tag + "? Confirm with `yes`. You have 25 seconds to respond with (y/n).");
      try {
        var banyornoR = await message.channel.awaitMessages(c => c.author.id === message.author.id && c.content.toLowerCase() === "y" || c.content.toLowerCase() === "yes" || c.content.toLowerCase() === "n" || c.content.toLowerCase() === "no", {
          maxMatches: 1,
          time: 25000,
          errors: ["time"]
        });
        var bancont = banyornoR.first().content.toLowerCase();
        if (bancont === "yes" || bancont === "y") {
          if (!message.guild.member(banuser).bannable) return message.channel.send(":no_entry_sign: Failed to ban this user. They either have a higher role than me, or I don't have permissions to ban.");
          message.guild.member(banuser).ban(banreason).then(() => {
            message.channel.send(":hammer: Banned " + banuser.tag + ".");
          })
        }
        if (bancont === "no" || bancont === "n") {
          return message.channel.send(":no_entry_sign: The moderator responded with `no`. The command has been cancelled.")
        }
    } catch (error) {
      console.error(error);
      return message.channel.send(":no_entry_sign: No response was entered. The command has been cancelled.")
    }

      break;

    case "sinfo":
    case "guildinfo":
    case "serverinfo":
      var levels = [
        "None (Unrestricted)",
        "Low",
        "Medium",
        "(╯°□°）╯︵ ┻━┻ (High)",
        "┻━┻彡 ヽ(ಠДಠ)ノ彡┻━┻ (Very High/Extreme)"
      ];
      var regions = {
        brazil: ":flag_br: Brazil",
        'eu-central': ":flag_eu: Central Europe",
        hongkong: ":flag_hk: Hong Kong",
        russia: ":flag_ru: Russia",
        singapore: ":flag_sg: Singapore",
        sydney: ":flag_au: Sydney",
        'us-central': ":flag_us: Central United States",
        'us-east': ":flag_us: East United States",
        'us-south': ":flag_us: South United States",
        'us-west': ":flag_us: West United States",
        'eu-west': ":flag_eu: Europe (Western)",
      };
      var bans = await message.guild.fetchBans();
      const serverInfo = new Discord.RichEmbed()
        .setAuthor(`Information for ${message.guild.name}`, message.guild.iconURL)
        .addField("Name:", message.guild.name)
        .addField("Region:", regions[message.guild.region])
        .addField("ID:", message.guild.id)
        .addField("Verification Level:", levels[message.guild.verificationLevel])
        .addField("Owner:", message.guild.owner.user.tag)
        .addField("Bans:", bans.array().length, true)
        .addField("Created on:", message.guild.createdAt, true)
        .addField("Members:", `**Humans:** ${message.guild.members.filter(mem => !mem.user.bot).size}\n**Bots:** ${message.guild.members.filter(bot => bot.user.bot).size}\n**Total:** ${message.guild.memberCount}`, true)
        .addField("Channels:", `**Text:** ${message.guild.channels.filter(textChan => textChan.type === "text").size}\n**Voice:** ${message.guild.channels.filter(voiceChan => voiceChan.type === "voice").size}\n**Total:** ${message.guild.channels.size}`, true)
        .addField(`Roles: (${message.guild.roles.size})`, message.guild.roles.map(role => role.toString()).join(" "), true)
        .setColor(0xFFA500)
        .setFooter(`Requested By: ${message.author.tag}`, message.author.displayAvatarURL)
      message.channel.send({embed: serverInfo});
      break;
    case "uptime":
      var time;
      var uptime = parseInt(client.uptime);
      uptime = Math.floor(uptime / 1000);
      var hours = Math.floor(uptime / 3600);
      var minutes = Math.floor((uptime - (hours * 3600)) / 60);
      var seconds = uptime - (hours * 3600) - (minutes * 60);
      message.channel.send(`:alarm_clock: The bot's uptime is: **${hours} hours, ${minutes} minutes, and ${seconds} seconds**`);
      break;
    case "roll":
      var die = parseInt(args[0]);
      if (die) {
        var roll = Math.floor(Math.random() * die) + 1;
        message.channel.send(`:game_die: You rolled a: **${roll}**`);
      } else {
        var roll2 = Math.floor(Math.random() * 6) + 1;
        message.channel.send(`:game_die: You rolled a: **${roll2}**`);
      }
      break;
    case "uinfo":
    case "userinfo":
      var userToGet = args[0];
      var userI = client.users.get(userToGet);
      var statuses = {
        online: "Online",
        idle: "Idle",
        dnd: "Do Not Disturb",
        invisible: "Invisible",
        offline: "Offline"
      };
      if (!userToGet) userI = message.author;
      if (!message.mentions.users.size < 1) userI = message.mentions.users.first();
      if (!userI) return message.channel.send(":no_entry_sign: No results found for that user.");
      const userInfo = new Discord.RichEmbed()
        .setAuthor(`Information for ${userI.username}`, userI.displayAvatarURL)
        .addField("Username:", userI.username)
        .addField("Tag:", userI.tag)
        .addField("Discriminator:", userI.discriminator)
        .addField("Avatar ID:", getAvatarID(userI))
        .addField("ID:", userI.id)
        .addField("Playing:", getGame(userI))
        .addField("Status:", statuses[userI.presence.status])
        .setColor(0xFFA500)
        .setFooter(`Requested By: ${message.author.tag}`, message.author.displayAvatarURL)
      message.channel.send({embed: userInfo});
      break;
    case "avatar":
      var userToGet2 = args[0];
      var userI2 = client.users.get(userToGet2);
      if (!userToGet2) userI2 = message.author;
      if (!message.mentions.users.size < 1) userI2 = message.mentions.users.first();
      if (!userI2) return message.channel.send(":no_entry_sign: No results found for that user.");
      const avatarInfo = new Discord.RichEmbed()
        .setAuthor(`${userI2.username}'s Avatar:`)
        .setImage(userI2.displayAvatarURL)
        .setColor(0xFFA500)
        .setFooter(`Requested By: ${message.author.tag}`, message.author.displayAvatarURL)
      message.channel.send({embed: avatarInfo});
      break;
    case "ver":
    case "version":
      message.channel.send(`:arrow_up: The current version of Tech-a-Bot is: **${ver}**`)
      break;
    case "die":
      message.channel.send("no u");
      break;
    case "hackban":
      if (!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send(":no_entry_sign: You need `Ban Members` to use this command.");
      var memberToGet = args[0];
      var hackbanuser = client.users.get(memberToGet);
      var hackbanreason = args.slice(1).join(" ")
      if (!memberToGet) return message.channel.send(":no_entry_sign: Please provide an ID.");
      if (!hackbanuser) return message.channel.send(":no_entry_sign: No results found for that user.");
      if (hackbanuser.id === message.author.id) return message.channel.send(":no_entry_sign: You cannot hackban yourself.");
      if (hackbanuser.id === client.user.id) return message.channel.send(":no_entry_sign: You cannot hackban me.");
      message.channel.send(":red_circle: Do you want to hackban " + hackbanuser.tag + "? Confirm with `yes`. You have 25 seconds to respond with (y/n).");
      try {
        var hackbanyornoR = await message.channel.awaitMessages(o => o.author.id === o.author.id && o.content.toLowerCase() === "y" || o.content.toLowerCase() === "yes" || o.content.toLowerCase() === "n" || o.content.toLowerCase() === "no", {
          maxMatches: 1,
          time: 25000,
          errors: ["time"]
        });
        var hackbancont = hackbanyornoR.first().content.toLowerCase();
        if (hackbancont === "yes" || hackbancont === "y") {
          message.guild.ban(hackbanuser).then(() => {
            message.channel.send(":hammer: Hackbanned " + hackbanuser.tag + ".");
          })
        }
        if (hackbancont === "no" || hackbancont === "n") {
          return message.channel.send(":no_entry_sign: The moderator responded with `no`. The command has been cancelled.")
        }
    } catch (error) {
      console.error(error);
      return message.channel.send(":no_entry_sign: No response was entered. The command has been cancelled.")
    }
      break;
    case "embedsay":
      if (!args.join(" ")) return message.channel.send(":no_entry_sign: You provided nothing to embed say.");
      const embedSay = new Discord.RichEmbed()
        .setTitle("Embed Say")
        .setDescription(args.join(" "))
        .setColor(randomHex())
        .setFooter(`Said By: ${message.author.tag}`, message.author.displayAvatarURL)
      message.channel.send({embed: embedSay});
      break;
    case "about":
    case "info":
      const botInfo = new Discord.RichEmbed()
        .setAuthor(`Information for ${client.user.username}!`, client.user.displayAvatarURL)
        .addField("Bot Owner:", client.users.get(ownerId).tag, true)
        .addField("Version:", ver, true)
        .addField("Language:", "Node.JS\nDiscord.JS", true)
        .addField("Prefix:", prefix, true)
        .setDescription("**NOTE:** This bot is still under development. If you find any issues, be sure to let me know!")
        .addField("Useful Links!", "[Bot Invite Link](https://discordapp.com/oauth2/authorize?client_id=374319373487439884&scope=bot&permissions=8)\n[Owner's Discord Server](https://discord.gg/h3t9peK)")
        .setColor(0xFFA500)
        .setFooter(`Requested By: ${message.author.tag}`, message.author.displayAvatarURL)
      message.channel.send({embed: botInfo})
      break;
    case "rate":
      var rating = ratings[randomNumber(ratings.length)];
      if (!args.join(" ")) return message.channel.send("I would give nothing an: UnDaFiNed")
      message.channel.send(`I would give that a: ${rating}`);
      break;
    case "kiss":
      var userKissed = message.guild.members.random().displayName;
      message.channel.send(`I will make ${message.author.username} kiss **${userKissed}**!`)
      break;
    case "google":
      if (!args.join(" ")) return message.channel.send(":no_entry_sign: Please enter something to search.");
        google.search(args.join(" "), message.channel && message.channel.nsfw).then(({card, results}) => {
            if (card) {
              message.channel.send(card);
            } else if (results.length) {
              var linkIndex = 0;
              const found = new Discord.RichEmbed()
                .setDescription(`${results.length} results were found in total for the keyword "${args.join(" ")}".\n**Available Results:**\n${results.map(r => `**> #${++linkIndex}** ${r.text} (${r.link})`).join("\n")}`)
                .setColor(0xFFA500)
                .setFooter(`Requested By: ${message.author.tag}`, message.author.displayAvatarURL)
              message.channel.send({embed: found})
            } else {
              message.channel.send(":no_entry_sign: No results found for that keyword.");
            }
          });
        break;
    case "meme":
          message.channel.send(`**${message.guild.members.random().displayName}** is a meme`);
          break;
    case "spamfilter":
          if (!message.member.hasPermission("MANAGE_GUILD")) return message.reply(":no_entry_sign: You need `Manage Server` to use this command.");
          var set;
          if (args[0] === "on") set = true;
          else if (args[0] === "off") set = false;
          else return message.channel.send(`This server's spam filter is currently **${fetchSpamFilterStatus(message.guild)}**.`);

          guildData.spamFiltering = set;
          return message.channel.send(`This server's spam filter is now **${fetchSpamFilterStatus(message.guild)}**.`);
          break;
    case "setwarnings":
          if (!message.member.hasPermission("MANAGE_GUILD")) return message.reply(":no_entry_sign: You need `Manage Server` to use this command.");
          var newChannel = message.guild.channels.get(args[0]);
          if (!args[0]) {
            guildData.warningsChannel = null;
            message.channel.send("Successfully turned off the warnings channel.");
            return;
          }
          else if (message.mentions.channels.size > 0) {
            newChannel = message.mentions.channels.first();
          }
          else if (!newChannel) {
            message.channel.send(":no_entry_sign: No results found for that channel.");
            return;
          }

          guildData.warningsChannel = newChannel.id;
          return message.channel.send(`Set the warnings channel to ${newChannel.toString()}!`);
          break;
    case "reversesay":
          if (!args.join(" ")) return message.channel.send(":no_entry_sign: Nothing to reverse.");
          message.channel.send(reverse(args.join(" ")));
          break;
    case "toesay":
          if (!args.join(" ")) return message.channel.send(":no_entry_sign: This toe is stinky, but no text spray?");
          message.channel.send(toesay(args.join(" ")), {code: true});
          break;
    case "setstarboard":
          if (!message.member.hasPermission("MANAGE_GUILD")) return message.reply(":no_entry_sign: You need `Manage Server` to use this command.");
          var newChannel2 = message.guild.channels.get(args[0]);
          if (!args[0]) {
            guilds[message.guild.id].starboardChannel = null;
            message.channel.send("Successfully turned off the starboard channel.");
            return;
          }
          else if (message.mentions.channels.size > 0) {
            newChannel2 = message.mentions.channels.first();
          }
          else if (!newChannel2) {
            message.channel.send(":no_entry_sign: No results found for that channel.");
            return;
          }

          guilds[message.guild.id].starboardChannel = newChannel2.id;
          return message.channel.send(`Set the starboard channel to ${newChannel2.toString()}!`);
          break;
    case "invite":
       message.channel.send("Invite link to add me to your server! https://discordapp.com/oauth2/authorize?client_id=374319373487439884&permissions=8&scope=bot");
       break;
    case "mute":
      if (!message.member.hasPermission("MUTE_MEMBERS")) return message.channel.send(":no_entry_sign: You need `Mute Members` to use this command.");
      var muteuser = message.mentions.users.first();
      var time = parseInt(args.slice(1).join(" "));
      var muterole = message.guild.roles.find("name", "Muted");
      if (message.mentions.users.size < 1) return message.channel.send(":no_entry_sign: Please mention a user.");
      if (muteuser === message.author) return message.channel.send(":no_entry_sign: You cannot mute yourself.");
      if (muteuser === client.user) return message.channel.send(":no_entry_sign: You cannot mute me.");
      if (!muterole) return message.reply(":no_entry_sign: Sorry about this, but *gulp* you need a role called Muted to do the trick. DON'T REMOVE ME FOR THIS! HAVE MERCY!")
      if (!time) return message.reply(":no_entry_sign: You need to provide how long you want to mute this user.");
      if (message.guild.member(muteuser).roles.find("name", "Muted")) return message.reply(":no_entry_sign: This user already has been muted.");
      message.channel.send(":red_circle: Do you want to mute " + muteuser.tag + "? Confirm with `yes`. You have 25 seconds to respond with (y/n).");
      try {
        var muteyornoR = await message.channel.awaitMessages(c => c.author.id === message.author.id && c.content.toLowerCase() === "y" || c.content.toLowerCase() === "yes" || c.content.toLowerCase() === "n" || c.content.toLowerCase() === "no", {
          maxMatches: 1,
          time: 25000,
          errors: ["time"]
        });
        var mutecont = muteyornoR.first().content.toLowerCase();
        if (mutecont === "yes" || mutecont === "y") {
          message.guild.member(muteuser).addRole(muterole.id).then(() => {
            message.channel.send(":mute: Muted " + muteuser.tag + " for " + time + ".");
          })
          setTimeout(() => {
            message.guild.member(muteuser).removeRole(muterole.id).then(() => {
            message.channel.send(":loud_sound: Unmuted " + muteuser.tag + ".");
          })
        }, ms(time))
        }
        if (mutecont === "no" || mutecont === "n") {
          return message.channel.send(":no_entry_sign: The moderator responded with `no`. The command has been cancelled.")
        }
    } catch (error) {
      console.error(error);
      return message.channel.send(":no_entry_sign: No response was entered. The command has been cancelled.")
    }

      break;

    default:
      if (!cmd) return;
      matched = false;
      message.channel.send(`:no_entry_sign: Unknown command ${cmd}. For a list of commands, type **${prefix}help**.`);
  }
});

function randomNumber(next = 1) {
  if (typeof(next) !== "number") {
    throw new TypeError("Parameter \"next\" must be a number, not a string");
  }
  return Math.floor(Math.random() * next);
}

function randomHex() {
  return "#" + Math.floor(Math.random() * 16777215).toString(16);
}

function getAvatarID(user) {
  if (!user.avatar) return "Nothing";
  else return user.avatar;
}

function getGame(user) {
  if (!user.presence.game) return "Nothing";
  else return user.presence.game.name;
}

function getSecs(song) {
  if (song.duration.seconds === 0 || song.duration.seconds === 1 || song.duration.seconds === 2 || song.duration.seconds === 3 || song.duration.seconds === 4 || song.duration.seconds === 5 || song.duration.seconds === 6 || song.duration.seconds === 7 || song.duration.seconds === 8 || song.duration.seconds === 9) return `0${song.duration.seconds}`;
  else return song.duration.seconds;
}

function setRandomGame() {
  client.user.setPresence({
    game: {
      type: 0,
      name: games[Math.floor(Math.random() * games.length)]
    }
  })
}

function clean(text) {
  if (typeof(text) === "string") {
    return text.replace(/`/g, "`" + String.fromCharCode(8203));
  } else {
    return text;
  }
}

function playSong(guild, song) {
  var server = servers.get(guild.id);

  if (!song) {
    server.textChannel.send("Music stopped because of an empty queue.");
    server.voiceChannel.leave();
    servers.delete(guild.id);
    return;
  }

  var dispatcher = server.connection.playStream(ytdl(song.url, {
    filter: "audioonly",
    quality: "lowest"
  }))
  .on("end", reason => {
    if (reason === "Stream is not generating quickly enough.") server.textChannel.send(`Music stopped, now playing the next song in the queue.`);
    else console.log(reason);
    server.queue.shift();
    playSong(guild, server.queue[0]);
  })
  .on("error", err => {
    return console.error(`:no_entry_sign: An unexpected error has occurred!\n\`\`\`${err.stack}\`\`\``);
  });
  dispatcher.setVolumeLogarithmic(server.volume / 5);
  server.playing = true;

  server.textChannel.send(`:musical_note: Now Playing: **${song.title}** (\`${song.minutes}:${song.seconds}\`) - Requested by: **${song.requester.tag}**`)
}

function fetchSpamFilterStatus(g) {
  var guild = guilds[g.id];

  if (guild.spamFiltering) return "on";
  else return "off";
}

async function handleVid(video, message, voiceChannel, playlist = false) {
  var server = servers.get(message.guild.id);
  var song = {
    title: video.title,
    id: video.id,
    url: `https://www.youtube.com/watch?v=${video.id}`,
    requester: message.author,
    minutes: video.duration.minutes,
    seconds: getSecs(video)
  };
  if (!server) {
    var serverC = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      queue: [],
      volume: 5,
      playing: true
    };
    servers.set(message.guild.id, serverC);

    serverC.queue.push(song);

  try {
    var connection = await voiceChannel.join();
    serverC.connection = connection;
    playSong(message.guild, serverC.queue[0]);
  } catch (error) {
    console.error(error.stack);
    servers.delete(message.guild.id);
    return message.channel.send(`:no_entry_sign: An unexpected error has occurred.\n\`\`\`${error}\`\`\``);
  }
} else {
  server.queue.push(song);
  if (playlist) return;
  else return message.channel.send(`:musical_note: Enqueued: **${song.title}** (\`${song.minutes}:${song.seconds}\`) - Requested by: **${message.author.tag}**`);
}
}

client.login(process.env.BOT_TOKEN);
