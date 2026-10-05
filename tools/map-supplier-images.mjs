import fs from 'node:fs';
import {localImageMap} from '../shop-local-image-map.js';
const report=JSON.parse(fs.readFileSync('tools/supplier-image-report.json','utf8')),mapping={};
for(const row of report)if(row.path)mapping[row.url]=localImageMap[row.path]||row.path;
fs.writeFileSync('shop-supplier-image-map.js','export const supplierImageMap='+JSON.stringify(mapping,null,2)+';\n');
console.log(JSON.stringify({mapped:Object.keys(mapping).length,webp:Object.values(mapping).filter(path=>path.endsWith('.webp')).length}));
