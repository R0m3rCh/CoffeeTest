export interface FixtureFileData {
  name: string;
  tests: TestFileData[];
  loc: Loc;
  isSkiped: boolean;
}

interface TestFileData {
  name: string;
  loc: Loc;
  isSkipped: boolean;
}

type Loc = {
  start: DocLocation;
  end: DocLocation;
}

type DocLocation = {
  line: number;
  column: number;
}
