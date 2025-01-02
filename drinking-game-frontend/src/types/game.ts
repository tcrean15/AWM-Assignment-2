export interface User {
  id: number;
  username: string;
}

export interface GamePlayer {
  id: number;
  user: User;
  team: number;
  username: string;
  team_name: string;
  location?: {
    type: string;
    coordinates: [number, number];
  };
}

export interface Game {
  id: number;
  status: string;
  host: User;
  selected_player?: User;
  players: GamePlayer[];
} 