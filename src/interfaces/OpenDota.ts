/**
 * GET /players/{account_id}
 */
export interface OpenDotaPlayer {
  tracked_until: string;
  solo_competitive_rank: string;
  competitive_rank: string;
  rank_tier: number;
  leaderboard_rank: number;
  mmr_estimate: MMREstimate;
  profile: Profile;
}

interface MMREstimate {
  estimate: number;
  stdDev: number;
  n: number;
}

interface Profile {
  account_id: number;
  personaname: string;
  name: string;
  plus: boolean;
  cheese: number;
  steamid: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  profileurl: string;
  last_login: string;
  loccountrycode: string;
  is_contributor: boolean;
}

/**
 * GET /players/{account_id}/wl
 */
export interface OpenDotaWinLose {
  win: number;
  lose: number;
}

/**
 * GET /players/{account_id}/heroes
 */
export interface OpenDotaPlayerHeroes {
  hero_id: string;
  last_played: number;
  games: number;
  win: number;
  with_game: number;
  with_win: number;
  against_games: number;
  against_win: number;
}

/**
 * GET /heroes
 */
export interface OpenDotaHeroes {
  id: number;
  name: string;
  localized_name: string;
  primary_attr: string;
  attack_type: string;
  roles: string[];
}

/**
 * GET /players/{account_id}/rankings
 */
export interface OpenDotaPlayerRankings {
  hero_id: string;
  score: number;
  percent_rank: number;
  card: number;
}

/**
 * GET /players/{account_id}/recentMatches
 */
export interface OpenDotaPlayerRecentMatches {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  duration: number;
  game_mode: number;
  lobby_type: number;
  hero_id: number;
  start_time: number;
  version: number;
  kills: number;
  deaths: number;
  assists: number;
  skill: number;
  average_rank: number;
  xp_per_min: number;
  gold_per_min: number;
  hero_damage: number;
  tower_damage: number;
  hero_healing: number;
  last_hits: number;
  lane: number;
  lane_role: number;
  is_roaming: boolean;
  cluster: number;
  leaver_status: number;
  party_size: number;
}

/**
 * GET /players/{account_id}/counts
 */
interface OpenDotaPlayerCount {
  [key: string]: { games: number; win: number };
}

export interface OpenDotaPlayerCounts {
  leaver_status: OpenDotaPlayerCount;
  game_mode: OpenDotaPlayerCount;
  lobby_type: OpenDotaPlayerCount;
  lane_role: OpenDotaPlayerCount;
  region: OpenDotaPlayerCount;
  patch: OpenDotaPlayerCount;
  is_radiant: OpenDotaPlayerCount;
}

export type OpenDotaData =
  | OpenDotaPlayer
  | OpenDotaWinLose
  | OpenDotaPlayerHeroes
  | OpenDotaHeroes
  | OpenDotaPlayerRankings
  | OpenDotaPlayerRecentMatches
  | OpenDotaPlayerCounts;
