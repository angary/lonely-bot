import { Command } from "../../Command";
import { gameModes } from "../../assets/gameModes";
import { laneRoles } from "../../assets/laneRoles";
import { lobbyTypes } from "../../assets/lobbyTypes";
import { ranks } from "../../assets/ranks";
import {
  PlayerData,
  PlayerHeroData,
  PlayerRecentData,
} from "../../interfaces/Bot";
import { User } from "../../interfaces/Mongoose";
import {
  OpenDotaHeroes,
  OpenDotaPlayer,
  OpenDotaPlayerCounts,
  OpenDotaPlayerHeroes,
  OpenDotaPlayerRankings,
  OpenDotaPlayerRecentMatches,
  OpenDotaWinLose,
} from "../../interfaces/OpenDota";
import { UserModel } from "../../models/User";
import { SlashCommandBuilder } from "@discordjs/builders";
import axios, { AxiosResponse } from "axios";
import { CommandInteraction, Message, MessageEmbed } from "discord.js";

type OpenDotaResponse = [
  OpenDotaPlayer,
  OpenDotaWinLose,
  OpenDotaPlayerHeroes[],
  OpenDotaHeroes[],
  OpenDotaPlayerRankings[],
  OpenDotaPlayerRecentMatches[],
  OpenDotaPlayerCounts
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
    // 6: Counts
    await axios
      .all([
        axios.get(`${url}players/${id}`),
        axios.get(`${url}players/${id}/wl`),
        axios.get(`${url}players/${id}/heroes`),
        axios.get(`${url}heroes`),
        axios.get(`${url}players/${id}/rankings`),
        axios.get(`${url}players/${id}/recentMatches`),
        axios.get(`${url}players/${id}/counts`),
      ])
      // Check for valid response
      .then((responses: AxiosResponse[]) => this.checkAPIResponse(responses))

      // Convert data to json
      .then((responses: AxiosResponse[]) =>
        axios.all(responses.map((response) => response.data))
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
        profileEmbed = this.createColouredEmbed(error.message);
      });
    return profileEmbed;
  }

  /**
   * Checks that all the responses had a valid status code of 200
   *
   * @param responses the list of responses to check
   * @returns the same list of responses given
   */
  private checkAPIResponse(responses: AxiosResponse[]): AxiosResponse[] {
    if (responses.some((r) => r.status !== 200)) {
      throw Error("Invalid API response, check that the id was correct!");
    }
    return responses;
  }

  /**
   *  Collect data from opendota api and return object containing data
   *
   * @param data a list of the JSON returned from the open dota api
   * @returns an object containing the formatted data
   */
  private formatData(data: OpenDotaResponse): PlayerData {
    // Destructure data
    const [player, wl, playerHeroes, heroes, rankings, recentMatches, counts] =
      data;

    // Check for missing profile data
    if (!player || !player.profile) {
      throw Error(
        "Unable to retrieve dota profile. Is your profile public and have you played matches?"
      );
    }

    // Extract hero data
    const playerHeroData: PlayerHeroData[] = playerHeroes
      .slice(0, 3)
      .map((hero) => {
        return {
          name: this.idToHeroName(heroes, hero.hero_id),
          games: hero.games,
          winRate: (100 * hero.win) / hero.games,
          percentile: this.idToHeroRanking(rankings, hero.hero_id),
        };
      });

    // Extra recent match data
    const recent = recentMatches[0];
    const won = recent.player_slot <= 5 === recent.radiant_win;
    let skill = "Unknown skill";
    if (recent.average_rank) {
      const rankNum = Math.floor(recent.average_rank / 10);
      skill = `${ranks[rankNum]} [${recent.average_rank % 10}]`;
    }

    const playerRecentData: PlayerRecentData = {
      id: recent.match_id,
      outcome: won ? "Won" : "Lost",
      skill: skill,
      lobbyType: lobbyTypes[recent.lobby_type].replace(/_/g, " ") || "",
      gameMode: gameModes[recent.game_mode].replace(/_/g, " ") || "",
      hero: this.idToHeroName(heroes, recent.hero_id),
      kills: recent.kills,
      deaths: recent.deaths,
      assists: recent.assists,
      gpm: recent.gold_per_min,
      xpm: recent.xp_per_min,
      heroDmg: recent.hero_damage,
      buildingDmg: recent.tower_damage,
      heroHealing: recent.hero_healing,
      date: new Date(recent.start_time * 1000).toString().substring(0, 15),
      duration: this.formatDuration(recent.duration),
    };

    // Extract laning details, remove unknown and convert laning matches to a percent
    delete counts.lane_role["0"];
    const parsedLaneCount = Object.values(counts.lane_role).reduce(
      (acc, x) => acc + x.games,
      0
    );
    const lanes = Object.entries(counts.lane_role)
      .map(([lane, { games, win }]) => {
        return {
          lane: laneRoles[+lane],
          games: Math.round((100 * games) / parsedLaneCount),
          winRate: Math.round((100 * win) / games),
        };
      })
      .sort((a, b) => b.games - a.games);
    // Extract lobby details
    const lobbies = Object.entries(counts.lobby_type)
      .map(([lobby, { games, win }]) => {
        return {
          lobby: lobbyTypes[+lobby],
          games,
          winRate: Math.round((100 * win) / games),
        };
      })
      .sort((a, b) => b.games - a.games)
      .slice(0, 4);

    // Profile details
    const profile = player.profile;
    return {
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
      lanes,
      lobbies,
    };
  }

  /**
   * Sent the embed with the dota player's profile and most recent match stats
   *
   * @param player data containing details for the player
   * @param heroes data containing details of the player's top 3 heroes
   * @param match data for the most recent match
   * @returns a promise to the message send
   */
  private getEmbed(
    player: PlayerData,
    heroes: PlayerHeroData[],
    match: PlayerRecentData
  ): MessageEmbed {
    const profileEmbed = this.createColouredEmbed()
      .setTitle(`${player.name}`)
      .setURL(`https://www.opendota.com/players/${player.accountId}`)
      .setDescription(
        `Medal: **${this.medal(player)}** | MMR Estimate: **${
          player.mmrEstimate
        }** | Country: **${player.country}**`
      )
      .setThumbnail(player.avatar)
      .setTimestamp()
      .setFooter({
        text: "Source: Opendota",
        iconURL:
          "https://pbs.twimg.com/profile_images/962444554967203840/G6KHe1q3.jpg",
      })
      .addFields(
        {
          name: "**Matches**",
          value: `
            Total: **${player.win + player.lose}**
            Won: **${player.win}**
            Lost: **${player.lose}**
            Winrate: **${player.winRate.toPrecision(4)}%**`,
          inline: true,
        },
        {
          name: "**Lobbies**",
          value: player.lobbies
            .map((l) => `${l.lobby}: **${l.games}**`)
            .join("\n"),
          inline: true,
        },
        {
          name: "**Lanes**",
          value: player.lanes
            .map((l) => `${l.lane}: **${l.games}**%`)
            .join("\n"),
          inline: true,
        }
      );

    // Add player's top three heroes
    for (const hero of heroes) {
      profileEmbed.addFields({
        name: `**${hero.name}**`,
        value: `
          Games: **${hero.games}**
          Winrate: **${hero.winRate.toPrecision(2)}%**
          Percentile: **${hero.percentile}**`,
        inline: true,
      });
    }

    const dbLink = `https://www.dotabuff.com/matches/${match.id}`;
    const odLink = `https://www.opendota.com/matches/${match.id}`;
    // Add most recent match data
    profileEmbed.addFields({
      name: "**Most Recent Match**",
      value: `
      **${match.outcome}** **${match.lobbyType} ${match.gameMode}** as **${match.hero}** | **${match.skill}**
      KDA: **${match.kills}/${match.deaths}/${match.assists}** | GPM: **${match.gpm}** | XPM: **${match.xpm}**
      Hero dmg: **${match.heroDmg}** | Building dmg: **${match.buildingDmg}** | Hero heal: **${match.heroHealing}**
      Date: **${match.date}** | Duration: **${match.duration}**
      More Info: [Dotabuff](${dbLink}) | [Opendota](${odLink})`,
    });

    return profileEmbed;
  }

  /**
   * Send a message notifying of an invalid database response
   *
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
    rankings: OpenDotaPlayerRankings[],
    heroId: string
  ): string {
    const rank = rankings.find((r) => parseInt(r.hero_id) === parseInt(heroId));
    return rank !== undefined
      ? `${+(100 * rank.percent_rank).toFixed(2)}%`
      : "Unknown";
  }

  /**
   * Get the hero with the corresponding hero ids
   *
   * @param heroes the list of hero data
   * @param heroId the id of the relevant hero
   * @returns the hero
   */
  private idToHeroName(
    heroes: OpenDotaHeroes[],
    heroId: string | number
  ): string {
    const hero = heroes.find((h) => h.id === parseInt(heroId as string));
    return hero !== undefined ? hero.localized_name : "Unknown";
  }

  /**
   * Given a player, return the name of the medal of their rank
   *
   * @param player the player to get data for
   * @returns the name of the medal of their rank
   */
  private medal(player: PlayerData): string {
    if (player.rankTier === null) {
      return "unranked";
    }
    if (player.leaderboardRank) {
      return `Immortal ** | rank **${player.leaderboardRank}`;
    }
    if (player.rankTier[0] === 8) {
      return "Immortal";
    }
    const medalTier = player.rankTier.toString();
    return `${ranks[medalTier[0]]} ${medalTier[1]}`;
  }

  /**
   * Given a discord id, return a promise to the user's details in the database
   *
   * @param discordID the discord ID of the user
   * @returns a promise to the user's details in the database
   */
  private async discordToSteamID(discordID: string): Promise<User> {
    const query = { discordID: discordID };
    return UserModel.findOne(query);
  }
}
