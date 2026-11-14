// ============================================================================
// NebCode Excel Formula & Spreadsheet Engine
// Supports 80+ Microsoft Excel functions, cell references (A1, $A$1, $A1, A$1),
// ranges (A1:D10), cross-sheet references (Sheet2!A1), relative formula shifting
// for AutoFill/Copy-Paste, number formatting, conditional formatting, & templates.
// ============================================================================

export type NumberFormatType =
  | 'general'
  | 'number_2dec'
  | 'integer'
  | 'currency_fcfa'
  | 'currency_usd'
  | 'percent'
  | 'date';

export type CellAlign = 'left' | 'center' | 'right';

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: CellAlign;
  color?: string;
  bg?: string;
  fontSize?: number;
  format?: NumberFormatType;
  border?: boolean;
  wrap?: boolean;
}

export interface CellData {
  raw: string; // Raw user input, e.g. "=SUM(B2:D2)" or "85" or "Amina"
  style?: CellStyle;
}

export interface ConditionalRule {
  id: string;
  range: string; // e.g. "B2:F15"
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between' | 'contains';
  value1: string;
  value2?: string;
  bg: string;
  color: string;
  label: string;
}

export interface SheetChart {
  id: string;
  title: string;
  type: 'column' | 'bar' | 'line' | 'pie';
  labelRange: string; // e.g. "A2:A7"
  dataRange: string; // e.g. "F2:F7"
}

export interface SheetData {
  id: string;
  name: string;
  cells: Record<string, CellData>;
  colWidths: Record<number, number>;
  rowHeights: Record<number, number>;
  freezeHeader?: boolean;
  conditionalRules: ConditionalRule[];
  charts: SheetChart[];
}

export interface ExcelFunctionMeta {
  name: string;
  category: 'Math & Stats' | 'Logical' | 'Lookup & Ref' | 'Text' | 'Date & Financial';
  syntax: string;
  description: string;
  example: string;
}

