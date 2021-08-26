import { gameModes } from "../../assets/gameModes";
import { lobbyTypes } from "../../assets/lobbyTypes";
import { UserModel } from "../../database/User";
import { Command } from "../../types/Command";
import { IUser } from "../../types/interfaces/Mongoose";
import { IDotaProfile, IOpenDotaHero } from "../../types/interfaces/OpenDota";
import { Message } from "discord.js";
import { MessageEmbed } from "discord.js";
import fetch from "node-fetch";

export default class Profile extends Command {
  name = "profile";
  visible = true;
  description = "Uses opendota API to collect general information on player";
  information =
    "Given a steamID, return general info about the player. If your steamID is saved with the id command, then the steamID argument is not required. \nThe steamID should consist of only numbers and be the number that you see as your steam friend id or in your steam URL, or the number at the end of your dotabuff/ opendota URL.";
  aliases: string[] = [];
  args = false;
  usage = "[Steam32 ID]";
  example = "193480093";
  cooldown = 0;
  category = "dota";
  guildOnly = false;
  execute = async (message: Message, args: string[]): Promise<Message> => {
    message.channel.startTyping();

    // Checks for id
    let id = args[0];
    if (!id) {
      const details = await this.discordToSteamID(message.author.id);
      if (details) {
        id = details.steamID;
      } else {
        return this.invalidDatabaseResponse(message);
      }
    }
    const url = "https://api.opendota.com/api/";

    // 0: Basic information
    // 1: Won and lost game totals
    // 2: Top heroes
    // 3: Hero names
    // 4: Hero rankings
    // 5: Most recent match data
    Promise.all([
      fetch(`${url}players/${id}`),
      fetch(`${url}players/${id}/wl`),
      fetch(`${url}players/${id}/heroes`),
      fetch(`${url}heroes`),
      fetch(`${url}players/${id}/rankings`),
      fetch(`${url}players/${id}/recentMatches`),
    ])
      // Check for valid response
      .then((responses) => this.checkAPIResponse(responses))

      // Convert data to .json
      .then((responses) =>
        Promise.all(responses.map((response) => response.json()))
      )

      // Extract and format data
      .then((data) => this.formatData(data))

      // Add data onto embed
      .then((playerData) =>
        this.sendEmbed(message, playerData, playerData.recent)
      )

      // Catch errors
      .catch((error) => {
        this.stopTypingAndSend(message.channel, `There was an error: ${error}`);
      });
  };

  // Check the status code of the API response
  private checkAPIResponse(responses) {
    // Takes a long time to loop, can be optimised
    for (const response of responses) {
      if (response.status !== 200) {
        throw Error("Invalid API response, check that the id was correct!");
      }
    }
    return responses;
  }

  // Collect data from opendota api and return object containing data
  private formatData(data) {
    // Destructure data
    const [profile, wl, playerHeroes, heroes, rankings, recentMatches] = data;

    // Check for missing profile data
    if (!profile || !profile.profile) {
      throw Error(
        "Unable to retrieve dota profile. Is your profile public and have you played matches?"
      );
    }

    // Profile details
    const p = profile;
    p.w = wl.win;
    p.l = wl.lose;
    p.wr = ((100 * p.w) / (p.w + p.l)).toPrecision(4);
    if (!p.profile.loccountrycode) p.profile.loccountrycode = "Unknown";

    // Top 3 heroes
    p.heroes = [];
    for (let i = 0; i < 3; i++) {
      p.heroes.push(playerHeroes[i]);
      p.heroes[i].name = this.idToHeroName(heroes, playerHeroes[i].hero_id);
      p.heroes[i].winAs = (
        (100 * p.heroes[i].win) /
        p.heroes[i].games
      ).toPrecision(2);
      p.heroes[i].percentile = this.idToHeroRanking(
        rankings,
        p.heroes[i].hero_id
      );
    }

    // Most recent match
    p.recent = recentMatches[0];
    p.recent.time = new Date(p.recent.start_time * 1000)
      .toString()
      .substr(0, 15);
    p.recent.skill = ["invalid", "normal", "high", "very high"][p.recent.skill];
    p.recent.hero = this.idToHeroName(heroes, p.recent.hero_id);
    try {
      p.recent.game_mode = gameModes[p.recent.game_mode].replace(/_/g, " ");
    } catch {
      p.recent.game_mode = "";
    }
    try {
      p.recent.lobby_type = lobbyTypes[p.recent.lobby_type].replace(/_/g, " ");
    } catch {
      p.recent.lobby_type = "";
    }
    if (p.recent.lobby_type === "" && p.recent.game_mode === "") {
      p.recent.lobby_type = "match";
    }

    // Check if they've won or lost
    const won =
      p.recent.player_slot < 6 ? p.recent.radiant_win : !p.recent.radiant_win;
    p.recent.outcome = won ? "Won" : "Lost";

    return p;
  }

