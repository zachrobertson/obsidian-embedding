import * as fs from "fs";
import { execSync } from "child_process";

const pluginDir = '.obsidian/plugins/embedding';

if (!fs.existsSync(pluginDir)) {
    fs.mkdirSync(pluginDir, { recursive: true });
}

execSync(`cp main.js ${pluginDir}`)
execSync(`cp manifest.json ${pluginDir}`)

if (!fs.existsSync(`${pluginDir}/node_modules`)) {
    execSync(`cp -r node_modules/ ${pluginDir}`)
}