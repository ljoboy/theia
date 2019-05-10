#!/usr/bin/env node
/********************************************************************************
 * Copyright (C) 2019 Ericsson and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
'use-strict'

// @ts-check

const downloadElectron = require('electron-download');
const unzipper = require('unzipper');
const yargs = require('yargs');
const path = require('path');
const fs = require('fs');

const { platforms, libffmpegLocation } = require('./electron-ffmpeg-lib')

async function main() {
    const options = yargs
        .option('electronVersion', {
            alias: ['v'],
            description: 'Electron version for which to pull the "clean" ffmpeg library.',
        })
        .option('absolutePath', {
            alias: ['a'],
            description: 'Absolute path to the ffmpeg shared library.',
        })
        .option('electronDist', {
            alias: ['d'],
            description: 'Electron distribution location.',
        })
        .option('platform', {
            alias: ['p'],
            description: 'Dictates where the library is located within the Electron distribution.',
            choices: platforms,
        })
        .help().alias('h', 'help')
        .exitProcess(false)
        .argv;

    if (options.help) {
        return; // help is being displayed.
    }

    const electronDist = options['electronDist'] || path.resolve(require.resolve('electron/index.js'), '..', 'dist');

    let electronVersion = options['electronVersion'];
    if (!electronVersion) {
        const electronVersionFilePath = path.resolve(electronDist, 'version');
        electronVersion = fs.readFileSync(electronVersionFilePath, {
            encoding: 'utf8'
        }).trim();
    }

    const libffmpegZipPath = await new Promise((resolve, reject) => {
        downloadElectron({
            // `version` usually starts with a `v`, which already gets added by `electron-download`.
            version: electronVersion.replace(/^v/i, ''),
            ffmpeg: true,
        }, (error, path) => {
            if (error) reject(error);
            else resolve(path);
        });
    });

    console.info(`Downloaded ffmpeg shared library { version: "${electronVersion}", dist: "${electronDist}" }.`);

    const {
        name: libffmpegFileName,
        folder: libffmpegFolder = '',
    } = libffmpegLocation(options['platform']);

    const libffmpegZip = await unzipper.Open.file(libffmpegZipPath);
    const file = libffmpegZip.files.find(file => file.path.endsWith(libffmpegFileName));
    if (!file) {
        throw new Error(`archive did not contain "${libffmpegFileName}".`);
    }
    const electronFfmpegLibPath = options['absolutePath'] ||
        path.resolve(electronDist, libffmpegFolder, libffmpegFileName);

    await new Promise((resolve, reject) => {
        file.stream()
            .pipe(fs.createWriteStream(electronFfmpegLibPath))
            .on('finish', resolve)
            .on('error', reject);
    });

    console.info(`Successfully replaced "${electronFfmpegLibPath}".`);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
