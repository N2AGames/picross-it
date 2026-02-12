export interface PicrossBoardData {
  rows: PicrossRowData[];
  rowClues: PicrossClueData[][];
  columnClues: PicrossClueData[][];
}

export interface PicrossRowData {
  cells: PicrossCellData[];
}

export interface PicrossCellData {
    color: string;
    enabled: boolean;
    pushed: boolean;
    correct: boolean;
    marked: boolean;
    text?: string;
}

export interface PicrossClueData {
    value: number;
    completed: boolean;
}