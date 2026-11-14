'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Table2,
  Sigma,
  Download,
  Upload,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2,
  ArrowUpAZ,
  ArrowDownZA,
  BarChart3,
  PieChart,
  LineChart,
  Sparkles,
  Search,
  Eye,
  Lock,
  Copy,
  ClipboardPaste,
  ArrowDownToLine,
  ArrowRightToLine,
  ListOrdered,
  Check,
  X,
  BookOpen,
  Layers,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Edit2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  SheetData,
  CellData,
  NumberFormatType,
  CellAlign,
  EXCEL_FUNCTIONS_CATALOG,
  colIndexToLetter,
  parseCellRef,
  toCellAddress,
  expandRange,
  shiftFormulaReferences,
  evaluateCell,
  formatCellValue,
  getConditionalFormattingStyle,
} from '@/lib/excel-engine';

const STORAGE_KEY = 'nebcode_excel_lab_v2';
const TOTAL_ROWS = 35;
const TOTAL_COLS = 12; // A to L

function createEmptySheet(id: string, name: string): SheetData {
  return {
    id,
    name,
    freezeHeader: false,
    colWidths: {},
    rowHeights: {},
    conditionalRules: [],
    charts: [],
    cells: {},
  };
}

const MOBILE_FORMULA_TOKENS = [
  '=',
  '(',
  ')',
  ':',
  ',',
  '"',
  '+',
  '-',
  '*',
  '/',
  '$',
  '>=',
  '<=',
  '<>',
  '&',
];

const COLOR_SWATCHES = [
  { label: 'Default', color: '', bg: '' },
  { label: 'Blue', color: '#38bdf8', bg: '#0c4a6e' },
  { label: 'Green', color: '#34d399', bg: '#064e3b' },
  { label: 'Amber', color: '#fbbf24', bg: '#78350f' },
  { label: 'Red', color: '#f87171', bg: '#7f1d1d' },
  { label: 'Purple', color: '#c084fc', bg: '#4c1d95' },
  { label: 'Header Slate', color: '#f8fafc', bg: '#1e293b' },
];

type RibbonTab = 'home' | 'formulas' | 'data' | 'charts';
type SelectionMode = 'single' | 'range';