  /**
   * Sent the embed with the dota player's profile and most recent match stats
   *
   * @param message
   * @param player
   * @param match
   */
  private sendEmbed(message: Message, player, match): Promise<Message> {
    const profileEmbed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle(`${player.profile.personaname}`)
      .setURL(`https://www.opendota.com/players/${player.profile.account_id}`)
      .setDescription(
        `Medal: **${this.medal(player)}**
        MMR Estimate: **${player.mmr_estimate.estimate}**
        Country: **${player.profile.loccountrycode}**`
      )
      .setThumbnail(player.profile.avatarfull)
      .setTimestamp()
      .setFooter(
        `Source: Opendota | Total Processing Time: ${
          Date.now() - message.createdTimestamp
        } ms`,
        "https://pbs.twimg.com/profile_images/962444554967203840/G6KHe1q3.jpg"
      )
      .addFields({
        name: "**General Match Data**",
        value: `Total: **${player.w + player.l}** | Won: **${
          player.w
        }** | Lost: **${player.l}** | Winrate: **${player.wr}%**\n`,
      });

    // Add player's top three heroes
    for (const hero of player.heroes) {
      profileEmbed.addFields({
        name: `**${hero.name}**`,
        value: `
          Games: **${hero.games}**
          Win as: **${hero.winAs}%**
          Percentile: **${hero.percentile}**`,
        inline: true,
      });
    }

    // Add most recent match data
    profileEmbed.addFields({
      name: "**Most Recent Match**",
      value: `
      **${match.outcome}** playing a **${match.skill}** skill **${
        match.lobby_type
      } ${match.game_mode}** as **${match.hero}**
      KDA: **${match.kills}/${match.deaths}/${match.assists}** | GPM: **${
        match.gold_per_min
      }** | XPM: **${match.xp_per_min}**
      Date: **${match.time}** | Duration: **${this.formatDuration(
        match.duration
      )}**`,
    });

    return this.stopTypingAndSend(message.channel, profileEmbed);
  }

  /**
   * Send a message notifying of an invalid database response
   *
   * @param message the original message that triggered this command
   * @returns a promise to the new message sent
   */
  private invalidDatabaseResponse(message: Message): Promise<Message> {
    let response = `${message.author} Invalid response from database. `;
    response +=
      "Either you haven't added your id, or there was a database error. ";
    response += "You can add you id with the steamid command!";
    return this.stopTypingAndSend(message.channel, response);
  }

  // Return a hero ranking given the hero id and list of ranking details
  private idToHeroRanking(rankings, heroId: string): string {
    for (const ranking of rankings) {
      // console.log(ranking);
      if (parseInt(ranking.hero_id) === parseInt(heroId)) {
        return `${+(100 * ranking.percent_rank).toFixed(2)}%`;
      }
    }
    return "Unknown";
  }

  /**
   * Get the hero with the corresponding hero id
   *
   * @param heroes the list of hero data
   * @param heroId the id of the relevant hero
   * @returns the hero
   */
  private idToHeroName(heroes: IOpenDotaHero[], heroId: string): string {
    for (const hero of heroes) {
      if (hero.id === parseInt(heroId)) {
        return hero.localized_name;
      }
    }
    return "Unknown";
  }

  /**
   * Given a player, return the name of the medal of their rank
   *
   * @param player the player to get data for
   * @returns the name of the medal of their rank
   */
  private medal(player: IDotaProfile): string {
    if (player.rank_tier === null) return "unranked";
    if (player.leaderboard_rank)
      return `Immortal ** | rank **${player.leaderboard_rank}`;
    if (player.rank_tier[0] === 8) return "Immortal";
    const medalTier = player.rank_tier.toString();
    const medals = [
      "Lower than Herald?",
      "Herald",
      "Guardian",
      "Crusader",
      "Archon",
      "Legend",
      "Ancient",
      "Divine",
    ];
    return `${medals[medalTier[0]]} ${medalTier[1]}`;
  }

  /**
   * Given a discord id, return a promise to the user's details in the database
   *
   * @param discordID the discord ID of the user
   * @returns a promise to the user's details in the database
   */
  private async discordToSteamID(discordID: string): Promise<IUser> {
    const query = { discordID: discordID };
    return UserModel.findOne(query);
  }
}
