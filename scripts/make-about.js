#!/usr/bin/env node

const fs = require('fs');

const PKG = 'app/package.json';
const SRC = 'scripts/about.html';
const DST = 'app/about.html';
const LICENSE = 'LICENSE';

const SOURCES = [PKG, SRC, DST, LICENSE];

function makeAbout() {
    console.log(`Updating ${DST}`);
    const pkg = JSON.parse(fs.readFileSync(PKG).toString());
    const template = fs.readFileSync(SRC).toString();
    const licenseFile = fs.readFileSync(LICENSE).toString()
        .replace('&', '&amp;')
        .replace('<', '&lt;')
        .replace('>', '&gt;');
    pkg[':licenseFile'] = licenseFile;

    const copyrights = [];
    for (const line of licenseFile.split('\n')) {
        if (line.startsWith('Copyright ')) {
            copyrights.push(line);
        } else {
            break;
        }
    }
    pkg[':copyrights'] = copyrights.join('<br/>\n');

    const sub = new RegExp('\\${([^}]+)}', 'g');

    const result = template.replace(sub, function (str, g1) {
        return pkg[g1] || '';
    });

    fs.writeFileSync(DST, result);
}

function main() {
    let dStat;
    try {
        dStat = fs.statSync(DST);
    } catch (ignored) {
        dStat = null;
    }

    if (dStat === null) {
        makeAbout();
    } else {
        for (const s of SOURCES) {
            if (fs.statSync(s).mtimeMs > dStat.mtimeMs) {
                makeAbout();
                break;
            }
        }
    }

}

main();