export default function ExcelLabClient() {
  const [sheets, setSheets] = useState<SheetData[]>(() => [
    createEmptySheet('sheet-1', 'Sheet1'),
  ]);
  const [activeSheetId, setActiveSheetId] = useState<string>('sheet-1');

  // History for Undo / Redo
  const [history, setHistory] = useState<SheetData[][]>([]);
  const [future, setFuture] = useState<SheetData[][]>([]);

  // Selection state
  const [activeCell, setActiveCell] = useState<string>('A1');
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('single');

  // Formula bar state
  const [formulaInput, setFormulaInput] = useState<string>('');
  const [isEditingFormula, setIsEditingFormula] = useState<boolean>(false);
  const [showFormulasOnly, setShowFormulasOnly] = useState<boolean>(false);

  // Ribbon & Modals
  const [ribbonTab, setRibbonTab] = useState<RibbonTab>('home');
  const [showFunctionModal, setShowFunctionModal] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [fnSearch, setFnSearch] = useState<string>('');
  const [fnCategory, setFnCategory] = useState<string>('All');
  const [showChartPanel, setShowChartPanel] = useState<boolean>(false);
  const [showCondModal, setShowCondModal] = useState<boolean>(false);
  const [showFindModal, setShowFindModal] = useState<boolean>(false);

  // Clipboard state
  const [copiedCell, setCopiedCell] = useState<{ address: string; data: CellData } | null>(null);

  // Conditional rule form
  const [condRange, setCondRange] = useState('G2:G7');
  const [condOp, setCondOp] = useState<'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains'>('eq');
  const [condVal, setCondVal] = useState('PASS');
  const [condColorIdx, setCondColorIdx] = useState(2); // Green

  // New chart form
  const [chartTitle, setChartTitle] = useState('Score Comparison');
  const [chartType, setChartType] = useState<'column' | 'bar' | 'line' | 'pie'>('column');
  const [chartLabelRange, setChartLabelRange] = useState('A2:A7');
  const [chartDataRange, setChartDataRange] = useState('F2:F7');

  // Find & Replace form
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  const formulaInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSheet = useMemo(
    () => sheets.find((s) => s.id === activeSheetId) || sheets[0],
    [sheets, activeSheetId]
  );

  // Load saved state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sheets && Array.isArray(parsed.sheets) && parsed.sheets.length > 0) {
          setSheets(parsed.sheets);
          setActiveSheetId(parsed.activeSheetId || parsed.sheets[0].id);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Save state
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ activeSheetId, sheets })
      );
    } catch {
      // ignore storage errors
    }
  }, [activeSheetId, sheets]);

  // Sync formula bar when activeCell changes
  useEffect(() => {
    const raw = activeSheet?.cells[activeCell]?.raw ?? '';
    setFormulaInput(raw);
    setIsEditingFormula(false);
  }, [activeCell, activeSheet]);

  const pushUndoState = useCallback(
    (nextSheets: SheetData[]) => {
      setHistory((prev) => [...prev.slice(-24), JSON.parse(JSON.stringify(sheets))]);
      setFuture([]);
      setSheets(nextSheets);
    },
    [sheets]
  );

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture((f) => [JSON.parse(JSON.stringify(sheets)), ...f.slice(0, 24)]);
    setHistory((h) => h.slice(0, -1));
    setSheets(prev);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((h) => [...h.slice(-24), JSON.parse(JSON.stringify(sheets))]);
    setFuture((f) => f.slice(1));
    setSheets(next);
  };

  // Current selection range string (e.g. "B2:D6" or "E2")
  const selectedRangeString = useMemo(() => {
    if (!rangeEnd || rangeEnd === activeCell) return activeCell;
    return `${activeCell}:${rangeEnd}`;
  }, [activeCell, rangeEnd]);

  const selectedAddresses = useMemo(() => {
    return expandRange(selectedRangeString).addresses;
  }, [selectedRangeString]);

  const selectedSet = useMemo(() => new Set(selectedAddresses), [selectedAddresses]);

  // Precompute evaluated values for the active sheet
  const evaluatedMap = useMemo(() => {
    const map: Record<string, string | number | boolean> = {};
    if (!activeSheet) return map;
    for (let r = 0; r < TOTAL_ROWS; r++) {
      for (let c = 0; c < TOTAL_COLS; c++) {
        const addr = toCellAddress(c, r);
        if (activeSheet.cells[addr]?.raw !== undefined && activeSheet.cells[addr]?.raw !== '') {
          map[addr] = evaluateCell(addr, activeSheet, sheets);
        } else {
          map[addr] = '';
        }
      }
    }
    return map;
  }, [activeSheet, sheets]);

  // Live Status Bar Stats (SUM, AVERAGE, COUNT, MIN, MAX) for selected cells
  const selectionStats = useMemo(() => {
    const nums: number[] = [];
    let nonEmpty = 0;
    for (const addr of selectedAddresses) {
      const val = evaluatedMap[addr];
      if (val !== '' && val !== undefined && val !== null) {
        nonEmpty++;
        const n = Number(val);
        if (!Number.isNaN(n) && Number.isFinite(n) && typeof val !== 'boolean') {
          nums.push(n);
        }
      }
    }
    if (nums.length === 0) {
      return { count: nonEmpty, hasNums: false, sum: 0, avg: 0, min: 0, max: 0 };
    }
    const sum = nums.reduce((a, b) => a + b, 0);
    return {
      count: nonEmpty,
      hasNums: true,
      sum: Number(sum.toFixed(2)),
      avg: Number((sum / nums.length).toFixed(2)),
      min: Math.min(...nums),
      max: Math.max(...nums),
    };
  }, [selectedAddresses, evaluatedMap]);

  // Commit formulaInput to activeCell
  const commitCellValue = useCallback(
    (targetAddr: string, newRaw: string) => {
      const nextSheets = sheets.map((s) => {
        if (s.id !== activeSheet.id) return s;
        const existing = s.cells[targetAddr] || { raw: '' };
        const updatedCells = { ...s.cells };
        if (newRaw === '' && !existing.style) {
          delete updatedCells[targetAddr];
        } else {
          updatedCells[targetAddr] = { ...existing, raw: newRaw };
        }
        return { ...s, cells: updatedCells };
      });
      pushUndoState(nextSheets);
      setIsEditingFormula(false);
    },
    [sheets, activeSheet, pushUndoState]
  );

  // Handle tapping a cell in the grid (supports Tap-to-Reference when typing a formula!)
  const handleCellTap = (addr: string, shiftKey = false) => {
    // If user is actively typing a formula starting with '=' and last character expects a cell reference
    if (
      isEditingFormula &&
      formulaInput.trim().startsWith('=') &&
      /[=(,+\-*/^&:><\s]$/.test(formulaInput)
    ) {
      const nextFormula = `${formulaInput}${addr}`;
      setFormulaInput(nextFormula);
      formulaInputRef.current?.focus();
      return;
    }

    // Commit any pending change in previous cell first
    const prevRaw = activeSheet.cells[activeCell]?.raw ?? '';
    if (isEditingFormula && formulaInput !== prevRaw) {
      commitCellValue(activeCell, formulaInput);
    }

    if (shiftKey || selectionMode === 'range') {
      if (rangeEnd === null && addr !== activeCell) {
        setRangeEnd(addr);
        toast.success(`Selected range ${activeCell}:${addr}`);
      } else {
        setActiveCell(addr);
        setRangeEnd(null);
      }
      return;
    }

    setActiveCell(addr);
    setRangeEnd(null);
  };

  // Insert token into Formula Input (used by mobile quick formula bar)
  const insertFormulaToken = (token: string) => {
    setIsEditingFormula(true);
    setFormulaInput((prev) => {
      if (token === '=' && prev === '') return '=';
      return `${prev}${token}`;
    });
    setTimeout(() => {
      formulaInputRef.current?.focus();
    }, 10);
  };

  // Toggle $A$1 absolute reference on the last cell ref in formulaInput
  const toggleAbsoluteRef = () => {
    if (!formulaInput.startsWith('=')) {
      toast.error('Start a formula with = first to lock a cell reference ($A$1)');
      return;
    }
    const match = formulaInput.match(/(\$?)([A-Za-z]{1,2})(\$?)(\d+)(?!.*\$?[A-Za-z]{1,2}\$?\d+)/);
    if (!match || match.index === undefined) {
      insertFormulaToken('$');
      return;
    }
    const [, cDollar, colStr, rDollar, rowStr] = match;
    let replacement = '';
    if (!cDollar && !rDollar) {
      replacement = `$${colStr}$${rowStr}`; // A1 -> $A$1
    } else if (cDollar && rDollar) {
      replacement = `${colStr}$${rowStr}`; // $A$1 -> A$1
    } else if (!cDollar && rDollar) {
      replacement = `$${colStr}${rowStr}`; // A$1 -> $A1
    } else {
      replacement = `${colStr}${rowStr}`; // $A1 -> A1
    }
    const next =
      formulaInput.slice(0, match.index) +
      replacement +
      formulaInput.slice(match.index + match[0].length);
    setFormulaInput(next);
    setIsEditingFormula(true);
    toast.success(`Reference changed to ${replacement}`);
  };

  // Apply style to all selected cells
  const updateSelectedStyle = (updater: (prev: NonNullable<CellData['style']>) => NonNullable<CellData['style']>) => {
    const nextSheets = sheets.map((s) => {
      if (s.id !== activeSheet.id) return s;
      const nextCells = { ...s.cells };
      for (const addr of selectedAddresses) {
        const cell = nextCells[addr] || { raw: '' };
        nextCells[addr] = {
          ...cell,
          style: updater(cell.style || {}),
        };
      }
      return { ...s, cells: nextCells };
    });
    pushUndoState(nextSheets);
  };

  // Quick AutoSum / Function insertion
  const applyQuickFunction = (fnName: string) => {
    // If a multi-cell range is selected, place formula in the cell right below or to the right
    if (selectedAddresses.length > 1) {
      const { matrix } = expandRange(selectedRangeString);
      const firstAddr = matrix[0][0];
      const lastRow = matrix[matrix.length - 1];
      const lastAddr = lastRow[lastRow.length - 1];
      const parsedLast = parseCellRef(lastAddr);
      if (!parsedLast) return;

      const isSingleRow = matrix.length === 1;
      const targetCol = isSingleRow ? parsedLast.col + 1 : parsedLast.col;
      const targetRow = isSingleRow ? parsedLast.row : parsedLast.row + 1;
      const destAddr = toCellAddress(
        Math.min(TOTAL_COLS - 1, targetCol),
        Math.min(TOTAL_ROWS - 1, targetRow)
      );
      const formula = `=${fnName}(${firstAddr}:${lastAddr})`;
      commitCellValue(destAddr, formula);
      setActiveCell(destAddr);
      setRangeEnd(null);
      toast.success(`Inserted ${formula} in ${destAddr}`);
      return;
    }

    // Otherwise, auto-detect numbers above or to the left of activeCell
    const parsed = parseCellRef(activeCell);
    if (!parsed) return;

    // Check above
    if (parsed.row > 0) {
      let startRow = parsed.row - 1;
      while (
        startRow > 0 &&
        evaluatedMap[toCellAddress(parsed.col, startRow - 1)] !== '' &&
        typeof evaluatedMap[toCellAddress(parsed.col, startRow - 1)] === 'number'
      ) {
        startRow--;
      }
      const rangeStr = `${toCellAddress(parsed.col, startRow)}:${toCellAddress(parsed.col, parsed.row - 1)}`;
      const formula = `=${fnName}(${rangeStr})`;
      setFormulaInput(formula);
      commitCellValue(activeCell, formula);
      toast.success(`Inserted ${formula}`);
      return;
    }

    setIsEditingFormula(true);
    setFormulaInput(`=${fnName}(`);
    formulaInputRef.current?.focus();
  };

  // AutoFill Down / Right / Series
  const handleAutoFill = (mode: 'down' | 'right' | 'series') => {
    const { matrix } = expandRange(selectedRangeString);
    if (matrix.length === 1 && matrix[0].length === 1) {
      // If only 1 cell selected, fill 1 cell down or right automatically
      const p = parseCellRef(activeCell);
      if (!p) return;
      const sourceCell = activeSheet.cells[activeCell];
      if (!sourceCell || !sourceCell.raw) {
        toast.error('Select a cell with a formula or value first');
        return;
      }
      const dCol = mode === 'right' ? 1 : 0;
      const dRow = mode === 'right' ? 0 : 1;
      const destAddr = toCellAddress(
        Math.min(TOTAL_COLS - 1, p.col + dCol),
        Math.min(TOTAL_ROWS - 1, p.row + dRow)
      );
      let newRaw = sourceCell.raw;
      if (newRaw.startsWith('=')) {
        newRaw = shiftFormulaReferences(newRaw, dCol, dRow);
      } else if (mode === 'series' && !Number.isNaN(Number(newRaw))) {
        newRaw = String(Number(newRaw) + 1);
      }
      const nextSheets = sheets.map((s) => {
        if (s.id !== activeSheet.id) return s;
        return {
          ...s,
          cells: {
            ...s.cells,
            [destAddr]: {
              raw: newRaw,
              style: sourceCell.style ? { ...sourceCell.style } : undefined,
            },
          },
        };
      });
      pushUndoState(nextSheets);
      setActiveCell(destAddr);
      toast.success(`AutoFilled ${destAddr}: ${newRaw}`);
      return;
    }

    const nextSheets = sheets.map((s) => {
      if (s.id !== activeSheet.id) return s;
      const nextCells = { ...s.cells };

      if (mode === 'down' || mode === 'series') {
        const topRow = matrix[0];
        for (let c = 0; c < topRow.length; c++) {
          const srcAddr = topRow[c];
          const srcCell = nextCells[srcAddr];
          if (!srcCell) continue;
          for (let r = 1; r < matrix.length; r++) {
            const destAddr = matrix[r][c];
            let newRaw = srcCell.raw;
            if (newRaw.startsWith('=')) {
              newRaw = shiftFormulaReferences(newRaw, 0, r);
            } else if (mode === 'series' && !Number.isNaN(Number(newRaw)) && newRaw.trim() !== '') {
              newRaw = String(Number(newRaw) + r);
            }
            nextCells[destAddr] = {
              raw: newRaw,
              style: srcCell.style ? { ...srcCell.style } : undefined,
            };
          }
        }
      } else if (mode === 'right') {
        for (let r = 0; r < matrix.length; r++) {
          const srcAddr = matrix[r][0];
          const srcCell = nextCells[srcAddr];
          if (!srcCell) continue;
          for (let c = 1; c < matrix[r].length; c++) {
            const destAddr = matrix[r][c];
            let newRaw = srcCell.raw;
            if (newRaw.startsWith('=')) {
              newRaw = shiftFormulaReferences(newRaw, c, 0);
            }
            nextCells[destAddr] = {
              raw: newRaw,
              style: srcCell.style ? { ...srcCell.style } : undefined,
            };
          }
        }
      }

      return { ...s, cells: nextCells };
    });

    pushUndoState(nextSheets);
    toast.success(`AutoFilled ${selectedRangeString}`);
  };

  // Sort rows by active column
  const handleSortByActiveCol = (direction: 'asc' | 'desc') => {
    const parsed = parseCellRef(activeCell);
    if (!parsed) return;
    const sortCol = parsed.col;
    const startRow = activeSheet.freezeHeader ? 1 : 0;

    // Find contiguous populated rows starting from startRow
    const populatedRows: number[] = [];
    for (let r = startRow; r < TOTAL_ROWS; r++) {
      let hasData = false;
      for (let c = 0; c < TOTAL_COLS; c++) {
        const raw = activeSheet.cells[toCellAddress(c, r)]?.raw;
        if (raw && raw.trim() !== '') {
          hasData = true;
          break;
        }
      }
      if (hasData) {
        populatedRows.push(r);
      } else if (populatedRows.length > 0) {
        break; // Stop at first blank summary separator row
      }
    }

    if (populatedRows.length < 2) {
      toast.error('Need at least 2 data rows to sort');
      return;
    }

    const rowSnapshots = populatedRows.map((r) => {
      const sortVal = evaluatedMap[toCellAddress(sortCol, r)];
      const rowCells: Record<number, CellData | undefined> = {};
      for (let c = 0; c < TOTAL_COLS; c++) {
        rowCells[c] = activeSheet.cells[toCellAddress(c, r)];
      }
      return { origRow: r, sortVal, rowCells };
    });

    rowSnapshots.sort((a, b) => {
      const vA = a.sortVal;
      const vB = b.sortVal;
      const numA = Number(vA);
      const numB = Number(vB);
      const bothNum =
        vA !== '' && vB !== '' && !Number.isNaN(numA) && !Number.isNaN(numB);
      const cmp = bothNum
        ? numA - numB
        : String(vA).localeCompare(String(vB), undefined, { sensitivity: 'base' });
      return direction === 'asc' ? cmp : -cmp;
    });

    const nextSheets = sheets.map((s) => {
      if (s.id !== activeSheet.id) return s;
      const nextCells = { ...s.cells };
      rowSnapshots.forEach((snap, idx) => {
        const targetRow = populatedRows[idx];
        const deltaRow = targetRow - snap.origRow;
        for (let c = 0; c < TOTAL_COLS; c++) {
          const destAddr = toCellAddress(c, targetRow);
          const cell = snap.rowCells[c];
          if (!cell) {
            delete nextCells[destAddr];
          } else {
            const shiftedRaw = cell.raw.startsWith('=')
              ? shiftFormulaReferences(cell.raw, 0, deltaRow)
              : cell.raw;
            nextCells[destAddr] = { ...cell, raw: shiftedRaw };
          }
        }
      });
      return { ...s, cells: nextCells };
    });

    pushUndoState(nextSheets);
    toast.success(
      `Sorted Column ${colIndexToLetter(sortCol)} (${direction === 'asc' ? 'A to Z' : 'Z to A'})`
    );
  };

  // Clear selected cells
  const handleClearSelection = () => {
    const nextSheets = sheets.map((s) => {
      if (s.id !== activeSheet.id) return s;
      const nextCells = { ...s.cells };
      for (const addr of selectedAddresses) {
        delete nextCells[addr];
      }
      return { ...s, cells: nextCells };
    });
    pushUndoState(nextSheets);
    setFormulaInput('');
    toast.success(`Cleared ${selectedRangeString}`);
  };

  // Copy & Paste with relative formula shifting
  const handleCopyCell = () => {
    const data = activeSheet.cells[activeCell] || { raw: '' };
    setCopiedCell({ address: activeCell, data: JSON.parse(JSON.stringify(data)) });
    toast.success(`Copied ${activeCell}`);
  };

  const handlePasteCell = () => {
    if (!copiedCell) {
      toast.error('Nothing copied yet');
      return;
    }
    const srcParsed = parseCellRef(copiedCell.address);
    const nextSheets = sheets.map((s) => {
      if (s.id !== activeSheet.id) return s;
      const nextCells = { ...s.cells };
      for (const destAddr of selectedAddresses) {
        const destParsed = parseCellRef(destAddr);
        let newRaw = copiedCell.data.raw;
        if (srcParsed && destParsed && newRaw.startsWith('=')) {
          newRaw = shiftFormulaReferences(
            newRaw,
            destParsed.col - srcParsed.col,
            destParsed.row - srcParsed.row
          );
        }
        nextCells[destAddr] = {
          raw: newRaw,
          style: copiedCell.data.style ? { ...copiedCell.data.style } : undefined,
        };
      }
      return { ...s, cells: nextCells };
    });
    pushUndoState(nextSheets);
    toast.success(`Pasted into ${selectedRangeString}`);
  };

  // Export CSV (Excel compatible)
  const handleExportCSV = () => {
    const rows: string[] = [];
    let maxPopulatedRow = 0;
    let maxPopulatedCol = 0;
    for (let r = 0; r < TOTAL_ROWS; r++) {
      for (let c = 0; c < TOTAL_COLS; c++) {
        const addr = toCellAddress(c, r);
        if (activeSheet.cells[addr]?.raw) {
          maxPopulatedRow = Math.max(maxPopulatedRow, r);
          maxPopulatedCol = Math.max(maxPopulatedCol, c);
        }
      }
    }

    for (let r = 0; r <= maxPopulatedRow; r++) {
      const cols: string[] = [];
      for (let c = 0; c <= maxPopulatedCol; c++) {
        const addr = toCellAddress(c, r);
        const val = showFormulasOnly
          ? activeSheet.cells[addr]?.raw ?? ''
          : evaluatedMap[addr] ?? '';
        const escaped = String(val).replace(/"/g, '""');
        cols.push(`"${escaped}"`);
      }
      rows.push(cols.join(','));
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSheet.name || 'NebCode_Sheet'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported Excel CSV file');
  };

  // Import CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result || '');
      const lines = content.split(/\r?\n/).filter((l) => l.trim() !== '');
      const newCells: Record<string, CellData> = {};
      lines.slice(0, TOTAL_ROWS).forEach((line, rIdx) => {
        const cols = line.split(',').map((s) => s.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        cols.slice(0, TOTAL_COLS).forEach((val, cIdx) => {
          if (val !== '') {
            newCells[toCellAddress(cIdx, rIdx)] = {
              raw: val,
              style: rIdx === 0 ? { bold: true, bg: '#1e293b', color: '#f8fafc' } : undefined,
            };
          }
        });
      });
      const nextSheets = sheets.map((s) =>
        s.id === activeSheet.id ? { ...s, cells: newCells } : s
      );
      pushUndoState(nextSheets);
      toast.success(`Imported ${lines.length} rows from ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Add / Rename / Delete Sheet
  const handleAddSheet = () => {
    let nextNum = sheets.length + 1;
    let candidateName = `Sheet${nextNum}`;
    while (sheets.some((s) => s.name.toLowerCase() === candidateName.toLowerCase())) {
      nextNum++;
      candidateName = `Sheet${nextNum}`;
    }
    const newSheet = createEmptySheet(`sheet-${Date.now()}`, candidateName);
    pushUndoState([...sheets, newSheet]);
    setActiveSheetId(newSheet.id);
    setActiveCell('A1');
    setRangeEnd(null);
    toast.success(`Created ${candidateName}`);
  };

  const handleRenameSheet = (sheet: SheetData) => {
    const newName = prompt('Rename sheet:', sheet.name);
    if (!newName || !newName.trim()) return;
    const trimmed = newName.trim();
    const nextSheets = sheets.map((s) =>
      s.id === sheet.id ? { ...s, name: trimmed } : s
    );
    pushUndoState(nextSheets);
    toast.success(`Renamed sheet to ${trimmed}`);
  };

  const handleDeleteSheet = (id: string) => {
    if (sheets.length <= 1) {
      toast.error('A workbook must have at least one sheet');
      return;
    }
    const filtered = sheets.filter((s) => s.id !== id);
    pushUndoState(filtered);
    if (activeSheetId === id) {
      setActiveSheetId(filtered[0].id);
    }
  };

  // Add Conditional Rule
  const handleAddConditionalRule = () => {
    const swatch = COLOR_SWATCHES[condColorIdx] || COLOR_SWATCHES[2];
    const nextSheets = sheets.map((s) => {
      if (s.id !== activeSheet.id) return s;
      return {
        ...s,
        conditionalRules: [
          ...s.conditionalRules,
          {
            id: `rule-${Date.now()}`,
            range: condRange.toUpperCase(),
            operator: condOp,
            value1: condVal,
            bg: swatch.bg || '#064e3b',
            color: swatch.color || '#6ee7b7',
            label: `${condRange}: ${condOp} ${condVal}`,
          },
        ],
      };
    });
    pushUndoState(nextSheets);
    setShowCondModal(false);
    toast.success('Conditional formatting rule applied');
  };

  // Add Chart
  const handleAddChart = () => {
    const nextSheets = sheets.map((s) => {
      if (s.id !== activeSheet.id) return s;
      return {
        ...s,
        charts: [
          {
            id: `chart-${Date.now()}`,
            title: chartTitle || 'Spreadsheet Chart',
            type: chartType,
            labelRange: chartLabelRange.toUpperCase(),
            dataRange: chartDataRange.toUpperCase(),
          },
          ...s.charts,
        ],
      };
    });
    pushUndoState(nextSheets);
    setShowChartPanel(true);
    toast.success('Chart generated from sheet data');
  };

  // Find & Replace
  const handleReplaceAll = () => {
    if (!findText) return;
    let count = 0;
    const nextSheets = sheets.map((s) => {
      if (s.id !== activeSheet.id) return s;
      const nextCells = { ...s.cells };
      Object.keys(nextCells).forEach((addr) => {
        const raw = nextCells[addr].raw;
        if (raw && raw.toLowerCase().includes(findText.toLowerCase())) {
          const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          nextCells[addr] = { ...nextCells[addr], raw: raw.replace(regex, replaceText) };
          count++;
        }
      });
      return { ...s, cells: nextCells };
    });
    pushUndoState(nextSheets);
    setShowFindModal(false);
    toast.success(`Replaced ${count} occurrence(s)`);
  };

  const activeCellStyle = activeSheet?.cells[activeCell]?.style || {};

  const filteredFunctions = useMemo(() => {
    return EXCEL_FUNCTIONS_CATALOG.filter((f) => {
      const matchesCat = fnCategory === 'All' || f.category === fnCategory;
      const q = fnSearch.trim().toLowerCase();
      const matchesQ =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.syntax.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [fnCategory, fnSearch]);

  return (
    <div
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-[200] h-screen w-screen'
          : 'h-[calc(100dvh-116px)] md:h-[calc(100dvh-56px)]'
      } bg-dark-950 flex flex-col overflow-hidden`}
    >
      {/* Floating Exit Fullscreen Button (Only visible when Fullscreen View is active) */}
      {isFullscreen && (
        <button
          type="button"
          onClick={() => setIsFullscreen(false)}
          className="fixed top-3 right-3 z-[210] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-900/90 hover:bg-dark-800 border border-emerald-500/60 text-white text-xs font-bold shadow-2xl backdrop-blur-md transition-all"
          title="Exit Fullscreen View"
        >
          <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Exit Fullscreen</span>
        </button>
      )}

      {!isFullscreen && (
      <>
      {/* Top Workbook Header Bar */}
      <div className="bg-dark-900 border-b border-dark-800 px-2.5 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Table2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-bold text-white truncate">
                Excel Practice Lab
              </h1>
              <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                80+ Functions
              </span>
            </div>
            <p className="text-[10px] text-dark-400 hidden sm:block truncate">
              Formulas, $A$1 References, VLOOKUP, IF, RANK, Charts &amp; AutoFill
            </p>
          </div>

          <button
            onClick={handleAddSheet}
            className="ml-1 sm:ml-2 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
            title="Create New Empty Sheet"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Sheet</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Undo"
            className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 disabled:opacity-40 text-dark-300 hover:text-white border border-dark-700 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={future.length === 0}
            title="Redo"
            className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 disabled:opacity-40 text-dark-300 hover:text-white border border-dark-700 transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowFormulasOnly((v) => !v)}
            title="Toggle Show All Formulas"
            className={`px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors ${
              showFormulasOnly
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-dark-800 border-dark-700 text-dark-300 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Formulas</span>
          </button>

          <button
            onClick={() => setShowChartPanel((v) => !v)}
            title="Toggle Charts Panel"
            className={`px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors ${
              showChartPanel
                ? 'bg-primary-500/15 border-primary-500/40 text-primary-400'
                : 'bg-dark-800 border-dark-700 text-dark-300 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Charts ({activeSheet?.charts.length || 0})</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import CSV file"
            className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white border border-dark-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleExportCSV}
            title="Export to Excel CSV"
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => setIsFullscreen(true)}
            title="Fullscreen View (See entire sheet alone with no other buttons)"
            className="px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 text-emerald-400 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fullscreen</span>
          </button>
        </div>
      </div>

      {/* Excel Ribbon Tabs + Scrollable Mobile Toolbar */}
      <div className="bg-dark-900 border-b border-dark-800 shrink-0">
        {/* Ribbon Tab Switcher */}
        <div className="flex items-center justify-between px-2.5 sm:px-4 pt-1 border-b border-dark-800/70 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1">
            {(
              [
                { id: 'home', label: 'Home', icon: SlidersHorizontal },
                { id: 'formulas', label: 'Formulas (fx)', icon: Sigma },
                { id: 'data', label: 'Data & AutoFill', icon: Layers },
                { id: 'charts', label: 'Charts & Rules', icon: BarChart3 },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = ribbonTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setRibbonTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                      : 'border-transparent text-dark-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Mobile Range Selection Toggle */}
          <div className="flex items-center gap-1.5 py-1 pl-2 shrink-0">
            <button
              onClick={() => {
                setSelectionMode((m) => (m === 'single' ? 'range' : 'single'));
                if (selectionMode === 'range') setRangeEnd(null);
              }}
              className={`px-2 py-1 rounded text-[11px] font-semibold border flex items-center gap-1 transition-colors ${
                selectionMode === 'range'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-dark-800 border-dark-700 text-dark-300 hover:text-white'
              }`}
              title="Toggle 2-Tap Range Selection for Mobile Phones"
            >
              <Sparkles className="w-3 h-3" />
              {selectionMode === 'range' ? 'Range Mode: ON (Tap End Cell)' : 'Select Range'}
            </button>
          </div>
        </div>

        {/* Ribbon Content Row (Horizontally scrollable on mobile) */}
        <div className="px-2.5 sm:px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {ribbonTab === 'home' && (
            <>
              {/* Copy / Paste */}
              <button
                onClick={handleCopyCell}
                className="px-2 py-1 rounded bg-dark-800 hover:bg-dark-700 text-dark-200 text-xs flex items-center gap-1 border border-dark-700 shrink-0"
                title="Copy Cell"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
              <button
                onClick={handlePasteCell}
                className="px-2 py-1 rounded bg-dark-800 hover:bg-dark-700 text-dark-200 text-xs flex items-center gap-1 border border-dark-700 shrink-0"
                title="Paste (auto-shifts relative formulas)"
              >
                <ClipboardPaste className="w-3.5 h-3.5" /> Paste
              </button>

              <div className="h-4 w-px bg-dark-700 mx-0.5 shrink-0" />

              {/* Bold / Italic / Underline */}
              <button
                onClick={() => updateSelectedStyle((st) => ({ ...st, bold: !st.bold }))}
                className={`p-1.5 rounded border shrink-0 ${
                  activeCellStyle.bold
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-dark-800 border-dark-700 text-dark-300 hover:text-white'
                }`}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateSelectedStyle((st) => ({ ...st, italic: !st.italic }))}
                className={`p-1.5 rounded border shrink-0 ${
                  activeCellStyle.italic
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-dark-800 border-dark-700 text-dark-300 hover:text-white'
                }`}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateSelectedStyle((st) => ({ ...st, underline: !st.underline }))}
                className={`p-1.5 rounded border shrink-0 ${
                  activeCellStyle.underline
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-dark-800 border-dark-700 text-dark-300 hover:text-white'
                }`}
                title="Underline"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-px bg-dark-700 mx-0.5 shrink-0" />

              {/* Alignment */}
              {(['left', 'center', 'right'] as CellAlign[]).map((align) => {
                const Icon =
                  align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight;
                return (
                  <button
                    key={align}
                    onClick={() => updateSelectedStyle((st) => ({ ...st, align }))}
                    className={`p-1.5 rounded border shrink-0 ${
                      activeCellStyle.align === align
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-dark-800 border-dark-700 text-dark-300 hover:text-white'
                    }`}
                    title={`Align ${align}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}

              <div className="h-4 w-px bg-dark-700 mx-0.5 shrink-0" />

              {/* Number Format */}
              <select
                value={activeCellStyle.format || 'general'}
                onChange={(e) =>
                  updateSelectedStyle((st) => ({
                    ...st,
                    format: e.target.value as NumberFormatType,
                  }))
                }
                aria-label="Number Format"
                className="bg-dark-800 border border-dark-700 text-xs text-white rounded px-2 py-1 focus:outline-none focus:border-emerald-500 shrink-0"
              >
                <option value="general">General Number</option>
                <option value="currency_fcfa">Currency (FCFA)</option>
                <option value="currency_usd">Currency ($ USD)</option>
                <option value="percent">Percentage (%)</option>
                <option value="number_2dec">Number (0.00)</option>
                <option value="integer">Integer (0)</option>
              </select>

              {/* Color Swatches */}
              <div className="flex items-center gap-1 pl-1 shrink-0">
                {COLOR_SWATCHES.map((sw, idx) => (
                  <button
                    key={sw.label}
                    onClick={() =>
                      updateSelectedStyle((st) => ({
                        ...st,
                        color: sw.color || undefined,
                        bg: sw.bg || undefined,
                      }))
                    }
                    title={`Style: ${sw.label}`}
                    className="w-5 h-5 rounded border border-dark-600 flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{
                      backgroundColor: sw.bg || '#1e293b',
                      color: sw.color || '#f8fafc',
                    }}
                  >
                    {idx === 0 ? 'X' : 'A'}
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-dark-700 mx-0.5 shrink-0" />

              <button
                onClick={handleClearSelection}
                className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs flex items-center gap-1 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            </>
          )}

          {ribbonTab === 'formulas' && (
            <>
              <button
                onClick={() => setShowFunctionModal(true)}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5" /> Browse All 65+ Functions
              </button>

              <div className="h-4 w-px bg-dark-700 mx-0.5 shrink-0" />

              {(['SUM', 'AVERAGE', 'MAX', 'MIN', 'COUNT'] as const).map((fn) => (
                <button
                  key={fn}
                  onClick={() => applyQuickFunction(fn)}
                  className="px-2 py-1 rounded bg-dark-800 hover:bg-dark-700 text-emerald-400 border border-dark-700 text-xs font-mono font-semibold shrink-0"
                >
                  ={fn}()
                </button>
              ))}

              <button
                onClick={() => {
                  setIsEditingFormula(true);
                  setFormulaInput('=IF(F2>=50, "PASS", "FAIL")');
                  formulaInputRef.current?.focus();
                }}
                className="px-2 py-1 rounded bg-dark-800 hover:bg-dark-700 text-sky-400 border border-dark-700 text-xs font-mono font-semibold shrink-0"
              >
                =IF()
              </button>

              <button
                onClick={() => {
                  setIsEditingFormula(true);
                  setFormulaInput('=RANK(F2, $F$2:$F$7)');
                  formulaInputRef.current?.focus();
                }}
                className="px-2 py-1 rounded bg-dark-800 hover:bg-dark-700 text-amber-400 border border-dark-700 text-xs font-mono font-semibold shrink-0"
              >
                =RANK()
              </button>

              <button
                onClick={() => {
                  setIsEditingFormula(true);
                  setFormulaInput('=VLOOKUP(A2, $A$2:$G$7, 6, FALSE)');
                  formulaInputRef.current?.focus();
                }}
                className="px-2 py-1 rounded bg-dark-800 hover:bg-dark-700 text-purple-400 border border-dark-700 text-xs font-mono font-semibold shrink-0"
              >
                =VLOOKUP()
              </button>

              <button
                onClick={toggleAbsoluteRef}
                className="px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 shrink-0"
                title="Lock/Unlock Cell Reference ($A$1)"
              >
                <Lock className="w-3.5 h-3.5" /> Lock $A$1
              </button>
            </>
          )}

          {ribbonTab === 'data' && (
            <>
              <button
                onClick={() => handleAutoFill('down')}
                className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" /> AutoFill Down
              </button>
              <button
                onClick={() => handleAutoFill('right')}
                className="px-2.5 py-1 rounded bg-dark-800 hover:bg-dark-700 text-dark-200 border border-dark-700 text-xs font-medium flex items-center gap-1 shrink-0"
              >
                <ArrowRightToLine className="w-3.5 h-3.5" /> AutoFill Right
              </button>
              <button
                onClick={() => handleAutoFill('series')}
                className="px-2.5 py-1 rounded bg-dark-800 hover:bg-dark-700 text-dark-200 border border-dark-700 text-xs font-medium flex items-center gap-1 shrink-0"
              >
                <ListOrdered className="w-3.5 h-3.5" /> Fill Series (1, 2, 3...)
              </button>

              <div className="h-4 w-px bg-dark-700 mx-0.5 shrink-0" />

              <button
                onClick={() => handleSortByActiveCol('asc')}
                className="px-2.5 py-1 rounded bg-dark-800 hover:bg-dark-700 text-dark-200 border border-dark-700 text-xs font-medium flex items-center gap-1 shrink-0"
              >
                <ArrowUpAZ className="w-3.5 h-3.5 text-sky-400" /> Sort Col {activeCell.replace(/\d+/g, '')} (A-Z)
              </button>
              <button
                onClick={() => handleSortByActiveCol('desc')}
                className="px-2.5 py-1 rounded bg-dark-800 hover:bg-dark-700 text-dark-200 border border-dark-700 text-xs font-medium flex items-center gap-1 shrink-0"
              >
                <ArrowDownZA className="w-3.5 h-3.5 text-amber-400" /> Sort Col {activeCell.replace(/\d+/g, '')} (Z-A)
              </button>

              <div className="h-4 w-px bg-dark-700 mx-0.5 shrink-0" />

              <button
                onClick={() => setShowFindModal(true)}
                className="px-2.5 py-1 rounded bg-dark-800 hover:bg-dark-700 text-dark-200 border border-dark-700 text-xs font-medium flex items-center gap-1 shrink-0"
              >
                <Search className="w-3.5 h-3.5" /> Find & Replace
              </button>
            </>
          )}

          {ribbonTab === 'charts' && (
            <>
              <button
                onClick={() => {
                  setChartType('column');
                  setShowChartPanel(true);
                }}
                className="px-2.5 py-1 rounded bg-primary-500/15 hover:bg-primary-500/25 text-primary-300 border border-primary-500/30 text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <BarChart3 className="w-3.5 h-3.5" /> Column / Bar Chart
              </button>
              <button
                onClick={() => {
                  setChartType('line');
                  setShowChartPanel(true);
                }}
                className="px-2.5 py-1 rounded bg-dark-800 hover:bg-dark-700 text-dark-200 border border-dark-700 text-xs font-medium flex items-center gap-1 shrink-0"
              >
                <LineChart className="w-3.5 h-3.5 text-emerald-400" /> Line Chart
              </button>
              <button
                onClick={() => {
                  setChartType('pie');
                  setShowChartPanel(true);
                }}
                className="px-2.5 py-1 rounded bg-dark-800 hover:bg-dark-700 text-dark-200 border border-dark-700 text-xs font-medium flex items-center gap-1 shrink-0"
              >
                <PieChart className="w-3.5 h-3.5 text-amber-400" /> Pie Chart
              </button>

              <div className="h-4 w-px bg-dark-700 mx-0.5 shrink-0" />

              <button
                onClick={() => {
                  setCondRange(selectedRangeString);
                  setShowCondModal(true);
                }}
                className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <Filter className="w-3.5 h-3.5" /> Conditional Formatting ({activeSheet?.conditionalRules.length || 0})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Formula Bar + Mobile Quick Symbol Bar */}
      <div className="bg-dark-900 border-b border-dark-800 px-2.5 sm:px-4 py-1.5 shrink-0 space-y-1.5">
        <div className="flex items-center gap-1.5">
          {/* Active Cell / Range Badge */}
          <div className="min-w-[62px] sm:min-w-[78px] px-2 py-1 rounded bg-dark-950 border border-dark-700 text-center font-mono text-xs font-bold text-emerald-400 shrink-0">
            {selectedRangeString}
          </div>

          {/* fx Button */}
          <button
            onClick={() => setShowFunctionModal(true)}
            title="Insert Excel Function (fx)"
            className="px-2 py-1 rounded bg-dark-800 hover:bg-dark-700 border border-dark-700 text-xs font-serif italic font-bold text-emerald-400 shrink-0 flex items-center gap-1"
          >
            fx
          </button>

          {/* Formula / Value Input */}
          <div className="relative flex-1 min-w-0">
            <input
              ref={formulaInputRef}
              type="text"
              value={formulaInput}
              onFocus={() => setIsEditingFormula(true)}
              onChange={(e) => {
                setIsEditingFormula(true);
                setFormulaInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitCellValue(activeCell, formulaInput);
                  // Move activeCell 1 row down on Enter (like Excel)
                  const parsed = parseCellRef(activeCell);
                  if (parsed && parsed.row + 1 < TOTAL_ROWS) {
                    setActiveCell(toCellAddress(parsed.col, parsed.row + 1));
                  }
                } else if (e.key === 'Escape') {
                  setFormulaInput(activeSheet.cells[activeCell]?.raw ?? '');
                  setIsEditingFormula(false);
                }
              }}
              placeholder="Enter value or formula (e.g. =SUM(B2:D2) or =IF(F2>=50, &quot;PASS&quot;, &quot;FAIL&quot;))"
              className="w-full bg-dark-950 border border-dark-700 focus:border-emerald-500 rounded px-2.5 py-1 text-xs sm:text-sm font-mono text-white focus:outline-none"
            />
          </div>

          {/* Apply / Cancel buttons */}
          {isEditingFormula && (
            <>
              <button
                onClick={() => commitCellValue(activeCell, formulaInput)}
                className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
                title="Apply Formula (Enter)"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setFormulaInput(activeSheet.cells[activeCell]?.raw ?? '');
                  setIsEditingFormula(false);
                }}
                className="p-1.5 rounded bg-dark-800 hover:bg-dark-700 text-dark-300 shrink-0"
                title="Cancel (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Mobile Quick Formula Bar (Always accessible for fast mobile typing) */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-dark-400 mr-1 shrink-0">
            Quick Keys:
          </span>
          {MOBILE_FORMULA_TOKENS.map((tok) => (
            <button
              key={tok}
              type="button"
              onClick={() => insertFormulaToken(tok)}
              className="px-2 py-0.5 rounded bg-dark-800 hover:bg-dark-700 active:bg-emerald-600 active:text-white border border-dark-700 text-xs font-mono font-bold text-dark-200 shrink-0 transition-colors"
            >
              {tok}
            </button>
          ))}
          <button
            type="button"
            onClick={toggleAbsoluteRef}
            className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] font-mono font-semibold text-amber-300 shrink-0"
          >
            $A$1
          </button>
        </div>
      </div>
      </>
      )}

      {/* Main Workspace: Spreadsheet Grid + Collapsible Chart Drawer */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        {/* Spreadsheet Scroll Container */}
        <div className="flex-1 overflow-auto relative select-none">
          <table className="border-collapse table-fixed min-w-max">
            <thead>
              <tr>
                {/* Top-Left Corner Select All Cell */}
                <th className="sticky top-0 left-0 z-30 w-10 bg-dark-900 border-b border-r border-dark-700 text-[10px] text-dark-400 font-mono">
                  #
                </th>
                {Array.from({ length: TOTAL_COLS }).map((_, cIdx) => {
                  const colLetter = colIndexToLetter(cIdx);
                  const width = activeSheet?.colWidths[cIdx] || 110;
                  const isActiveCol = activeCell.replace(/\d+/g, '') === colLetter;
                  return (
                    <th
                      key={colLetter}
                      style={{ width, minWidth: width }}
                      className={`sticky top-0 z-20 h-7 border-b border-r border-dark-700 text-xs font-mono font-bold transition-colors ${
                        isActiveCol
                          ? 'bg-emerald-950/90 text-emerald-400'
                          : 'bg-dark-900 text-dark-300'
                      }`}
                    >
                      {colLetter}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: TOTAL_ROWS }).map((_, rIdx) => {
                const rowNum = rIdx + 1;
                const isActiveRow = Number(activeCell.replace(/\D+/g, '')) === rowNum;
                return (
                  <tr key={rowNum} className="h-8">
                    {/* Sticky Row Header */}
                    <td
                      className={`sticky left-0 z-10 w-10 text-center border-b border-r border-dark-700 text-[11px] font-mono font-semibold ${
                        isActiveRow
                          ? 'bg-emerald-950/90 text-emerald-400'
                          : 'bg-dark-900 text-dark-400'
                      }`}
                    >
                      {rowNum}
                    </td>

                    {/* Row Cells */}
                    {Array.from({ length: TOTAL_COLS }).map((__, cIdx) => {
                      const addr = toCellAddress(cIdx, rIdx);
                      const cell = activeSheet?.cells[addr];
                      const raw = cell?.raw ?? '';
                      const evalVal = evaluatedMap[addr] ?? '';
                      const st = cell?.style || {};

                      const isPrimaryActive = activeCell === addr;
                      const isInSelection = selectedSet.has(addr);
                      const isFormula = raw.trim().startsWith('=');
                      const isError = typeof evalVal === 'string' && evalVal.startsWith('#');

                      const condStyle = getConditionalFormattingStyle(
                        addr,
                        evalVal,
                        activeSheet?.conditionalRules || []
                      );

                      const displayStr = showFormulasOnly
                        ? raw
                        : formatCellValue(evalVal, st.format);

                      const numericAlign =
                        !st.align &&
                        !showFormulasOnly &&
                        typeof evalVal === 'number'
                          ? 'right'
                          : st.align || 'left';

                      return (
                        <td
                          key={addr}
                          onClick={(e) => handleCellTap(addr, e.shiftKey)}
                          onDoubleClick={() => {
                            setActiveCell(addr);
                            setIsEditingFormula(true);
                            formulaInputRef.current?.focus();
                          }}
                          style={{
                            backgroundColor: condStyle?.bg || st.bg || undefined,
                            color: isError
                              ? '#f87171'
                              : condStyle?.color || st.color || undefined,
                            fontWeight: st.bold ? 700 : 400,
                            fontStyle: st.italic ? 'italic' : 'normal',
                            textDecoration: st.underline ? 'underline' : 'none',
                            textAlign: numericAlign,
                          }}
                          className={`px-2 py-1 border-b border-r border-dark-800 text-xs font-mono truncate cursor-cell transition-colors ${
                            isPrimaryActive
                              ? 'ring-2 ring-inset ring-emerald-400 bg-emerald-500/10 z-10'
                              : isInSelection
                              ? 'bg-emerald-500/15 border-emerald-500/30'
                              : 'hover:bg-dark-900/50'
                          } ${!st.color && !condStyle?.color ? 'text-dark-100' : ''}`}
                        >
                          <div className="flex items-center justify-between gap-1 truncate">
                            <span className="truncate w-full">{displayStr}</span>
                            {isFormula && !showFormulasOnly && (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 shrink-0"
                                title={`Formula: ${raw}`}
                              />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Visual Charts Side Panel */}
        {showChartPanel && (
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-dark-800 bg-dark-900 flex flex-col max-h-[45vh] lg:max-h-none overflow-y-auto shrink-0">
            <div className="p-3 border-b border-dark-800 flex items-center justify-between sticky top-0 bg-dark-900 z-10">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary-400" />
                <span className="text-xs font-bold text-white">Live Spreadsheet Charts</span>
              </div>
              <button
                onClick={() => setShowChartPanel(false)}
                className="p-1 rounded hover:bg-dark-800 text-dark-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chart Creator Form */}
            <div className="p-3 border-b border-dark-800 bg-dark-950/50 space-y-2">
              <div className="text-[11px] font-semibold text-dark-300">Create New Chart</div>
              <input
                type="text"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                placeholder="Chart Title"
                className="w-full bg-dark-900 border border-dark-700 rounded px-2 py-1 text-xs text-white"
              />
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="text-[10px] text-dark-400 block mb-0.5">Labels Range</label>
                  <input
                    type="text"
                    value={chartLabelRange}
                    onChange={(e) => setChartLabelRange(e.target.value)}
                    placeholder="A2:A7"
                    className="w-full bg-dark-900 border border-dark-700 rounded px-2 py-1 text-xs font-mono text-white uppercase"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-dark-400 block mb-0.5">Values Range</label>
                  <input
                    type="text"
                    value={chartDataRange}
                    onChange={(e) => setChartDataRange(e.target.value)}
                    placeholder="F2:F7"
                    className="w-full bg-dark-900 border border-dark-700 rounded px-2 py-1 text-xs font-mono text-white uppercase"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-dark-400 block mb-0.5">Chart Type</label>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as 'column' | 'bar' | 'line' | 'pie')}
                    className="w-full bg-dark-900 border border-dark-700 rounded px-1.5 py-1 text-xs text-white"
                  >
                    <option value="column">Column</option>
                    <option value="bar">Bar</option>
                    <option value="line">Line</option>
                    <option value="pie">Distribution</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleAddChart}
                className="w-full py-1.5 rounded bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Plot Chart from Cells
              </button>
            </div>

            {/* Rendered Charts List */}
            <div className="p-3 space-y-3">
              {activeSheet.charts.length === 0 ? (
                <p className="text-xs text-dark-400 text-center py-6">
                  No charts on this sheet yet. Specify a label range (e.g. A2:A7) and data range (e.g. F2:F7) above.
                </p>
              ) : (
                activeSheet.charts.map((chart) => {
                  const labels = expandRange(chart.labelRange).addresses.map((a) =>
                    String(evaluatedMap[a] || a)
                  );
                  const values = expandRange(chart.dataRange).addresses.map((a) => {
                    const n = Number(evaluatedMap[a]);
                    return Number.isNaN(n) ? 0 : n;
                  });
                  const maxVal = Math.max(...values, 1);
                  const totalVal = values.reduce((a, b) => a + Math.max(0, b), 0) || 1;

                  return (
                    <div
                      key={chart.id}
                      className="p-3 rounded-xl bg-dark-950 border border-dark-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white">{chart.title}</h4>
                          <p className="text-[10px] text-dark-400 font-mono">
                            Labels: {chart.labelRange} | Data: {chart.dataRange}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const nextSheets = sheets.map((s) =>
                              s.id === activeSheet.id
                                ? { ...s, charts: s.charts.filter((c) => c.id !== chart.id) }
                                : s
                            );
                            pushUndoState(nextSheets);
                          }}
                          className="p-1 text-dark-400 hover:text-red-400"
                          title="Remove Chart"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {chart.type === 'column' && (
                        <div className="h-36 flex items-end gap-2 pt-4 pb-1 px-1 border-b border-dark-800">
                          {values.map((v, idx) => {
                            const pct = Math.max(6, Math.round((Math.max(0, v) / maxVal) * 100));
                            return (
                              <div
                                key={idx}
                                className="flex-1 flex flex-col items-center justify-end h-full min-w-0"
                              >
                                <span className="text-[9px] font-mono text-emerald-400 mb-1">
                                  {v}
                                </span>
                                <div
                                  style={{ height: `${pct}%` }}
                                  className="w-full max-w-[28px] rounded-t bg-gradient-to-t from-emerald-600 to-teal-400 transition-all"
                                />
                                <span className="text-[9px] text-dark-300 truncate w-full text-center mt-1">
                                  {labels[idx] || `#${idx + 1}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {(chart.type === 'bar' || chart.type === 'pie' || chart.type === 'line') && (
                        <div className="space-y-1.5">
                          {values.map((v, idx) => {
                            const pct =
                              chart.type === 'pie'
                                ? Math.round((Math.max(0, v) / totalVal) * 100)
                                : Math.round((Math.max(0, v) / maxVal) * 100);
                            return (
                              <div key={idx} className="space-y-0.5">
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-dark-200 truncate max-w-[160px]">
                                    {labels[idx] || `Item ${idx + 1}`}
                                  </span>
                                  <span className="font-mono text-emerald-400">
                                    {v.toLocaleString()}{' '}
                                    {chart.type === 'pie' ? `(${pct}%)` : ''}
                                  </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-dark-800 overflow-hidden">
                                  <div
                                    style={{ width: `${Math.max(3, pct)}%` }}
                                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-emerald-400"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheet Tabs + Live Excel Status Bar (Hidden in Fullscreen View) */}
      {!isFullscreen && (
      <div className="bg-dark-900 border-t border-dark-800 px-2.5 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Multi-sheet tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {sheets.map((s) => {
            const isActive = s.id === activeSheet.id;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                  isActive
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : 'bg-dark-800 border-dark-700 text-dark-300 hover:text-white'
                }`}
                onClick={() => {
                  setActiveSheetId(s.id);
                  setActiveCell('A1');
                  setRangeEnd(null);
                }}
                onDoubleClick={() => handleRenameSheet(s)}
              >
                <span>{s.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameSheet(s);
                  }}
                  className="p-0.5 text-dark-400 hover:text-emerald-400"
                  title="Rename Sheet"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                {sheets.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSheet(s.id);
                    }}
                    className="p-0.5 text-dark-400 hover:text-red-400"
                    title="Delete Sheet"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
          <button
            onClick={handleAddSheet}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1 shadow-sm shrink-0"
            title="Create New Empty Sheet"
          >
            <Plus className="w-3.5 h-3.5" /> New Sheet
          </button>
        </div>

        {/* Live Selection Summary Bar (Count, Sum, Average, Min, Max) */}
        <div className="flex items-center gap-3 text-[11px] font-mono text-dark-300 overflow-x-auto no-scrollbar">
          <span>
            COUNT: <strong className="text-white">{selectionStats.count}</strong>
          </span>
          {selectionStats.hasNums && (
            <>
              <span>
                SUM: <strong className="text-emerald-400">{selectionStats.sum.toLocaleString()}</strong>
              </span>
              <span>
                AVG: <strong className="text-sky-400">{selectionStats.avg.toLocaleString()}</strong>
              </span>
              <span className="hidden sm:inline">
                MIN: <strong className="text-amber-400">{selectionStats.min.toLocaleString()}</strong>
              </span>
              <span className="hidden sm:inline">
                MAX: <strong className="text-purple-400">{selectionStats.max.toLocaleString()}</strong>
              </span>
            </>
          )}
        </div>
      </div>
      )}

      {/* Function Catalog Modal (fx) */}
      {showFunctionModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-dark-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-serif italic font-bold text-emerald-400">
                  fx
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Microsoft Excel Function Library
                  </h3>
                  <p className="text-xs text-dark-400">
                    Tap any function to insert it into cell {activeCell}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFunctionModal(false)}
                className="p-1.5 rounded-lg bg-dark-800 text-dark-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-dark-800 space-y-2 bg-dark-950/50">
              <div className="relative">
                <Search className="w-4 h-4 text-dark-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fnSearch}
                  onChange={(e) => setFnSearch(e.target.value)}
                  placeholder="Search function (e.g. VLOOKUP, SUMIF, RANK, IF, AVERAGE)..."
                  className="w-full bg-dark-900 border border-dark-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {(
                  ['All', 'Math & Stats', 'Logical', 'Lookup & Ref', 'Text', 'Date & Financial'] as const
                ).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFnCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      fnCategory === cat
                        ? 'bg-emerald-600 text-white'
                        : 'bg-dark-800 text-dark-300 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredFunctions.map((fn) => (
                <div
                  key={fn.name}
                  className="p-3 rounded-xl bg-dark-950 border border-dark-800 hover:border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {fn.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-800 text-dark-300">
                        {fn.category}
                      </span>
                    </div>
                    <p className="text-xs text-dark-200">{fn.description}</p>
                    <p className="text-[11px] font-mono text-dark-400">
                      Syntax: <span className="text-dark-200">{fn.syntax}</span> | Example:{' '}
                      <span className="text-sky-400">{fn.example}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setIsEditingFormula(true);
                        setFormulaInput(`=${fn.name}(`);
                        setShowFunctionModal(false);
                        setTimeout(() => formulaInputRef.current?.focus(), 20);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      Insert <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Conditional Formatting Modal */}
      {showCondModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-md p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Conditional Formatting Rules</h3>
              <button
                onClick={() => setShowCondModal(false)}
                className="p-1 text-dark-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-dark-300 block mb-1">Apply to Cell Range</label>
                <input
                  type="text"
                  value={condRange}
                  onChange={(e) => setCondRange(e.target.value)}
                  placeholder="G2:G7"
                  className="w-full bg-dark-950 border border-dark-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-dark-300 block mb-1">Condition</label>
                  <select
                    value={condOp}
                    onChange={(e) =>
                      setCondOp(e.target.value as 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains')
                    }
                    className="w-full bg-dark-950 border border-dark-700 rounded-lg px-2 py-1.5 text-xs text-white"
                  >
                    <option value="eq">Equals (=)</option>
                    <option value="gt">Greater Than (&gt;)</option>
                    <option value="lt">Less Than (&lt;)</option>
                    <option value="gte">Greater or Equal (&gt;=)</option>
                    <option value="lte">Less or Equal (&lt;=)</option>
                    <option value="contains">Text Contains</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-dark-300 block mb-1">Target Value</label>
                  <input
                    type="text"
                    value={condVal}
                    onChange={(e) => setCondVal(e.target.value)}
                    placeholder="50 or PASS"
                    className="w-full bg-dark-950 border border-dark-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-dark-300 block mb-1">Highlight Style</label>
                <div className="flex items-center gap-2">
                  {COLOR_SWATCHES.slice(1).map((sw, i) => (
                    <button
                      key={sw.label}
                      onClick={() => setCondColorIdx(i + 1)}
                      style={{ backgroundColor: sw.bg, color: sw.color }}
                      className={`px-2.5 py-1 rounded text-xs font-bold border ${
                        condColorIdx === i + 1 ? 'border-white' : 'border-transparent'
                      }`}
                    >
                      {sw.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAddConditionalRule}
                className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Add Highlight Rule
              </button>
            </div>

            {activeSheet.conditionalRules.length > 0 && (
              <div className="pt-2 border-t border-dark-800 space-y-1.5">
                <div className="text-xs font-semibold text-dark-300">Active Rules</div>
                {activeSheet.conditionalRules.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded bg-dark-950 border border-dark-800 text-xs"
                  >
                    <span className="font-mono text-dark-200">{r.label}</span>
                    <button
                      onClick={() => {
                        const nextSheets = sheets.map((s) =>
                          s.id === activeSheet.id
                            ? {
                                ...s,
                                conditionalRules: s.conditionalRules.filter((x) => x.id !== r.id),
                              }
                            : s
                        );
                        pushUndoState(nextSheets);
                      }}
                      className="text-dark-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Find & Replace Modal */}
      {showFindModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-sm p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Find & Replace in Sheet</h3>
              <button
                onClick={() => setShowFindModal(false)}
                className="p-1 text-dark-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="text-xs text-dark-300 block mb-1">Find Text or Number</label>
              <input
                type="text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                className="w-full bg-dark-950 border border-dark-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-dark-300 block mb-1">Replace With</label>
              <input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className="w-full bg-dark-950 border border-dark-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <button
              onClick={handleReplaceAll}
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              Replace All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