export const EXCEL_FUNCTIONS_CATALOG: ExcelFunctionMeta[] = [
  // Math & Stats
  { name: 'SUM', category: 'Math & Stats', syntax: 'SUM(number1, [number2], ...)', description: 'Adds all numbers in a range of cells.', example: '=SUM(B2:D2)' },
  { name: 'AVERAGE', category: 'Math & Stats', syntax: 'AVERAGE(number1, [number2], ...)', description: 'Calculates the arithmetic mean of arguments.', example: '=AVERAGE(B2:D2)' },
  { name: 'MIN', category: 'Math & Stats', syntax: 'MIN(number1, [number2], ...)', description: 'Returns the smallest number in a set of values.', example: '=MIN(B2:B10)' },
  { name: 'MAX', category: 'Math & Stats', syntax: 'MAX(number1, [number2], ...)', description: 'Returns the largest value in a set of values.', example: '=MAX(B2:B10)' },
  { name: 'COUNT', category: 'Math & Stats', syntax: 'COUNT(value1, [value2], ...)', description: 'Counts the number of cells in a range that contain numbers.', example: '=COUNT(B2:B10)' },
  { name: 'COUNTA', category: 'Math & Stats', syntax: 'COUNTA(value1, [value2], ...)', description: 'Counts the number of cells in a range that are not empty.', example: '=COUNTA(A2:A10)' },
  { name: 'COUNTBLANK', category: 'Math & Stats', syntax: 'COUNTBLANK(range)', description: 'Counts empty cells in a specified range.', example: '=COUNTBLANK(B2:B10)' },
  { name: 'COUNTIF', category: 'Math & Stats', syntax: 'COUNTIF(range, criteria)', description: 'Counts the number of cells within a range that meet a condition.', example: '=COUNTIF(F2:F7, ">=50")' },
  { name: 'SUMIF', category: 'Math & Stats', syntax: 'SUMIF(range, criteria, [sum_range])', description: 'Adds the cells specified by a given condition or criteria.', example: '=SUMIF(G2:G7, "PASS", E2:E7)' },
  { name: 'AVERAGEIF', category: 'Math & Stats', syntax: 'AVERAGEIF(range, criteria, [average_range])', description: 'Finds average for the cells specified by a given condition.', example: '=AVERAGEIF(G2:G7, "PASS", F2:F7)' },
  { name: 'RANK', category: 'Math & Stats', syntax: 'RANK(number, ref, [order])', description: 'Returns the rank of a number in a list of numbers (0=descending, 1=ascending).', example: '=RANK(F2, $F$2:$F$7)' },
  { name: 'MEDIAN', category: 'Math & Stats', syntax: 'MEDIAN(number1, [number2], ...)', description: 'Returns the median (middle value) of given numbers.', example: '=MEDIAN(B2:B10)' },
  { name: 'MODE', category: 'Math & Stats', syntax: 'MODE(number1, [number2], ...)', description: 'Returns the most frequently occurring value in a range.', example: '=MODE(B2:B10)' },
  { name: 'STDEV', category: 'Math & Stats', syntax: 'STDEV(number1, [number2], ...)', description: 'Estimates standard deviation based on a sample.', example: '=STDEV(B2:B10)' },
  { name: 'VAR', category: 'Math & Stats', syntax: 'VAR(number1, [number2], ...)', description: 'Estimates variance based on a sample.', example: '=VAR(B2:B10)' },
  { name: 'ROUND', category: 'Math & Stats', syntax: 'ROUND(number, num_digits)', description: 'Rounds a number to a specified number of digits.', example: '=ROUND(F2, 1)' },
  { name: 'ROUNDUP', category: 'Math & Stats', syntax: 'ROUNDUP(number, num_digits)', description: 'Rounds a number up, away from zero.', example: '=ROUNDUP(F2, 0)' },
  { name: 'ROUNDDOWN', category: 'Math & Stats', syntax: 'ROUNDDOWN(number, num_digits)', description: 'Rounds a number down, toward zero.', example: '=ROUNDDOWN(F2, 0)' },
  { name: 'INT', category: 'Math & Stats', syntax: 'INT(number)', description: 'Rounds a number down to the nearest integer.', example: '=INT(14.8)' },
  { name: 'ABS', category: 'Math & Stats', syntax: 'ABS(number)', description: 'Returns the absolute value of a number.', example: '=ABS(B2-C2)' },
  { name: 'SQRT', category: 'Math & Stats', syntax: 'SQRT(number)', description: 'Returns the positive square root of a number.', example: '=SQRT(144)' },
  { name: 'POWER', category: 'Math & Stats', syntax: 'POWER(number, power)', description: 'Returns the result of a number raised to a power.', example: '=POWER(2, 8)' },
  { name: 'MOD', category: 'Math & Stats', syntax: 'MOD(number, divisor)', description: 'Returns the remainder after number is divided by divisor.', example: '=MOD(17, 5)' },
  { name: 'PRODUCT', category: 'Math & Stats', syntax: 'PRODUCT(number1, [number2], ...)', description: 'Multiplies all the numbers given as arguments.', example: '=PRODUCT(B2:D2)' },
  { name: 'PI', category: 'Math & Stats', syntax: 'PI()', description: 'Returns the value of Pi (3.14159265358979).', example: '=PI()*R2^2' },
  { name: 'RAND', category: 'Math & Stats', syntax: 'RAND()', description: 'Returns a random number between 0 and 1.', example: '=RAND()' },
  { name: 'RANDBETWEEN', category: 'Math & Stats', syntax: 'RANDBETWEEN(bottom, top)', description: 'Returns a random integer between the numbers you specify.', example: '=RANDBETWEEN(1, 100)' },

  // Logical
  { name: 'IF', category: 'Logical', syntax: 'IF(logical_test, value_if_true, [value_if_false])', description: 'Checks whether a condition is met, and returns one value if TRUE and another if FALSE.', example: '=IF(F2>=50, "PASS", "FAIL")' },
  { name: 'IFS', category: 'Logical', syntax: 'IFS(test1, val1, [test2, val2], ...)', description: 'Checks multiple conditions and returns a value corresponding to the first TRUE condition.', example: '=IFS(F2>=75, "A", F2>=60, "B", F2>=50, "C", TRUE, "F")' },
  { name: 'AND', category: 'Logical', syntax: 'AND(logical1, [logical2], ...)', description: 'Returns TRUE if all arguments evaluate to TRUE.', example: '=AND(B2>=50, C2>=50)' },
  { name: 'OR', category: 'Logical', syntax: 'OR(logical1, [logical2], ...)', description: 'Returns TRUE if any argument evaluates to TRUE.', example: '=OR(B2>=50, C2>=50)' },
  { name: 'NOT', category: 'Logical', syntax: 'NOT(logical)', description: 'Reverses the logic of its argument.', example: '=NOT(B2<50)' },
  { name: 'XOR', category: 'Logical', syntax: 'XOR(logical1, [logical2], ...)', description: 'Returns a logical Exclusive Or of all arguments.', example: '=XOR(B2>50, C2>50)' },
  { name: 'IFERROR', category: 'Logical', syntax: 'IFERROR(value, value_if_error)', description: 'Returns value_if_error if expression is an error; otherwise returns the value.', example: '=IFERROR(B2/C2, 0)' },

  // Lookup & Reference
  { name: 'VLOOKUP', category: 'Lookup & Ref', syntax: 'VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])', description: 'Looks for a value in the leftmost column of a table, and returns a value in the same row from a column you specify.', example: '=VLOOKUP(A2, $A$2:$G$7, 6, FALSE)' },
  { name: 'HLOOKUP', category: 'Lookup & Ref', syntax: 'HLOOKUP(lookup_value, table_array, row_index_num, [range_lookup])', description: 'Looks for a value in the top row of a table and returns a value in the same column from a specified row.', example: '=HLOOKUP("Math", A1:F7, 3, FALSE)' },
  { name: 'INDEX', category: 'Lookup & Ref', syntax: 'INDEX(array, row_num, [column_num])', description: 'Returns a value or the reference to a value from within a table or range.', example: '=INDEX(A2:G7, 2, 1)' },
  { name: 'MATCH', category: 'Lookup & Ref', syntax: 'MATCH(lookup_value, lookup_array, [match_type])', description: 'Searches for a specified item in a range of cells, and returns the relative position.', example: '=MATCH("Ngwa Paul", A2:A7, 0)' },
  { name: 'CHOOSE', category: 'Lookup & Ref', syntax: 'CHOOSE(index_num, value1, [value2], ...)', description: 'Uses index_num to return a value from the list of value arguments.', example: '=CHOOSE(2, "Gold", "Silver", "Bronze")' },
  { name: 'ROW', category: 'Lookup & Ref', syntax: 'ROW([reference])', description: 'Returns the row number of a reference.', example: '=ROW(B5)' },
  { name: 'COLUMN', category: 'Lookup & Ref', syntax: 'COLUMN([reference])', description: 'Returns the column number of a reference.', example: '=COLUMN(C2)' },

  // Text
  { name: 'CONCAT', category: 'Text', syntax: 'CONCAT(text1, [text2], ...)', description: 'Combines the text from multiple ranges and/or strings.', example: '=CONCAT(A2, " - ", G2)' },
  { name: 'CONCATENATE', category: 'Text', syntax: 'CONCATENATE(text1, [text2], ...)', description: 'Joins two or more text strings into one string.', example: '=CONCATENATE(A2, " (", H2, ")")' },
  { name: 'UPPER', category: 'Text', syntax: 'UPPER(text)', description: 'Converts text to uppercase.', example: '=UPPER(A2)' },
  { name: 'LOWER', category: 'Text', syntax: 'LOWER(text)', description: 'Converts all uppercase letters in a text string to lowercase.', example: '=LOWER(A2)' },
  { name: 'PROPER', category: 'Text', syntax: 'PROPER(text)', description: 'Capitalizes the first letter in each word of a text value.', example: '=PROPER(A2)' },
  { name: 'LEN', category: 'Text', syntax: 'LEN(text)', description: 'Returns the number of characters in a text string.', example: '=LEN(A2)' },
  { name: 'LEFT', category: 'Text', syntax: 'LEFT(text, [num_chars])', description: 'Returns the leftmost characters from a text value.', example: '=LEFT(A2, 4)' },
  { name: 'RIGHT', category: 'Text', syntax: 'RIGHT(text, [num_chars])', description: 'Returns the rightmost characters from a text value.', example: '=RIGHT(A2, 4)' },
  { name: 'MID', category: 'Text', syntax: 'MID(text, start_num, num_chars)', description: 'Returns a specific number of characters from a text string starting at the position you specify.', example: '=MID(A2, 2, 3)' },
  { name: 'TRIM', category: 'Text', syntax: 'TRIM(text)', description: 'Removes extra spaces from text.', example: '=TRIM(A2)' },
  { name: 'SUBSTITUTE', category: 'Text', syntax: 'SUBSTITUTE(text, old_text, new_text)', description: 'Substitutes new_text for old_text in a text string.', example: '=SUBSTITUTE(A2, " ", "_")' },
  { name: 'FIND', category: 'Text', syntax: 'FIND(find_text, within_text, [start_num])', description: 'Finds one text value within another (case-sensitive).', example: '=FIND(" ", A2)' },
  { name: 'VALUE', category: 'Text', syntax: 'VALUE(text)', description: 'Converts a text argument to a number.', example: '=VALUE("125")' },
  { name: 'EXACT', category: 'Text', syntax: 'EXACT(text1, text2)', description: 'Checks to see if two text values are identical.', example: '=EXACT(A2, B2)' },
  { name: 'REPT', category: 'Text', syntax: 'REPT(text, number_times)', description: 'Repeats text a given number of times.', example: '=REPT("*", 5)' },

  // Date & Financial
  { name: 'TODAY', category: 'Date & Financial', syntax: 'TODAY()', description: 'Returns the current date formatted as YYYY-MM-DD.', example: '=TODAY()' },
  { name: 'YEAR', category: 'Date & Financial', syntax: 'YEAR(date_text)', description: 'Returns the year corresponding to a date.', example: '=YEAR("2026-06-15")' },
  { name: 'MONTH', category: 'Date & Financial', syntax: 'MONTH(date_text)', description: 'Returns the month of a date (1 to 12).', example: '=MONTH("2026-06-15")' },
  { name: 'DAY', category: 'Date & Financial', syntax: 'DAY(date_text)', description: 'Returns the day of a date (1 to 31).', example: '=DAY("2026-06-15")' },
  { name: 'DAYS', category: 'Date & Financial', syntax: 'DAYS(end_date, start_date)', description: 'Returns the number of days between two dates.', example: '=DAYS("2026-06-30", "2026-06-01")' },
  { name: 'PMT', category: 'Date & Financial', syntax: 'PMT(rate, nper, pv)', description: 'Calculates the payment for a loan based on constant payments and a constant interest rate.', example: '=PMT(0.05/12, 24, 500000)' },
  { name: 'FV', category: 'Date & Financial', syntax: 'FV(rate, nper, pmt, [pv])', description: 'Returns the future value of an investment.', example: '=FV(0.06/12, 12, -10000, 0)' },
  { name: 'PV', category: 'Date & Financial', syntax: 'PV(rate, nper, pmt)', description: 'Returns the present value of a loan or an investment.', example: '=PV(0.05/12, 24, -25000)' },
];

// ============================================================================
// Coordinate Helpers (A1 <-> { col, row })
// ============================================================================

export function colIndexToLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

export function letterToColIndex(letter: string): number {
  const clean = letter.toUpperCase().replace(/\$/g, '');
  let col = 0;
  for (let i = 0; i < clean.length; i++) {
    col = col * 26 + (clean.charCodeAt(i) - 64);
  }
  return col - 1;
}

export interface ParsedCellRef {
  col: number; // 0-indexed
  row: number; // 0-indexed
  absCol: boolean;
  absRow: boolean;
  sheet?: string;
}

export function parseCellRef(ref: string): ParsedCellRef | null {
  let targetRef = ref.trim();
  let sheet: string | undefined;
  if (targetRef.includes('!')) {
    const parts = targetRef.split('!');
    sheet = parts[0].replace(/^'|'$/g, '');
    targetRef = parts[1];
  }
  const match = targetRef.match(/^(\$?)([A-Za-z]+)(\$?)(\d+)$/);
  if (!match) return null;
  const absCol = match[1] === '$';
  const col = letterToColIndex(match[2]);
  const absRow = match[3] === '$';
  const row = parseInt(match[4], 10) - 1;
  if (row < 0 || col < 0) return null;
  return { col, row, absCol, absRow, sheet };
}

export function toCellAddress(col: number, row: number, absCol = false, absRow = false): string {
  return `${absCol ? '$' : ''}${colIndexToLetter(col)}${absRow ? '$' : ''}${row + 1}`;
}

