export function formatResults(results: any, limit: number = 10): any {
  // Handle Domo's response structure: { columns: [], rows: [] }
  if (!results) {
    return { message: 'No results found', count: 0 };
  }

  // If it's already an array (for backward compatibility)
  if (Array.isArray(results)) {
    const truncated = results.slice(0, limit);
    return {
      results: truncated,
      count: results.length,
      showing: truncated.length,
      ...(results.length > limit ? { note: `Showing first ${limit} of ${results.length} results` } : {})
    };
  }

  // Handle Domo response format
  if (!results.rows || results.rows.length === 0) {
    return { message: 'No results found', count: 0 };
  }

  // Convert rows to objects using column names
  const mappedResults = results.rows.slice(0, limit).map((row: any[]) => {
    const obj: Record<string, any> = {};
    if (results.columns && Array.isArray(results.columns)) {
      results.columns.forEach((col: any, index: number) => {
        const colName = typeof col === 'string' ? col : col.name || `column_${index}`;
        obj[colName] = row[index];
      });
    } else {
      // Fallback if no column information
      row.forEach((value: any, index: number) => {
        obj[`column_${index}`] = value;
      });
    }
    return obj;
  });

  return {
    results: mappedResults,
    count: results.rows.length,
    showing: mappedResults.length,
    ...(results.rows.length > limit ? { note: `Showing first ${limit} of ${results.rows.length} results` } : {})
  };
}