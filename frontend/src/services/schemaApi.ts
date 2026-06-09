/**
 * Schema API Service
 * Fetches table schemas from the backend schema registry
 */

import { SchemaResponse, SchemaError } from '../types/schema';

const API_BASE = 'http://localhost:8000/api/v1';

/**
 * Fetch schema for a given domain and table
 */
export async function fetchSchema(
  domain: string,
  table: string
): Promise<SchemaResponse> {
  const url = `${API_BASE}/schema/${domain}/${table}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = (await response.json()) as SchemaError;
      throw new Error(errorData.error || `Schema not found: ${domain}.${table}`);
    }

    const data = (await response.json()) as SchemaResponse;
    return data;
  } catch (error) {
    console.error(`❌ Failed to fetch schema for ${domain}.${table}:`, error);
    throw error;
  }
}

/**
 * Get available columns for a table
 */
export async function getTableColumns(
  domain: string,
  table: string
): Promise<string[]> {
  const schema = await fetchSchema(domain, table);
  return schema.columns.map((col) => col.name);
}

/**
 * Get column metadata for filtering/KPI configuration
 */
export async function getColumnMetadata(
  domain: string,
  table: string,
  columnName: string
) {
  const schema = await fetchSchema(domain, table);
  return schema.columns.find((col) => col.name === columnName);
}
