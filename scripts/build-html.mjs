import { readFile, readdir, unlink, writeFile } from "node:fs/promises";

const entry = new URL("../.build/site/index.html", import.meta.url);
const html = await readFile(entry, "utf8");
const script = html.match(/<script type="module"[^>]* src="\.\/([^"]+)"><\/script>/u);
const style = html.match(/<link rel="stylesheet"[^>]* href="\.\/([^"]+)">/u);
if (!script?.[1] || !style?.[1]) throw new Error("Expected one bundled script and stylesheet.");

const scriptFile = new URL(script[1], entry);
const styleFile = new URL(style[1], entry);
const [code, css, icon] = await Promise.all([
    readFile(scriptFile, "utf8"),
    readFile(styleFile, "utf8"),
    readFile(new URL("./icon-192.png", entry)),
]);
const notices = [];
for (const directory of ["fonts/", "licenses/"]) {
    const folder = new URL(directory, entry);
    for (const filename of (await readdir(folder)).sort()) {
        if (!filename.endsWith(".txt")) continue;
        const license = await readFile(new URL(filename, folder), "utf8");
        notices.push(filename + "\n" + license);
    }
}
const notice = notices.join("\n\n").replaceAll("-->", "-- >");
const offlineStart = `<script>
if (isSecureContext && location.protocol !== "file:" && "serviceWorker" in navigator && !navigator.serviceWorker.controller) {
    window.firstOfflineRegistration = navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" })
        .catch(() => undefined);
}
</script>`;
const page = html
    .replace(script[0], () => offlineStart + '\n<script type="module">\n' + code.replace(/<\/script/giu, "<\\/script") + "\n</script>")
    .replace(style[0], () => "<style>\n" + css + "\n</style>")
    .replace("./icon-192.png", "data:image/png;base64," + icon.toString("base64"))
    .replace("</html>", () => "</html>\n<!-- Third-party notices\n" + notice + "\n-->\n");
await writeFile(entry, page);
await Promise.all([unlink(scriptFile), unlink(styleFile)]);
