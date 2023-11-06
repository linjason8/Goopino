const eris = require('eris');
const { EmbedBuilder, PermissionsBitField, IntegrationExpireBehavior } = require('discord.js');
const axios = require('axios')
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');

const { MongoClient, ServerApiVersion, ReturnDocument } = require('mongodb');
const uri = "mongodb+srv://jason:JasonPassword123@cluster0.8njyfao.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const jsdom = require("jsdom");
const e = require('express');
const { JSDOM } = jsdom;
const dom = new JSDOM(`<!DOCTYPE html><p></p>`);

const bot = new eris.Client('MTA1Nzg2MDY3Nzk0OTIxNDc5MA.GGywH9.hJJpeEP3rS0Cv5WQOv8GeLdV00cz1fzDvvJMjQ');

const errorMsg = ":warning:\u200b \u200b Incorrect usage: **!help [command]** for more info";
let songsFull = new Array(100);
let songsTitle = new Array(100);
let pollRes = new Array(100);
let curRec = 0;
let curPoll = 0;
let collection;
let pollLabels = ["A)\u200b \u200b ", "B)\u200b \u200b ", "C)\u200b \u200b ", "D)\u200b \u200b ", "E)\u200b \u200b "];

bot.on('ready', () => {
    initDB();
    console.log('Connected');
});

bot.on('messageCreate', async (msg) => {
    checkCommands(msg);
});

bot.on('error', err => {
    console.warn(err);
});

bot.on(Events.InteractionCreate, interaction => {
    if (interaction.message) {
        const arr = interaction.data.custom_id.split(" ");

        if (arr[0] === "Song") {
            choseSong(interaction.message, arr[2], arr[1]);
            interaction.message.delete();
        } else if (arr[0] === "lvlY") {
            if (arr[1] === interaction.member.username) {
                prestigeSuccess(interaction.message, arr[1]);
            } else {
                if (!interaction.message.content.includes("Only")) {
                    interaction.message.edit(interaction.message.content + "\nOnly " + arr[1] + " can click these buttons!");
                }
            }
        } else if (arr[0] === "lvlN") {
            if (arr[1] === interaction.member.username) {
                interaction.message.edit({ components: [], content: ":x:\u200b \u200b Prestige Canceled!" })
            } else {
                if (!interaction.message.content.includes("Only")) {
                    interaction.message.edit(interaction.message.content + "\nOnly " + arr[1] + " can click these buttons!");
                }
            }
        } else if (arr[0] === "poll") {
            let pollNum = Number(arr[2]);
            if(!pollRes[pollNum].includes(interaction.member.username)){
                pollRes[pollNum] += interaction.member.username;
                interaction.channel.createMessage("vote registered");
            } else{
                interaction.channel.createMessage("already voted");
            }
        }

        interaction.acknowledge();
    }
});

bot.connect();

async function initDB() {
    await client.connect();
    collection = client.db("Bot").collection("Users");
}

async function checkCommands(msg) {
    let content = msg.content;
    const isCommand = content.charAt(0) == '!';

    if (isCommand) {
        try {
            const wordArr = content.split(" ");

            const lower = wordArr[0].toLowerCase();

            if (lower === "!help") {
                help(msg, wordArr);
            } else if (lower === "!coinflip" || lower === "!cf") {
                cf(msg, wordArr);
            } else if (lower === "!profile") {
                profile(msg, wordArr);
            } else if (lower === "!recommend" || lower === "!rec") {
                if (wordArr.length == 1) {
                    rec(msg, "");
                    return;
                }
                rec(msg, content.substring(content.indexOf(' ') + 1));
            } else if (lower === "!balance" || lower === "!bal") {
                showBal(msg, wordArr);
            } else if (lower === "!gamble") {
                gamble(msg, wordArr);
            } else if (lower === "!mine") {
                mine(msg, wordArr);
            } else if (lower === "!prestige") {
                prestige(msg, wordArr);
            } else if (lower === "!avatar") {
                avatar(msg, wordArr);
            } else if (lower === "!poll") {
                if (wordArr.length == 1) {
                    poll(msg, "");
                    return;
                }
                poll(msg, content.substring(content.indexOf(' ') + 1));
            }
        } catch (err) {
            console.warn(err);
        }
    }
}

