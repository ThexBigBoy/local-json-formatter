"use strict";


/* =========================================================
   ELEMENTS
========================================================= */

const input = document.getElementById("input");

const output = document.getElementById("output");

const status = document.getElementById("status");

const validState = document.getElementById("validState");

const charCount = document.getElementById("charCount");

const language = document.getElementById("language");

const indentSelect = document.getElementById("indent");

const languageWrap = document.getElementById("languageWrap");

const treeSection = document.getElementById("treeSection");

const tree = document.getElementById("tree");

const fileInput = document.getElementById("fileInput");


/* =========================================================
   STATE
========================================================= */

let mode = "json";

let lastObject = null;


/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function getIndent() {

    if (indentSelect.value === "tab") {
        return "\t";
    }

    return Number(indentSelect.value);
}


function updateCharacterCount() {

    charCount.textContent =
        input.value.length.toLocaleString() +
        " chars";
}


function setState(text, valid = null) {

    validState.textContent = text;

    validState.className = "";

    if (valid === true) {
        validState.className = "valid";
    }

    if (valid === false) {
        validState.className = "invalid";
    }
}


function setStatus(text) {

    status.textContent = text;
}


/* =========================================================
   JSON
========================================================= */

function parseJSON() {

    try {

        const object = JSON.parse(input.value);

        lastObject = object;

        setState(
            "Valid JSON",
            true
        );

        return object;

    } catch (error) {

        lastObject = null;

        setState(
            "Invalid JSON",
            false
        );

        setStatus(
            error.message
        );

        return null;
    }
}


function formatJSON() {

    if (!input.value.trim()) {

        output.textContent = "";

        return;
    }

    const object = parseJSON();

    if (object === null) {
        return;
    }

    output.textContent =
        JSON.stringify(
            object,
            null,
            getIndent()
        );

    setStatus(
        "JSON formatted locally."
    );
}


function minifyJSON() {

    if (!input.value.trim()) {
        return;
    }

    const object = parseJSON();

    if (object === null) {
        return;
    }

    output.textContent =
        JSON.stringify(object);

    setStatus(
        "JSON minified locally."
    );
}


/* =========================================================
   STRING PROTECTION
========================================================= */

function protectStrings(source) {

    const strings = [];

    const protectedSource =
        source.replace(
            /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g,
            function (match) {

                strings.push(match);

                return `___STRING_${strings.length - 1}___`;
            }
        );

    return {
        source: protectedSource,
        strings
    };
}


function restoreStrings(source, strings) {

    return source.replace(
        /___STRING_(\d+)___/g,
        function (_, index) {

            return strings[
                Number(index)
            ];
        }
    );
}


/* =========================================================
   JAVASCRIPT / TYPESCRIPT / C# / JAVA / PHP / CSS
========================================================= */

function genericBeautify(source) {

    const protectedData =
        protectStrings(
            source
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n")
                .trim()
        );

    let code =
        protectedData.source;

    const indent = getIndent();

    const unit =
        typeof indent === "number"
            ? " ".repeat(indent)
            : "\t";


    /* Normalize spaces */

    code = code.replace(
        /[ \t]+\n/g,
        "\n"
    );


    /*
        Put braces on their own structure.
    */

    code = code.replace(
        /\s*{\s*/g,
        " {\n"
    );

    code = code.replace(
        /\s*}\s*/g,
        "\n}\n"
    );


    /*
        Semicolon = new statement.
    */

    code = code.replace(
        /;\s*/g,
        ";\n"
    );


    /*
        Commas.
    */

    code = code.replace(
        /,\s*/g,
        ", "
    );


    /*
        Remove excessive blank lines.
    */

    code = code.replace(
        /\n{2,}/g,
        "\n"
    );


    let level = 0;

    const lines = [];


    for (
        let line of code.split("\n")
    ) {

        line = line.trim();

        if (!line) {
            continue;
        }


        /*
            Closing brace reduces indentation.
        */

        if (
            line.startsWith("}")
        ) {

            level =
                Math.max(
                    0,
                    level - 1
                );
        }


        lines.push(
            unit.repeat(level) +
            line
        );


        /*
            Opening brace increases indentation.
        */

        if (
            line.endsWith("{")
        ) {

            level++;
        }
    }


    return restoreStrings(
        lines.join("\n"),
        protectedData.strings
    );
}


