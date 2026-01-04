export enum View {
  DASHBOARD = 'DASHBOARD',
  LAB_DIRECT = 'LAB_DIRECT',
  LAB_CONCAT = 'LAB_CONCAT',
  LAB_BYPASS = 'LAB_BYPASS', // New
  LAB_BLIND = 'LAB_BLIND',   // New
  LAB_RCE = 'LAB_RCE',
  SOURCE_JAVA = 'SOURCE_JAVA',
  SOURCE_DOCKER = 'SOURCE_DOCKER',
  SOURCE_SCRIPTS = 'SOURCE_SCRIPTS',
  BUILD_GUIDE = 'BUILD_GUIDE',
  README = 'README'
}

export interface Artifact {
  filename: string;
  language: string;
  content: string;
  description: string;
}

export interface SimulationLog {
  id: number;
  expression: string;
  result: string;
  ip: string;
  timestamp: string;
}