async function poll(msg, txt) {
    let q = txt.indexOf("Q:");
    let a = txt.indexOf(" A:");
    if (q != 0 || a == -1) {
        await msg.channel.createMessage(errorMsg);
        return;
    }

    let ans = txt.substring(a + 3).trim();
    let arr = ans.split(";");
    console.log(arr);
    if (arr.length > 5) {
        await msg.channel.createMessage(":warning:\u200b \u200b You must provide between 1-5 response options");
        return;
    }

    let ansStr = "";

    let row = new ActionRowBuilder();

    for (let i = 0; i < arr.length; i++) {
        ansStr += pollLabels[i] + arr[i] + "\n";
        row.addComponents(new ButtonBuilder()
            .setCustomId('poll '+ i + ' ' + curPoll)
            .setLabel(pollLabels[i].charAt(0))
            .setStyle(ButtonStyle.Primary));
    }
    
    pollRes[curPoll] = "00000";
    curPoll++;

    const pollEmbed = new EmbedBuilder()
        .setColor(0x00D3DD)
        .setAuthor({ name: msg.author.username + "'s Poll", iconURL: msg.author.avatarURL })
        .setTitle(txt.substring(2, a).trim() + "\n\n" + ansStr)
        .setTimestamp()
        .setFooter({ text: bot.user.username + " on " + msg.channel.guild.name, iconURL: msg.channel.guild.iconURL });

    await msg.channel.createMessage({ embeds: [pollEmbed], components: [row] })
        .then(newMsg => {
            setTimeout(() => newMsg.delete(), 10000)
        });

}

async function avatar(msg, arr) {
    if (arr.length == 1) {
        avatarEmbed(msg, msg.author);
    } else if (arr.length == 2 && msg.mentions.length == 1) {
        avatarEmbed(msg, msg.mentions[0]);
    } else {
        msg.channel.createMessage(errorMsg);
    }
}

async function avatarEmbed(msg, user) {
    const avatarEmbed = new EmbedBuilder()
        .setColor(0x7623FE)
        .setAuthor({ name: user.username + "'s Avatar", iconURL: bot.user.avatarURL })
        .setImage(user.avatarURL)
        .setTimestamp()
        .setFooter({ text: bot.user.username + " on " + msg.channel.guild.name, iconURL: msg.channel.guild.iconURL });

    await msg.channel.createMessage({ embeds: [avatarEmbed] });
}

async function prestige(msg, arr) {
    if (arr.length == 1) {
        const findResult = await collection.find({ User: msg.author.username }).toArray();
        if (findResult.length == 0) {
            await msg.channel.createMessage(":cry:\u200b \u200b No profile found for **" + msg.author.username + "**! use `!profile` to create a profile!");
            return;
        } else {
            let lvl = findResult[0].Lvl;
            let cost = Math.pow(10, Math.ceil(lvl / 2) + 2);
            if (lvl % 2 == 0) {
                cost *= 5;
            }

            let row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('lvlY ' + msg.author.username)
                        .setLabel('Confirm')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('lvlN ' + msg.author.username)
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Danger),
                );

            msg.channel.createMessage({
                content: ":arrow_up:\u200b \u200b Prestige to level " + (lvl + 1) + "? **Cost: $ " + cost.toLocaleString() + "**",
                components: [row]
            });

            return;
        }
    }

    await msg.channel.createMessage(errorMsg);
}

async function prestigeSuccess(msg, user) {
    const findResult = await collection.find({ User: user }).toArray();

    let lvl = findResult[0].Lvl;
    let cost = Math.pow(10, Math.ceil(lvl / 2) + 2);
    if (lvl % 2 == 0) {
        cost *= 5;
    }

    if (findResult[0].Bal < cost) {
        msg.edit({ components: [], content: ":x:\u200b \u200b Prestige Failed! Insufficient Funds" });
    } else {
        msg.edit({ components: [], content: ":dove:\u200b \u200b Prestige Success! " + user + " is now **Level " + (lvl + 1) + "!**" });
        const updateResult = collection.updateOne({ User: user }, { $inc: { Bal: (0 - cost), Lvl: 1 } });
    }
}