/* =========================================================
   HTML / XML
========================================================= */

function htmlBeautify(source) {

    const indent = getIndent();

    const unit =
        typeof indent === "number"
            ? " ".repeat(indent)
            : "\t";


    let code =
        source
            .replace(
                />\s*</g,
                "><"
            )
            .trim();


    const parts =
        code.split(
            /(<[^>]+>)/g
        );


    let level = 0;

    const result = [];


    const selfClosing =
        /^(input|meta|link|br|hr|img|source|area|base|embed|param|track|wbr)$/i;


    for (let part of parts) {

        part = part.trim();

        if (!part) {
            continue;
        }


        if (
            part.startsWith("</")
        ) {

            level =
                Math.max(
                    0,
                    level - 1
                );
        }


        result.push(
            unit.repeat(level) +
            part
        );


        const openingMatch =
            part.match(
                /^<([a-zA-Z][\w:-]*)/
            );


        if (
            openingMatch &&
            !part.startsWith("</") &&
            !part.startsWith("<!") &&
            !part.startsWith("<?") &&
            !part.endsWith("/>")
        ) {

            if (
                !selfClosing.test(
                    openingMatch[1]
                )
            ) {

                level++;
            }
        }
    }


    return result.join("\n");
}


/* =========================================================
   SQL
========================================================= */

function sqlBeautify(source) {

    const protectedData =
        protectStrings(
            source
                .replace(/\s+/g, " ")
                .trim()
        );


    let sql =
        protectedData.source;


    const keywords = [
        "SELECT",
        "FROM",
        "WHERE",
        "LEFT JOIN",
        "RIGHT JOIN",
        "INNER JOIN",
        "OUTER JOIN",
        "FULL JOIN",
        "JOIN",
        "GROUP BY",
        "ORDER BY",
        "HAVING",
        "LIMIT",
        "UNION",
        "SET",
        "VALUES",
        "INSERT INTO",
        "UPDATE",
        "DELETE FROM",
        "CREATE TABLE",
        "ALTER TABLE"
    ];


    for (const keyword of keywords) {

        const regex =
            new RegExp(
                "\\b" +
                keyword.replace(
                    / /g,
                    "\\s+"
                ) +
                "\\b",
                "gi"
            );


        sql =
            sql.replace(
                regex,
                "\n" +
                keyword
            );
    }


    sql =
        sql.replace(
            /\b(AND|OR)\b/gi,
            "\n    $1"
        );


    sql =
        sql.replace(
            /,\s*/g,
            ",\n    "
        );


    sql =
        sql.replace(
            /\n\s*\n/g,
            "\n"
        );


    sql =
        sql.trim();


    return restoreStrings(
        sql,
        protectedData.strings
    );
}


/* =========================================================
   jBASE / MULTIVALUE BASIC
========================================================= */

function jbaseBeautify(source) {

    const indent = getIndent();

    const unit =
        typeof indent === "number"
            ? " ".repeat(indent)
            : "\t";


    const lines =
        source
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .split("\n");


    let level = 0;

    const result = [];


    for (let raw of lines) {

        let line =
            raw.trim();


        if (!line) {
            continue;
        }


        /*
            Keywords which close blocks.
        */

        if (
            /^(END|END IF|END ELSE|NEXT|REPEAT|LOOP)\b/i.test(
                line
            )
        ) {

            level =
                Math.max(
                    0,
                    level - 1
                );
        }


        result.push(
            unit.repeat(level) +
            line
        );


        /*
            jBASE / BASIC block starters.
        */

        if (
            /\bTHEN\s*$/i.test(line) ||
            /\bELSE\s*$/i.test(line) ||
            /\bLOOP\s*$/i.test(line) ||
            /\bREPEAT\s*$/i.test(line) ||
            /\bBEGIN\s+CASE\b/i.test(line) ||
            /\bFOR\s+EACH\b/i.test(line)
        ) {

            level++;
        }
    }


    return result.join("\n");
}


/* =========================================================
   PYTHON
========================================================= */

