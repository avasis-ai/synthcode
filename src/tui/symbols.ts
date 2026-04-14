export const BAR = [" ", "\u2581", "\u2582", "\u2583", "\u2584", "\u2585", "\u2586", "\u2587", "\u2588"] as const;
export const BLOCK = [" ", "\u258F", "\u258E", "\u258D", "\u258C", "\u258B", "\u258A", "\u2589", "\u2588"] as const;
export const SHADE = [" ", "\u2591", "\u2592", "\u2593", "\u2588"] as const;

export interface BorderSet {
  topLeft: string;
  top: string;
  topRight: string;
  midLeft: string;
  midRight: string;
  bottomLeft: string;
  bottom: string;
  bottomRight: string;
  headLeft: string;
  head: string;
  headRight: string;
  headCross: string;
}

export const ROUNDED: BorderSet = {
  topLeft: "\u256D", top: "\u2500", topRight: "\u256E",
  midLeft: "\u2502", midRight: "\u2502",
  bottomLeft: "\u2570", bottom: "\u2500", bottomRight: "\u256F",
  headLeft: "\u251C", head: "\u2500", headRight: "\u2524",
  headCross: "\u253C",
};

export const THICK = {
  topLeft: "\u250F", top: "\u2501", topRight: "\u2513",
  midLeft: "\u2503", midRight: "\u2503",
  bottomLeft: "\u2517", bottom: "\u2501", bottomRight: "\u251B",
  headLeft: "\u2523", head: "\u2501", headRight: "\u252B",
  headCross: "\u254B",
};

export const DOUBLE = {
  topLeft: "\u2554", top: "\u2550", topRight: "\u2557",
  midLeft: "\u2551", midRight: "\u2551",
  bottomLeft: "\u255A", bottom: "\u2550", bottomRight: "\u255D",
  headLeft: "\u2560", head: "\u2550", headRight: "\u2563",
  headCross: "\u256C",
};

export const PLAIN = {
  topLeft: "\u250C", top: "\u2500", topRight: "\u2510",
  midLeft: "\u2502", midRight: "\u2502",
  bottomLeft: "\u2514", bottom: "\u2500", bottomRight: "\u2518",
  headLeft: "\u251C", head: "\u2500", headRight: "\u2524",
  headCross: "\u253C",
};

export const ASCII = {
  topLeft: "+", top: "-", topRight: "+",
  midLeft: "|", midRight: "|",
  bottomLeft: "+", bottom: "-", bottomRight: "+",
  headLeft: "+", head: "-", headRight: "+",
  headCross: "+",
};

export const HEAVY_HEAD = {
  topLeft: "\u250C", top: "\u2500", topRight: "\u2510",
  midLeft: "\u2502", midRight: "\u2502",
  bottomLeft: "\u2514", bottom: "\u2500", bottomRight: "\u2518",
  headLeft: "\u251C", head: "\u2501", headRight: "\u2524",
  headCross: "\u253F",
};

export const TREE_GUIDES = {
  space: "    ",
  continue: "\u2502   ",
  fork: "\u251C\u2500\u2500 ",
  end: "\u2514\u2500\u2500 ",
};

export const THICK_TREE_GUIDES = {
  space: "    ",
  continue: "\u2503   ",
  fork: "\u2523\u2501\u2501 ",
  end: "\u2517\u2501\u2501 ",
};

export const HLINE = {
  thin: "\u2500",
  thick: "\u2501",
  double: "\u2550",
  rounded: "\u2500",
  dot: "\u2504",
  dash: "\u2506",
};

export const CHECK = "\u2713";
export const CROSS = "\u2717";
export const BULLET = "\u2022";
export const ARROW_R = "\u2192";
export const STAR = "\u2605";
export const DIAMOND = "\u25C6";
export const TRIANGLE_R = "\u25B6";
export const HLINE_CHAR = "\u2500";
export const VLINE_CHAR = "\u2502";
