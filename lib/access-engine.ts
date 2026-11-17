// ============================================================================
// Nebcode Microsoft Access Relational Database Engine
// Supports Access Table Design View (Field Types, Primary Keys, Field Properties,
// Validation Rules, Required, Default Values), Datasheet View, Referential Integrity
// Relationships (1-to-Many), Access SQL Engine (SELECT, JOIN, WHERE, GROUP BY, LIKE),
// QBE Grid, and GCE A/O-Level Computer Science practical templates.
// ============================================================================

export type AccessDataType =
  | 'Short Text'
  | 'Long Text'
  | 'Number'
  | 'Date/Time'
  | 'Currency'
  | 'AutoNumber'
  | 'Yes/No';

export interface FieldProperties {
  fieldSize?: number | string; // e.g. 50 or "Long Integer"
  format?: string; // e.g. "Currency", "Short Date", "Percent"
  defaultValue?: string; // e.g. "Douala" or 0
  validationRule?: string; // e.g. ">= 0 AND <= 100" or "IN ('M', 'F')"
  validationText?: string; // Error prompt if rule fails
  required?: boolean; // Cannot be NULL / empty
  indexed?: 'No' | 'Yes (Duplicates OK)' | 'Yes (No Duplicates)';
}

export interface FieldDefinition {
  id: string;
  name: string;
  type: AccessDataType;
  description?: string;
  isPrimaryKey?: boolean;
  properties: FieldProperties;
}

export interface TableDefinition {
  id: string;
  name: string;
  fields: FieldDefinition[];
  records: Record<string, any>[];
  autoNumberCounter: number;
}

export interface Relationship {
  id: string;
  fromTable: string; // Primary key table (e.g. tbl_Student)
  fromField: string; // Primary key field (e.g. StudentID)
  toTable: string; // Foreign key table (e.g. tbl_Enrollment)
  toField: string; // Foreign key field (e.g. StudentID)
  type: '1-to-Many' | '1-to-1';
  enforceReferentialIntegrity: boolean;
  cascadeUpdate?: boolean;
  cascadeDelete?: boolean;
}

export interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  description?: string;
}

export interface SavedForm {
  id: string;
  name: string;
  tableName: string;
  title: string;
}

export interface SavedReport {
  id: string;
  name: string;
  sourceType: 'table' | 'query';
  sourceName: string;
  title: string;
  groupByField?: string;
}

export interface AccessDatabase {
  id: string;
  name: string;
  tables: Record<string, TableDefinition>;
  relationships: Relationship[];
  queries: Record<string, SavedQuery>;
  forms: Record<string, SavedForm>;
  reports: Record<string, SavedReport>;
  updatedAt: string;
}

// ============================================================================
// 1. Validation Rule Evaluator (Access Expression Engine)
// ============================================================================