function pythonBeautify(source) {

    const indent = getIndent();

    const unit =
        typeof indent === "number"
            ? " ".repeat(indent)
            : "\t";


    const lines =
        source
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .split("\n");


    let level = 0;

    const result = [];


    for (let raw of lines) {

        let line =
            raw.trim();


        if (!line) {
            continue;
        }


        if (
            /^(elif|else|except|finally)\b/.test(
                line
            )
        ) {

            level =
                Math.max(
                    0,
                    level - 1
                );
        }


        result.push(
            unit.repeat(level) +
            line
        );


        if (
            line.endsWith(":")
        ) {

            level++;
        }
    }


    return result.join("\n");
}


/* =========================================================
   YAML
========================================================= */

function yamlBeautify(source) {

    const indent = getIndent();

    const unit =
        typeof indent === "number"
            ? " ".repeat(indent)
            : "\t";


    const lines =
        source
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .split("\n");


    return lines
        .map(line => {

            const trimmed =
                line.trim();

            if (!trimmed) {
                return "";
            }

            return trimmed;
        })
        .join("\n");
}


/* =========================================================
   CODE BEAUTIFIER
========================================================= */

function beautifyCode() {

    const source =
        input.value;


    if (!source.trim()) {
        return;
    }


    const selectedLanguage =
        language.value;


    try {

        let result;


        switch (selectedLanguage) {

            case "html":
            case "xml":

                result =
                    htmlBeautify(
                        source
                    );

                break;


            case "sql":

                result =
                    sqlBeautify(
                        source
                    );

                break;


            case "jbase":

                result =
                    jbaseBeautify(
                        source
                    );

                break;


            case "python":

                result =
                    pythonBeautify(
                        source
                    );

                break;


            case "yaml":

                result =
                    yamlBeautify(
                        source
                    );

                break;


            default:

                result =
                    genericBeautify(
                        source
                    );

                break;
        }


        output.textContent =
            result;


        setState(
            "Beautified",
            true
        );


        setStatus(
            `${selectedLanguage} formatted locally.`
        );

    } catch (error) {

        output.textContent =
            source;


        setState(
            "Formatter Error",
            false
        );


        setStatus(
            error.message
        );
    }
}


/* =========================================================
   CODE MINIFIER
========================================================= */

function minifyCode() {

    let source =
        input.value.trim();


    if (!source) {
        return;
    }


    /*
        Remove block comments.
    */

    source =
        source.replace(
            /\/\*[\s\S]*?\*\//g,
            ""
        );


    /*
        Remove JavaScript-style comments.
    */

    source =
        source.replace(
            /(^|[^:])\/\/.*$/gm,
            "$1"
        );


    /*
        Compress whitespace.
    */

    source =
        source.replace(
            /\s+/g,
            " "
        );


    output.textContent =
        source.trim();


    setState(
        "Compacted",
        true
    );


    setStatus(
        "Code compacted locally."
    );
}


/* =========================================================
   VALIDATION
========================================================= */

function validate() {

    if (mode === "json") {

        if (!input.value.trim()) {

            setStatus(
                "Nothing to validate."
            );

            return;
        }


        parseJSON();

        return;
    }


    setState(
        "Formatter check",
        true
    );


    setStatus(
        "Source processed locally. A full compiler/parser is not included."
    );
}


/* =========================================================
   TREE VIEW
========================================================= */

function createTreeNode(
    value,
    label = ""
) {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "node";


    if (
        value !== null &&
        typeof value === "object"
    ) {

        const isArray =
            Array.isArray(value);


        const entries =
            Object.entries(value);


        const header =
            document.createElement(
                "div"
            );


        const toggle =
            document.createElement(
                "span"
            );


        toggle.className =
            "toggle";


        toggle.textContent =
            "▼";


        header.appendChild(
            toggle
        );


        header.appendChild(
            document.createTextNode(
                label +
                (
                    isArray
                        ? "["
                        : "{"
                )
            )
        );


        wrapper.appendChild(
            header
        );


        const children =
            document.createElement(
                "div"
            );


        entries.forEach(
            ([key, value]) => {

                children.appendChild(
                    createTreeNode(
                        value,
                        isArray
                            ? ""
                            : `"${key}": `
                    )
                );
            }
        );


        wrapper.appendChild(
            children
        );


        const closing =
            document.createElement(
                "div"
            );


        closing.textContent =
            isArray
                ? "]"
                : "}";


        wrapper.appendChild(
            closing
        );


        toggle.addEventListener(
            "click",
            () => {

                children.classList.toggle(
                    "hidden"
                );


                toggle.textContent =
                    children.classList.contains(
                        "hidden"
                    )
                        ? "▶"
                        : "▼";
            }
        );

    } else {

        wrapper.textContent =
            label +
            (
                typeof value === "string"
                    ? `"${value}"`
                    : String(value)
            );
    }


    return wrapper;
}


