/**
 * runtime-data-utils.js
 *
 * Shared browser-side utilities for loading runtime CSV files used by
 * jsPsych experiments.
 *
 * Current uses:
 *   - practice manifests
 *   - pre-generated order files
 *   - perception-task manifests/orders when those tasks are integrated
 *
 * Why this file exists:
 *   Some CSV fields contain commas inside quoted strings, for example:
 *     "Sáng nay, em bé ngủ rất ngon."
 *
 *   Therefore, simple parsing with line.split(",") would be incorrect.
 *   This file provides a small CSV parser that supports:
 *     - comma-separated fields
 *     - quoted fields
 *     - escaped quotes inside quoted fields
 *     - Windows or Unix line endings
 */


/* -------------------------------------------------------------------------- */
/* 1. Low-level CSV parser                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Parse CSV text into an array of rows, where each row is an array of cells.
 *
 * This parser supports:
 *   - quoted fields
 *   - commas inside quoted fields
 *   - escaped double quotes represented as ""
 *   - CRLF and LF line endings
 *
 * @param {string} csvText
 * @returns {string[][]}
 */
function parseCsvRows(csvText) {
    if (typeof csvText !== "string") {
        throw new Error("parseCsvRows expected a string.");
    }

    const rows = [];
    let currentRow = [];
    let currentField = "";
    let insideQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        // Handle quoted fields
        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                // Escaped quote inside a quoted field
                currentField += '"';
                i++;
            } else {
                // Opening or closing quote
                insideQuotes = !insideQuotes;
            }

            continue;
        }

        // Field separator
        if (char === "," && !insideQuotes) {
            currentRow.push(currentField);
            currentField = "";
            continue;
        }

        // Newline handling outside quoted fields
        if ((char === "\n" || char === "\r") && !insideQuotes) {
            // Handle CRLF as one newline
            if (char === "\r" && nextChar === "\n") {
                i++;
            }

            currentRow.push(currentField);

            const rowIsCompletelyEmpty =
                currentRow.length === 1 && currentRow[0] === "";

            if (!rowIsCompletelyEmpty) {
                rows.push(currentRow);
            }

            currentRow = [];
            currentField = "";
            continue;
        }

        // Ordinary character
        currentField += char;
    }

    // Final row if the file does not end with a newline
    if (currentField.length > 0 || currentRow.length > 0) {
        currentRow.push(currentField);

        const rowIsCompletelyEmpty =
            currentRow.length === 1 && currentRow[0] === "";

        if (!rowIsCompletelyEmpty) {
            rows.push(currentRow);
        }
    }

    if (insideQuotes) {
        throw new Error("CSV parsing failed: unmatched quotation mark.");
    }

    return rows;
}


/* -------------------------------------------------------------------------- */
/* 2. Convert CSV rows to objects                                             */
/* -------------------------------------------------------------------------- */

/**
 * Convert CSV text into an array of objects using the first row as headers.
 *
 * Example:
 *   item_id,item_type
 *   CARRIER_PRACTICE_001,practice
 *
 * becomes:
 *   [
 *     {
 *       item_id: "CARRIER_PRACTICE_001",
 *       item_type: "practice"
 *     }
 *   ]
 *
 * @param {string} csvText
 * @returns {object[]}
 */
function parseCsvToObjects(csvText) {
    const rows = parseCsvRows(csvText);

    if (rows.length === 0) {
        return [];
    }

    const headers = rows[0].map((header) => header.trim());

    if (headers.some((header) => !header)) {
        throw new Error("CSV parsing failed: at least one header is empty.");
    }

    const duplicateHeaders = headers.filter(
        (header, index) => headers.indexOf(header) !== index
    );

    if (duplicateHeaders.length > 0) {
        throw new Error(
            `CSV parsing failed: duplicate header(s): ${duplicateHeaders.join(", ")}`
        );
    }

    return rows.slice(1).map((row, rowIndex) => {
        if (row.length !== headers.length) {
            throw new Error(
                `CSV parsing failed on data row ${rowIndex + 2}: expected ${headers.length} columns, found ${row.length}.`
            );
        }

        const objectRow = {};

        headers.forEach((header, columnIndex) => {
            objectRow[header] = row[columnIndex];
        });

        return objectRow;
    });
}


/* -------------------------------------------------------------------------- */
/* 3. Fetch helpers                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Fetch a CSV file from the server and return its raw text.
 *
 * @param {string} csvUrl
 * @returns {Promise<string>}
 */