export function evaluateValidationRule(
  rule: string | undefined,
  value: any,
  fieldName?: string
): { isValid: boolean; message?: string } {
  if (!rule || !rule.trim()) return { isValid: true };
  if (value === null || value === undefined || value === '') {
    return { isValid: true }; // NULL check handled by "required"
  }

  const cleanRule = rule.trim();

  try {
    // 1. IN ('A', 'B', 'C') or IN ("M", "F")
    const inMatch = cleanRule.match(/^IN\s*\((.*)\)$/i);
    if (inMatch) {
      const allowed = inMatch[1]
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, '').toLowerCase());
      const valStr = String(value).trim().toLowerCase();
      if (!allowed.includes(valStr)) {
        return { isValid: false, message: `Value must be one of: ${inMatch[1]}` };
      }
      return { isValid: true };
    }

    // 2. BETWEEN X AND Y
    const betweenMatch = cleanRule.match(/^BETWEEN\s+(.+)\s+AND\s+(.+)$/i);
    if (betweenMatch) {
      const low = Number(betweenMatch[1].trim());
      const high = Number(betweenMatch[2].trim());
      const numVal = Number(value);
      if (isNaN(numVal) || numVal < low || numVal > high) {
        return { isValid: false, message: `Value must be between ${low} and ${high}` };
      }
      return { isValid: true };
    }

    // 3. LIKE "*pattern*" or LIKE "CM-*"
    const likeMatch = cleanRule.match(/^LIKE\s+['"](.+)['"]$/i);
    if (likeMatch) {
      const rawPattern = likeMatch[1];
      const regexStr = '^' + rawPattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$';
      const regex = new RegExp(regexStr, 'i');
      if (!regex.test(String(value))) {
        return { isValid: false, message: `Value must match pattern: ${rawPattern}` };
      }
      return { isValid: true };
    }

    // 4. Comparison with compound AND/OR, e.g. ">= 0 AND <= 100" or "> 0"
    // Tokenize by AND / OR
    const andParts = cleanRule.split(/\s+AND\s+/i);
    for (const part of andParts) {
      const sub = part.trim();
      const compMatch = sub.match(/^([><=!]+)\s*(.+)$/);
      if (compMatch) {
        const op = compMatch[1];
        const target = compMatch[2].trim().replace(/^['"]|['"]$/g, '');
        const targetNum = Number(target);
        const valNum = Number(value);

        if (!isNaN(targetNum) && !isNaN(valNum)) {
          if (op === '>' && !(valNum > targetNum)) return { isValid: false, message: `Value must be > ${targetNum}` };
          if (op === '>=' && !(valNum >= targetNum)) return { isValid: false, message: `Value must be >= ${targetNum}` };
          if (op === '<' && !(valNum < targetNum)) return { isValid: false, message: `Value must be < ${targetNum}` };
          if (op === '<=' && !(valNum <= targetNum)) return { isValid: false, message: `Value must be <= ${targetNum}` };
          if ((op === '=' || op === '==') && !(valNum === targetNum)) return { isValid: false, message: `Value must equal ${targetNum}` };
          if ((op === '<>' || op === '!=') && !(valNum !== targetNum)) return { isValid: false, message: `Value cannot equal ${targetNum}` };
        } else {
          // String comparison
          const sVal = String(value);
          if (op === '=' && sVal !== target) return { isValid: false, message: `Value must equal "${target}"` };
          if (op === '<>' && sVal === target) return { isValid: false, message: `Value cannot equal "${target}"` };
        }
      }
    }

    return { isValid: true };
  } catch {
    return { isValid: true };
  }
}

// Validate a whole record against table definitions and primary key uniqueness
export function validateRecord(
  table: TableDefinition,
  record: Record<string, any>,
  existingIndex?: number
): { isValid: boolean; error?: string } {
  for (const field of table.fields) {
    const val = record[field.name];

    // 1. Required Check
    if (field.properties.required && (val === null || val === undefined || val === '')) {
      return { isValid: false, error: `Field '${field.name}' is required and cannot be empty.` };
    }

    // 2. Data Type Coercion / Format Validation
    if (val !== null && val !== undefined && val !== '') {
      if (field.type === 'Number' || field.type === 'Currency') {
        const num = Number(val);
        if (isNaN(num)) {
          return { isValid: false, error: `Field '${field.name}' must be a valid number.` };
        }
      }
    }

    // 3. Validation Rule Check
    if (field.properties.validationRule) {
      const res = evaluateValidationRule(field.properties.validationRule, val, field.name);
      if (!res.isValid) {
        return {
          isValid: false,
          error:
            field.properties.validationText ||
            res.message ||
            `Validation rule '${field.properties.validationRule}' violated on '${field.name}'.`,
        };
      }
    }

    // 4. Primary Key Unique Check
    if (field.isPrimaryKey && val !== null && val !== undefined && val !== '') {
      const duplicate = table.records.some((r, idx) => {
        if (existingIndex !== undefined && idx === existingIndex) return false;
        return String(r[field.name]).trim().toLowerCase() === String(val).trim().toLowerCase();
      });
      if (duplicate) {
        return {
          isValid: false,
          error: `Primary key violation: Duplicate value '${val}' already exists for '${field.name}'.`,
        };
      }
    }
  }

  return { isValid: true };
}

// Enforce Referential Integrity Check on insert/update/delete
export function validateReferentialIntegrity(
  db: AccessDatabase,
  action: 'insert' | 'update' | 'delete',
  tableName: string,
  record: Record<string, any>
): { isValid: boolean; error?: string } {
  for (const rel of db.relationships) {
    if (!rel.enforceReferentialIntegrity) continue;

    // A) If inserting/updating a child record (rel.toTable):
    // The foreign key value must exist in the parent table (rel.fromTable)
    if (rel.toTable.toLowerCase() === tableName.toLowerCase() && (action === 'insert' || action === 'update')) {
      const fkValue = record[rel.toField];
      if (fkValue !== null && fkValue !== undefined && fkValue !== '') {
        const parentTable = Object.values(db.tables).find(
          (t) => t.name.toLowerCase() === rel.fromTable.toLowerCase()
        );
        if (parentTable) {
          const exists = parentTable.records.some(
            (r) => String(r[rel.fromField]).trim() === String(fkValue).trim()
          );
          if (!exists) {
            return {
              isValid: false,
              error: `Referential Integrity Error: You cannot add or change a record because a related record is required in table '${rel.fromTable}' (${rel.fromField} = '${fkValue}').`,
            };
          }
        }
      }
    }

    // B) If deleting a parent record (rel.fromTable):
    // No child records must reference this parent (unless cascade delete)
    if (rel.fromTable.toLowerCase() === tableName.toLowerCase() && action === 'delete') {
      const pkValue = record[rel.fromField];
      const childTable = Object.values(db.tables).find(
        (t) => t.name.toLowerCase() === rel.toTable.toLowerCase()
      );
      if (childTable && pkValue !== null && pkValue !== undefined) {
        const hasChildren = childTable.records.some(
          (r) => String(r[rel.toField]).trim() === String(pkValue).trim()
        );
        if (hasChildren) {
          return {
            isValid: false,
            error: `Referential Integrity Error: You cannot delete this record because table '${rel.toTable}' includes related records. Delete related records first or enable Cascade Delete.`,
          };
        }
      }
    }
  }

  return { isValid: true };
}

// ============================================================================
// 2. Access SQL Engine (SELECT, JOIN, WHERE, GROUP BY, ORDER BY, INSERT, UPDATE, DELETE)
// ============================================================================

export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  message?: string;
  executionTimeMs: number;
}

export function executeAccessSQL(db: AccessDatabase, sqlQuery: string): QueryResult {
  const start = performance.now();
  const rawSql = sqlQuery.trim().replace(/;+$/, '');
  if (!rawSql) {
    throw new Error('Please enter an SQL query to execute.');
  }

  const upper = rawSql.toUpperCase();

  // 1. SELECT Query Execution
  if (upper.startsWith('SELECT')) {
    return runSelectQuery(db, rawSql, start);
  }

  // 2. INSERT INTO Execution
  if (upper.startsWith('INSERT INTO')) {
    return runInsertQuery(db, rawSql, start);
  }

  // 3. UPDATE Execution
  if (upper.startsWith('UPDATE')) {
    return runUpdateQuery(db, rawSql, start);
  }

  // 4. DELETE Execution
  if (upper.startsWith('DELETE')) {
    return runDeleteQuery(db, rawSql, start);
  }

  throw new Error(`Unsupported SQL command. Access Lab supports SELECT, INSERT INTO, UPDATE, and DELETE.`);
}

function runSelectQuery(db: AccessDatabase, sql: string, start: number): QueryResult {
  // Parsing regex: SELECT [DISTINCT] <columns> FROM <fromClause> [WHERE <whereClause>] [GROUP BY <groupClause>] [ORDER BY <orderClause>]
  const selectRegex = /^SELECT\s+(DISTINCT\s+)?(.+?)\s+FROM\s+(.+?)(?:\s+WHERE\s+(.+?))?(?:\s+GROUP\s+BY\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?$/i;
  const match = sql.match(selectRegex);

  if (!match) {
    throw new Error('Syntax error in SELECT query. Format: SELECT <columns> FROM <table> [INNER JOIN ...] [WHERE ...] [ORDER BY ...]');
  }

  const isDistinct = Boolean(match[1]);
  const columnsClause = match[2].trim();
  const fromClause = match[3].trim();
  const whereClause = match[4]?.trim();
  const groupByClause = match[5]?.trim();
  const orderByClause = match[6]?.trim();

  // 1. Resolve FROM and JOINs
  let workingRows: Record<string, any>[] = [];

  // Check for INNER JOIN
  // e.g. tbl_Student INNER JOIN tbl_Enrollment ON tbl_Student.StudentID = tbl_Enrollment.StudentID
  const joinRegex = /^([^\s]+)(?:\s+(?:AS\s+)?([^\s]+))?\s+(?:INNER\s+)?JOIN\s+([^\s]+)(?:\s+(?:AS\s+)?([^\s]+))?\s+ON\s+([^\s]+)\s*=\s*([^\s]+)/i;
  const joinMatch = fromClause.match(joinRegex);

  if (joinMatch) {
    const table1Name = joinMatch[1].replace(/[\[\]]/g, '');
    const table2Name = joinMatch[3].replace(/[\[\]]/g, '');
    const onLeft = joinMatch[5].replace(/[\[\]]/g, '');
    const onRight = joinMatch[6].replace(/[\[\]]/g, '');

    const t1 = findTable(db, table1Name);
    const t2 = findTable(db, table2Name);

    if (!t1) throw new Error(`Table '${table1Name}' does not exist.`);
    if (!t2) throw new Error(`Table '${table2Name}' does not exist.`);

    const [t1KeyTable, t1KeyField] = onLeft.includes('.') ? onLeft.split('.') : [table1Name, onLeft];
    const [t2KeyTable, t2KeyField] = onRight.includes('.') ? onRight.split('.') : [table2Name, onRight];

    for (const r1 of t1.records) {
      for (const r2 of t2.records) {
        const val1 = r1[t1KeyField] ?? r1[t2KeyField];
        const val2 = r2[t2KeyField] ?? r2[t1KeyField];

        if (val1 !== undefined && val2 !== undefined && String(val1) === String(val2)) {
          // Combined row with qualified and unqualified keys
          const combined: Record<string, any> = {};
          for (const [k, v] of Object.entries(r1)) {
            combined[`${t1.name}.${k}`] = v;
            combined[k] = v;
          }
          for (const [k, v] of Object.entries(r2)) {
            combined[`${t2.name}.${k}`] = v;
            if (combined[k] === undefined) combined[k] = v;
          }
          workingRows.push(combined);
        }
      }
    }
  } else {
    // Single table query
    const cleanTableName = fromClause.split(/\s+/)[0].replace(/[\[\]]/g, '');
    const table = findTable(db, cleanTableName);
    if (!table) throw new Error(`Table '${cleanTableName}' does not exist.`);

    workingRows = table.records.map((r) => {
      const row: Record<string, any> = {};
      for (const [k, v] of Object.entries(r)) {
        row[`${table.name}.${k}`] = v;
        row[k] = v;
      }
      return row;
    });
  }

  // 2. Apply WHERE Filter
  if (whereClause) {
    workingRows = workingRows.filter((row) => evaluateWhereClause(whereClause, row));
  }

  // 3. Column Selection and Projection
  let outputColumns: string[] = [];
  let outputRows: any[][] = [];

  if (columnsClause === '*') {
    // All unique field names from workingRows
    const sample = workingRows[0] || {};
    outputColumns = Object.keys(sample).filter((k) => !k.includes('.'));
    outputRows = workingRows.map((r) => outputColumns.map((col) => r[col]));
  } else {
    const rawCols = splitColumns(columnsClause);
    outputColumns = rawCols.map((c) => {
      // Handle alias: e.g. tbl_Student.FirstName AS StudentName or FirstName
      const aliasMatch = c.match(/(?:AS\s+)?([^\s]+)$/i);
      return aliasMatch ? aliasMatch[1].replace(/[\[\]]/g, '') : c.replace(/[\[\]]/g, '');
    });

    outputRows = workingRows.map((row) => {
      return rawCols.map((colExpr) => {
        const cleanExpr = colExpr.split(/\s+AS\s+/i)[0].trim().replace(/[\[\]]/g, '');
        // Check for aggregate functions: COUNT(*), SUM(FeePaid), etc.
        if (cleanExpr.toUpperCase() === 'COUNT(*)') {
          return workingRows.length;
        }
        return row[cleanExpr] !== undefined ? row[cleanExpr] : null;
      });
    });
  }

  // 4. DISTINCT
  if (isDistinct) {
    const seen = new Set<string>();
    outputRows = outputRows.filter((r) => {
      const key = JSON.stringify(r);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // 5. ORDER BY
  if (orderByClause) {
    const [orderColRaw, direction] = orderByClause.split(/\s+/);
    const orderCol = orderColRaw.replace(/[\[\]]/g, '');
    const colIdx = outputColumns.findIndex(
      (c) => c.toLowerCase() === orderCol.toLowerCase()
    );
    const isDesc = direction && direction.toUpperCase() === 'DESC';

    outputRows.sort((a, b) => {
      const valA = colIdx >= 0 ? a[colIdx] : '';
      const valB = colIdx >= 0 ? b[colIdx] : '';
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      const cmp = valA > valB ? 1 : -1;
      return isDesc ? -cmp : cmp;
    });
  }

  const executionTimeMs = Math.round((performance.now() - start) * 10) / 10;
  return {
    columns: outputColumns,
    rows: outputRows,
    rowCount: outputRows.length,
    executionTimeMs,
  };
}

function runInsertQuery(db: AccessDatabase, sql: string, start: number): QueryResult {
  const insertRegex = /^INSERT\s+INTO\s+([^\s\(]+)\s*(?:\(([^\)]+)\))?\s+VALUES\s*\(([^\)]+)\)/i;
  const match = sql.match(insertRegex);
  if (!match) throw new Error("Syntax error in INSERT query. Format: INSERT INTO <table> (col1, col2) VALUES ('val1', 'val2')");

  const tableName = match[1].replace(/[\[\]]/g, '');
  const cols = match[2] ? match[2].split(',').map((s) => s.trim().replace(/[\[\]]/g, '')) : [];
  const rawVals = match[3].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, ''));

  const table = findTable(db, tableName);
  if (!table) throw new Error(`Table '${tableName}' does not exist.`);

  const newRecord: Record<string, any> = {};
  if (cols.length > 0) {
    cols.forEach((col, idx) => {
      newRecord[col] = rawVals[idx] !== undefined ? rawVals[idx] : null;
    });
  } else {
    table.fields.forEach((f, idx) => {
      newRecord[f.name] = rawVals[idx] !== undefined ? rawVals[idx] : null;
    });
  }

  // Handle AutoNumber
  for (const f of table.fields) {
    if (f.type === 'AutoNumber' && !newRecord[f.name]) {
      table.autoNumberCounter += 1;
      newRecord[f.name] = table.autoNumberCounter;
    }
  }

  // Validation
  const valRes = validateRecord(table, newRecord);
  if (!valRes.isValid) throw new Error(valRes.error);

  const riRes = validateReferentialIntegrity(db, 'insert', tableName, newRecord);
  if (!riRes.isValid) throw new Error(riRes.error);

  table.records.push(newRecord);

  return {
    columns: ['Status', 'Rows Affected'],
    rows: [['1 row inserted successfully', 1]],
    rowCount: 1,
    message: `1 row inserted into '${tableName}'.`,
    executionTimeMs: Math.round((performance.now() - start) * 10) / 10,
  };
}

function runUpdateQuery(db: AccessDatabase, sql: string, start: number): QueryResult {
  const updateRegex = /^UPDATE\s+([^\s]+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i;
  const match = sql.match(updateRegex);
  if (!match) throw new Error('Syntax error in UPDATE query. Format: UPDATE <table> SET col1 = val1 WHERE <condition>');

  const tableName = match[1].replace(/[\[\]]/g, '');
  const setClause = match[2].trim();
  const whereClause = match[3]?.trim();

  const table = findTable(db, tableName);
  if (!table) throw new Error(`Table '${tableName}' does not exist.`);

  // Parse SET assignments: col1 = 'val1', col2 = 50
  const assignments: { col: string; val: any }[] = setClause.split(',').map((part) => {
    const [c, v] = part.split('=').map((s) => s.trim());
    return {
      col: c.replace(/[\[\]]/g, ''),
      val: v.replace(/^['"]|['"]$/g, ''),
    };
  });

  let rowsUpdated = 0;
  for (let i = 0; i < table.records.length; i++) {
    const row = table.records[i];
    if (!whereClause || evaluateWhereClause(whereClause, row)) {
      for (const assign of assignments) {
        row[assign.col] = assign.val;
      }
      rowsUpdated++;
    }
  }

  return {
    columns: ['Status', 'Rows Affected'],
    rows: [[`${rowsUpdated} row(s) updated successfully`, rowsUpdated]],
    rowCount: rowsUpdated,
    message: `${rowsUpdated} row(s) updated in '${tableName}'.`,
    executionTimeMs: Math.round((performance.now() - start) * 10) / 10,
  };
}

function runDeleteQuery(db: AccessDatabase, sql: string, start: number): QueryResult {
  const deleteRegex = /^DELETE\s+(?:\*\s+)?FROM\s+([^\s]+)(?:\s+WHERE\s+(.+))?$/i;
  const match = sql.match(deleteRegex);
  if (!match) throw new Error('Syntax error in DELETE query. Format: DELETE FROM <table> WHERE <condition>');

  const tableName = match[1].replace(/[\[\]]/g, '');
  const whereClause = match[2]?.trim();

  const table = findTable(db, tableName);
  if (!table) throw new Error(`Table '${tableName}' does not exist.`);

  const initialCount = table.records.length;
  table.records = table.records.filter((row) => {
    if (!whereClause || evaluateWhereClause(whereClause, row)) {
      // Check referential integrity before delete
      const riRes = validateReferentialIntegrity(db, 'delete', tableName, row);
      if (!riRes.isValid) throw new Error(riRes.error);
      return false; // delete
    }
    return true; // keep
  });

  const deletedCount = initialCount - table.records.length;
  return {
    columns: ['Status', 'Rows Affected'],
    rows: [[`${deletedCount} row(s) deleted successfully`, deletedCount]],
    rowCount: deletedCount,
    message: `${deletedCount} row(s) deleted from '${tableName}'.`,
    executionTimeMs: Math.round((performance.now() - start) * 10) / 10,
  };
}

function evaluateWhereClause(clause: string, row: Record<string, any>): boolean {
  if (!clause || !clause.trim()) return true;

  // Split on OR
  const orParts = clause.split(/\s+OR\s+/i);
  return orParts.some((orPart) => {
    // Split on AND
    const andParts = orPart.split(/\s+AND\s+/i);
    return andParts.every((andSub) => evaluateSimpleCondition(andSub.trim(), row));
  });
}

function evaluateSimpleCondition(cond: string, row: Record<string, any>): boolean {
  // 1. LIKE: Col LIKE "*text*"
  const likeMatch = cond.match(/^([^\s]+)\s+LIKE\s+['"](.+)['"]$/i);
  if (likeMatch) {
    const col = likeMatch[1].replace(/[\[\]]/g, '');
    const rawPattern = likeMatch[2];
    const val = String(row[col] ?? '');
    const regex = new RegExp('^' + rawPattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');
    return regex.test(val);
  }

  // 2. Comparison: Col >= 50 or Col = 'Female' or Col <> 'Douala'
  const compMatch = cond.match(/^([^\s]+)\s*([><=!]+|LIKE)\s*(.+)$/i);
  if (compMatch) {
    const col = compMatch[1].replace(/[\[\]]/g, '');
    const op = compMatch[2].toUpperCase();
    const targetRaw = compMatch[3].trim().replace(/^['"#]|['"#]$/g, ''); // strip quotes and Access date hashes #
    const rowVal = row[col];

    if (rowVal === undefined || rowVal === null) return false;

    const numVal = Number(rowVal);
    const numTarget = Number(targetRaw);

    if (!isNaN(numVal) && !isNaN(numTarget)) {
      if (op === '=') return numVal === numTarget;
      if (op === '<>' || op === '!=') return numVal !== numTarget;
      if (op === '>') return numVal > numTarget;
      if (op === '>=') return numVal >= numTarget;
      if (op === '<') return numVal < numTarget;
      if (op === '<=') return numVal <= numTarget;
    } else {
      const sVal = String(rowVal).toLowerCase();
      const sTarget = targetRaw.toLowerCase();
      if (op === '=') return sVal === sTarget;
      if (op === '<>' || op === '!=') return sVal !== sTarget;
      if (op === '>') return sVal > sTarget;
      if (op === '>=') return sVal >= sTarget;
      if (op === '<') return sVal < sTarget;
      if (op === '<=') return sVal <= sTarget;
    }
  }

  return true;
}

function findTable(db: AccessDatabase, name: string): TableDefinition | undefined {
  const clean = name.toLowerCase().replace(/[\[\]]/g, '');
  return Object.values(db.tables).find((t) => t.name.toLowerCase() === clean);
}

function splitColumns(colsStr: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let current = '';

  for (let i = 0; i < colsStr.length; i++) {
    const char = colsStr[i];
    if (char === '(') depth++;
    else if (char === ')') depth--;

    if (char === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

// ============================================================================
// 3. Preloaded Cameroon GCE Practical Templates
// ============================================================================

export function getGceSchoolTemplate(): AccessDatabase {
  return {
    id: 'db_gce_school',
    name: 'School_Management_GCE.accdb',
    updatedAt: new Date().toISOString(),
    tables: {
      tbl_Student: {
        id: 't_student',
        name: 'tbl_Student',
        autoNumberCounter: 5,
        fields: [
          {
            id: 'f_std_1',
            name: 'StudentID',
            type: 'AutoNumber',
            isPrimaryKey: true,
            description: 'Unique registration number',
            properties: { fieldSize: 'Long Integer', required: true, indexed: 'Yes (No Duplicates)' },
          },
          {
            id: 'f_std_2',
            name: 'FirstName',
            type: 'Short Text',
            description: 'Student first name',
            properties: { fieldSize: 50, required: true },
          },
          {
            id: 'f_std_3',
            name: 'LastName',
            type: 'Short Text',
            description: 'Student family surname',
            properties: { fieldSize: 50, required: true },
          },
          {
            id: 'f_std_4',
            name: 'Gender',
            type: 'Short Text',
            description: 'M or F',
            properties: { fieldSize: 1, validationRule: "IN ('M', 'F')", validationText: "Gender must be 'M' or 'F'", required: true },
          },
          {
            id: 'f_std_5',
            name: 'City',
            type: 'Short Text',
            description: 'City of residence',
            properties: { fieldSize: 50, defaultValue: 'Bamenda' },
          },
          {
            id: 'f_std_6',
            name: 'TuitionFee',
            type: 'Currency',
            description: 'Annual fees in XAF',
            properties: { format: 'Currency', validationRule: '>= 0', validationText: 'Fees cannot be negative', defaultValue: '50000' },
          },
        ],
        records: [
          { StudentID: 1, FirstName: 'Amina', LastName: 'Fofung', Gender: 'F', City: 'Bamenda', TuitionFee: 50000 },
          { StudentID: 2, FirstName: 'Boris', LastName: 'Nkwain', Gender: 'M', City: 'Buea', TuitionFee: 50000 },
          { StudentID: 3, FirstName: 'Chantal', LastName: 'Mbassi', Gender: 'F', City: 'Douala', TuitionFee: 65000 },
          { StudentID: 4, FirstName: 'Daniel', LastName: 'Tanyi', Gender: 'M', City: 'Yaounde', TuitionFee: 50000 },
          { StudentID: 5, FirstName: 'Emelda', LastName: 'Bi', Gender: 'F', City: 'Bamenda', TuitionFee: 45000 },
        ],
      },
      tbl_Course: {
        id: 't_course',
        name: 'tbl_Course',
        autoNumberCounter: 0,
        fields: [
          {
            id: 'f_crs_1',
            name: 'CourseCode',
            type: 'Short Text',
            isPrimaryKey: true,
            description: 'Unique Course ID',
            properties: { fieldSize: 10, required: true, indexed: 'Yes (No Duplicates)' },
          },
          {
            id: 'f_crs_2',
            name: 'CourseTitle',
            type: 'Short Text',
            description: 'Full course subject title',
            properties: { fieldSize: 100, required: true },
          },
          {
            id: 'f_crs_3',
            name: 'CreditHours',
            type: 'Number',
            description: 'Course credits (1 - 6)',
            properties: { validationRule: 'BETWEEN 1 AND 6', validationText: 'Credits must be between 1 and 6', defaultValue: '3' },
          },
        ],
        records: [
          { CourseCode: 'CSC710', CourseTitle: 'Computer Science Practical Paper 3', CreditHours: 4 },
          { CourseCode: 'ICT515', CourseTitle: 'Information and Communication Technology', CreditHours: 3 },
          { CourseCode: 'MAT705', CourseTitle: 'Pure Mathematics with Statistics', CreditHours: 5 },
        ],
      },
      tbl_Enrollment: {
        id: 't_enroll',
        name: 'tbl_Enrollment',
        autoNumberCounter: 6,
        fields: [
          {
            id: 'f_enr_1',
            name: 'EnrollmentID',
            type: 'AutoNumber',
            isPrimaryKey: true,
            properties: { required: true },
          },
          {
            id: 'f_enr_2',
            name: 'StudentID',
            type: 'Number',
            description: 'FK to tbl_Student',
            properties: { required: true },
          },
          {
            id: 'f_enr_3',
            name: 'CourseCode',
            type: 'Short Text',
            description: 'FK to tbl_Course',
            properties: { required: true },
          },
          {
            id: 'f_enr_4',
            name: 'ExamScore',
            type: 'Number',
            description: 'Mark over 100',
            properties: { validationRule: '>= 0 AND <= 100', validationText: 'Exam score must be between 0 and 100' },
          },
          {
            id: 'f_enr_5',
            name: 'Grade',
            type: 'Short Text',
            description: 'Letter grade A, B, C, D, E, F',
            properties: { fieldSize: 2 },
          },
        ],
        records: [
          { EnrollmentID: 1, StudentID: 1, CourseCode: 'CSC710', ExamScore: 84, Grade: 'A' },
          { EnrollmentID: 2, StudentID: 2, CourseCode: 'CSC710', ExamScore: 68, Grade: 'B' },
          { EnrollmentID: 3, StudentID: 3, CourseCode: 'ICT515', ExamScore: 92, Grade: 'A' },
          { EnrollmentID: 4, StudentID: 4, CourseCode: 'CSC710', ExamScore: 48, Grade: 'D' },
          { EnrollmentID: 5, StudentID: 5, CourseCode: 'MAT705', ExamScore: 75, Grade: 'B' },
          { EnrollmentID: 6, StudentID: 1, CourseCode: 'MAT705', ExamScore: 88, Grade: 'A' },
        ],
      },
    },
    relationships: [
      {
        id: 'rel_1',
        fromTable: 'tbl_Student',
        fromField: 'StudentID',
        toTable: 'tbl_Enrollment',
        toField: 'StudentID',
        type: '1-to-Many',
        enforceReferentialIntegrity: true,
      },
      {
        id: 'rel_2',
        fromTable: 'tbl_Course',
        fromField: 'CourseCode',
        toTable: 'tbl_Enrollment',
        toField: 'CourseCode',
        type: '1-to-Many',
        enforceReferentialIntegrity: true,
      },
    ],
    queries: {
      qry_HighAchievers: {
        id: 'q_1',
        name: 'qry_HighAchievers',
        sql: 'SELECT StudentID, CourseCode, ExamScore, Grade FROM tbl_Enrollment WHERE ExamScore >= 70 ORDER BY ExamScore DESC',
        description: 'Find all enrollments with score 70 or higher',
      },
      qry_StudentCourses: {
        id: 'q_2',
        name: 'qry_StudentCourses',
        sql: 'SELECT tbl_Student.FirstName, tbl_Student.LastName, tbl_Enrollment.CourseCode, tbl_Enrollment.ExamScore, tbl_Enrollment.Grade FROM tbl_Student INNER JOIN tbl_Enrollment ON tbl_Student.StudentID = tbl_Enrollment.StudentID ORDER BY tbl_Enrollment.ExamScore DESC',
        description: 'List student names with their course scores using INNER JOIN',
      },
      qry_FemaleStudents: {
        id: 'q_3',
        name: 'qry_FemaleStudents',
        sql: "SELECT StudentID, FirstName, LastName, City, TuitionFee FROM tbl_Student WHERE Gender = 'F' ORDER BY FirstName ASC",
        description: 'Filter only female students',
      },
    },
    forms: {
      frm_StudentRegistration: {
        id: 'frm_1',
        name: 'frm_StudentRegistration',
        tableName: 'tbl_Student',
        title: 'Student Registration Form',
      },
    },
    reports: {
      rpt_GradeSummary: {
        id: 'rpt_1',
        name: 'rpt_GradeSummary',
        sourceType: 'table',
        sourceName: 'tbl_Enrollment',
        title: 'GCE Examination Results Summary Report',
      },
    },
  };
}

export function getBlankDatabase(name: string = 'Database1.accdb'): AccessDatabase {
  const cleanName = name.trim() || 'Database1';
  return {
    id: `db_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: cleanName.endsWith('.accdb') ? cleanName : `${cleanName}.accdb`,
    updatedAt: new Date().toISOString(),
    tables: {},
    relationships: [],
    queries: {},
    forms: {},
    reports: {},
  };
}

// Generate complete DDL + DML SQL export script
export function exportDatabaseToSQL(db: AccessDatabase): string {
  const lines: string[] = [];
  lines.push(`-- =============================================================`);
  lines.push(`-- Nebcode Microsoft Access Database Export: ${db.name}`);
  lines.push(`-- Generated: ${new Date().toLocaleString()}`);
  lines.push(`-- =============================================================\n`);

  for (const table of Object.values(db.tables)) {
    lines.push(`-- Table: ${table.name}`);
    lines.push(`DROP TABLE IF EXISTS \`${table.name}\`;`);
    lines.push(`CREATE TABLE \`${table.name}\` (`);

    const fieldDefs = table.fields.map((f) => {
      let sqlType = 'VARCHAR(255)';
      if (f.type === 'Number') sqlType = 'INT';
      if (f.type === 'Currency') sqlType = 'DECIMAL(12,2)';
      if (f.type === 'Date/Time') sqlType = 'DATETIME';
      if (f.type === 'Yes/No') sqlType = 'BOOLEAN';
      if (f.type === 'AutoNumber') sqlType = 'INT AUTO_INCREMENT';
      if (f.type === 'Long Text') sqlType = 'TEXT';

      let def = `  \`${f.name}\` ${sqlType}`;
      if (f.isPrimaryKey) def += ' PRIMARY KEY';
      else if (f.properties.required) def += ' NOT NULL';
      return def;
    });

    lines.push(fieldDefs.join(',\n'));
    lines.push(`);\n`);

    if (table.records.length > 0) {
      lines.push(`-- Records for ${table.name}`);
      for (const r of table.records) {
        const keys = Object.keys(r);
        const vals = keys.map((k) => {
          const val = r[k];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number') return val;
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        lines.push(`INSERT INTO \`${table.name}\` (\`${keys.join('`, `')}\`) VALUES (${vals.join(', ')});`);
      }
      lines.push('');
    }
  }

  if (Object.keys(db.queries).length > 0) {
    lines.push(`-- =============================================================`);
    lines.push(`-- Saved Queries`);
    lines.push(`-- =============================================================`);
    for (const q of Object.values(db.queries)) {
      lines.push(`-- Query: ${q.name} (${q.description || ''})`);
      lines.push(`${q.sql};\n`);
    }
  }

  return lines.join('\n');
}