function showTree() {

    if (mode !== "json") {
        return;
    }


    const object =
        parseJSON();


    if (object === null) {
        return;
    }


    tree.innerHTML = "";


    tree.appendChild(
        createTreeNode(
            object
        )
    );


    treeSection.classList.remove(
        "hidden"
    );
}


/* =========================================================
   COPY
========================================================= */

async function copyOutput() {

    const text =
        output.textContent ||
        input.value;


    if (!text) {
        return;
    }


    try {

        await navigator.clipboard.writeText(
            text
        );


        setStatus(
            "Copied to clipboard."
        );

    } catch {

        setStatus(
            "Clipboard access was blocked by the browser."
        );
    }
}


/* =========================================================
   DOWNLOAD
========================================================= */

function downloadOutput() {

    const text =
        output.textContent ||
        input.value;


    if (!text) {
        return;
    }


    let extension =
        "txt";


    if (mode === "json") {

        extension =
            "json";

    } else {

        const extensions = {

            javascript: "js",

            typescript: "ts",

            html: "html",

            css: "css",

            xml: "xml",

            sql: "sql",

            php: "php",

            csharp: "cs",

            java: "java",

            python: "py",

            jbase: "basic",

            yaml: "yml"
        };


        extension =
            extensions[
                language.value
            ] || "txt";
    }


    const blob =
        new Blob(
            [text],
            {
                type: "text/plain"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href = url;

    link.download =
        `formatted.${extension}`;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );


    setStatus(
        `Downloaded formatted.${extension}`
    );
}


/* =========================================================
   CLEAR
========================================================= */

function clearAll() {

    input.value = "";

    output.textContent = "";

    setState("—");

    setStatus(
        "Cleared."
    );

    updateCharacterCount();

    tree.innerHTML = "";

    treeSection.classList.add(
        "hidden"
    );
}


/* =========================================================
   SAMPLE
========================================================= */

function loadSample() {

    if (mode === "json") {

        input.value =
            JSON.stringify(
                {
                    company: "Example Bank",

                    customer: {
                        id: 12345,

                        name: "Dara",

                        active: true
                    },

                    accounts: [
                        {
                            currency: "USD",

                            balance: 1250.50
                        },

                        {
                            currency: "KHR",

                            balance: 500000
                        }
                    ]
                },
                null,
                2
            );


        formatJSON();

    } else {

        const samples = {

            javascript:
`function calculateTotal(items) {
const total = items.reduce((sum, item) => sum + item.price, 0);
return total;
}`,

            typescript:
`interface User {
name: string;
age: number;
}
function hello(user: User) {
return "Hello " + user.name;
}`,

            html:
`<html><body><div class="container"><h1>Hello</h1><p>Welcome</p></div></body></html>`,

            css:
`.container { display: flex; align-items: center; justify-content: center; padding: 20px; }`,

            sql:
`SELECT a.id,a.name,c.balance FROM customer a LEFT JOIN account c ON a.id=c.customer_id WHERE a.active=1 ORDER BY a.name;`,

            php:
`<?php function hello($name) { $message = "Hello " . $name; return $message; } ?>`,

            csharp:
`public class User { public string Name { get; set; } public int Age { get; set; } }`,

            java:
`public class Main { public static void main(String[] args) { System.out.println("Hello"); } }`,

            python:
`def calculate_total(items):
total = sum(item["price"] for item in items)
return total`,

            jbase:
`SUBROUTINE DARA.CUSTOMER.INFO(CUS.ID)
F.CUSTOMER = ""
CALL OPF("F.CUSTOMER",F.CUSTOMER)
CALL F.READ(F.CUSTOMER,CUS.ID,R.CUSTOMER,F.CUSTOMER)
IF R.CUSTOMER THEN
PRINT R.CUSTOMER
END ELSE
PRINT "CUSTOMER NOT FOUND"
END
RETURN`,

            yaml:
`name: example
version: 1
database:
host: localhost
port: 3306`,

            xml:
`<root><customer><name>Dara</name><active>true</active></customer></root>`
        };


        input.value =
            samples[
                language.value
            ] || "";


        beautifyCode();
    }


    updateCharacterCount();
}


/* =========================================================
   MODE SWITCHING
========================================================= */

function switchToJSON() {

    mode = "json";


    document
        .getElementById("jsonModeBtn")
        .classList.add("active");


    document
        .getElementById("codeModeBtn")
        .classList.remove("active");


    languageWrap.style.display =
        "none";


    document
        .getElementById("treeBtn")
        .style.display =
        "inline-block";


    setStatus(
        "JSON Formatter selected."
    );
}


function switchToCode() {

    mode = "code";


    document
        .getElementById("codeModeBtn")
        .classList.add("active");


    document
        .getElementById("jsonModeBtn")
        .classList.remove("active");


    languageWrap.style.display =
        "flex";


    document
        .getElementById("treeBtn")
        .style.display =
        "none";


    setStatus(
        "Code Beautifier selected."
    );
}


/* =========================================================
   BUTTON EVENTS
========================================================= */

/*
    IMPORTANT:
    No inline onclick="format()" is used.
*/

document
    .getElementById("jsonModeBtn")
    .addEventListener(
        "click",
        switchToJSON
    );


document
    .getElementById("codeModeBtn")
    .addEventListener(
        "click",
        switchToCode
    );


document
    .getElementById("formatBtn")
    .addEventListener(
        "click",
        function () {

            if (mode === "json") {

                formatJSON();

            } else {

                beautifyCode();
            }
        }
    );


document
    .getElementById("minifyBtn")
    .addEventListener(
        "click",
        function () {

            if (mode === "json") {

                minifyJSON();

            } else {

                minifyCode();
            }
        }
    );


document
    .getElementById("validateBtn")
    .addEventListener(
        "click",
        validate
    );


document
    .getElementById("treeBtn")
    .addEventListener(
        "click",
        showTree
    );


document
    .getElementById("clearBtn")
    .addEventListener(
        "click",
        clearAll
    );


document
    .getElementById("copyBtn")
    .addEventListener(
        "click",
        copyOutput
    );


document
    .getElementById("downloadBtn")
    .addEventListener(
        "click",
        downloadOutput
    );


document
    .getElementById("sampleBtn")
    .addEventListener(
        "click",
        loadSample
    );


document
    .getElementById("closeTree")
    .addEventListener(
        "click",
        function () {

            treeSection.classList.add(
                "hidden"
            );
        }
    );


/* =========================================================
   FILE UPLOAD
========================================================= */

document
    .getElementById("uploadBtn")
    .addEventListener(
        "click",
        function () {

            fileInput.click();
        }
    );


fileInput.addEventListener(
    "change",
    function () {

        const file =
            fileInput.files[0];


        if (!file) {
            return;
        }


        const reader =
            new FileReader();


        reader.onload =
            function () {

                input.value =
                    reader.result;


                updateCharacterCount();


                if (mode === "json") {

                    formatJSON();

                } else {

                    beautifyCode();
                }
            };


        reader.readAsText(
            file
        );
    }
);


/* =========================================================
   INPUT EVENTS
========================================================= */

input.addEventListener(
    "input",
    function () {

        updateCharacterCount();

        setStatus(
            "Editing locally..."
        );
    }
);


input.addEventListener(
    "keydown",
    function (event) {

        /*
            Ctrl + Enter
            = Format
        */

        if (
            (event.ctrlKey ||
             event.metaKey) &&
            event.key === "Enter"
        ) {

            event.preventDefault();


            if (mode === "json") {

                formatJSON();

            } else {

                beautifyCode();
            }
        }
    }
);


/* =========================================================
   INITIALIZE
========================================================= */

updateCharacterCount();

switchToJSON();