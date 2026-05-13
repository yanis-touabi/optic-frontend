/**
 * Exports data to a CSV file and triggers a download.
 * @param data Array of objects to export
 * @param headers Mapping of keys to display names (e.g., { id: 'ID', name: 'Nom' })
 * @param fileName Name of the file (without extension)
 */
export function exportToCSV(
  data: any[],
  headers: Record<string, string>,
  fileName: string,
) {
  if (!data || !data.length) return;

  const headerKeys = Object.keys(headers);
  const headerLabels = Object.values(headers);

  const csvRows = [];

  // Add headers
  csvRows.push(headerLabels.join(','));

  // Add data rows
  for (const row of data) {
    const values = headerKeys.map((key) => {
      const val = row[key];
      const escaped = ('' + (val ?? '')).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  
  // Use BOM for Excel compatibility (UTF-8)
  const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
