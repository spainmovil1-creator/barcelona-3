import fs from 'fs';
import path from 'path';

async function translateText(text: string): Promise<string> {
  if (!text.trim()) return text;
  
  // We chunk by up to 2000 chars, split by newline preferably
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=ca&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API Error ' + res.status);
    const json = await res.json();
    
    let translated = '';
    if (json && json[0]) {
      for (let i = 0; i < json[0].length; i++) {
        translated += json[0][i][0];
      }
    }
    return translated || text;
  } catch (e) {
    console.error('Translation error chunk:', e);
    return text; // fallback
  }
}

async function translateFile(filename: string, outputFilename: string) {
  console.log(`Translating ${filename}...`);
  const content = fs.readFileSync(path.join(process.cwd(), 'src', filename), 'utf-8');
  
  const lines = content.split('\n');
  const translatedLines = [];
  
  let i = 0;
  let inContentBlock = false;
  let contentBuffer = [];
  
  while (i < lines.length) {
    const line = lines[i];
    
    if (inContentBlock) {
      if (line.includes('\`')) { // End of content block
        const textBeforeBacktick = line.split('\`')[0];
        contentBuffer.push(textBeforeBacktick);
        
        const fullText = contentBuffer.join('\n');
        
        // Batch translation in max 3000 chars (safe for URLs)
        let blockText = fullText;
        const subChunks = blockText.match(/[\s\S]{1,2500}(?=\n|$)/g) || [blockText];
        
        let translatedContent = '';
        for (const sub of subChunks) {
           translatedContent += await translateText(sub);
           await new Promise(r => setTimeout(r, 100)); // small delay to prevent 429
        }
        
        translatedLines.push(`      content: \`${translatedContent}\``);
        
        const rest = line.substring(line.indexOf('\`') + 1);
        if (rest) translatedLines[translatedLines.length - 1] += rest;
        
        inContentBlock = false;
        contentBuffer = [];
      } else {
        contentBuffer.push(line);
      }
      i++;
      continue;
    }
    
    const titleMatch = line.match(/^(\s*title:\s*")([^"]+)(".*)$/);
    if (titleMatch) {
      const translated = await translateText(titleMatch[2]);
      translatedLines.push(`${titleMatch[1]}${translated}${titleMatch[3]}`);
      i++;
      continue;
    }
    
    const descMatch = line.match(/^(\s*description:\s*")([^"]+)(".*)$/);
    if (descMatch) {
      const translated = await translateText(descMatch[2]);
      translatedLines.push(`${descMatch[1]}${translated}${descMatch[3]}`);
      i++;
      continue;
    }
    
    const contentStartMatch = line.match(/^(\s*content:\s*\`)(.*)$/);
    if (contentStartMatch) {
      if (contentStartMatch[2].includes('\`')) {
         const contentText = contentStartMatch[2].split('\`')[0];
         const translated = await translateText(contentText);
         const rest = contentStartMatch[2].substring(contentStartMatch[2].indexOf('\`') + 1);
         translatedLines.push(`${contentStartMatch[1]}${translated}\`${rest}`);
      } else {
         inContentBlock = true;
         contentBuffer.push(contentStartMatch[2]);
      }
      i++;
      continue;
    }
    
    translatedLines.push(line);
    i++;
  }
  
  fs.writeFileSync(path.join(process.cwd(), 'src', outputFilename), translatedLines.join('\n'));
  console.log(`Saved ${outputFilename}`);
}

async function main() {
  const files = ['data2.ts', 'data3.ts', 'data4.ts', 'data5.ts', 'data6.ts'];
  for (const file of files) {
    const out = file.replace('.ts', '_ca.ts');
    await translateFile(file, out);
    console.log(`Success with ${file}`);
  }
  
  console.log('Translations complete!');
}

main();