export function expandRange(rangeStr: string): { sheet?: string; addresses: string[]; matrix: string[][] } {
  let clean = rangeStr.trim();
  let sheet: string | undefined;
  if (clean.includes('!')) {
    const parts = clean.split('!');
    sheet = parts[0].replace(/^'|'$/g, '');
    clean = parts[1];
  }
  const [startStr, endStr] = clean.split(':');
  const start = parseCellRef(startStr);
  const end = endStr ? parseCellRef(endStr) : start;
  if (!start || !end) {
    return { sheet, addresses: [], matrix: [] };
  }
  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);

  const addresses: string[] = [];
  const matrix: string[][] = [];

  for (let r = minRow; r <= maxRow; r++) {
    const rowArr: string[] = [];
    for (let c = minCol; c <= maxCol; c++) {
      const addr = toCellAddress(c, r);
      addresses.push(addr);
      rowArr.push(addr);
    }
    matrix.push(rowArr);
  }
  return { sheet, addresses, matrix };
}

// ============================================================================
// Relative Reference Shifting (for AutoFill & Copy/Paste)
// ============================================================================

export function shiftFormulaReferences(formula: string, deltaCol: number, deltaRow: number): string {
  if (!formula.startsWith('=')) return formula;
  // Replace cell references outside of double quotes
  let inQuotes = false;
  let result = '';
  let i = 0;

  while (i < formula.length) {
    const ch = formula[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      result += ch;
      i++;
      continue;
    }
    if (!inQuotes) {
      // Match cell ref like $A$1, A1, $B12, B$12 (not followed by '(' which would be a function name like LOG10)
      const rest = formula.slice(i);
      const match = rest.match(/^(\$?[A-Za-z]{1,2}\$?\d+)(?!\s*\()/);
      // Ensure previous character isn't a letter/number
      const prevChar = i > 0 ? formula[i - 1] : '';
      if (match && !/[A-Za-z0-9_]/.test(prevChar)) {
        const refToken = match[1];
        const parsed = parseCellRef(refToken);
        if (parsed) {
          const newCol = parsed.absCol ? parsed.col : Math.max(0, parsed.col + deltaCol);
          const newRow = parsed.absRow ? parsed.row : Math.max(0, parsed.row + deltaRow);
          result += toCellAddress(newCol, newRow, parsed.absCol, parsed.absRow);
          i += refToken.length;
          continue;
        }
      }
    }
    result += ch;
    i++;
  }
  return result;
}

// ============================================================================
// Formula Parser & Evaluator
// ============================================================================

export type CellValue = number | string | boolean;

function isNumericVal(val: unknown): boolean {
  if (typeof val === 'number') return !Number.isNaN(val) && Number.isFinite(val);
  if (typeof val === 'string' && val.trim() !== '') {
    const n = Number(val);
    return !Number.isNaN(n) && Number.isFinite(n);
  }
  return false;
}

function toNumber(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') return 0;
    const n = Number(trimmed);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

function matchesCriteria(val: CellValue, criteria: CellValue): boolean {
  const critStr = String(criteria).trim();
  const opMatch = critStr.match(/^(>=|<=|<>|>|<|=)(.*)$/);
  if (opMatch) {
    const op = opMatch[1];
    const rhsRaw = opMatch[2].trim().replace(/^"|"$/g, '');
    const bothNum = isNumericVal(val) && isNumericVal(rhsRaw);
    const left = bothNum ? Number(val) : String(val).toLowerCase();
    const right = bothNum ? Number(rhsRaw) : rhsRaw.toLowerCase();
    switch (op) {
      case '>': return left > right;
      case '<': return left < right;
      case '>=': return left >= right;
      case '<=': return left <= right;
      case '<>': return left !== right;
      case '=': return left === right;
    }
  }
  if (isNumericVal(val) && isNumericVal(critStr)) {
    return Number(val) === Number(critStr);
  }
  return String(val).toLowerCase() === critStr.toLowerCase();
}

// Split top-level arguments by comma (or semicolon for European locale formulas)
function splitTopLevelArgs(argsStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let depth = 0;
  let inQuotes = false;

  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (!inQuotes) {
      if (ch === '(') {
        depth++;
        current += ch;
      } else if (ch === ')') {
        depth--;
        current += ch;
      } else if ((ch === ',' || ch === ';') && depth === 0) {
        args.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    } else {
      current += ch;
    }
  }
  if (current.trim() !== '' || args.length > 0) {
    args.push(current.trim());
  }
  return args;
}

export function evaluateCell(
  address: string,
  activeSheet: SheetData,
  allSheets: SheetData[],
  visited: Set<string> = new Set()
): CellValue {
  const normAddr = address.toUpperCase().replace(/\$/g, '');
  const visitKey = `${activeSheet.id}!${normAddr}`;
  if (visited.has(visitKey)) {
    return '#REF!'; // Circular reference guard
  }

  const cell = activeSheet.cells[normAddr];
  if (!cell || cell.raw === undefined || cell.raw === '') {
    return '';
  }

  const raw = cell.raw.trim();
  if (!raw.startsWith('=')) {
    if (raw.toUpperCase() === 'TRUE') return true;
    if (raw.toUpperCase() === 'FALSE') return false;
    if (isNumericVal(raw)) return Number(raw);
    return raw;
  }

  const nextVisited = new Set(visited);
  nextVisited.add(visitKey);

  try {
    const expr = raw.slice(1).trim();
    return evaluateExpression(expr, activeSheet, allSheets, nextVisited);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.startsWith('#')) {
      return err.message;
    }
    return '#ERROR!';
  }
}

function getSheetByName(name: string | undefined, activeSheet: SheetData, allSheets: SheetData[]): SheetData {
  if (!name) return activeSheet;
  const found = allSheets.find((s) => s.name.toLowerCase() === name.toLowerCase());
  if (!found) throw new Error('#REF!');
  return found;
}

function resolveRangeValues(
  rangeToken: string,
  activeSheet: SheetData,
  allSheets: SheetData[],
  visited: Set<string>
): { flat: CellValue[]; matrix: CellValue[][] } {
  const { sheet, addresses, matrix } = expandRange(rangeToken);
  const targetSheet = getSheetByName(sheet, activeSheet, allSheets);
  const flat = addresses.map((addr) => evaluateCell(addr, targetSheet, allSheets, visited));
  const valMatrix = matrix.map((row) =>
    row.map((addr) => evaluateCell(addr, targetSheet, allSheets, visited))
  );
  return { flat, matrix: valMatrix };
}

function evaluateArgAsList(
  argExpr: string,
  activeSheet: SheetData,
  allSheets: SheetData[],
  visited: Set<string>
): CellValue[] {
  const clean = argExpr.trim();
  if (/^(?:[A-Za-z0-9_']+!)?\$?[A-Za-z]{1,2}\$?\d+:\$?[A-Za-z]{1,2}\$?\d+$/.test(clean)) {
    return resolveRangeValues(clean, activeSheet, allSheets, visited).flat;
  }
  return [evaluateExpression(clean, activeSheet, allSheets, visited)];
}

function evaluateFunction(
  fnNameRaw: string,
  argsStr: string,
  activeSheet: SheetData,
  allSheets: SheetData[],
  visited: Set<string>
): CellValue {
  const fn = fnNameRaw.toUpperCase();
  const rawArgs = splitTopLevelArgs(argsStr);

  // Special handling for IFERROR so errors are caught cleanly
  if (fn === 'IFERROR') {
    if (rawArgs.length < 2) return '#VALUE!';
    try {
      const val = evaluateExpression(rawArgs[0], activeSheet, allSheets, visited);
      if (typeof val === 'string' && val.startsWith('#')) {
        return evaluateExpression(rawArgs[1], activeSheet, allSheets, visited);
      }
      return val;
    } catch {
      return evaluateExpression(rawArgs[1], activeSheet, allSheets, visited);
    }
  }

  // Lazy evaluation for IF and IFS
  if (fn === 'IF') {
    if (rawArgs.length < 2) return '#VALUE!';
    const cond = evaluateExpression(rawArgs[0], activeSheet, allSheets, visited);
    const isTrue = Boolean(cond) && cond !== 0 && cond !== 'FALSE' && cond !== '';
    if (isTrue) {
      return evaluateExpression(rawArgs[1], activeSheet, allSheets, visited);
    }
    return rawArgs[2] !== undefined
      ? evaluateExpression(rawArgs[2], activeSheet, allSheets, visited)
      : false;
  }

  if (fn === 'IFS') {
    for (let i = 0; i + 1 < rawArgs.length; i += 2) {
      const cond = evaluateExpression(rawArgs[i], activeSheet, allSheets, visited);
      if (Boolean(cond) && cond !== 0 && cond !== 'FALSE') {
        return evaluateExpression(rawArgs[i + 1], activeSheet, allSheets, visited);
      }
    }
    return '#N/A';
  }

  // ROW / COLUMN
  if (fn === 'ROW') {
    if (!rawArgs[0]) return 1;
    const parsed = parseCellRef(rawArgs[0]);
    return parsed ? parsed.row + 1 : '#REF!';
  }
  if (fn === 'COLUMN') {
    if (!rawArgs[0]) return 1;
    const parsed = parseCellRef(rawArgs[0]);
    return parsed ? parsed.col + 1 : '#REF!';
  }

  // Range-based conditional functions
  if (fn === 'COUNTIF') {
    if (rawArgs.length < 2) return '#VALUE!';
    const vals = evaluateArgAsList(rawArgs[0], activeSheet, allSheets, visited);
    const crit = evaluateExpression(rawArgs[1], activeSheet, allSheets, visited);
    return vals.filter((v) => matchesCriteria(v, crit)).length;
  }

  if (fn === 'SUMIF') {
    if (rawArgs.length < 2) return '#VALUE!';
    const rangeVals = evaluateArgAsList(rawArgs[0], activeSheet, allSheets, visited);
    const crit = evaluateExpression(rawArgs[1], activeSheet, allSheets, visited);
    const sumVals = rawArgs[2]
      ? evaluateArgAsList(rawArgs[2], activeSheet, allSheets, visited)
      : rangeVals;
    let total = 0;
    for (let i = 0; i < rangeVals.length; i++) {
      if (matchesCriteria(rangeVals[i], crit)) {
        total += toNumber(sumVals[i]);
      }
    }
    return total;
  }

  if (fn === 'AVERAGEIF') {
    if (rawArgs.length < 2) return '#VALUE!';
    const rangeVals = evaluateArgAsList(rawArgs[0], activeSheet, allSheets, visited);
    const crit = evaluateExpression(rawArgs[1], activeSheet, allSheets, visited);
    const avgVals = rawArgs[2]
      ? evaluateArgAsList(rawArgs[2], activeSheet, allSheets, visited)
      : rangeVals;
    let total = 0;
    let count = 0;
    for (let i = 0; i < rangeVals.length; i++) {
      if (matchesCriteria(rangeVals[i], crit) && isNumericVal(avgVals[i])) {
        total += Number(avgVals[i]);
        count++;
      }
    }
    return count === 0 ? '#DIV/0!' : total / count;
  }

  if (fn === 'RANK') {
    if (rawArgs.length < 2) return '#VALUE!';
    const target = toNumber(evaluateExpression(rawArgs[0], activeSheet, allSheets, visited));
    const list = evaluateArgAsList(rawArgs[1], activeSheet, allSheets, visited)
      .filter((v) => isNumericVal(v))
      .map((v) => Number(v));
    const order = rawArgs[2] ? toNumber(evaluateExpression(rawArgs[2], activeSheet, allSheets, visited)) : 0;
    const sorted = [...list].sort((a, b) => (order === 0 ? b - a : a - b));
    const idx = sorted.findIndex((n) => Math.abs(n - target) < 1e-9);
    return idx === -1 ? '#N/A' : idx + 1;
  }

  if (fn === 'VLOOKUP') {
    if (rawArgs.length < 3) return '#VALUE!';
    const lookupVal = evaluateExpression(rawArgs[0], activeSheet, allSheets, visited);
    const { matrix } = resolveRangeValues(rawArgs[1], activeSheet, allSheets, visited);
    const colIdx = toNumber(evaluateExpression(rawArgs[2], activeSheet, allSheets, visited)) - 1;
    const exactMatch = rawArgs[3]
      ? !Boolean(evaluateExpression(rawArgs[3], activeSheet, allSheets, visited)) ||
        String(evaluateExpression(rawArgs[3], activeSheet, allSheets, visited)).toUpperCase() === 'FALSE'
      : false;

    if (colIdx < 0 || (matrix[0] && colIdx >= matrix[0].length)) return '#REF!';
    for (const row of matrix) {
      const cellVal = row[0];
      const match =
        String(cellVal).toLowerCase() === String(lookupVal).toLowerCase() ||
        (isNumericVal(cellVal) && isNumericVal(lookupVal) && Number(cellVal) === Number(lookupVal));
      if (match) {
        return row[colIdx] ?? '';
      }
    }
    if (!exactMatch && matrix.length > 0) {
      return matrix[matrix.length - 1][colIdx] ?? '#N/A';
    }
    return '#N/A';
  }

  if (fn === 'HLOOKUP') {
    if (rawArgs.length < 3) return '#VALUE!';
    const lookupVal = evaluateExpression(rawArgs[0], activeSheet, allSheets, visited);
    const { matrix } = resolveRangeValues(rawArgs[1], activeSheet, allSheets, visited);
    const rowIdx = toNumber(evaluateExpression(rawArgs[2], activeSheet, allSheets, visited)) - 1;
    if (rowIdx < 0 || rowIdx >= matrix.length || matrix.length === 0) return '#REF!';
    const firstRow = matrix[0];
    for (let c = 0; c < firstRow.length; c++) {
      if (String(firstRow[c]).toLowerCase() === String(lookupVal).toLowerCase()) {
        return matrix[rowIdx][c] ?? '';
      }
    }
    return '#N/A';
  }

  if (fn === 'INDEX') {
    if (rawArgs.length < 2) return '#VALUE!';
    const { matrix } = resolveRangeValues(rawArgs[0], activeSheet, allSheets, visited);
    const r = toNumber(evaluateExpression(rawArgs[1], activeSheet, allSheets, visited)) - 1;
    const c = rawArgs[2] ? toNumber(evaluateExpression(rawArgs[2], activeSheet, allSheets, visited)) - 1 : 0;
    if (r < 0 || r >= matrix.length || c < 0 || (matrix[0] && c >= matrix[0].length)) return '#REF!';
    return matrix[r][c];
  }

  if (fn === 'MATCH') {
    if (rawArgs.length < 2) return '#VALUE!';
    const lookupVal = evaluateExpression(rawArgs[0], activeSheet, allSheets, visited);
    const list = evaluateArgAsList(rawArgs[1], activeSheet, allSheets, visited);
    const idx = list.findIndex(
      (v) =>
        String(v).toLowerCase() === String(lookupVal).toLowerCase() ||
        (isNumericVal(v) && isNumericVal(lookupVal) && Number(v) === Number(lookupVal))
    );
    return idx === -1 ? '#N/A' : idx + 1;
  }

  // Flatten all arguments (supporting both ranges and single values)
  const flatValues: CellValue[] = [];
  for (const arg of rawArgs) {
    if (arg !== '') {
      flatValues.push(...evaluateArgAsList(arg, activeSheet, allSheets, visited));
    }
  }

  const numericValues = flatValues.filter((v) => isNumericVal(v)).map((v) => Number(v));

  switch (fn) {
    case 'SUM':
      return numericValues.reduce((acc, n) => acc + n, 0);
    case 'AVERAGE':
    case 'MEAN':
      return numericValues.length === 0
        ? '#DIV/0!'
        : numericValues.reduce((acc, n) => acc + n, 0) / numericValues.length;
    case 'MIN':
      return numericValues.length === 0 ? 0 : Math.min(...numericValues);
    case 'MAX':
      return numericValues.length === 0 ? 0 : Math.max(...numericValues);
    case 'COUNT':
      return numericValues.length;
    case 'COUNTA':
      return flatValues.filter((v) => v !== '' && v !== null && v !== undefined).length;
    case 'COUNTBLANK':
      return flatValues.filter((v) => v === '' || v === null || v === undefined).length;
    case 'MEDIAN': {
      if (numericValues.length === 0) return 0;
      const sorted = [...numericValues].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    case 'MODE': {
      if (numericValues.length === 0) return '#N/A';
      const counts = new Map<number, number>();
      let best = numericValues[0];
      let bestCount = 0;
      for (const n of numericValues) {
        const c = (counts.get(n) || 0) + 1;
        counts.set(n, c);
        if (c > bestCount) {
          bestCount = c;
          best = n;
        }
      }
      return best;
    }
    case 'STDEV':
    case 'STDEV.S': {
      if (numericValues.length < 2) return '#DIV/0!';
      const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      const variance =
        numericValues.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) / (numericValues.length - 1);
      return Math.sqrt(variance);
    }
    case 'VAR':
    case 'VAR.S': {
      if (numericValues.length < 2) return '#DIV/0!';
      const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      return numericValues.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) / (numericValues.length - 1);
    }
    case 'PRODUCT':
      return numericValues.length === 0 ? 0 : numericValues.reduce((acc, n) => acc * n, 1);
    case 'ROUND': {
      const num = toNumber(flatValues[0]);
      const digits = toNumber(flatValues[1] ?? 0);
      const factor = Math.pow(10, digits);
      return Math.round(num * factor) / factor;
    }
    case 'ROUNDUP': {
      const num = toNumber(flatValues[0]);
      const digits = toNumber(flatValues[1] ?? 0);
      const factor = Math.pow(10, digits);
      return (num >= 0 ? Math.ceil(num * factor) : Math.floor(num * factor)) / factor;
    }
    case 'ROUNDDOWN': {
      const num = toNumber(flatValues[0]);
      const digits = toNumber(flatValues[1] ?? 0);
      const factor = Math.pow(10, digits);
      return (num >= 0 ? Math.floor(num * factor) : Math.ceil(num * factor)) / factor;
    }
    case 'INT':
      return Math.floor(toNumber(flatValues[0]));
    case 'ABS':
      return Math.abs(toNumber(flatValues[0]));
    case 'SQRT': {
      const n = toNumber(flatValues[0]);
      return n < 0 ? '#NUM!' : Math.sqrt(n);
    }
    case 'POWER':
      return Math.pow(toNumber(flatValues[0]), toNumber(flatValues[1] ?? 1));
    case 'MOD': {
      const d = toNumber(flatValues[1]);
      if (d === 0) return '#DIV/0!';
      return toNumber(flatValues[0]) % d;
    }
    case 'PI':
      return Math.PI;
    case 'RAND':
      return Number(Math.random().toFixed(6));
    case 'RANDBETWEEN': {
      const min = Math.ceil(toNumber(flatValues[0] ?? 0));
      const max = Math.floor(toNumber(flatValues[1] ?? 100));
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    case 'AND':
      return flatValues.every((v) => Boolean(v) && v !== 0 && String(v).toUpperCase() !== 'FALSE');
    case 'OR':
      return flatValues.some((v) => Boolean(v) && v !== 0 && String(v).toUpperCase() !== 'FALSE');
    case 'XOR': {
      const trues = flatValues.filter((v) => Boolean(v) && v !== 0 && String(v).toUpperCase() !== 'FALSE').length;
      return trues % 2 === 1;
    }
    case 'NOT': {
      const v = flatValues[0];
      return !(Boolean(v) && v !== 0 && String(v).toUpperCase() !== 'FALSE');
    }
    case 'TRUE':
      return true;
    case 'FALSE':
      return false;
    case 'CHOOSE': {
      const idx = toNumber(flatValues[0]);
      if (idx < 1 || idx >= flatValues.length) return '#VALUE!';
      return flatValues[idx];
    }
    case 'CONCAT':
    case 'CONCATENATE':
      return flatValues.map((v) => String(v)).join('');
    case 'UPPER':
      return String(flatValues[0] ?? '').toUpperCase();
    case 'LOWER':
      return String(flatValues[0] ?? '').toLowerCase();
    case 'PROPER':
      return String(flatValues[0] ?? '').replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
      );
    case 'TRIM':
      return String(flatValues[0] ?? '').trim().replace(/\s+/g, ' ');
    case 'LEN':
      return String(flatValues[0] ?? '').length;
    case 'LEFT':
      return String(flatValues[0] ?? '').slice(0, toNumber(flatValues[1] ?? 1));
    case 'RIGHT': {
      const s = String(flatValues[0] ?? '');
      const len = toNumber(flatValues[1] ?? 1);
      return s.slice(Math.max(0, s.length - len));
    }
    case 'MID': {
      const s = String(flatValues[0] ?? '');
      const start = Math.max(1, toNumber(flatValues[1] ?? 1)) - 1;
      const len = toNumber(flatValues[2] ?? 1);
      return s.slice(start, start + len);
    }
    case 'SUBSTITUTE': {
      const text = String(flatValues[0] ?? '');
      const oldText = String(flatValues[1] ?? '');
      const newText = String(flatValues[2] ?? '');
      return text.split(oldText).join(newText);
    }
    case 'REPLACE': {
      const text = String(flatValues[0] ?? '');
      const start = Math.max(1, toNumber(flatValues[1] ?? 1)) - 1;
      const count = toNumber(flatValues[2] ?? 0);
      const replacement = String(flatValues[3] ?? '');
      return text.slice(0, start) + replacement + text.slice(start + count);
    }
    case 'FIND':
    case 'SEARCH': {
      const needle = String(flatValues[0] ?? '');
      const haystack = String(flatValues[1] ?? '');
      const start = Math.max(1, toNumber(flatValues[2] ?? 1)) - 1;
      const idx =
        fn === 'SEARCH'
          ? haystack.toLowerCase().indexOf(needle.toLowerCase(), start)
          : haystack.indexOf(needle, start);
      return idx === -1 ? '#VALUE!' : idx + 1;
    }
    case 'VALUE': {
      const n = Number(String(flatValues[0] ?? '').replace(/[^0-9.-]/g, ''));
      return Number.isNaN(n) ? '#VALUE!' : n;
    }
    case 'TEXT': {
      const val = toNumber(flatValues[0]);
      const fmt = String(flatValues[1] ?? '');
      if (fmt.includes('%')) return `${(val * 100).toFixed(1)}%`;
      if (fmt.includes('.00')) return val.toFixed(2);
      return String(val);
    }
    case 'EXACT':
      return String(flatValues[0] ?? '') === String(flatValues[1] ?? '');
    case 'REPT':
      return String(flatValues[0] ?? '').repeat(Math.max(0, Math.min(200, toNumber(flatValues[1] ?? 1))));
    case 'TODAY':
    case 'NOW':
      return new Date().toISOString().split('T')[0];
    case 'DATE': {
      const y = toNumber(flatValues[0] ?? 2026);
      const m = String(toNumber(flatValues[1] ?? 1)).padStart(2, '0');
      const d = String(toNumber(flatValues[2] ?? 1)).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    case 'YEAR': {
      const d = new Date(String(flatValues[0]));
      return Number.isNaN(d.getTime()) ? '#VALUE!' : d.getFullYear();
    }
    case 'MONTH': {
      const d = new Date(String(flatValues[0]));
      return Number.isNaN(d.getTime()) ? '#VALUE!' : d.getMonth() + 1;
    }
    case 'DAY': {
      const d = new Date(String(flatValues[0]));
      return Number.isNaN(d.getTime()) ? '#VALUE!' : d.getDate();
    }
    case 'DAYS':
    case 'DATEDIF': {
      const d1 = new Date(String(flatValues[0]));
      const d2 = new Date(String(flatValues[1]));
      if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return '#VALUE!';
      return Math.round(Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
    }
    case 'PMT': {
      const rate = toNumber(flatValues[0]);
      const nper = toNumber(flatValues[1]);
      const pv = toNumber(flatValues[2]);
      if (nper === 0) return '#DIV/0!';
      if (rate === 0) return -(pv / nper);
      return Number((-(pv * rate) / (1 - Math.pow(1 + rate, -nper))).toFixed(2));
    }
    case 'FV': {
      const rate = toNumber(flatValues[0]);
      const nper = toNumber(flatValues[1]);
      const pmt = toNumber(flatValues[2]);
      const pv = toNumber(flatValues[3] ?? 0);
      if (rate === 0) return -(pv + pmt * nper);
      const term = Math.pow(1 + rate, nper);
      return Number((-pv * term - (pmt * (term - 1)) / rate).toFixed(2));
    }
    case 'PV': {
      const rate = toNumber(flatValues[0]);
      const nper = toNumber(flatValues[1]);
      const pmt = toNumber(flatValues[2]);
      if (rate === 0) return -(pmt * nper);
      return Number(((-pmt * (1 - Math.pow(1 + rate, -nper))) / rate).toFixed(2));
    }
    default:
      throw new Error('#NAME?');
  }
}

// Recursive descent expression evaluator supporting:
// Comparisons (=, <>, >=, <=, >, <), Concatenation (&), Addition (+, -),
// Multiplication (*, /), Exponentiation (^), Postfix %, Parentheses, Functions, Cell Refs, Strings, Numbers
function findTopLevelOperator(expr: string, ops: string[]): { index: number; op: string } | null {
  let depth = 0;
  let inQuotes = false;
  // Scan right-to-left for left-associative binary operators
  for (let i = expr.length - 1; i >= 0; i--) {
    const ch = expr[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (inQuotes) continue;
    if (ch === ')') depth++;
    else if (ch === '(') depth--;
    else if (depth === 0) {
      for (const op of ops) {
        if (expr.slice(i, i + op.length) === op) {
          // Avoid matching unary + or - after another operator
          if ((op === '+' || op === '-') && i > 0) {
            const prev = expr.slice(0, i).trim();
            if (prev === '' || /[+\-*/^&=<>]$/.test(prev)) {
              continue;
            }
          }
          // Avoid matching '=' inside '>=' '<=' '<>'
          if (op === '=' && i > 0 && ['>', '<'].includes(expr[i - 1])) {
            continue;
          }
          if ((op === '>' || op === '<') && expr[i + 1] === '=') {
            continue;
          }
          if (op === '<' && expr[i + 1] === '>') {
            continue;
          }
          return { index: i, op };
        }
      }
    }
  }
  return null;
}

function stripOuterParens(expr: string): string {
  let s = expr.trim();
  while (s.startsWith('(') && s.endsWith(')')) {
    let depth = 0;
    let inQuotes = false;
    let wrapsAll = true;
    for (let i = 0; i < s.length - 1; i++) {
      const ch = s[i];
      if (ch === '"') inQuotes = !inQuotes;
      else if (!inQuotes) {
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        if (depth === 0) {
          wrapsAll = false;
          break;
        }
      }
    }
    if (wrapsAll) {
      s = s.slice(1, -1).trim();
    } else {
      break;
    }
  }
  return s;
}

export function evaluateExpression(
  rawExpr: string,
  activeSheet: SheetData,
  allSheets: SheetData[],
  visited: Set<string>
): CellValue {
  const expr = stripOuterParens(rawExpr);
  if (expr === '') return '';

  // 1. Comparison operators
  const cmp = findTopLevelOperator(expr, ['>=', '<=', '<>', '=', '>', '<']);
  if (cmp && cmp.index > 0) {
    const left = evaluateExpression(expr.slice(0, cmp.index), activeSheet, allSheets, visited);
    const right = evaluateExpression(expr.slice(cmp.index + cmp.op.length), activeSheet, allSheets, visited);
    const bothNum = isNumericVal(left) && isNumericVal(right);
    const lVal = bothNum ? Number(left) : String(left).toLowerCase();
    const rVal = bothNum ? Number(right) : String(right).toLowerCase();
    switch (cmp.op) {
      case '=': return lVal === rVal;
      case '<>': return lVal !== rVal;
      case '>': return lVal > rVal;
      case '<': return lVal < rVal;
      case '>=': return lVal >= rVal;
      case '<=': return lVal <= rVal;
    }
  }

  // 2. String concatenation (&)
  const concatOp = findTopLevelOperator(expr, ['&']);
  if (concatOp && concatOp.index > 0) {
    const left = evaluateExpression(expr.slice(0, concatOp.index), activeSheet, allSheets, visited);
    const right = evaluateExpression(expr.slice(concatOp.index + 1), activeSheet, allSheets, visited);
    return `${left}${right}`;
  }

  // 3. Addition / Subtraction (+, -)
  const addSub = findTopLevelOperator(expr, ['+', '-']);
  if (addSub && addSub.index > 0) {
    const left = evaluateExpression(expr.slice(0, addSub.index), activeSheet, allSheets, visited);
    const right = evaluateExpression(expr.slice(addSub.index + 1), activeSheet, allSheets, visited);
    if (typeof left === 'string' && left.startsWith('#')) return left;
    if (typeof right === 'string' && right.startsWith('#')) return right;
    return addSub.op === '+' ? toNumber(left) + toNumber(right) : toNumber(left) - toNumber(right);
  }

  // 4. Multiplication / Division (*, /)
  const mulDiv = findTopLevelOperator(expr, ['*', '/']);
  if (mulDiv && mulDiv.index > 0) {
    const left = evaluateExpression(expr.slice(0, mulDiv.index), activeSheet, allSheets, visited);
    const right = evaluateExpression(expr.slice(mulDiv.index + 1), activeSheet, allSheets, visited);
    if (typeof left === 'string' && left.startsWith('#')) return left;
    if (typeof right === 'string' && right.startsWith('#')) return right;
    const rNum = toNumber(right);
    if (mulDiv.op === '/') {
      if (rNum === 0) return '#DIV/0!';
      return toNumber(left) / rNum;
    }
    return toNumber(left) * rNum;
  }

  // 5. Exponentiation (^)
  const powOp = findTopLevelOperator(expr, ['^']);
  if (powOp && powOp.index > 0) {
    const left = evaluateExpression(expr.slice(0, powOp.index), activeSheet, allSheets, visited);
    const right = evaluateExpression(expr.slice(powOp.index + 1), activeSheet, allSheets, visited);
    return Math.pow(toNumber(left), toNumber(right));
  }

  // 6. Unary + or -
  if (expr.startsWith('-')) {
    return -toNumber(evaluateExpression(expr.slice(1), activeSheet, allSheets, visited));
  }
  if (expr.startsWith('+')) {
    return +toNumber(evaluateExpression(expr.slice(1), activeSheet, allSheets, visited));
  }

  // 7. Percentage literal (e.g. 19.25%)
  if (expr.endsWith('%') && !expr.startsWith('"')) {
    const inner = evaluateExpression(expr.slice(0, -1), activeSheet, allSheets, visited);
    return toNumber(inner) / 100;
  }

  // 8. String literal
  if (expr.startsWith('"') && expr.endsWith('"')) {
    return expr.slice(1, -1).replace(/""/g, '"');
  }

  // 9. Boolean literal
  if (expr.toUpperCase() === 'TRUE') return true;
  if (expr.toUpperCase() === 'FALSE') return false;

  // 10. Numeric literal
  if (isNumericVal(expr)) {
    return Number(expr);
  }

  // 11. Function call: FUNC_NAME(...)
  const fnMatch = expr.match(/^([A-Za-z_][A-Za-z0-9_.]*)\s*\(([\s\S]*)\)$/);
  if (fnMatch) {
    return evaluateFunction(fnMatch[1], fnMatch[2], activeSheet, allSheets, visited);
  }

  // 12. Cell Reference (with optional Sheet! prefix)
  const parsedRef = parseCellRef(expr);
  if (parsedRef) {
    const targetSheet = getSheetByName(parsedRef.sheet, activeSheet, allSheets);
    const addr = toCellAddress(parsedRef.col, parsedRef.row);
    return evaluateCell(addr, targetSheet, allSheets, visited);
  }

  throw new Error('#NAME?');
}

// ============================================================================
// Display Value Formatting & Conditional Formatting
// ============================================================================

export function formatCellValue(value: CellValue, format: NumberFormatType = 'general'): string {
  if (value === '' || value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'string' && value.startsWith('#')) return value;

  if (!isNumericVal(value)) return String(value);
  const num = Number(value);

  switch (format) {
    case 'number_2dec':
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case 'integer':
      return Math.round(num).toLocaleString('en-US');
    case 'currency_fcfa':
      return `${Math.round(num).toLocaleString('en-US')} FCFA`;
    case 'currency_usd':
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'percent':
      return `${(num * 100).toFixed(1)}%`;
    case 'general':
    default: {
      if (Number.isInteger(num)) return String(num);
      return Number(num.toFixed(4)).toString();
    }
  }
}

export function getConditionalFormattingStyle(
  address: string,
  value: CellValue,
  rules: ConditionalRule[]
): { bg?: string; color?: string } | null {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = parseCellRef(address);
  if (!parsed) return null;

  for (const rule of rules) {
    const { addresses } = expandRange(rule.range);
    if (!addresses.includes(address)) continue;

    const bothNum = isNumericVal(value) && isNumericVal(rule.value1);
    const v = bothNum ? Number(value) : String(value).toLowerCase();
    const t1 = bothNum ? Number(rule.value1) : rule.value1.toLowerCase();

    let matched = false;
    switch (rule.operator) {
      case 'gt': matched = v > t1; break;
      case 'lt': matched = v < t1; break;
      case 'gte': matched = v >= t1; break;
      case 'lte': matched = v <= t1; break;
      case 'eq': matched = v === t1; break;
      case 'contains':
        matched = String(value).toLowerCase().includes(rule.value1.toLowerCase());
        break;
      case 'between': {
        const t2 = isNumericVal(rule.value2) ? Number(rule.value2) : String(rule.value2 ?? '').toLowerCase();
        matched = v >= t1 && v <= t2;
        break;
      }
    }

    if (matched) {
      return { bg: rule.bg, color: rule.color };
    }
  }
  return null;
}

// ============================================================================
// Built-in GCE & Practical Templates
// ============================================================================

export interface ExcelTemplate {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  sheets: SheetData[];
}

export const EXCEL_TEMPLATES: ExcelTemplate[] = [
  {
    id: 'gce-report-card',
    title: 'GCE Student Report Card & Grading',
    subtitle: 'Practice SUM, AVERAGE, IF, IFS, RANK, MAX, MIN & COUNTIF',
    badge: 'GCE O/A Level',
    sheets: [
      {
        id: 'sheet-1',
        name: 'Term1_Scores',
        freezeHeader: true,
        colWidths: { 0: 155, 1: 95, 2: 95, 3: 95, 4: 95, 5: 105, 6: 95, 7: 80, 8: 80 },
        rowHeights: {},
        conditionalRules: [
          {
            id: 'rule-pass',
            range: 'G2:G7',
            operator: 'eq',
            value1: 'PASS',
            bg: '#064e3b',
            color: '#6ee7b7',
            label: 'Highlight PASS in Green',
          },
          {
            id: 'rule-fail',
            range: 'G2:G7',
            operator: 'eq',
            value1: 'FAIL',
            bg: '#7f1d1d',
            color: '#fca5a5',
            label: 'Highlight FAIL in Red',
          },
        ],
        charts: [
          {
            id: 'chart-1',
            title: 'Student Average Score (%)',
            type: 'column',
            labelRange: 'A2:A7',
            dataRange: 'F2:F7',
          },
        ],
        cells: {
          A1: { raw: 'Student Name', style: { bold: true, bg: '#1e293b', color: '#f8fafc' } },
          B1: { raw: 'Computer Sci', style: { bold: true, bg: '#1e293b', color: '#f8fafc', align: 'right' } },
          C1: { raw: 'Mathematics', style: { bold: true, bg: '#1e293b', color: '#f8fafc', align: 'right' } },
          D1: { raw: 'Physics', style: { bold: true, bg: '#1e293b', color: '#f8fafc', align: 'right' } },
          E1: { raw: 'Total', style: { bold: true, bg: '#1e293b', color: '#38bdf8', align: 'right' } },
          F1: { raw: 'Average', style: { bold: true, bg: '#1e293b', color: '#38bdf8', align: 'right' } },
          G1: { raw: 'Remark', style: { bold: true, bg: '#1e293b', color: '#f8fafc', align: 'center' } },
          H1: { raw: 'Grade', style: { bold: true, bg: '#1e293b', color: '#f8fafc', align: 'center' } },
          I1: { raw: 'Rank', style: { bold: true, bg: '#1e293b', color: '#fbbf24', align: 'center' } },

          A2: { raw: 'Neba Frank' },
          B2: { raw: '88' },
          C2: { raw: '82' },
          D2: { raw: '79' },
          E2: { raw: '=SUM(B2:D2)', style: { bold: true } },
          F2: { raw: '=ROUND(AVERAGE(B2:D2), 1)', style: { format: 'number_2dec' } },
          G2: { raw: '=IF(F2>=50, "PASS", "FAIL")', style: { bold: true, align: 'center' } },
          H2: { raw: '=IFS(F2>=75, "A", F2>=65, "B", F2>=50, "C", TRUE, "F")', style: { bold: true, align: 'center' } },
          I2: { raw: '=RANK(F2, $F$2:$F$7)', style: { align: 'center' } },

          A3: { raw: 'Amina Bello' },
          B3: { raw: '92' },
          C3: { raw: '89' },
          D3: { raw: '85' },
          E3: { raw: '=SUM(B3:D3)', style: { bold: true } },
          F3: { raw: '=ROUND(AVERAGE(B3:D3), 1)', style: { format: 'number_2dec' } },
          G3: { raw: '=IF(F3>=50, "PASS", "FAIL")', style: { bold: true, align: 'center' } },
          H3: { raw: '=IFS(F3>=75, "A", F3>=65, "B", F3>=50, "C", TRUE, "F")', style: { bold: true, align: 'center' } },
          I3: { raw: '=RANK(F3, $F$2:$F$7)', style: { align: 'center' } },

          A4: { raw: 'Tabe Claudia' },
          B4: { raw: '64' },
          C4: { raw: '58' },
          D4: { raw: '61' },
          E4: { raw: '=SUM(B4:D4)', style: { bold: true } },
          F4: { raw: '=ROUND(AVERAGE(B4:D4), 1)', style: { format: 'number_2dec' } },
          G4: { raw: '=IF(F4>=50, "PASS", "FAIL")', style: { bold: true, align: 'center' } },
          H4: { raw: '=IFS(F4>=75, "A", F4>=65, "B", F4>=50, "C", TRUE, "F")', style: { bold: true, align: 'center' } },
          I4: { raw: '=RANK(F4, $F$2:$F$7)', style: { align: 'center' } },

          A5: { raw: 'Fru Junior' },
          B5: { raw: '42' },
          C5: { raw: '39' },
          D5: { raw: '45' },
          E5: { raw: '=SUM(B5:D5)', style: { bold: true } },
          F5: { raw: '=ROUND(AVERAGE(B5:D5), 1)', style: { format: 'number_2dec' } },
          G5: { raw: '=IF(F5>=50, "PASS", "FAIL")', style: { bold: true, align: 'center' } },
          H5: { raw: '=IFS(F5>=75, "A", F5>=65, "B", F5>=50, "C", TRUE, "F")', style: { bold: true, align: 'center' } },
          I5: { raw: '=RANK(F5, $F$2:$F$7)', style: { align: 'center' } },

          A6: { raw: 'Ngwa Paul' },
          B6: { raw: '76' },
          C6: { raw: '71' },
          D6: { raw: '68' },
          E6: { raw: '=SUM(B6:D6)', style: { bold: true } },
          F6: { raw: '=ROUND(AVERAGE(B6:D6), 1)', style: { format: 'number_2dec' } },
          G6: { raw: '=IF(F6>=50, "PASS", "FAIL")', style: { bold: true, align: 'center' } },
          H6: { raw: '=IFS(F6>=75, "A", F6>=65, "B", F6>=50, "C", TRUE, "F")', style: { bold: true, align: 'center' } },
          I6: { raw: '=RANK(F6, $F$2:$F$7)', style: { align: 'center' } },

          A7: { raw: 'Enow Grace' },
          B7: { raw: '54' },
          C7: { raw: '51' },
          D7: { raw: '49' },
          E7: { raw: '=SUM(B7:D7)', style: { bold: true } },
          F7: { raw: '=ROUND(AVERAGE(B7:D7), 1)', style: { format: 'number_2dec' } },
          G7: { raw: '=IF(F7>=50, "PASS", "FAIL")', style: { bold: true, align: 'center' } },
          H7: { raw: '=IFS(F7>=75, "A", F7>=65, "B", F7>=50, "C", TRUE, "F")', style: { bold: true, align: 'center' } },
          I7: { raw: '=RANK(F7, $F$2:$F$7)', style: { align: 'center' } },

          A9: { raw: 'Class Mean', style: { bold: true, color: '#38bdf8' } },
          B9: { raw: '=ROUND(AVERAGE(B2:B7), 1)', style: { bold: true } },
          C9: { raw: '=ROUND(AVERAGE(C2:C7), 1)', style: { bold: true } },
          D9: { raw: '=ROUND(AVERAGE(D2:D7), 1)', style: { bold: true } },
          E9: { raw: '=ROUND(AVERAGE(E2:E7), 1)', style: { bold: true } },
          F9: { raw: '=ROUND(AVERAGE(F2:F7), 1)', style: { bold: true } },

          A10: { raw: 'Highest Score', style: { bold: true, color: '#34d399' } },
          B10: { raw: '=MAX(B2:B7)', style: { bold: true } },
          C10: { raw: '=MAX(C2:C7)', style: { bold: true } },
          D10: { raw: '=MAX(D2:D7)', style: { bold: true } },
          E10: { raw: '=MAX(E2:E7)', style: { bold: true } },
          F10: { raw: '=MAX(F2:F7)', style: { bold: true } },

          A11: { raw: 'Number Passed', style: { bold: true, color: '#fbbf24' } },
          B11: { raw: '=COUNTIF(G2:G7, "PASS")', style: { bold: true } },
        },
      },
    ],
  },
  {
    id: 'supermarket-invoice',
    title: 'Supermarket Sales Invoice & VAT ($A$1)',
    subtitle: 'Practice Absolute Cell References ($C$1), Currency FCFA, Discounts & VLOOKUP',
    badge: 'Commercial / GCE',
    sheets: [
      {
        id: 'sheet-1',
        name: 'Sales_Invoice',
        freezeHeader: true,
        colWidths: { 0: 150, 1: 90, 2: 115, 3: 125, 4: 115, 5: 130 },
        rowHeights: {},
        conditionalRules: [],
        charts: [
          {
            id: 'chart-inv',
            title: 'Net Amount by Item (FCFA)',
            type: 'bar',
            labelRange: 'A4:A8',
            dataRange: 'F4:F8',
          },
        ],
        cells: {
          A1: { raw: 'VAT Tax Rate:', style: { bold: true, color: '#fbbf24' } },
          B1: { raw: '0.1925', style: { bold: true, format: 'percent', color: '#fbbf24' } },
          D1: { raw: 'Discount Rate:', style: { bold: true, color: '#38bdf8' } },
          E1: { raw: '0.05', style: { bold: true, format: 'percent', color: '#38bdf8' } },

          A3: { raw: 'Item Description', style: { bold: true, bg: '#1e293b', color: '#f8fafc' } },
          B3: { raw: 'Qty', style: { bold: true, bg: '#1e293b', color: '#f8fafc', align: 'right' } },
          C3: { raw: 'Unit Price', style: { bold: true, bg: '#1e293b', color: '#f8fafc', align: 'right' } },
          D3: { raw: 'Gross Total', style: { bold: true, bg: '#1e293b', color: '#f8fafc', align: 'right' } },
          E3: { raw: 'VAT (19.25%)', style: { bold: true, bg: '#1e293b', color: '#fbbf24', align: 'right' } },
          F3: { raw: 'Net Payable', style: { bold: true, bg: '#1e293b', color: '#34d399', align: 'right' } },

          A4: { raw: 'Exercise Books (Pack)' },
          B4: { raw: '12' },
          C4: { raw: '2500', style: { format: 'currency_fcfa' } },
          D4: { raw: '=B4*C4', style: { format: 'currency_fcfa' } },
          E4: { raw: '=D4*$B$1', style: { format: 'currency_fcfa' } },
          F4: { raw: '=D4+E4', style: { bold: true, format: 'currency_fcfa' } },

          A5: { raw: 'Scientific Calculator' },
          B5: { raw: '4' },
          C5: { raw: '8500', style: { format: 'currency_fcfa' } },
          D5: { raw: '=B5*C5', style: { format: 'currency_fcfa' } },
          E5: { raw: '=D5*$B$1', style: { format: 'currency_fcfa' } },
          F5: { raw: '=D5+E5', style: { bold: true, format: 'currency_fcfa' } },

          A6: { raw: 'USB Flash Drive 64GB' },
          B6: { raw: '6' },
          C6: { raw: '5000', style: { format: 'currency_fcfa' } },
          D6: { raw: '=B6*C6', style: { format: 'currency_fcfa' } },
          E6: { raw: '=D6*$B$1', style: { format: 'currency_fcfa' } },
          F6: { raw: '=D6+E6', style: { bold: true, format: 'currency_fcfa' } },

          A7: { raw: 'GCE Computer Textbook' },
          B7: { raw: '5' },
          C7: { raw: '6000', style: { format: 'currency_fcfa' } },
          D7: { raw: '=B7*C7', style: { format: 'currency_fcfa' } },
          E7: { raw: '=D7*$B$1', style: { format: 'currency_fcfa' } },
          F7: { raw: '=D7+E7', style: { bold: true, format: 'currency_fcfa' } },

          A8: { raw: 'Mathematical Set' },
          B8: { raw: '10' },
          C8: { raw: '1500', style: { format: 'currency_fcfa' } },
          D8: { raw: '=B8*C8', style: { format: 'currency_fcfa' } },
          E8: { raw: '=D8*$B$1', style: { format: 'currency_fcfa' } },
          F8: { raw: '=D8+E8', style: { bold: true, format: 'currency_fcfa' } },

          A10: { raw: 'GRAND TOTAL', style: { bold: true, color: '#34d399' } },
          D10: { raw: '=SUM(D4:D8)', style: { bold: true, format: 'currency_fcfa' } },
          E10: { raw: '=SUM(E4:E8)', style: { bold: true, format: 'currency_fcfa' } },
          F10: { raw: '=SUM(F4:F8)', style: { bold: true, format: 'currency_fcfa', color: '#34d399' } },
        },
      },
    ],
  },
  {
    id: 'employee-payroll',
    title: 'Company Payroll & Tax Deduction Sheet',
    subtitle: 'Practice IF, Allowances, Tax Brackets & Net Salary Calculations',
    badge: 'Practical Exam',
    sheets: [
      {
        id: 'sheet-1',
        name: 'Payroll_2026',
        freezeHeader: true,
        colWidths: { 0: 145, 1: 110, 2: 120, 3: 115, 4: 115, 5: 125 },
        rowHeights: {},
        conditionalRules: [],
        charts: [],
        cells: {
          A1: { raw: 'Employee Name', style: { bold: true, bg: '#1e293b', color: '#f8fafc' } },
          B1: { raw: 'Department', style: { bold: true, bg: '#1e293b', color: '#f8fafc' } },
          C1: { raw: 'Basic Salary', style: { bold: true, bg: '#1e293b', color: '#f8fafc', align: 'right' } },
          D1: { raw: 'Housing (15%)', style: { bold: true, bg: '#1e293b', color: '#38bdf8', align: 'right' } },
          E1: { raw: 'Income Tax', style: { bold: true, bg: '#1e293b', color: '#f87171', align: 'right' } },
          F1: { raw: 'Net Salary', style: { bold: true, bg: '#1e293b', color: '#34d399', align: 'right' } },

          A2: { raw: 'Ndifor Samuel' },
          B2: { raw: 'Engineering' },
          C2: { raw: '350000', style: { format: 'currency_fcfa' } },
          D2: { raw: '=C2*0.15', style: { format: 'currency_fcfa' } },
          E2: { raw: '=IF(C2>=250000, C2*0.1, C2*0.05)', style: { format: 'currency_fcfa' } },
          F2: { raw: '=C2+D2-E2', style: { bold: true, format: 'currency_fcfa' } },

          A3: { raw: 'Mbah Chantal' },
          B3: { raw: 'Accounting' },
          C3: { raw: '280000', style: { format: 'currency_fcfa' } },
          D3: { raw: '=C3*0.15', style: { format: 'currency_fcfa' } },
          E3: { raw: '=IF(C3>=250000, C3*0.1, C3*0.05)', style: { format: 'currency_fcfa' } },
          F3: { raw: '=C3+D3-E3', style: { bold: true, format: 'currency_fcfa' } },

          A4: { raw: 'Nfor Kevin' },
          B4: { raw: 'Support' },
          C4: { raw: '180000', style: { format: 'currency_fcfa' } },
          D4: { raw: '=C4*0.15', style: { format: 'currency_fcfa' } },
          E4: { raw: '=IF(C4>=250000, C4*0.1, C4*0.05)', style: { format: 'currency_fcfa' } },
          F4: { raw: '=C4+D4-E4', style: { bold: true, format: 'currency_fcfa' } },

          A5: { raw: 'Ayuk Brenda' },
          B5: { raw: 'Engineering' },
          C5: { raw: '400000', style: { format: 'currency_fcfa' } },
          D5: { raw: '=C5*0.15', style: { format: 'currency_fcfa' } },
          E5: { raw: '=IF(C5>=250000, C5*0.1, C5*0.05)', style: { format: 'currency_fcfa' } },
          F5: { raw: '=C5+D5-E5', style: { bold: true, format: 'currency_fcfa' } },

          A7: { raw: 'TOTAL PAYROLL', style: { bold: true, color: '#34d399' } },
          C7: { raw: '=SUM(C2:C5)', style: { bold: true, format: 'currency_fcfa' } },
          D7: { raw: '=SUM(D2:D5)', style: { bold: true, format: 'currency_fcfa' } },
          E7: { raw: '=SUM(E2:E5)', style: { bold: true, format: 'currency_fcfa' } },
          F7: { raw: '=SUM(F2:F5)', style: { bold: true, format: 'currency_fcfa', color: '#34d399' } },
        },
      },
    ],
  },
  {
    id: 'blank-workbook',
    title: 'Blank Excel Workbook',
    subtitle: 'Start from an empty spreadsheet grid with Sheet1',
    badge: 'Scratch',
    sheets: [
      {
        id: 'sheet-1',
        name: 'Sheet1',
        freezeHeader: false,
        colWidths: {},
        rowHeights: {},
        conditionalRules: [],
        charts: [],
        cells: {},
      },
    ],
  },
];
