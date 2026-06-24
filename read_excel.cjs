const fs = require('fs');
const XLSX = require('xlsx');

const buf = fs.readFileSync('c:/Users/reyha/OneDrive/Documents/Projek/kapro/app/contoh/report_fulfillment_endstate_2026-06-24_13_20_28.xls');
const workbook = XLSX.read(buf, {type:'buffer'});
const firstSheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];
const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});

const header = jsonData.find(row => row && row.length > 0 && row.some(c => c));
console.log("Headers:", header.filter(c => c).join(', '));
console.log("First row data:", jsonData[jsonData.indexOf(header) + 1]);