async function mine(msg, arr) {
    const findResult = await collection.find({ User: msg.author.username }).toArray();
    if (findResult.length == 0) {
        await msg.channel.createMessage(":cry:\u200b \u200b Can't mine because no profile found for **" + msg.author.username + "**! use `!profile` to create a profile!");
        return;
    }

    if (arr.length != 1) {
        await msg.channel.createMessage(errorMsg);
        return;
    }

    if (Math.floor(Math.random() * 3) == 0) {
        await msg.channel.createMessage(":bone:\u200b \u200b **Unlucky.** " + msg.author.username + " found nothing.");
    } else if (Math.floor(Math.random() * 20) == 0) {
        let money = Math.floor(Math.random() * 1001) + 1000;
        money *= Math.floor(Math.pow(2.5, findResult[0].Lvl - 1));
        await msg.channel.createMessage(":gem:\u200b \u200b **Jackpot!** " + msg.author.username + " found **$ **" + money.toLocaleString());
        const updateResult = await collection.updateOne({ User: msg.author.username }, { $inc: { Bal: money } });
    } else {
        let money = Math.floor(Math.random() * 99) + 1;
        money *= Math.floor(Math.pow(2.5, findResult[0].Lvl - 1));
        await msg.channel.createMessage(":rock:\u200b \u200b **Lucky!** " + msg.author.username + " found **$ **" + money.toLocaleString());
        const updateResult = await collection.updateOne({ User: msg.author.username }, { $inc: { Bal: money } });
    }
}

async function gamble(msg, arr) {
    if (arr.length != 2 || !Number.isInteger(Number(arr[1]))) {
        await msg.channel.createMessage(errorMsg);
        return;
    }

    let bet = Number(arr[1]);
    const findResult = await collection.find({ User: msg.author.username }).toArray();
    if (findResult.length == 0) {
        await msg.channel.createMessage(":cry:\u200b \u200b No balance found for **" + msg.author.username + "**! use `!profile` to create a profile!");
        return;
    }
    let bal = findResult[0].Bal;
    if (bet <= 0) {
        await msg.channel.createMessage(":warning:\u200b \u200b Bet must be a positive amount");
        return;
    }
    if (bet > bal) {
        await msg.channel.createMessage(":warning:\u200b \u200b Insufficient Funds");
        return;
    }

    if (Math.floor(Math.random() * 2) == 0) {
        await msg.channel.createMessage(":confetti_ball:\u200b \u200b **Congratulations!** You won **$ **" + bet.toLocaleString());
        const updateResult = await collection.updateOne({ User: msg.author.username }, { $set: { Bal: bal + bet } });
    } else {
        await msg.channel.createMessage(":cry:\u200b \u200b **Unlucky.** You lost **$ **" + bet.toLocaleString());
        const updateResult = await collection.updateOne({ User: msg.author.username }, { $set: { Bal: bal - bet } });
    }
}

async function showBal(msg, arr) {
    if (arr.length == 1) {
        let user = msg.author;
        const findResult = await collection.find({ User: user.username }).toArray();
        if (findResult.length == 0) {
            await msg.channel.createMessage(":cry:\u200b \u200b No balance found for **" + user.username + "**! use `!profile` to create a profile!");
        } else {
            await msg.channel.createMessage(":dollar:\u200b \u200b Current balance for **" + user.username + "**: $ " + findResult[0].Bal.toLocaleString());
        }
        return;
    } else if (arr.length == 2 && msg.mentions.length != 0) {
        let user = msg.mentions[0];
        const findResult = await collection.find({ User: user.username }).toArray();
        if (findResult.length == 0) {
            await msg.channel.createMessage(":cry:\u200b \u200b No balance found for **" + user.username + "**! Tell them to use `!profile` to create a profile!");
        } else {
            await msg.channel.createMessage(":dollar:\u200b \u200b Current balance for **" + user.username + "**: $ " + findResult[0].Bal.toLocaleString());
        }
        return;
    }
    await msg.channel.createMessage(errorMsg);
    return;
}

