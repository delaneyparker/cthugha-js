const fs = require('fs');
const path = require('path');

// Directory containing the .MAP files
const directoryPath = path.join(__dirname, '..', 'cthugha');

let tsArrayContent = `
// This code was generated automatically by util/maps-to-palettes.js
//
// These palettes were extracted from Cthugha's .MAP files.
// To zaph & team: Thank you for inspiring us late night coders! =D
//
//
// Cthugha - Audio Seeded Image Processing
//
// Zaph, Digital Aasvogel Group, Torps Productions 1993-1994
//
// Copyright Information:
// ======================
//
// Some parts of the source are from the public domain and are not
// copyrighted.
//
// Some parts of the source bear explicit copyright notices from the
// author and are subject to the conditions listed there by the author.
//
// The remainder of the source (not already public domain, no explicit
// author's copyright notice) is Copyright 1994 by Torps Productions
// (a loosely associated and ever-growing group of fanatic programmers).
//
// The source code may be copied freely and may be used in other programs
// under the following conditions:
//  It may not be used in a commercial program without prior permission.
//  Please credit the author (in general, credit Cthugha and Torps
//  Productions) as the source of the code.
//
// This copyright notice is grafted from the Fractint copyright notice.
//
//
// Modifying the code:
// ===================
//
// Feel free to modify this source code, HOWEVER, please send any working
// changes/fixes to me (zaph@torps.apana.org.au) for inclusion in future
// versions of the code.
//
// Distributing the code:
// ======================
//
// Feel free to distribute this code, as long as it is complete and contains
// all copyright information that was included in the original.
//
// Legal Issues:
// =============
//
// What legal issues ???
//
// Come on guys, this is for *fun*, get on with it, make it great, make us
// all famous!!!
//
//                                                zaph, 12May94

// We need to preserve the formatting of this file...
/* eslint-disable */
/* prettier-ignore */
/* tslint:disable */
/* @ts-ignore */
export const PALETTES = [
`;

fs.readdir(directoryPath, function (err, files) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }

    const mapFiles = files.filter(file => path.extname(file).toLowerCase() === '.map');

    mapFiles.forEach(function (file, fileIndex) {
        const filePath = path.join(directoryPath, file);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const lines = fileContents.split('\n');
        let paletteInfo = `[${fileIndex}] ${file}`;
        let palette = [];

        lines.forEach((line, index) => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
              if (index === 0 && parts.length > 3) {
                // First line may contain a description after the RGB values
                const potentialComment = parts.slice(3).join(' ');
                if (potentialComment.length > 0) {
                    paletteInfo += ' - ' + potentialComment;
                }
              }

              palette.push(parts.slice(0, 3).map(Number));
            }
        });

        // Append the paletteInfo as a comment above the palette
        tsArrayContent += `    [  // ${paletteInfo}\n`;

        palette.forEach(color => {
            tsArrayContent += `      ${color.join(', ')},\n`;
        });

        tsArrayContent += `    ]${fileIndex < mapFiles.length - 1 ? ',' : ''}\n`;
    });

    tsArrayContent += `];\n`;

    fs.writeFileSync(path.join(__dirname, '..', 'src', 'palettes.ts'), tsArrayContent);
    console.log('src/palettes.ts has been generated successfully.');
});
