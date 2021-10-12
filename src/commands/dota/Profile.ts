import { gameModes } from "../../assets/gameModes";
import { lobbyTypes } from "../../assets/lobbyTypes";
import { UserModel } from "../../database/User";
import { Command } from "../../types/Command";
import {
  IPlayerData,
  IPlayerHeroData,
  IPlayerRecentData,
} from "../../types/interfaces/Bot";
import { IUser } from "../../types/interfaces/Mongoose";
import {
  IOpenDotaHeroes,
  IOpenDotaPlayer,
  IOpenDotaPlayerHeroes,
  IOpenDotaPlayerRankings,
  IOpenDotaPlayerRecentMatches,
  IOpenDotaWinLose,
} from "../../types/interfaces/OpenDota";
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import fetch, { Response } from "node-fetch";

type OpenDotaResponse = [
  IOpenDotaPlayer,
  IOpenDotaWinLose,
  IOpenDotaPlayerHeroes,
  IOpenDotaHeroes[],
  IOpenDotaPlayerRankings[],
  IOpenDotaPlayerRecentMatches
];

export default class Profile extends Command {
  name = "profile";
  visible = true;
  description = "Uses opendota API to collect general information on player";
  information =
    "Given a steamID, return general info about the player. \
    If your steamID is saved with the id command, then the steamID argument is not required. \n\
    The steamID should consist of only numbers and be the number that you see as your steam friend id \
    or in your steam URL, or the number at the end of your dotabuff / opendota URL.";
  aliases = [];
  args = false;
  usage = "[Steam32 ID]";
  example = "193480093";
  cooldown = 0;
  category = "dota";
  guildOnly = false;
  data = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description)
    .addStringOption((option) =>
      option
        .setName("steamid")
        .setDescription("The steam id of the user to get data on")
    );
  execute = async (message: Message, args: string[]): Promise<Message> => {
    message.channel.sendTyping();
    const profileEmbed = await this.profile(args, message.author.id);
    return message.channel.send({ embeds: [profileEmbed] });
  };
  executeSlash = async (interaction: CommandInteraction): Promise<void> => {
    const commandArg = interaction.options.get("steamid");
    const args = commandArg !== null ? [commandArg.value as string] : [];
    const profileEmbed = await this.profile(args, interaction.user.id);
    return interaction.reply({ embeds: [profileEmbed] });
  };

  /**
   * Extracts the user's steamid through the argument or database, and then
   * collect data on their profile from opendota
   *
   * @param args the arguments given by the user
   * @param authorId the id of the user who triggered the command
   * @returns a message embed containing data about the user's dota profile
   */
  private async profile(
    args: string[],
    authorId: string
  ): Promise<MessageEmbed> {
    let profileEmbed: MessageEmbed;

    // Checks for id
    let id = args[0];
    if (!id) {
      const details = await this.discordToSteamID(authorId);
      if (details) {
        id = details.steamID;
      } else {
        return this.invalidDatabaseResponse();
      }
    }
    const url = "https://api.opendota.com/api/";

    // 0: Basic information
    // 1: Won and lost game totals
    // 2: Top heroes
    // 3: Hero names
    // 4: Hero rankings
    // 5: Most recent match data
    await Promise.all([
      fetch(`${url}players/${id}`),
      fetch(`${url}players/${id}/wl`),
      fetch(`${url}players/${id}/heroes`),
      fetch(`${url}heroes`),
      fetch(`${url}players/${id}/rankings`),
      fetch(`${url}players/${id}/recentMatches`),
    ])
      // Check for valid response
      .then((responses: Response[]) => this.checkAPIResponse(responses))

      // Convert data to .json
      .then((responses: Response[]) =>
        Promise.all(responses.map((response) => response.json()))
      )

      // Extract and format data
      .then((data: OpenDotaResponse) => this.formatData(data))

      // Add data onto embed
      .then((playerData) => {
        profileEmbed = this.getEmbed(
          playerData,
          playerData.heroes,
          playerData.recent
        );
      })
      .catch((error: Error) => {
        return this.createColouredEmbed(error.message);
      });
    return profileEmbed;
  }

  /**
   * Checks that all the responses had a valid status code of 200
   *
   * @param responses the list of responses to check
   * @returns the same list of responses given
   */
  private checkAPIResponse(responses: Response[]): Response[] {
    // Takes a long time to loop, can be optimised
    for (const response of responses) {
      if (response.status !== 200) {
        throw Error("Invalid API response, check that the id was correct!");
      }
    }
    return responses;
  }

  /**
   *  Collect data from opendota api and return object containing data
   *
   * @param data a list of the JSON returned from the open dota api
   * @returns an object containing the formatted data
   */
  private formatData(data: OpenDotaResponse): IPlayerData {
    // Destructure data
    const [player, wl, playerHeroes, heroes, rankings, recentMatches] = data;

    // Check for missing profile data
    if (!player || !player.profile) {
      throw Error(
        "Unable to retrieve dota profile. Is your profile public and have you played matches?"
      );
    }

    // Extract hero data
    const playerHeroData: IPlayerHeroData[] = [];
    for (let i = 0; i < 3; i++) {
      playerHeroData.push({
        name: this.idToHeroName(heroes, playerHeroes[i].hero_id),
        games: playerHeroes[i].games,
        winRate: (100 * playerHeroes[i].win) / playerHeroes[i].games,
        percentile: this.idToHeroRanking(rankings, playerHeroes[i].hero_id),
      });
    }

    // Extra recent match data
    const recent = recentMatches[0];

    const won =
      recent.player_slot < 6 ? recent.radiant_win : !recent.radiant_win;

    const playerRecentData: IPlayerRecentData = {
      outcome: won ? "Won" : "Lost",
      skill: ["unknown", "normal", "high", "very high"][recent.skill || 0],
      lobbyType: lobbyTypes[recent.lobby_type].replace(/_/g, " ") || "",
      gameMode: gameModes[recent.game_mode].replace(/_/g, " ") || "",
      hero: this.idToHeroName(heroes, recent.hero_id),
      kills: recent.kills,
      deaths: recent.deaths,
      assists: recent.assists,
      goldPerMin: recent.gold_per_min,
      expPerMin: recent.xp_per_min,
      date: new Date(recent.start_time * 1000).toString().substr(0, 15),
      duration: this.formatDuration(recent.duration),
    };

    // Profile details
    const profile = player.profile;

    const p: IPlayerData = {
      name: profile.personaname,
      accountId: profile.account_id,
      mmrEstimate: player.mmr_estimate.estimate,
      country: profile.loccountrycode,
      avatar: profile.avatarfull,
      win: wl.win,
      lose: wl.lose,
      rankTier: player.rank_tier,
      leaderboardRank: player.leaderboard_rank,
      winRate: (100 * wl.win) / (wl.win + wl.lose),
      heroes: playerHeroData,
      recent: playerRecentData,
    };

    return p;
  }

  /**
   * Sent the embed with the dota player's profile and most recent match stats
   *
   * @param message the original message that triggered the command
   * @param player data containing details for the player
   * @param heroes data containing details of the player's top 3 heroes
   * @param match data for the most recent match
   * @returns a promise to the message send
   */
  private getEmbed(
    player: IPlayerData,
    heroes: IPlayerHeroData[],
    match: IPlayerRecentData
  ): MessageEmbed {
    const profileEmbed = this.createColouredEmbed()
      .setTitle(`${player.name}`)
      .setURL(`https://www.opendota.com/players/${player.accountId}`)
      .setDescription(
        `Medal: **${this.medal(player)}**
        MMR Estimate: **${player.mmrEstimate}**
        Country: **${player.country}**`
      )
      .setThumbnail(player.avatar)
      .setTimestamp()
      .setFooter(
        "Source: Opendota",
        "https://pbs.twimg.com/profile_images/962444554967203840/G6KHe1q3.jpg"
      )
      .addFields({
        name: "**General Match Data**",
        value: `
          Total: **${player.win + player.lose}** | Won: **${
          player.win
        }** | Lost: **${
          player.lose
        }** | Winrate: **${player.winRate.toPrecision(2)}%**\n`,
      });

    // Add player's top three heroes
    for (const hero of heroes) {
      profileEmbed.addFields({
        name: `**${hero.name}**`,
        value: `
          Games: **${hero.games}**
          Win as: **${hero.winRate.toPrecision(2)}%**
          Percentile: **${hero.percentile}**`,
        inline: true,
      });
    }

    // Add most recent match data
    profileEmbed.addFields({
      name: "**Most Recent Match**",
      value: `
      **${match.outcome}** playing a **${match.skill}** skill **${match.lobbyType} ${match.gameMode}** as **${match.hero}**
      KDA: **${match.kills}/${match.deaths}/${match.assists}** | GPM: **${match.goldPerMin}** | XPM: **${match.expPerMin}**
      Date: **${match.date}** | Duration: **${match.duration}**`,
    });

    return profileEmbed;
  }

  /**
   * Send a message notifying of an invalid database response
   *
   * @param message the original message that triggered this command
   * @returns a promise to the new message sent
   */
  private invalidDatabaseResponse(): MessageEmbed {
    const response = `Invalid response from database. 
      Either you haven't added your id, or there was a database error. 
      You can add you id with the steamid command!`;
    return this.createColouredEmbed(response);
  }

  /**
   * Return a hero ranking given the hero id and list of ranking details
   *
   * @param rankings a list of the player's rankings for each hero
   * @param heroId the relevant hero's id
   * @returns a string of the player's hero ranking if found, else unknown
   */
  private idToHeroRanking(
    rankings: IOpenDotaPlayerRankings[],
    heroId: string
  ): string {
    for (const ranking of rankings) {
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
  private idToHeroName(heroes: IOpenDotaHeroes[], heroId: string): string {
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
  private medal(player: IPlayerData): string {
    if (player.rankTier === null) return "unranked";
    if (player.leaderboardRank)
      return `Immortal ** | rank **${player.leaderboardRank}`;
    if (player.rankTier[0] === 8) return "Immortal";
    const medalTier = player.rankTier.toString();
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