async function help(msg, arr) {
    try {
        if (arr.length == 2) {
            const lower = arr[1].toLowerCase();
            if (lower === "coinflip" || lower === "cf") {
                helpEmbed(msg, "Coinflip",
                    "`!coinflip {number}` or `!cf {number}` to flip coin *\"number\"* times",
                    "If no number given, defaults to 1\n*Number must be less than 1,000,000*");
                return;
            } else if (lower === "profile") {
                helpEmbed(msg, "Profile",
                    "`!profile {@User}` to show user profile\n`!profile description/desc [Description]` to change profile description",
                    "{@User} is an optional parameter (if none, shows self)\nDescription can have spaces");
                return;
            } else if (lower === "recommend" || lower === "rec") {
                helpEmbed(msg, "Recommend",
                    "`!recommend [song]` or `!rec [song]` to find songs similar to [song]",
                    "[song] is a required parameter\n[song] can contain spaces\n[song] can be title/artist (search query)");
                return;
            } else if (lower === "balance" || lower === "bal") {
                helpEmbed(msg, "Balance",
                    "`!balance {@User}` or `!bal {@User}` to view balance of @User",
                    "{@User} is an optional parameter (if none, shows self)");
                return;
            } else if (lower === "gamble") {
                helpEmbed(msg, "Gamble",
                    "`!gamble [bet]` to gamble [bet] amount from balance",
                    "[bet] must be a positive integer that you can afford");
                return;
            } else if (lower === "mine") {
                helpEmbed(msg, "Mine",
                    "`!mine` to mine for money'",
                    "Small chance to win jackpot!\n`!prestige` increases rewards from mining");
                return;
            } else if (lower === "prestige") {
                helpEmbed(msg, "Prestige",
                    "`!prestige` to level profile up",
                    "Increases value of mining");
                return;
            } else if (lower === "avatar") {
                helpEmbed(msg, "Avatar",
                    "`!avatar` {@User} to view avatar for User",
                    "{@User} is an optional parameter (if none, shows self)");
                return;
            }
        }

        const genHelp = new EmbedBuilder()
            .setColor(0xFF9393)
            .setAuthor({ name: bot.user.username + ' Command Help', iconURL: bot.user.avatarURL })
            .setDescription('**Command Usage**\n`![command] {optional arguments}` to use bot commands\n`!help [command]` for more info on command usage')
            .addFields({ name: '**Full Command List**', value: '`help` \n`coinflip` `cf` \n`profile` `avatar`\n `prestige` `balance` `bal` `mine` `gamble`\n`recommend` `rec`' })
            .setTimestamp()
            .setFooter({ text: bot.user.username + " on " + msg.channel.guild.name, iconURL: msg.channel.guild.iconURL });

        await msg.channel.createMessage({ embeds: [genHelp] });
    } catch (err) {
        console.warn(err);
    }
}

async function helpEmbed(msg, cmd, desc, note) {
    const helpEmbed = new EmbedBuilder()
        .setColor(0xFF9393)
        .setAuthor({ name: cmd + ' Help', iconURL: bot.user.avatarURL })
        .setDescription('**Command Usage**\n' + desc)
        .addFields({ name: "Notes", value: note })
        .setTimestamp()
        .setFooter({ text: bot.user.username + " on " + msg.channel.guild.name, iconURL: msg.channel.guild.iconURL });

    await msg.channel.createMessage({ embeds: [helpEmbed] });
}

async function cf(msg, arr) {
    try {
        if (arr.length == 1 || arr.length == 2) {
            let count = 1;
            if (arr.length == 2) {
                count = Number(arr[1]);
                if (!(Number.isInteger(count) && count > 0) || count > 1_000_000) {
                    await msg.channel.createMessage(errorMsg);
                    return;
                }
            }
            let heads = 0;
            for (let i = 0; i < count; i++) {
                if (Math.floor(Math.random() * 2) == 0) heads++;
            }
            await msg.channel.createMessage(":coin: Flipped coin " + count + " time(s): **" + heads + "** heads and **" + (count - heads) + "** tails");
        } else {
            await msg.channel.createMessage(errorMsg);
            return;
        }
    } catch (err) {
        console.warn(err);
    }
}

