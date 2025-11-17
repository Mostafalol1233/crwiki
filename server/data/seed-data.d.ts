export interface MercenaryData {
  id?: string;
  name: string;
  image: string;
  role: string;
  sounds?: string[];
}

export interface WeaponData {
  name: string;
  image: string;
  category: string;
  description: string;
  stats?: Record<string, any>;
}

export interface ModeData {
  name: string;
  image: string;
  description: string;
  type: string;
}

export interface RankData {
  name: string;
  image: string;
  description: string;
  requirements: string;
}

export declare const mercenariesData: MercenaryData[];
export declare const weaponsData: WeaponData[];
export declare const modesData: ModeData[];
export declare const ranksData: RankData[];
