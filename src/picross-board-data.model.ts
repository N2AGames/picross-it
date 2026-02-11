export interface PicrossBoardData {
  rows: PicrossRowData[];
  rowClues: number[][];
  columnClues: number[][];
}

export interface PicrossRowData {
  cells: PicrossCellData[];
}

export interface PicrossCellData {
    color: string;
    enabled: boolean;
    pushed: boolean;
    correct: boolean;
    text?: string;
}