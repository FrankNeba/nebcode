'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Database,
  Table,
  Plus,
  Trash2,
  Play,
  Key,
  Maximize2,
  Minimize2,
  Download,
  RotateCcw,
  BookOpen,
  Share2,
  Check,
  AlertCircle,
  FolderOpen,
  Code2,
  LayoutTemplate,
  FileSpreadsheet,
  FileText,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Sparkles,
  Info,
  X,
  Eye,
  Filter,
  ArrowUpDown,
  Printer,
  FileCode,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LabAccessGate } from '@/components/ui/LabAccessGate';
import {
  AccessDatabase,
  TableDefinition,
  FieldDefinition,
  AccessDataType,
  Relationship,
  SavedQuery,
  SavedForm,
  SavedReport,
  executeAccessSQL,
  QueryResult,
  validateRecord,
  validateReferentialIntegrity,
  getGceSchoolTemplate,
  getBlankDatabase,
  exportDatabaseToSQL,
} from '@/lib/access-engine';

const STORAGE_KEY = 'nebcode_access_lab_v1';

type ActiveTabType =
  | { type: 'table_design'; tableName: string }
  | { type: 'table_datasheet'; tableName: string }
  | { type: 'query'; queryId: string }
  | { type: 'relationships' }
  | { type: 'form'; formId: string }
  | { type: 'report'; reportId: string };

const ACCESS_DATA_TYPES: AccessDataType[] = [
  'Short Text',
  'Long Text',
  'Number',
  'Date/Time',
  'Currency',
  'AutoNumber',
  'Yes/No',
];

const MOBILE_SQL_TOKENS = [
  'SELECT',
  'FROM',
  'WHERE',
  'INNER JOIN',
  'ON',
  'ORDER BY',
  'GROUP BY',
  'LIKE',
  'AND',
  'OR',
  '*',
  '=',
  '>=',
  '<=',
  '<>',
  ';',
];