async function profile(msg, arr) {
    try {
        if (arr.length == 1) {
            const findResult = await collection.find({ User: msg.author.username }).toArray();
            let desc = "Nothing to see here!";
            let bal = 100;
            let lvl = 1;
            if (findResult.length == 0) {
                const insertResult = await collection.insertMany([{ User: msg.author.username, Desc: "Nothing to see here!", Bal: 100, Lvl: 1 }]);
            } else {
                desc = findResult[0].Desc;
                bal = findResult[0].Bal;
                lvl = findResult[0].Lvl;
            }

            showProfile(msg.channel, msg.author.username, desc, bal, msg.author.avatarURL, lvl);

        } else if (arr[1].toLowerCase() === "desc" || arr[1].toLowerCase() === "description") {
            const subArr = arr.slice(2);
            const str = subArr.join(" ");
            const findResult = await collection.find({ User: msg.author.username }).toArray();
            if (findResult.length == 0) {
                const insertResult = await collection.insertMany([{ User: msg.author.username, Desc: str, Bal: 100, Lvl: 1 }]);
            } else {
                const updateResult = await collection.updateOne({ User: msg.author.username }, { $set: { Desc: str } });
            }

            await msg.channel.createMessage(":white_check_mark:\u200b \u200b Description for **" + msg.author.username + "'s Profile** successfully updated!");
        } else {
            if (arr.length == 2 && msg.mentions.length != 0) {
                let user = msg.mentions[0];
                const findResult = await collection.find({ User: user.username }).toArray();
                if (findResult.length == 0) {
                    await msg.channel.createMessage(":cry:\u200b \u200b No profile found for **" + user.username + "**! Tell them to use `!profile` to create one!");
                } else {
                    showProfile(msg.channel, user.username, findResult[0].Desc, findResult[0].Bal, user.avatarURL, findResult[0].Lvl);
                }
                return;
            }
            await msg.channel.createMessage(errorMsg);
            return;
        }
    } catch (err) {
        console.warn(err);
    }
}

async function showProfile(channel, name, desc, bal, avatar, lvl) {
    const profileEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setAuthor({ name: name + "'s Profile", iconURL: avatar })
        .setDescription(':pencil:\u200b \u200b **Description**\n' + desc + "\n\n:dollar:\u200b \u200b **Balance** \n$ " + bal.toLocaleString() + "\n\n:dove:\u200b \u200b **Prestige**\nLevel: " + lvl)
        .setThumbnail(avatar)
        .setTimestamp()
        .setFooter({ text: name, iconURL: avatar });

    await channel.createMessage({ embeds: [profileEmbed] });
}

async function rec(msg, songName) {
    try {
        if (songName != null && songName.trim() != "") {
            songName = songName.replace(" ", "+").toLowerCase();
            await axios.get('https://songslikex.com/?song=' + songName)
                .then((response) => {
                    let res = response.data;
                    songsFull[curRec] = [];
                    songsTitle[curRec] = [];
                    for (let i = 0; i < 5; i++) {
                        songsFull[curRec].push(res.substring(res.indexOf('<li class="song">'), res.indexOf('</li>')));
                        songsTitle[curRec].push(decode(songsFull[curRec][i].substring(songsFull[curRec][i].indexOf("<span>") + 6, songsFull[curRec][i].indexOf("</span>"))));

                        res = res.substring(res.indexOf('</li>') + 1);
                    }

                    const songChoiceEmbed = new EmbedBuilder()
                        .setColor(0x00C703)
                        .setAuthor({ name: "Choose Song", iconURL: bot.user.avatarURL })
                        .setDescription(':loud_sound:\u200b \u200b **Select a song below**\n' +
                            '\n **1)\u200b \u200b ' + songsTitle[curRec][0] + "**" +
                            '\n **2)\u200b \u200b ' + songsTitle[curRec][1] + "**" +
                            '\n **3)\u200b \u200b ' + songsTitle[curRec][2] + "**" +
                            '\n **4)\u200b \u200b ' + songsTitle[curRec][3] + "**" +
                            '\n **5)\u200b \u200b ' + songsTitle[curRec][4] + "**"
                        )
                        .setThumbnail('https://www.freepnglogos.com/uploads/spotify-logo-png/spotify-download-logo-30.png')
                        .setTimestamp()
                        .setFooter({ text: bot.user.username + " on " + msg.channel.guild.name, iconURL: msg.channel.guild.iconURL });

                    let row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('Song 0 ' + curRec)
                                .setLabel('1')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('Song 1 ' + curRec)
                                .setLabel('2')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('Song 2 ' + curRec)
                                .setLabel('3')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('Song 3 ' + curRec)
                                .setLabel('4')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('Song 4 ' + curRec)
                                .setLabel('5')
                                .setStyle(ButtonStyle.Primary),
                        );

                    msg.channel.createMessage({
                        embeds: [songChoiceEmbed],
                        components: [row]
                    });

                    curRec = (curRec + 1) % 100;
                })
                .catch((error) => {
                    console.error(error)
                });
        } else {
            await msg.channel.createMessage(errorMsg);
            return;
        }
    } catch (err) {
        console.warn(err);
    }
}

