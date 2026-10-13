export type SceneFx =
  | 'deep'
  | 'iris'
  | 'warp'
  | 'curtain'
  | 'slices'
  | 'flip'
  | 'arrival';

export interface Scene {
  id: string;
  weight: number;
  fx: SceneFx;
}

export interface Service {
  n: string;
  t: string;
  d: string;
  tags: string[];
}

export interface NavLink {
  href: string;
  label: string;
}
