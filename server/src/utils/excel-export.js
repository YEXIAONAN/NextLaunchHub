import * as XLSX from 'xlsx';

function pad(value) {
  return String(value).padStart(2, '0');
}

export function buildExportFileName(prefix, date = new Date()) {
  const timestamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('') + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join('');

  return `${prefix}_${timestamp}.xlsx`;
}

export function sendExcelFile(res, {
  fileName,
  sheetName,
  columns,
  rows
}) {
  const exportRows = rows.map((row) => {
    const mappedRow = {};

    columns.forEach((column) => {
      mappedRow[column.header] = typeof column.value === 'function'
        ? column.value(row)
        : row[column.value];
    });

    return mappedRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const buffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx'
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  res.send(buffer);
}