async function fetchCsvText(csvUrl) {
    if (!csvUrl || typeof csvUrl !== "string") {
        throw new Error("fetchCsvText requires a CSV URL string.");
    }

    const response = await fetch(csvUrl, {
        method: "GET",
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(
            `Failed to load CSV file: ${csvUrl} (HTTP ${response.status})`
        );
    }

    return response.text();
}


/**
 * Fetch a CSV file and parse it into an array of objects.
 *
 * @param {string} csvUrl
 * @returns {Promise<object[]>}
 */
async function loadCsvAsObjects(csvUrl) {
    const csvText = await fetchCsvText(csvUrl);
    return parseCsvToObjects(csvText);
}


/* -------------------------------------------------------------------------- */
/* 4. Type coercion helpers                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Convert selected fields in a row object from strings to integers.
 *
 * CSV files arrive as strings in the browser. For numeric fields such as:
 *   - order_number
 *   - block_number
 *   - position_in_block
 *   - global_main_position
 *
 * it is convenient to convert them before using them.
 *
 * @param {object} row
 * @param {string[]} fieldNames
 * @returns {object}
 */
function coerceIntegerFields(row, fieldNames = []) {
    const output = { ...row };

    fieldNames.forEach((fieldName) => {
        const rawValue = output[fieldName];

        if (
            rawValue === "" ||
            rawValue === null ||
            rawValue === undefined ||
            String(rawValue).trim().toUpperCase() === "NA"
        ) {
            output[fieldName] = null;
            return;
        }

        const numericValue = Number(rawValue);

        if (!Number.isInteger(numericValue)) {
            throw new Error(
                `Field "${fieldName}" could not be converted to an integer: ${rawValue}`
            );
        }

        output[fieldName] = numericValue;
    });

    return output;
}


/**
 * Convert common CSV boolean values to JavaScript booleans.
 *
 * Accepted TRUE values:
 *   TRUE, true, 1
 *
 * Accepted FALSE values:
 *   FALSE, false, 0
 *
 * Empty strings become null.
 *
 * @param {object} row
 * @param {string[]} fieldNames
 * @returns {object}
 */
function coerceBooleanFields(row, fieldNames = []) {
    const output = { ...row };

    fieldNames.forEach((fieldName) => {
        const rawValue = output[fieldName];

        if (rawValue === "" || rawValue === null || rawValue === undefined) {
            output[fieldName] = null;
            return;
        }

        if (rawValue === true || rawValue === false) {
            return;
        }

        const normalized = String(rawValue).trim().toLowerCase();

        if (normalized === "true" || normalized === "1") {
            output[fieldName] = true;
            return;
        }

        if (normalized === "false" || normalized === "0") {
            output[fieldName] = false;
            return;
        }

        throw new Error(
            `Field "${fieldName}" could not be converted to a boolean: ${rawValue}`
        );
    });

    return output;
}


/* -------------------------------------------------------------------------- */
/* 5. Carrier-phrase-specific loaders                                         */
/* -------------------------------------------------------------------------- */

/**
 * Load and normalize the carrier-phrase practice manifest.
 *
 * @param {string} practiceManifestUrl
 * @returns {Promise<object[]>}
 */
async function loadCarrierPhrasePracticeManifest(practiceManifestUrl) {
    const rows = await loadCsvAsObjects(practiceManifestUrl);

    return rows.map((row) => ({ ...row }));
}


/**
 * Load and normalize one carrier-phrase main order file.
 *
 * Numeric order fields are converted from CSV strings to numbers.
 * Boolean is_filler is converted to true/false.
 *
 * @param {string} orderFileUrl
 * @returns {Promise<object[]>}
 */
async function loadCarrierPhraseOrderFile(orderFileUrl) {
    const rows = await loadCsvAsObjects(orderFileUrl);

    return rows.map((row) => {
        let normalized = coerceIntegerFields(row, [
            "order_number",
            "block_shift",
            "block_number",
            "position_in_block",
            "global_main_position",
            "target_position_in_block",
            "filler_position_in_block"
        ]);

        normalized = coerceBooleanFields(normalized, [
            "is_filler"
        ]);

        return normalized;
    });
}

/* -------------------------------------------------------------------------- */
/* 6. Ambiguous pragmatic-context task loaders                                */
/* -------------------------------------------------------------------------- */

/**
 * Load and normalize the Task 2 ambiguous-context practice manifest.
 *
 * @param {string} practiceManifestUrl
 * @returns {Promise<object[]>}
 */
async function loadAmbiguousPracticeManifest(practiceManifestUrl) {
    const rows = await loadCsvAsObjects(practiceManifestUrl);

    return rows.map((row) => ({ ...row }));
}


/**
 * Load and normalize one Task 2 ambiguous-context main order file.
 *
 * Numeric order fields are converted from CSV strings to numbers.
 * Boolean is_filler is converted to true/false.
 * CSV "NA" markers emitted by R are treated as null by coerceIntegerFields().
 *
 * @param {string} orderFileUrl
 * @returns {Promise<object[]>}
 */
async function loadAmbiguousOrderFile(orderFileUrl) {
    const rows = await loadCsvAsObjects(orderFileUrl);

    return rows.map((row) => {
        let normalized = coerceIntegerFields(row, [
            "order_number",
            "condition_shift",
            "block_number",
            "position_in_block",
            "global_main_position",
            "target_position_in_block",
            "filler_position_in_block",
            "repetition_number"
        ]);

        normalized = coerceBooleanFields(normalized, [
            "is_filler"
        ]);

        return normalized;
    });
}