async function choseSong(msg, ind0, ind) {
    let link = songsFull[ind0][ind].substring(songsFull[ind0][ind].indexOf('href="') + 6);
    link = "https://songslikex.com" + link.substring(0, link.indexOf('">'));

    await axios.get(link)
        .then((response) => {
            let res = response.data;
            let recSongs = [[], [], [], [], []];
            for (let i = 0; i < 5; i++) {
                let song = res.substring(res.indexOf('<li>'), res.indexOf('</li>'));
                song = song.substring(song.indexOf('</div><div>') + 11);
                recSongs[i].push(decode(song.substring(0, song.indexOf('</div>'))));


                song = song.substring(song.indexOf('</div>') + 6);
                recSongs[i].push(decode(song.substring(song.indexOf('">') + 2, song.indexOf('</div>'))));

                song = song.substring(song.indexOf('</div>') + 6);
                recSongs[i].push(decode(song.substring(song.indexOf('">') + 2, song.indexOf('</div>'))));

                res = res.substring(res.indexOf('</li>') + 1);
            }

            let links = [];
            let begURL = "https://open.spotify.com/search/";
            for (let i = 0; i < 5; i++) {
                let songStr = (recSongs[i][0] + ' ' + recSongs[i][1]).replaceAll(" ", "%20");
                links.push(begURL + songStr);
            }

            const songChoiceEmbed = new EmbedBuilder()
                .setColor(0x00C703)
                .setAuthor({ name: "Song Recommendations", iconURL: bot.user.avatarURL })
                .setDescription(':loud_sound:\u200b \u200b **Songs similar to:**\u200b \u200b *' + songsTitle[ind0][ind] + "*\n\u200b \u200b \n")
                .addFields(
                    { name: recSongs[0][0] + '\u200b \u200b -\u200b \u200b ' + recSongs[0][1] + '\u200b \u200b (' + recSongs[0][2] + ')', value: ":musical_note:\u200b \u200b [Spotify Link](" + links[0] + ")" },
                    { name: recSongs[1][0] + '\u200b \u200b -\u200b \u200b ' + recSongs[1][1] + '\u200b \u200b (' + recSongs[1][2] + ')', value: ":musical_note:\u200b \u200b [Spotify Link](" + links[1] + ")" },
                    { name: recSongs[2][0] + '\u200b \u200b -\u200b \u200b ' + recSongs[2][1] + '\u200b \u200b (' + recSongs[2][2] + ')', value: ":musical_note:\u200b \u200b [Spotify Link](" + links[2] + ")" },
                    { name: recSongs[3][0] + '\u200b \u200b -\u200b \u200b ' + recSongs[3][1] + '\u200b \u200b (' + recSongs[3][2] + ')', value: ":musical_note:\u200b \u200b [Spotify Link](" + links[3] + ")" },
                    { name: recSongs[4][0] + '\u200b \u200b -\u200b \u200b ' + recSongs[4][1] + '\u200b \u200b (' + recSongs[4][2] + ')', value: ":musical_note:\u200b \u200b [Spotify Link](" + links[4] + ")" }
                )
                .setThumbnail('https://www.freepnglogos.com/uploads/spotify-logo-png/spotify-download-logo-30.png')
                .setTimestamp()
                .setFooter({ text: bot.user.username + " on " + msg.channel.guild.name, iconURL: msg.channel.guild.iconURL });

            msg.channel.createMessage({
                embeds: [songChoiceEmbed]
            });

        })
        .catch((error) => {
            console.error(error)
        });
}

function decode(html) {
    var txt = dom.window.document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
};