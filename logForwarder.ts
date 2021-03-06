interface MinecraftLogWatcherOptions {
    logFilePath: string;
    ModsDirPath?: string;
    webhookUrl: string;
    watchInterval?: number;
    loginMessages: string[];
    logoutMessages: string[];
}

interface WebhookContent {
    content: string;
}


const configFilePath = Deno.args[0];
const configFile = await Deno.readTextFile(configFilePath);
const config = JSON.parse(configFile) as MinecraftLogWatcherOptions;

let lastSawLine: string | null = null;

while (true) {
    const fileContent = await Deno.readTextFile(config.logFilePath);
    const lines = fileContent.split("\n").filter(s => s.length);
    if (lastSawLine === null) {
        lastSawLine = lines[lines.length - 1];
        continue;
    }
    const lastSawLineIdx = lines.lastIndexOf(lastSawLine);
    const newLineStartIdx = lastSawLineIdx >= 0 ? lastSawLineIdx + 1 : 0;
    let serverStarted = false;
    let serverStoped = false;
    const joinedMembers: string[] = [];
    const leftMembers: string[] = [];
    for (const line of lines.slice(newLineStartIdx)) {
        if (line.includes("Starting minecraft server")) {
            serverStarted = true;
        } else if (
            line.includes("Server Shutdown") &&
            line.includes("Stopping server")
        ) {
            serverStoped = true;
        } else if (line.includes("joined the game")) {
            const name = line.match(/(?<=:\s).+?(?=\sjoined)/);
            if (name) {
                joinedMembers.push(name[0]);
            }
        } else if (line.includes("left the game")) {
            const name = line.match(/(?<=:\s).+?(?=\sleft)/);
            if (name) {
                leftMembers.push(name[0]);
            }
        }
    }
    let contentText = "";
    if (serverStarted) {
        contentText += "マイクラ鯖が再起動しました！\n導入Mod一覧：\n";
        if (config.ModsDirPath) {
            contentText += "\n導入Mod一覧：\n";
            const mods = await lsFiles(config.ModsDirPath);
            if (mods.length) {
                for (const mod of mods) {
                    contentText += `  ${mod}\n`;
                }
            }
        }
    } else if (serverStoped) {
        contentText += "マイクラ鯖が停止しました！";
    }
    if (joinedMembers.length) {
        if (contentText) {
            contentText += "\n";
        }
        contentText +=
            joinedMembers.join("と") +
            pickUpRandomOne(config.loginMessages);
    }
    if (leftMembers.length) {
        if (contentText) {
            contentText += "\n";
        }
        contentText +=
            leftMembers.join("と") +
            pickUpRandomOne(config.logoutMessages);
    }
    if (contentText) {
        const bodyJson: WebhookContent = {
            content: contentText
        };
        await fetch(config.webhookUrl, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(bodyJson)
        });
    }
    lastSawLine = lines[lines.length - 1];
    await sleep(config.watchInterval ?? 1000);
}

async function lsFiles(path: string) {
    const res: string[] = [];
    for await (const entry of Deno.readDir(path)) {
        if (entry.isFile) {
            res.push(entry.name);
        }
    }
    return res;
}

function pickUpRandomOne<T>(choices: T[]): T {
    const idx = Math.floor(Math.random() * choices.length);
    return choices[idx];
}

function sleep(ms: number) {
    return new Promise(res => setTimeout(res, ms));
}