export default function AccessLabClient() {
  // Database state
  const [db, setDb] = useState<AccessDatabase>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load saved Access DB:', e);
      }
    }
    return getGceSchoolTemplate();
  });

  // UI state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTabType>({
    type: 'table_datasheet',
    tableName: 'tbl_Student',
  });
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [navSearch, setNavSearch] = useState('');
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [ribbonTab, setRibbonTab] = useState<'home' | 'create' | 'tools'>('home');

  // Query editor state
  const [currentQuerySql, setCurrentQuerySql] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryViewMode, setQueryViewMode] = useState<'sql' | 'results'>('sql');

  // Form navigation state
  const [formRecordIndex, setFormRecordIndex] = useState(0);

  // Relationship modal state
  const [isRelModalOpen, setIsRelModalOpen] = useState(false);
  const [newRel, setNewRel] = useState<Partial<Relationship>>({
    fromTable: '',
    fromField: '',
    toTable: '',
    toField: '',
    type: '1-to-Many',
    enforceReferentialIntegrity: true,
  });

  // Cheatsheet modal
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Failed to save Access DB:', e);
    }
  }, [db]);

  // Keep query SQL in sync when switching query tabs
  useEffect(() => {
    if (activeTab.type === 'query') {
      const q = db.queries[activeTab.queryId];
      if (q) {
        setCurrentQuerySql(q.sql);
        setQueryResult(null);
        setQueryError(null);
        setQueryViewMode('sql');
      }
    }
  }, [activeTab, db.queries]);

  // --------------------------------------------------------------------------
  // Table Operations
  // --------------------------------------------------------------------------
  const activeTable = useMemo(() => {
    if (activeTab.type === 'table_design' || activeTab.type === 'table_datasheet') {
      return db.tables[activeTab.tableName];
    }
    return null;
  }, [activeTab, db.tables]);

  const handleAddField = (tableName: string) => {
    const table = db.tables[tableName];
    if (!table) return;

    const newField: FieldDefinition = {
      id: `f_${Date.now()}`,
      name: `Field${table.fields.length + 1}`,
      type: 'Short Text',
      description: '',
      properties: { fieldSize: 255 },
    };

    setDb((prev) => ({
      ...prev,
      tables: {
        ...prev.tables,
        [tableName]: {
          ...table,
          fields: [...table.fields, newField],
        },
      },
      updatedAt: new Date().toISOString(),
    }));
    setSelectedFieldId(newField.id);
  };

  const handleUpdateField = (
    tableName: string,
    fieldId: string,
    updates: Partial<FieldDefinition>
  ) => {
    setDb((prev) => {
      const table = prev.tables[tableName];
      if (!table) return prev;

      const updatedFields = table.fields.map((f) => {
        if (f.id !== fieldId) return f;
        return {
          ...f,
          ...updates,
          properties: { ...f.properties, ...(updates.properties || {}) },
        };
      });

      return {
        ...prev,
        tables: {
          ...prev.tables,
          [tableName]: { ...table, fields: updatedFields },
        },
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleTogglePrimaryKey = (tableName: string, fieldId: string) => {
    setDb((prev) => {
      const table = prev.tables[tableName];
      if (!table) return prev;

      const updatedFields = table.fields.map((f) => {
        if (f.id === fieldId) {
          return { ...f, isPrimaryKey: !f.isPrimaryKey };
        }
        return f;
      });

      return {
        ...prev,
        tables: {
          ...prev.tables,
          [tableName]: { ...table, fields: updatedFields },
        },
        updatedAt: new Date().toISOString(),
      };
    });
    toast.success('Primary key updated');
  };

  const handleDeleteField = (tableName: string, fieldId: string) => {
    setDb((prev) => {
      const table = prev.tables[tableName];
      if (!table) return prev;

      return {
        ...prev,
        tables: {
          ...prev.tables,
          [tableName]: {
            ...table,
            fields: table.fields.filter((f) => f.id !== fieldId),
          },
        },
        updatedAt: new Date().toISOString(),
      };
    });
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  const handleCreateNewTable = () => {
    const count = Object.keys(db.tables).length + 1;
    const name = `Table${count}`;
    const newTable: TableDefinition = {
      id: `t_${Date.now()}`,
      name,
      autoNumberCounter: 0,
      fields: [
        {
          id: `f_id_${Date.now()}`,
          name: 'ID',
          type: 'AutoNumber',
          isPrimaryKey: true,
          properties: { fieldSize: 'Long Integer', required: true },
        },
        {
          id: `f_f1_${Date.now()}`,
          name: 'Field1',
          type: 'Short Text',
          properties: { fieldSize: 255 },
        },
      ],
      records: [],
    };

    setDb((prev) => ({
      ...prev,
      tables: { ...prev.tables, [name]: newTable },
      updatedAt: new Date().toISOString(),
    }));
    setActiveTab({ type: 'table_design', tableName: name });
    toast.success(`Created table '${name}'`);
  };

  // --------------------------------------------------------------------------
  // Datasheet Record Editing
  // --------------------------------------------------------------------------
  const handleCellChange = (
    tableName: string,
    rowIndex: number,
    fieldName: string,
    val: any
  ) => {
    const table = db.tables[tableName];
    if (!table) return;

    const row = { ...table.records[rowIndex], [fieldName]: val };

    // Validate record constraints
    const valRes = validateRecord(table, row, rowIndex);
    if (!valRes.isValid) {
      toast.error(valRes.error || 'Validation error');
      return;
    }

    // Validate referential integrity
    const riRes = validateReferentialIntegrity(db, 'update', tableName, row);
    if (!riRes.isValid) {
      toast.error(riRes.error || 'Referential integrity error');
      return;
    }

    const updatedRecords = [...table.records];
    updatedRecords[rowIndex] = row;

    setDb((prev) => ({
      ...prev,
      tables: {
        ...prev.tables,
        [tableName]: { ...table, records: updatedRecords },
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleAddNewRecord = (tableName: string) => {
    const table = db.tables[tableName];
    if (!table) return;

    const newRecord: Record<string, any> = {};
    let nextCounter = table.autoNumberCounter;

    table.fields.forEach((f) => {
      if (f.type === 'AutoNumber') {
        nextCounter += 1;
        newRecord[f.name] = nextCounter;
      } else if (f.properties.defaultValue) {
        newRecord[f.name] = f.properties.defaultValue;
      } else {
        newRecord[f.name] = '';
      }
    });

    setDb((prev) => ({
      ...prev,
      tables: {
        ...prev.tables,
        [tableName]: {
          ...table,
          autoNumberCounter: nextCounter,
          records: [...table.records, newRecord],
        },
      },
      updatedAt: new Date().toISOString(),
    }));
    toast.success('New record added to datasheet');
  };

  const handleDeleteRecord = (tableName: string, rowIndex: number) => {
    const table = db.tables[tableName];
    if (!table) return;

    const targetRow = table.records[rowIndex];
    const riRes = validateReferentialIntegrity(db, 'delete', tableName, targetRow);
    if (!riRes.isValid) {
      toast.error(riRes.error || 'Cannot delete record');
      return;
    }

    const updated = table.records.filter((_, idx) => idx !== rowIndex);
    setDb((prev) => ({
      ...prev,
      tables: {
        ...prev.tables,
        [tableName]: { ...table, records: updated },
      },
      updatedAt: new Date().toISOString(),
    }));
    toast.success('Record deleted');
  };

  // --------------------------------------------------------------------------
  // SQL Query Execution
  // --------------------------------------------------------------------------
  const handleRunQuery = () => {
    try {
      setQueryError(null);
      const res = executeAccessSQL(db, currentQuerySql);
      setQueryResult(res);
      setQueryViewMode('results');
      toast.success(`Query executed: ${res.rowCount} row(s) returned (${res.executionTimeMs}ms)`);
    } catch (err: any) {
      setQueryError(err.message || 'Error executing SQL query.');
      setQueryResult(null);
      toast.error(err.message || 'SQL syntax error');
    }
  };

  const handleCreateNewQuery = () => {
    const count = Object.keys(db.queries).length + 1;
    const qId = `qry_Query${count}`;
    const firstTable = Object.values(db.tables)[0]?.name || 'tbl_Student';
    const newQ: SavedQuery = {
      id: qId,
      name: qId,
      sql: `SELECT * FROM ${firstTable};`,
      description: 'Custom Access SQL query',
    };

    setDb((prev) => ({
      ...prev,
      queries: { ...prev.queries, [qId]: newQ },
      updatedAt: new Date().toISOString(),
    }));
    setActiveTab({ type: 'query', queryId: qId });
    toast.success(`Created query '${qId}'`);
  };

  const handleSaveCurrentQuery = () => {
    if (activeTab.type !== 'query') return;
    const qId = activeTab.queryId;
    setDb((prev) => {
      const existing = prev.queries[qId];
      if (!existing) return prev;
      return {
        ...prev,
        queries: {
          ...prev.queries,
          [qId]: { ...existing, sql: currentQuerySql },
        },
        updatedAt: new Date().toISOString(),
      };
    });
    toast.success('Query saved');
  };

  // --------------------------------------------------------------------------
  // Relationships
  // --------------------------------------------------------------------------
  const handleAddRelationship = () => {
    if (!newRel.fromTable || !newRel.fromField || !newRel.toTable || !newRel.toField) {
      toast.error('Please select both parent (PK) and child (FK) tables and fields.');
      return;
    }

    const rel: Relationship = {
      id: `rel_${Date.now()}`,
      fromTable: newRel.fromTable,
      fromField: newRel.fromField,
      toTable: newRel.toTable,
      toField: newRel.toField,
      type: newRel.type || '1-to-Many',
      enforceReferentialIntegrity: newRel.enforceReferentialIntegrity !== false,
    };

    setDb((prev) => ({
      ...prev,
      relationships: [...prev.relationships, rel],
      updatedAt: new Date().toISOString(),
    }));
    setIsRelModalOpen(false);
    toast.success(`Relationship created: ${rel.fromTable} → ${rel.toTable}`);
  };

  const handleDeleteRelationship = (relId: string) => {
    setDb((prev) => ({
      ...prev,
      relationships: prev.relationships.filter((r) => r.id !== relId),
      updatedAt: new Date().toISOString(),
    }));
    toast.success('Relationship deleted');
  };

  // --------------------------------------------------------------------------
  // Forms & Reports
  // --------------------------------------------------------------------------
  const handleCreateNewForm = () => {
    const firstTable = Object.values(db.tables)[0]?.name || 'tbl_Student';
    const formId = `frm_${firstTable}`;
    const newForm: SavedForm = {
      id: formId,
      name: formId,
      tableName: firstTable,
      title: `${firstTable} Entry Form`,
    };

    setDb((prev) => ({
      ...prev,
      forms: { ...prev.forms, [formId]: newForm },
      updatedAt: new Date().toISOString(),
    }));
    setActiveTab({ type: 'form', formId });
    setFormRecordIndex(0);
    toast.success(`Created form for '${firstTable}'`);
  };

  const handleCreateNewReport = () => {
    const firstTable = Object.values(db.tables)[0]?.name || 'tbl_Student';
    const reportId = `rpt_${firstTable}`;
    const newReport: SavedReport = {
      id: reportId,
      name: reportId,
      sourceType: 'table',
      sourceName: firstTable,
      title: `${firstTable} Official Summary Report`,
    };

    setDb((prev) => ({
      ...prev,
      reports: { ...prev.reports, [reportId]: newReport },
      updatedAt: new Date().toISOString(),
    }));
    setActiveTab({ type: 'report', reportId });
    toast.success(`Created report for '${firstTable}'`);
  };

  // --------------------------------------------------------------------------
  // Templates & Export
  // --------------------------------------------------------------------------
  const handleResetToGceSchool = () => {
    if (confirm('Reset to the Cameroon GCE School Management template? Current unsaved changes will be replaced.')) {
      const template = getGceSchoolTemplate();
      setDb(template);
      setActiveTab({ type: 'table_datasheet', tableName: 'tbl_Student' });
      toast.success('Loaded GCE School Management template');
    }
  };

  const handleStartBlank = () => {
    if (confirm('Create a new blank Access database?')) {
      const blank = getBlankDatabase();
      setDb(blank);
      setActiveTab({ type: 'table_design', tableName: 'Table1' });
      toast.success('Created blank Access database');
    }
  };

  const handleDownloadSQL = () => {
    const sql = exportDatabaseToSQL(db);
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${db.name.replace(/\.[^/.]+$/, '')}_export.sql`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported database script as SQL');
  };

  // Filtered Nav Objects
  const filteredTables = Object.values(db.tables).filter((t) =>
    t.name.toLowerCase().includes(navSearch.toLowerCase())
  );
  const filteredQueries = Object.values(db.queries).filter((q) =>
    q.name.toLowerCase().includes(navSearch.toLowerCase())
  );
  const filteredForms = Object.values(db.forms).filter((f) =>
    f.name.toLowerCase().includes(navSearch.toLowerCase())
  );
  const filteredReports = Object.values(db.reports).filter((r) =>
    r.name.toLowerCase().includes(navSearch.toLowerCase())
  );

  return (
    <LabAccessGate labName="Microsoft Access Database Lab">
      <div
        className={`flex flex-col bg-dark-950 text-gray-100 ${
          isFullscreen
            ? 'fixed inset-0 z-[200] h-screen w-screen overflow-hidden'
            : 'h-[calc(100dvh-116px)] md:h-[calc(100dvh-56px)] overflow-hidden'
        }`}
      >
        {/* ==================================================================== */}
        {/* TOP BAR / ACCESS HEADER RIBBON                                       */}
        {/* ==================================================================== */}
        <header className="bg-dark-900 border-b border-dark-700 px-3 py-2 flex items-center justify-between shrink-0 select-none">
          {/* Left: Brand & Database Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center shrink-0 shadow-sm">
              <Database className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wide text-rose-400 uppercase">
                  MS Access Lab
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950/70 text-rose-300 font-mono border border-rose-800/40 hidden sm:inline-block">
                  GCE O/A-Level
                </span>
              </div>
              <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[140px] sm:max-w-xs">
                {db.name}
              </h1>
            </div>
          </div>

          {/* Center: Ribbon Menu Controls */}
          <div className="hidden lg:flex items-center bg-dark-950/70 p-0.5 rounded-lg border border-dark-800">
            <button
              onClick={() => setRibbonTab('home')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                ribbonTab === 'home'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Home &amp; View
            </button>
            <button
              onClick={() => setRibbonTab('create')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                ribbonTab === 'create'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Create Objects
            </button>
            <button
              onClick={() => setRibbonTab('tools')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                ribbonTab === 'tools'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Database Tools
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowCheatSheet(true)}
              className="px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-gray-300 text-xs font-semibold flex items-center gap-1 transition"
              title="Access SQL & GCE Exam Guide"
            >
              <BookOpen className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">GCE Guide</span>
            </button>

            <button
              onClick={handleDownloadSQL}
              className="px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-gray-300 text-xs font-semibold flex items-center gap-1 transition"
              title="Download database as SQL script"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export SQL</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-gray-300 hover:text-white transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Workspace'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-rose-400" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* ==================================================================== */}
        {/* SECONDARY RIBBON TOOLBAR                                             */}
        {/* ==================================================================== */}
        <div className="bg-dark-900/60 border-b border-dark-800 px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto text-xs shrink-0">
          <div className="flex items-center gap-2">
            {/* View Switching if in table tab */}
            {(activeTab.type === 'table_design' || activeTab.type === 'table_datasheet') && (
              <div className="flex items-center bg-dark-950 rounded-lg p-0.5 border border-dark-800">
                <button
                  onClick={() =>
                    setActiveTab({
                      type: 'table_datasheet',
                      tableName: activeTab.tableName,
                    })
                  }
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${
                    activeTab.type === 'table_datasheet'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800/40 font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Datasheet View
                </button>
                <button
                  onClick={() =>
                    setActiveTab({
                      type: 'table_design',
                      tableName: activeTab.tableName,
                    })
                  }
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${
                    activeTab.type === 'table_design'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800/40 font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  Design View
                </button>
              </div>
            )}

            {/* Quick Actions depending on active ribbon tab */}
            {ribbonTab === 'create' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCreateNewTable}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-600/30 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Table
                </button>
                <button
                  onClick={handleCreateNewQuery}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-600/30 font-semibold"
                >
                  <Code2 className="w-3.5 h-3.5" /> Query (SQL)
                </button>
                <button
                  onClick={handleCreateNewForm}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-sky-600/20 text-sky-300 hover:bg-sky-600/30 border border-sky-600/30 font-semibold"
                >
                  <FileText className="w-3.5 h-3.5" /> Form
                </button>
                <button
                  onClick={handleCreateNewReport}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-600/30 font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" /> Report
                </button>
              </div>
            )}

            {ribbonTab === 'tools' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab({ type: 'relationships' })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-dark-800 hover:bg-dark-700 text-rose-300 font-semibold border border-dark-700"
                >
                  <Share2 className="w-3.5 h-3.5" /> Relationships Canvas
                </button>
                <button
                  onClick={handleResetToGceSchool}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-dark-800 hover:bg-dark-700 text-amber-300 font-medium border border-dark-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Load GCE School Sample
                </button>
                <button
                  onClick={handleStartBlank}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-dark-800 hover:bg-dark-700 text-gray-300 font-medium border border-dark-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Blank DB
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded border border-dark-800 bg-dark-950 flex items-center gap-1"
          >
            <FolderOpen className="w-3 h-3 text-rose-400" />
            <span>{isNavOpen ? 'Hide Nav' : 'Show All Objects'}</span>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* MAIN BODY: SPLIT VIEW (NAVIGATION PANE + WORKSPACE TABS)              */}
        {/* ==================================================================== */}
        <div className="flex-1 flex overflow-hidden">
          {/* ------------------------------------------------------------------ */}
          {/* LEFT: ALL ACCESS OBJECTS NAVIGATION PANE                           */}
          {/* ------------------------------------------------------------------ */}
          {isNavOpen && (
            <aside className="w-56 sm:w-64 bg-dark-900 border-r border-dark-800 flex flex-col shrink-0 overflow-y-auto">
              <div className="p-2 border-b border-dark-800 bg-dark-950/60 sticky top-0 z-10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span>All Access Objects</span>
                  <button
                    onClick={handleCreateNewTable}
                    title="Create Table"
                    className="p-1 hover:text-rose-400 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="w-3 h-3 text-gray-500 absolute left-2 top-2" />
                  <input
                    type="text"
                    placeholder="Search objects..."
                    value={navSearch}
                    onChange={(e) => setNavSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs bg-dark-900 border border-dark-700 rounded-lg text-white placeholder-gray-500 outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="p-2 space-y-4 text-xs">
                {/* 1. Tables Section */}
                <div>
                  <div className="flex items-center justify-between font-bold text-gray-400 mb-1.5 px-1.5 uppercase text-[10px] tracking-wider">
                    <span className="flex items-center gap-1 text-rose-400">
                      <Table className="w-3 h-3" /> Tables ({filteredTables.length})
                    </span>
                    <button onClick={handleCreateNewTable} className="text-gray-500 hover:text-white">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {filteredTables.map((t) => {
                      const isCurrent =
                        (activeTab.type === 'table_design' ||
                          activeTab.type === 'table_datasheet') &&
                        activeTab.tableName === t.name;
                      return (
                        <div
                          key={t.id}
                          onClick={() =>
                            setActiveTab({
                              type: 'table_datasheet',
                              tableName: t.name,
                            })
                          }
                          className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition ${
                            isCurrent
                              ? 'bg-rose-950/60 text-white font-semibold border border-rose-700/40'
                              : 'text-gray-300 hover:bg-dark-800'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Table className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span className="truncate">{t.name}</span>
                          </div>
                          <span className="text-[10px] text-gray-500 group-hover:text-gray-300">
                            {t.records.length}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Queries Section */}
                <div>
                  <div className="flex items-center justify-between font-bold text-gray-400 mb-1.5 px-1.5 uppercase text-[10px] tracking-wider">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Code2 className="w-3 h-3" /> Queries ({filteredQueries.length})
                    </span>
                    <button onClick={handleCreateNewQuery} className="text-gray-500 hover:text-white">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {filteredQueries.map((q) => {
                      const isCurrent =
                        activeTab.type === 'query' && activeTab.queryId === q.id;
                      return (
                        <div
                          key={q.id}
                          onClick={() => setActiveTab({ type: 'query', queryId: q.id })}
                          className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition ${
                            isCurrent
                              ? 'bg-amber-950/60 text-white font-semibold border border-amber-700/40'
                              : 'text-gray-300 hover:bg-dark-800'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Code2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">{q.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Relationships */}
                <div>
                  <div className="flex items-center justify-between font-bold text-gray-400 mb-1.5 px-1.5 uppercase text-[10px] tracking-wider">
                    <span className="flex items-center gap-1 text-sky-400">
                      <Share2 className="w-3 h-3" /> Relationships
                    </span>
                  </div>
                  <div
                    onClick={() => setActiveTab({ type: 'relationships' })}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition ${
                      activeTab.type === 'relationships'
                        ? 'bg-sky-950/60 text-white font-semibold border border-sky-700/40'
                        : 'text-gray-300 hover:bg-dark-800'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Relationships Canvas ({db.relationships.length})</span>
                  </div>
                </div>

                {/* 4. Forms */}
                <div>
                  <div className="flex items-center justify-between font-bold text-gray-400 mb-1.5 px-1.5 uppercase text-[10px] tracking-wider">
                    <span className="flex items-center gap-1 text-teal-400">
                      <FileText className="w-3 h-3" /> Forms ({filteredForms.length})
                    </span>
                    <button onClick={handleCreateNewForm} className="text-gray-500 hover:text-white">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {filteredForms.map((frm) => (
                      <div
                        key={frm.id}
                        onClick={() => setActiveTab({ type: 'form', formId: frm.id })}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition ${
                          activeTab.type === 'form' && activeTab.formId === frm.id
                            ? 'bg-teal-950/60 text-white font-semibold border border-teal-700/40'
                            : 'text-gray-300 hover:bg-dark-800'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className="truncate">{frm.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Reports */}
                <div>
                  <div className="flex items-center justify-between font-bold text-gray-400 mb-1.5 px-1.5 uppercase text-[10px] tracking-wider">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Printer className="w-3 h-3" /> Reports ({filteredReports.length})
                    </span>
                    <button onClick={handleCreateNewReport} className="text-gray-500 hover:text-white">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {filteredReports.map((rpt) => (
                      <div
                        key={rpt.id}
                        onClick={() => setActiveTab({ type: 'report', reportId: rpt.id })}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition ${
                          activeTab.type === 'report' && activeTab.reportId === rpt.id
                            ? 'bg-emerald-950/60 text-white font-semibold border border-emerald-700/40'
                            : 'text-gray-300 hover:bg-dark-800'
                        }`}
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{rpt.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* RIGHT: MAIN WORKSPACE CANVAS                                       */}
          {/* ------------------------------------------------------------------ */}
          <main className="flex-1 flex flex-col bg-dark-950 overflow-hidden">
            {/* Active Workspace Object Title Bar */}
            <div className="bg-dark-900 border-b border-dark-800 px-4 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {activeTab.type === 'table_design' && (
                  <span className="flex items-center gap-1.5 font-bold text-rose-300">
                    <LayoutTemplate className="w-4 h-4 text-rose-400" />
                    {activeTab.tableName} : Table (Design View)
                  </span>
                )}
                {activeTab.type === 'table_datasheet' && (
                  <span className="flex items-center gap-1.5 font-bold text-rose-300">
                    <FileSpreadsheet className="w-4 h-4 text-rose-400" />
                    {activeTab.tableName} : Table (Datasheet View)
                  </span>
                )}
                {activeTab.type === 'query' && (
                  <span className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Code2 className="w-4 h-4 text-amber-400" />
                    {activeTab.queryId} : Query ({queryViewMode === 'sql' ? 'SQL View' : 'Datasheet View'})
                  </span>
                )}
                {activeTab.type === 'relationships' && (
                  <span className="flex items-center gap-1.5 font-bold text-sky-300">
                    <Share2 className="w-4 h-4 text-sky-400" />
                    Relationships Canvas
                  </span>
                )}
                {activeTab.type === 'form' && (
                  <span className="flex items-center gap-1.5 font-bold text-teal-300">
                    <FileText className="w-4 h-4 text-teal-400" />
                    {activeTab.formId} : Form View
                  </span>
                )}
                {activeTab.type === 'report' && (
                  <span className="flex items-center gap-1.5 font-bold text-emerald-300">
                    <Printer className="w-4 h-4 text-emerald-400" />
                    {activeTab.reportId} : Print Preview Report
                  </span>
                )}
              </div>

              {/* Context Actions */}
              <div className="flex items-center gap-2">
                {activeTab.type === 'table_datasheet' && (
                  <button
                    onClick={() => handleAddNewRecord(activeTab.tableName)}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Record
                  </button>
                )}
                {activeTab.type === 'table_design' && (
                  <button
                    onClick={() => handleAddField(activeTab.tableName)}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Field
                  </button>
                )}
                {activeTab.type === 'query' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleSaveCurrentQuery}
                      className="px-2.5 py-1 bg-dark-800 hover:bg-dark-700 text-gray-300 border border-dark-700 rounded text-xs font-semibold transition"
                    >
                      Save SQL
                    </button>
                    <button
                      onClick={handleRunQuery}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold transition flex items-center gap-1 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Run Query
                    </button>
                  </div>
                )}
                {activeTab.type === 'relationships' && (
                  <button
                    onClick={() => {
                      setNewRel({
                        fromTable: Object.keys(db.tables)[0] || '',
                        fromField: '',
                        toTable: Object.keys(db.tables)[1] || '',
                        toField: '',
                        type: '1-to-Many',
                        enforceReferentialIntegrity: true,
                      });
                      setIsRelModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-bold transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Edit Relationship
                  </button>
                )}
              </div>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* VIEW 1: TABLE DESIGN VIEW                                         */}
            {/* ---------------------------------------------------------------- */}
            {activeTab.type === 'table_design' && activeTable && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Field Grid */}
                <div className="flex-1 overflow-auto border-b border-dark-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-dark-900/90 sticky top-0 z-10 text-gray-400 uppercase text-[10px] tracking-wider border-b border-dark-700">
                      <tr>
                        <th className="py-2 px-3 w-10 text-center">PK</th>
                        <th className="py-2 px-3 font-bold">Field Name</th>
                        <th className="py-2 px-3 font-bold">Data Type</th>
                        <th className="py-2 px-3 font-bold hidden sm:table-cell">Description</th>
                        <th className="py-2 px-3 w-10 text-center">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-800 font-mono">
                      {activeTable.fields.map((f) => {
                        const isSelected = selectedFieldId === f.id;
                        return (
                          <tr
                            key={f.id}
                            onClick={() => setSelectedFieldId(f.id)}
                            className={`cursor-pointer transition ${
                              isSelected
                                ? 'bg-rose-950/40 text-white border-l-4 border-rose-500'
                                : 'hover:bg-dark-900/50 text-gray-300'
                            }`}
                          >
                            {/* Primary Key Toggle */}
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePrimaryKey(activeTable.name, f.id);
                                }}
                                title={f.isPrimaryKey ? 'Remove Primary Key' : 'Set as Primary Key'}
                                className={`p-1 rounded hover:scale-110 transition ${
                                  f.isPrimaryKey ? 'text-amber-400' : 'text-gray-600 hover:text-gray-400'
                                }`}
                              >
                                <Key className="w-3.5 h-3.5 fill-current" />
                              </button>
                            </td>

                            {/* Field Name Input */}
                            <td className="py-1 px-3">
                              <input
                                type="text"
                                value={f.name}
                                onChange={(e) =>
                                  handleUpdateField(activeTable.name, f.id, { name: e.target.value })
                                }
                                className="w-full bg-transparent outline-none focus:bg-dark-950 px-1 py-0.5 rounded font-bold text-rose-300"
                              />
                            </td>

                            {/* Data Type Dropdown */}
                            <td className="py-1 px-3">
                              <select
                                value={f.type}
                                onChange={(e) =>
                                  handleUpdateField(activeTable.name, f.id, {
                                    type: e.target.value as AccessDataType,
                                  })
                                }
                                className="bg-dark-900 text-xs border border-dark-700 rounded px-2 py-1 outline-none text-gray-200 focus:border-rose-500 font-sans"
                              >
                                {ACCESS_DATA_TYPES.map((dt) => (
                                  <option key={dt} value={dt}>
                                    {dt}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Description */}
                            <td className="py-1 px-3 hidden sm:table-cell">
                              <input
                                type="text"
                                value={f.description || ''}
                                placeholder="Optional field description"
                                onChange={(e) =>
                                  handleUpdateField(activeTable.name, f.id, {
                                    description: e.target.value,
                                  })
                                }
                                className="w-full bg-transparent outline-none focus:bg-dark-950 px-1 py-0.5 rounded text-gray-400 font-sans"
                              />
                            </td>

                            {/* Delete */}
                            <td className="py-1 px-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteField(activeTable.name, f.id);
                                }}
                                className="text-gray-600 hover:text-red-400 p-1 transition"
                                title="Delete Field"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Field Properties Pane */}
                <div className="h-56 sm:h-64 bg-dark-900 border-t border-dark-700 flex flex-col overflow-hidden shrink-0">
                  <div className="bg-dark-950 px-4 py-1.5 border-b border-dark-800 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>
                      Field Properties:{' '}
                      <span className="text-rose-400 font-mono">
                        {activeTable.fields.find((f) => f.id === selectedFieldId)?.name || 'Select a field'}
                      </span>
                    </span>
                    <span className="text-[10px] text-gray-500">General Tab</span>
                  </div>

                  {(() => {
                    const selected = activeTable.fields.find((f) => f.id === selectedFieldId);
                    if (!selected) {
                      return (
                        <div className="flex-1 flex items-center justify-center text-xs text-gray-500 p-4">
                          Click any field in the grid above to configure its Field Properties (Validation Rules, Default Value, Required).
                        </div>
                      );
                    }

                    return (
                      <div className="flex-1 p-3 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                        {/* Field Size */}
                        <div className="flex items-center justify-between gap-2 border-b border-dark-800 pb-1">
                          <label className="text-gray-400 font-medium">Field Size</label>
                          <input
                            type="text"
                            value={selected.properties.fieldSize || ''}
                            onChange={(e) =>
                              handleUpdateField(activeTable.name, selected.id, {
                                properties: { fieldSize: e.target.value },
                              })
                            }
                            placeholder="e.g. 50 or Long Integer"
                            className="w-48 bg-dark-950 border border-dark-700 rounded px-2 py-0.5 text-right font-mono"
                          />
                        </div>

                        {/* Format */}
                        <div className="flex items-center justify-between gap-2 border-b border-dark-800 pb-1">
                          <label className="text-gray-400 font-medium">Format</label>
                          <input
                            type="text"
                            value={selected.properties.format || ''}
                            onChange={(e) =>
                              handleUpdateField(activeTable.name, selected.id, {
                                properties: { format: e.target.value },
                              })
                            }
                            placeholder="Currency, Short Date, etc."
                            className="w-48 bg-dark-950 border border-dark-700 rounded px-2 py-0.5 text-right font-mono"
                          />
                        </div>

                        {/* Default Value */}
                        <div className="flex items-center justify-between gap-2 border-b border-dark-800 pb-1">
                          <label className="text-gray-400 font-medium">Default Value</label>
                          <input
                            type="text"
                            value={selected.properties.defaultValue || ''}
                            onChange={(e) =>
                              handleUpdateField(activeTable.name, selected.id, {
                                properties: { defaultValue: e.target.value },
                              })
                            }
                            placeholder='e.g. "Douala" or 0'
                            className="w-48 bg-dark-950 border border-dark-700 rounded px-2 py-0.5 text-right font-mono"
                          />
                        </div>

                        {/* Validation Rule */}
                        <div className="flex items-center justify-between gap-2 border-b border-dark-800 pb-1">
                          <div className="flex flex-col">
                            <label className="text-gray-400 font-medium">Validation Rule</label>
                            <span className="text-[10px] text-gray-500">e.g. &gt;= 0 AND &lt;= 100</span>
                          </div>
                          <input
                            type="text"
                            value={selected.properties.validationRule || ''}
                            onChange={(e) =>
                              handleUpdateField(activeTable.name, selected.id, {
                                properties: { validationRule: e.target.value },
                              })
                            }
                            placeholder=">= 0, IN ('M', 'F')"
                            className="w-48 bg-dark-950 border border-dark-700 rounded px-2 py-0.5 text-right font-mono text-amber-300"
                          />
                        </div>

                        {/* Validation Text */}
                        <div className="flex items-center justify-between gap-2 border-b border-dark-800 pb-1">
                          <label className="text-gray-400 font-medium">Validation Text</label>
                          <input
                            type="text"
                            value={selected.properties.validationText || ''}
                            onChange={(e) =>
                              handleUpdateField(activeTable.name, selected.id, {
                                properties: { validationText: e.target.value },
                              })
                            }
                            placeholder="Error message when rule violated"
                            className="w-48 bg-dark-950 border border-dark-700 rounded px-2 py-0.5 text-right"
                          />
                        </div>

                        {/* Required */}
                        <div className="flex items-center justify-between gap-2 border-b border-dark-800 pb-1">
                          <label className="text-gray-400 font-medium">Required</label>
                          <select
                            value={selected.properties.required ? 'Yes' : 'No'}
                            onChange={(e) =>
                              handleUpdateField(activeTable.name, selected.id, {
                                properties: { required: e.target.value === 'Yes' },
                              })
                            }
                            className="w-24 bg-dark-950 border border-dark-700 rounded px-2 py-0.5 text-right"
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* VIEW 2: TABLE DATASHEET VIEW (RECORD ENTRY)                      */}
            {/* ---------------------------------------------------------------- */}
            {activeTab.type === 'table_datasheet' && activeTable && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-dark-900 sticky top-0 z-10 text-gray-300 uppercase text-[10px] tracking-wider border-b border-dark-700 shadow-sm">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center bg-dark-950 border-r border-dark-800">
                          #
                        </th>
                        {activeTable.fields.map((f) => (
                          <th
                            key={f.id}
                            className="py-2.5 px-3 border-r border-dark-800 font-bold whitespace-nowrap"
                          >
                            <div className="flex items-center gap-1.5">
                              {f.isPrimaryKey && (
                                <Key className="w-3 h-3 text-amber-400 fill-current shrink-0" />
                              )}
                              <span>{f.name}</span>
                            </div>
                          </th>
                        ))}
                        <th className="py-2.5 px-3 w-10 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-800/80 font-mono">
                      {activeTable.records.map((rec, rIdx) => (
                        <tr key={rIdx} className="hover:bg-dark-900/40 transition group">
                          {/* Row Number */}
                          <td className="py-1.5 px-2 text-center text-gray-500 bg-dark-950/70 border-r border-dark-800 select-none">
                            {rIdx + 1}
                          </td>

                          {/* Editable Cells */}
                          {activeTable.fields.map((f) => {
                            const val = rec[f.name];
                            const isReadOnly = f.type === 'AutoNumber';
                            return (
                              <td key={f.id} className="p-0 border-r border-dark-800/60">
                                <input
                                  type={f.type === 'Number' || f.type === 'Currency' ? 'number' : 'text'}
                                  disabled={isReadOnly}
                                  value={val === null || val === undefined ? '' : val}
                                  onChange={(e) =>
                                    handleCellChange(activeTable.name, rIdx, f.name, e.target.value)
                                  }
                                  className={`w-full h-full px-3 py-1.5 bg-transparent outline-none focus:bg-rose-950/30 focus:border-rose-500 text-xs ${
                                    isReadOnly ? 'text-gray-500 cursor-not-allowed' : 'text-gray-200'
                                  }`}
                                />
                              </td>
                            );
                          })}

                          {/* Delete Row */}
                          <td className="py-1 px-2 text-center">
                            <button
                              onClick={() => handleDeleteRecord(activeTable.name, rIdx)}
                              className="text-gray-600 hover:text-red-400 p-1 transition opacity-0 group-hover:opacity-100"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {/* New Record Hint Row */}
                      <tr className="bg-dark-950/40 border-t-2 border-dark-700 text-gray-500">
                        <td className="py-2 px-2 text-center font-bold text-rose-400">*</td>
                        <td
                          colSpan={activeTable.fields.length + 1}
                          onClick={() => handleAddNewRecord(activeTable.name)}
                          className="py-2 px-3 text-gray-500 hover:text-rose-300 cursor-pointer font-sans"
                        >
                          + Click to add new record to {activeTable.name}...
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Bottom Status bar */}
                <div className="bg-dark-900 border-t border-dark-800 px-4 py-1.5 flex items-center justify-between text-[11px] text-gray-400">
                  <span>
                    Total Records: <strong className="text-white">{activeTable.records.length}</strong>
                  </span>
                  <span>
                    Validation &amp; Referential Integrity: <strong className="text-emerald-400">Enforced</strong>
                  </span>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* VIEW 3: QUERY EDITOR (SQL VIEW & DATASHEET RESULTS)              */}
            {/* ---------------------------------------------------------------- */}
            {activeTab.type === 'query' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* View Mode Toggle Bar */}
                <div className="bg-dark-900/80 border-b border-dark-800 px-3 py-1.5 flex items-center justify-between text-xs shrink-0">
                  <div className="flex items-center gap-1.5 bg-dark-950 p-0.5 rounded border border-dark-800">
                    <button
                      onClick={() => setQueryViewMode('sql')}
                      className={`px-3 py-1 rounded font-semibold transition ${
                        queryViewMode === 'sql'
                          ? 'bg-amber-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      SQL View
                    </button>
                    <button
                      onClick={() => {
                        if (!queryResult) handleRunQuery();
                        setQueryViewMode('results');
                      }}
                      className={`px-3 py-1 rounded font-semibold transition ${
                        queryViewMode === 'results'
                          ? 'bg-amber-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Datasheet View (Results)
                    </button>
                  </div>

                  {queryResult && (
                    <span className="text-[11px] text-emerald-400 font-mono">
                      {queryResult.rowCount} row(s) returned ({queryResult.executionTimeMs}ms)
                    </span>
                  )}
                </div>

                {/* SQL Editor Mode */}
                {queryViewMode === 'sql' && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Mobile Quick SQL Keyword Bar */}
                    <div className="bg-dark-900 px-3 py-1.5 border-b border-dark-800 flex items-center gap-1.5 overflow-x-auto shrink-0 select-none">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0">
                        Quick Keys:
                      </span>
                      {MOBILE_SQL_TOKENS.map((token) => (
                        <button
                          key={token}
                          type="button"
                          onClick={() => setCurrentQuerySql((prev) => `${prev} ${token} `)}
                          className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-dark-800 hover:bg-dark-700 text-amber-300 border border-dark-700 shrink-0"
                        >
                          {token}
                        </button>
                      ))}
                    </div>

                    {/* SQL Textarea */}
                    <div className="flex-1 p-3 flex flex-col">
                      <textarea
                        value={currentQuerySql}
                        onChange={(e) => setCurrentQuerySql(e.target.value)}
                        placeholder="SELECT * FROM tbl_Student WHERE Gender = 'F';"
                        className="flex-1 w-full p-4 bg-dark-900 border border-dark-700 rounded-xl font-mono text-sm text-amber-200 outline-none focus:border-amber-500 leading-relaxed resize-none shadow-inner"
                        spellCheck={false}
                      />
                    </div>

                    {/* Error Banner */}
                    {queryError && (
                      <div className="m-3 p-3 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{queryError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Results Mode */}
                {queryViewMode === 'results' && (
                  <div className="flex-1 overflow-auto">
                    {queryResult ? (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-dark-900 sticky top-0 z-10 text-gray-300 uppercase text-[10px] tracking-wider border-b border-dark-700">
                          <tr>
                            <th className="py-2.5 px-3 w-10 text-center bg-dark-950 border-r border-dark-800">
                              #
                            </th>
                            {queryResult.columns.map((c, i) => (
                              <th
                                key={i}
                                className="py-2.5 px-3 border-r border-dark-800 font-bold whitespace-nowrap"
                              >
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-800 font-mono">
                          {queryResult.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-dark-900/40">
                              <td className="py-1.5 px-2 text-center text-gray-500 bg-dark-950/70 border-r border-dark-800 select-none">
                                {rIdx + 1}
                              </td>
                              {row.map((val, cIdx) => (
                                <td key={cIdx} className="py-1.5 px-3 border-r border-dark-800/60">
                                  {val === null || val === undefined ? (
                                    <span className="text-gray-600 italic">NULL</span>
                                  ) : (
                                    String(val)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex-1 h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                        <Code2 className="w-8 h-8 text-gray-600 mb-2" />
                        <p>No results yet. Click &quot;Run Query&quot; to execute SQL.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* VIEW 4: RELATIONSHIPS CANVAS                                      */}
            {/* ---------------------------------------------------------------- */}
            {activeTab.type === 'relationships' && (
              <div className="flex-1 flex flex-col bg-dark-950 overflow-auto p-6 relative">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Share2 className="w-4 h-4 text-sky-400" /> Relationships Diagram
                    </h2>
                    <p className="text-xs text-gray-400">
                      Primary Key &harr; Foreign Key linkages with Referential Integrity enforcement.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setNewRel({
                        fromTable: Object.keys(db.tables)[0] || '',
                        fromField: '',
                        toTable: Object.keys(db.tables)[1] || '',
                        toField: '',
                        type: '1-to-Many',
                        enforceReferentialIntegrity: true,
                      });
                      setIsRelModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Relationship
                  </button>
                </div>

                {/* Table Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {Object.values(db.tables).map((t) => (
                    <div
                      key={t.id}
                      className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden shadow-xl"
                    >
                      <div className="bg-dark-800 px-3 py-2 border-b border-dark-700 flex items-center justify-between">
                        <span className="font-bold text-xs text-rose-300 flex items-center gap-1.5">
                          <Table className="w-3.5 h-3.5 text-rose-400" /> {t.name}
                        </span>
                        <span className="text-[10px] text-gray-500">{t.records.length} records</span>
                      </div>
                      <div className="p-2 space-y-1 text-xs font-mono">
                        {t.fields.map((f) => (
                          <div
                            key={f.id}
                            className="flex items-center justify-between px-2 py-1 rounded bg-dark-950/60"
                          >
                            <span className="flex items-center gap-1.5">
                              {f.isPrimaryKey && (
                                <Key className="w-3 h-3 text-amber-400 fill-current shrink-0" />
                              )}
                              <span className={f.isPrimaryKey ? 'font-bold text-amber-200' : 'text-gray-300'}>
                                {f.name}
                              </span>
                            </span>
                            <span className="text-[10px] text-gray-500 font-sans">{f.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Established Relationships List */}
                <div className="bg-dark-900 border border-dark-800 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
                    Active Relationships ({db.relationships.length})
                  </h3>
                  {db.relationships.length === 0 ? (
                    <p className="text-xs text-gray-500">No relationships created yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {db.relationships.map((rel) => (
                        <div
                          key={rel.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-dark-950 border border-dark-800 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-rose-300 font-bold">
                              {rel.fromTable}.{rel.fromField}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-400 font-mono text-[10px] border border-sky-800/40">
                              1 &rarr; &infin; ({rel.type})
                            </span>
                            <span className="font-mono text-amber-300 font-bold">
                              {rel.toTable}.{rel.toField}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {rel.enforceReferentialIntegrity && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-semibold border border-emerald-800/40">
                                Referential Integrity
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteRelationship(rel.id)}
                              className="text-gray-500 hover:text-red-400 p-1 transition"
                              title="Delete Relationship"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* VIEW 5: FORM VIEW                                                */}
            {/* ---------------------------------------------------------------- */}
            {activeTab.type === 'form' && (
              <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
                {(() => {
                  const form = db.forms[activeTab.formId];
                  const table = form ? db.tables[form.tableName] : null;
                  if (!table) return <p className="text-gray-500 text-xs">Form table not found.</p>;

                  const record = table.records[formRecordIndex] || {};

                  return (
                    <div className="max-w-md w-full bg-dark-900 border border-dark-700 rounded-2xl p-6 shadow-2xl">
                      <div className="flex items-center justify-between pb-3 border-b border-dark-800 mb-4">
                        <div>
                          <h2 className="text-base font-bold text-white">{form.title}</h2>
                          <p className="text-[11px] text-teal-400 font-mono">Source: {table.name}</p>
                        </div>
                        <FileText className="w-5 h-5 text-teal-400" />
                      </div>

                      <div className="space-y-3 mb-6">
                        {table.fields.map((f) => (
                          <div key={f.id} className="space-y-1">
                            <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                              <span>{f.name}</span>
                              <span className="text-[10px] text-gray-500">{f.type}</span>
                            </label>
                            <input
                              type={f.type === 'Number' || f.type === 'Currency' ? 'number' : 'text'}
                              disabled={f.type === 'AutoNumber'}
                              value={record[f.name] !== undefined ? record[f.name] : ''}
                              onChange={(e) =>
                                handleCellChange(table.name, formRecordIndex, f.name, e.target.value)
                              }
                              className="w-full px-3 py-1.5 bg-dark-950 border border-dark-700 rounded-lg text-xs text-white outline-none focus:border-teal-500"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Navigation Controls */}
                      <div className="flex items-center justify-between pt-3 border-t border-dark-800 text-xs">
                        <div className="flex items-center gap-1">
                          <button
                            disabled={formRecordIndex <= 0}
                            onClick={() => setFormRecordIndex(0)}
                            className="p-1 rounded bg-dark-800 hover:bg-dark-700 disabled:opacity-30"
                          >
                            &laquo;
                          </button>
                          <button
                            disabled={formRecordIndex <= 0}
                            onClick={() => setFormRecordIndex((prev) => Math.max(0, prev - 1))}
                            className="p-1 rounded bg-dark-800 hover:bg-dark-700 disabled:opacity-30"
                          >
                            &lsaquo;
                          </button>
                          <span className="px-2 text-gray-400">
                            Record {table.records.length > 0 ? formRecordIndex + 1 : 0} of{' '}
                            {table.records.length}
                          </span>
                          <button
                            disabled={formRecordIndex >= table.records.length - 1}
                            onClick={() =>
                              setFormRecordIndex((prev) =>
                                Math.min(table.records.length - 1, prev + 1)
                              )
                            }
                            className="p-1 rounded bg-dark-800 hover:bg-dark-700 disabled:opacity-30"
                          >
                            &rsaquo;
                          </button>
                          <button
                            disabled={formRecordIndex >= table.records.length - 1}
                            onClick={() => setFormRecordIndex(table.records.length - 1)}
                            className="p-1 rounded bg-dark-800 hover:bg-dark-700 disabled:opacity-30"
                          >
                            &raquo;
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            handleAddNewRecord(table.name);
                            setFormRecordIndex(table.records.length);
                          }}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded font-bold text-xs"
                        >
                          + New
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* VIEW 6: REPORT VIEW                                              */}
            {/* ---------------------------------------------------------------- */}
            {activeTab.type === 'report' && (
              <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-dark-950 items-center">
                {(() => {
                  const report = db.reports[activeTab.reportId];
                  if (!report) return null;

                  const table = db.tables[report.sourceName];
                  if (!table) return null;

                  return (
                    <div className="max-w-3xl w-full bg-white text-gray-900 rounded-xl p-8 shadow-2xl print:p-0">
                      {/* Report Header */}
                      <div className="border-b-2 border-emerald-700 pb-4 mb-6 flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-black text-emerald-900 tracking-wide">
                            {report.title}
                          </h2>
                          <p className="text-xs text-gray-600">
                            Generated by Nebcode Microsoft Access Lab &bull; {new Date().toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => window.print()}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 print:hidden shadow"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print / PDF
                        </button>
                      </div>

                      {/* Report Table */}
                      <table className="w-full text-left text-xs border-collapse mb-6">
                        <thead>
                          <tr className="bg-emerald-100/80 text-emerald-950 font-bold border-b border-emerald-300">
                            <th className="py-2 px-3">#</th>
                            {table.fields.map((f) => (
                              <th key={f.id} className="py-2 px-3">
                                {f.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {table.records.map((r, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="py-2 px-3 text-gray-500 font-mono">{i + 1}</td>
                              {table.fields.map((f) => (
                                <td key={f.id} className="py-2 px-3">
                                  {r[f.name]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Summary Footer */}
                      <div className="border-t border-gray-300 pt-3 flex items-center justify-between text-xs text-gray-600">
                        <span>Total Records Count: {table.records.length}</span>
                        <span>Examiner Verification Signature: _______________________</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </main>
        </div>

        {/* ==================================================================== */}
        {/* ADD / EDIT RELATIONSHIP MODAL                                        */}
        {/* ==================================================================== */}
        {isRelModalOpen && (
          <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="bg-dark-900 border border-dark-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-dark-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-sky-400" /> Edit Relationship
                </h3>
                <button
                  onClick={() => setIsRelModalOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                {/* Table 1 (Primary Key table) */}
                <div className="space-y-2">
                  <label className="font-bold text-rose-300">Table/Query (Primary Key)</label>
                  <select
                    value={newRel.fromTable}
                    onChange={(e) =>
                      setNewRel((prev) => ({
                        ...prev,
                        fromTable: e.target.value,
                        fromField: db.tables[e.target.value]?.fields[0]?.name || '',
                      }))
                    }
                    className="w-full bg-dark-950 border border-dark-700 rounded-lg p-2 text-white outline-none"
                  >
                    <option value="">Select Table...</option>
                    {Object.values(db.tables).map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  <label className="text-gray-400">Primary Key Field</label>
                  <select
                    value={newRel.fromField}
                    onChange={(e) => setNewRel((prev) => ({ ...prev, fromField: e.target.value }))}
                    className="w-full bg-dark-950 border border-dark-700 rounded-lg p-2 text-white outline-none"
                  >
                    <option value="">Select Field...</option>
                    {newRel.fromTable &&
                      db.tables[newRel.fromTable]?.fields.map((f) => (
                        <option key={f.id} value={f.name}>
                          {f.name} {f.isPrimaryKey ? '(PK)' : ''}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Table 2 (Foreign Key table) */}
                <div className="space-y-2">
                  <label className="font-bold text-amber-300">Related Table (Foreign Key)</label>
                  <select
                    value={newRel.toTable}
                    onChange={(e) =>
                      setNewRel((prev) => ({
                        ...prev,
                        toTable: e.target.value,
                        toField: db.tables[e.target.value]?.fields[0]?.name || '',
                      }))
                    }
                    className="w-full bg-dark-950 border border-dark-700 rounded-lg p-2 text-white outline-none"
                  >
                    <option value="">Select Table...</option>
                    {Object.values(db.tables).map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  <label className="text-gray-400">Foreign Key Field</label>
                  <select
                    value={newRel.toField}
                    onChange={(e) => setNewRel((prev) => ({ ...prev, toField: e.target.value }))}
                    className="w-full bg-dark-950 border border-dark-700 rounded-lg p-2 text-white outline-none"
                  >
                    <option value="">Select Field...</option>
                    {newRel.toTable &&
                      db.tables[newRel.toTable]?.fields.map((f) => (
                        <option key={f.id} value={f.name}>
                          {f.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Referential Integrity Checkbox */}
              <div className="p-3 bg-dark-950 rounded-xl border border-dark-800 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="enforceRI"
                  checked={newRel.enforceReferentialIntegrity}
                  onChange={(e) =>
                    setNewRel((prev) => ({
                      ...prev,
                      enforceReferentialIntegrity: e.target.checked,
                    }))
                  }
                  className="mt-0.5 rounded accent-rose-600"
                />
                <label htmlFor="enforceRI" className="text-xs text-gray-300 cursor-pointer">
                  <strong className="text-white block">Enforce Referential Integrity</strong>
                  Prevents orphan foreign keys and blocks deleting parent records that have child records in {newRel.toTable || 'related table'}.
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsRelModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRelationship}
                  className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* GCE ACCESS CHEATSHEET MODAL                                          */}
        {/* ==================================================================== */}
        {showCheatSheet && (
          <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="bg-dark-900 border border-dark-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-dark-800 shrink-0">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-rose-400" />
                  Cameroon GCE Microsoft Access Practical Guide
                </h3>
                <button
                  onClick={() => setShowCheatSheet(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 text-xs text-gray-300 leading-relaxed pr-2">
                <div className="bg-dark-950 p-4 rounded-xl border border-dark-800 space-y-2">
                  <h4 className="font-bold text-rose-300 text-sm">1. Common GCE Access Data Types</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-400">
                    <li><strong className="text-white">Short Text:</strong> Names, codes, genders (up to 255 chars).</li>
                    <li><strong className="text-white">Number:</strong> Exam scores, ages, quantities (integer/decimal).</li>
                    <li><strong className="text-white">Currency:</strong> Tuition fees, salaries, product prices.</li>
                    <li><strong className="text-white">Date/Time:</strong> Date of birth, enrollment dates.</li>
                    <li><strong className="text-white">AutoNumber:</strong> Unique primary key that automatically increments.</li>
                  </ul>
                </div>

                <div className="bg-dark-950 p-4 rounded-xl border border-dark-800 space-y-2">
                  <h4 className="font-bold text-amber-300 text-sm">2. Popular Validation Rules</h4>
                  <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-amber-200">
                    <li><code className="text-white">IN ('M', 'F')</code> &rarr; Restricts gender to Male or Female</li>
                    <li><code className="text-white">&gt;= 0 AND &lt;= 100</code> &rarr; Validates exam scores between 0 and 100</li>
                    <li><code className="text-white">BETWEEN 10 AND 50</code> &rarr; Restricts values to range</li>
                    <li><code className="text-white">LIKE &quot;CM-*&quot;</code> &rarr; Requires code starting with &apos;CM-&apos;</li>
                    <li><code className="text-white">&gt;= 0</code> &rarr; Ensures prices or fees cannot be negative</li>
                  </ul>
                </div>

                <div className="bg-dark-950 p-4 rounded-xl border border-dark-800 space-y-2">
                  <h4 className="font-bold text-sky-300 text-sm">3. Essential GCE Access SQL Syntax</h4>
                  <p className="text-gray-400">Basic selection:</p>
                  <pre className="bg-dark-900 p-2 rounded text-sky-300 font-mono text-[11px]">
                    SELECT FirstName, LastName, City FROM tbl_Student WHERE City = &apos;Bamenda&apos;;
                  </pre>
                  <p className="text-gray-400">Inner Join (Connecting related tables):</p>
                  <pre className="bg-dark-900 p-2 rounded text-sky-300 font-mono text-[11px]">
                    SELECT tbl_Student.FirstName, tbl_Enrollment.ExamScore<br />
                    FROM tbl_Student INNER JOIN tbl_Enrollment<br />
                    ON tbl_Student.StudentID = tbl_Enrollment.StudentID<br />
                    WHERE tbl_Enrollment.ExamScore &gt;= 50;
                  </pre>
                </div>
              </div>

              <div className="pt-2 border-t border-dark-800 flex justify-end shrink-0">
                <button
                  onClick={() => setShowCheatSheet(false)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LabAccessGate>
  );
}
