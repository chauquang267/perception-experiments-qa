/**
 * participant-utils.js
 *
 * Shared participant/provider ID validation and decoding for the PhD suite.
 *
 * Code format:
 *   SSPGXNNN
 *
 *   SS  = site / collection country
 *   P   = phase or role
 *   G   = participant group
 *   X   = sex/gender code
 *   NNN = serial number
 *
 * Historical technical-test namespace:
 *   00999NNN
 *
 * From 2026-09-26 onward, new pilot/testing/validation runs use ordinary
 * participant-format IDs with real site/group/sex fields and high serials.
 * The 00999NNN namespace remains decodable only for historical provenance.
 */


const PARTICIPANT_ID_SCHEMA = Object.freeze({
    expectedLength: 8,
    positions: Object.freeze({
        site: { start: 0, end: 2 },
        phase: { start: 2, end: 3 },
        group: { start: 3, end: 4 },
        sex: { start: 4, end: 5 },
        serial: { start: 5, end: 8 }
    })
});


const PARTICIPANT_SITE_CODES = Object.freeze({
    "00": Object.freeze({
        site_code: "00",
        site: "TEST",
        site_label: "Technical test",
        timezone: "UTC"
    }),
    "33": Object.freeze({
        site_code: "33",
        site: "FR",
        site_label: "France",
        timezone: "Europe/Paris"
    }),
    "84": Object.freeze({
        site_code: "84",
        site: "VN",
        site_label: "Vietnam",
        timezone: "Asia/Ho_Chi_Minh"
    })
});


const PARTICIPANT_PHASE_CODES = Object.freeze({
    "0": Object.freeze({
        phase_code: "0",
        phase: "pilot",
        phase_label: "Pilot"
    }),
    "1": Object.freeze({
        phase_code: "1",
        phase: "main",
        phase_label: "Main experiment"
    }),
    "2": Object.freeze({
        phase_code: "2",
        phase: "stimulus_provider",
        phase_label: "Stimulus provider"
    }),
    "9": Object.freeze({
        phase_code: "9",
        phase: "test",
        phase_label: "Technical test / debug"
    })
});


const PARTICIPANT_GROUP_CODES = Object.freeze({
    "1": Object.freeze({
        group_code: "1",
        group: "HS",
        group_label: "Heritage speakers"
    }),
    "2": Object.freeze({
        group_code: "2",
        group: "NV_Paris",
        group_label: "Northern Vietnamese speakers in Paris"
    }),
    "3": Object.freeze({
        group_code: "3",
        group: "NV_Hanoi",
        group_label: "Northern Vietnamese speakers in Hanoi / NV stimulus providers"
    }),
    "4": Object.freeze({
        group_code: "4",
        group: "FR",
        group_label: "French speakers"
    }),
    "9": Object.freeze({
        group_code: "9",
        group: "TEST",
        group_label: "Technical test"
    })
});


const PARTICIPANT_SEX_CODES = Object.freeze({
    "0": Object.freeze({
        sex_code: "0",
        sex: "female",
        sex_label: "Female",
        sex_short: "F"
    }),
    "1": Object.freeze({
        sex_code: "1",
        sex: "male",
        sex_label: "Male",
        sex_short: "M"
    }),
    "2": Object.freeze({
        sex_code: "2",
        sex: "other",
        sex_label: "Other / non-binary",
        sex_short: "X"
    }),
    "9": Object.freeze({
        sex_code: "9",
        sex: "not_reported",
        sex_label: "Not reported / not applicable",
        sex_short: "U"
    })
});


const TECHNICAL_TEST_NAMESPACE = Object.freeze({
    site_code: "00",
    phase_code: "9",
    group_code: "9",
    sex_code: "9",
    serial_min: 1,
    serial_max: 999
});


const PARTICIPANT_SERIAL_BANDS = Object.freeze({
    ordinary_scientific: Object.freeze({
        label: "Ordinary scientific/main range",
        min: 1,
        max: 899
    }),
    pilot_testing: Object.freeze({
        label: "Pilot / rehearsal / participant-format testing",
        min: 900,
        max: 989
    }),
    activation_validation: Object.freeze({
        label: "Technical QA / activation validation",
        min: 990,
        max: 999
    })
});


/**
 * Global acceptance rules for current participant-format IDs on hosted tasks.
 *
 * These rules answer only: "Is this a valid current participant ID?"
 * They deliberately do NOT encode site/group coherence or whether a person
 * belongs in a particular task. Those checks are evaluated separately and
 * should affect provenance/scientific eligibility rather than block entry.
 *
 * Historical 00999NNN technical IDs remain a separate valid namespace handled
 * by collectParticipantCode(..., { allowTechnical: true }).
 */
const HOSTED_PARTICIPANT_ENTRY_RULES = Object.freeze({
    allowedSiteCodes: Object.freeze(["33", "84"]),
    allowedPhaseCodes: Object.freeze(["0", "1", "2"]),
    allowedGroupCodes: Object.freeze(["1", "2", "3", "4"]),
    allowedSexCodes: Object.freeze(["0", "1", "2", "9"]),
    allowedSerialMin: 1,
    allowedSerialMax: 999,
    requireTechnicalTestCode: false
});


function cleanParticipantCode(rawCode) {
    if (rawCode === null || rawCode === undefined) {
        return "";
    }

    return String(rawCode)
        .trim()
        .replace(/\s+/g, "");
}


function splitParticipantCode(cleanedCode) {
    const pos = PARTICIPANT_ID_SCHEMA.positions;

    return {
        site_code: cleanedCode.slice(pos.site.start, pos.site.end),
        phase_code: cleanedCode.slice(pos.phase.start, pos.phase.end),
        group_code: cleanedCode.slice(pos.group.start, pos.group.end),
        sex_code: cleanedCode.slice(pos.sex.start, pos.sex.end),
        serial: cleanedCode.slice(pos.serial.start, pos.serial.end)
    };
}


function partsUseReservedTechnicalTestFields(parts) {
    return Boolean(
        parts &&
        (
            parts.site_code === TECHNICAL_TEST_NAMESPACE.site_code ||
            parts.phase_code === TECHNICAL_TEST_NAMESPACE.phase_code ||
            parts.group_code === TECHNICAL_TEST_NAMESPACE.group_code
        )
    );
}


function isTechnicalTestParts(parts) {
    if (!parts) return false;

    const serialNumber = Number(parts.serial);

    return (
        parts.site_code === TECHNICAL_TEST_NAMESPACE.site_code &&
        parts.phase_code === TECHNICAL_TEST_NAMESPACE.phase_code &&
        parts.group_code === TECHNICAL_TEST_NAMESPACE.group_code &&
        parts.sex_code === TECHNICAL_TEST_NAMESPACE.sex_code &&
        Number.isInteger(serialNumber) &&
        serialNumber >= TECHNICAL_TEST_NAMESPACE.serial_min &&
        serialNumber <= TECHNICAL_TEST_NAMESPACE.serial_max
    );
}


function isTechnicalTestCode(rawCode) {
    const code = cleanParticipantCode(rawCode);

    if (!/^\d{8}$/.test(code)) {
        return false;
    }

    return isTechnicalTestParts(splitParticipantCode(code));
}


function getTechnicalTestSerialCategory(serial) {
    const serialNumber = Number(serial);

    if (!Number.isInteger(serialNumber) || serialNumber < 1 || serialNumber > 999) {
        return null;
    }

    if (serialNumber <= 9) {
        return "researcher_developer_self";
    }

    if (serialNumber <= 99) {
        return "research_team";
    }

    if (serialNumber <= 899) {
        return "manual_qa";
    }

    return "automated_qa";
}


function getParticipantSerialBand(serial) {
    const serialNumber = Number(serial);

    if (!Number.isInteger(serialNumber) || serialNumber < 1 || serialNumber > 999) {
        return null;
    }

    for (const [bandName, band] of Object.entries(PARTICIPANT_SERIAL_BANDS)) {
        if (serialNumber >= band.min && serialNumber <= band.max) {
            return bandName;
        }
    }

    return null;
}


function validateParticipantCode(rawCode) {
    const code = cleanParticipantCode(rawCode);
    const errors = [];

    if (!code) {
        return {
            valid: false,
            code,
            errors: ["No participant code was entered."]
        };
    }

    if (!/^\d{8}$/.test(code)) {
        return {
            valid: false,
            code,
            errors: ["The participant code must contain exactly 8 digits."]
        };
    }

    const parts = splitParticipantCode(code);
    const usesReservedTestFields = partsUseReservedTechnicalTestFields(parts);

    if (usesReservedTestFields) {
        if (!isTechnicalTestParts(parts)) {
            errors.push(
                "Reserved technical-test fields are valid only in the complete 00999NNN namespace with NNN from 001 to 999."
            );
        }

        return {
            valid: errors.length === 0,
            code,
            errors,
            parts
        };
    }

    if (!PARTICIPANT_SITE_CODES[parts.site_code] || parts.site_code === "00") {
        errors.push(`Unknown site code: ${parts.site_code}.`);
    }

    if (!PARTICIPANT_PHASE_CODES[parts.phase_code] || parts.phase_code === "9") {
        errors.push(`Unknown phase/role code: ${parts.phase_code}.`);
    }

    if (!PARTICIPANT_GROUP_CODES[parts.group_code] || parts.group_code === "9") {
        errors.push(`Unknown group code: ${parts.group_code}.`);
    }

    if (!PARTICIPANT_SEX_CODES[parts.sex_code]) {
        errors.push(`Unknown sex/gender code: ${parts.sex_code}.`);
    }

    return {
        valid: errors.length === 0,
        code,
        errors,
        parts
    };
}


function decodeParticipantCode(rawCode) {
    const validation = validateParticipantCode(rawCode);

    if (!validation.valid) {
        throw new Error(
            `Invalid participant code: ${validation.errors.join(" ")}`
        );
    }

    const { code, parts } = validation;
    const siteInfo = PARTICIPANT_SITE_CODES[parts.site_code];
    const phaseInfo = PARTICIPANT_PHASE_CODES[parts.phase_code];
    const groupInfo = PARTICIPANT_GROUP_CODES[parts.group_code];
    const sexInfo = PARTICIPANT_SEX_CODES[parts.sex_code];
    const technicalTest = isTechnicalTestParts(parts);

    return {
        participant_id: code,

        site_code: parts.site_code,
        site: siteInfo.site,
        site_label: siteInfo.site_label,
        site_timezone: siteInfo.timezone,

        phase_code: parts.phase_code,
        phase: phaseInfo.phase,
        phase_label: phaseInfo.phase_label,

        group_code: parts.group_code,
        group: groupInfo.group,
        group_label: groupInfo.group_label,

        sex_code: parts.sex_code,
        sex: sexInfo.sex,
        sex_label: sexInfo.sex_label,
        sex_short: sexInfo.sex_short,

        serial: parts.serial,
        serial_number: Number(parts.serial),
        serial_band: technicalTest
            ? "legacy_technical"
            : getParticipantSerialBand(parts.serial),
        is_technical_test: technicalTest,
        test_serial_category: technicalTest
            ? getTechnicalTestSerialCategory(parts.serial)
            : null
    };
}


function validateParticipantForTask(decodedCode, taskRules = {}) {
    const errors = [];

    if (!decodedCode || typeof decodedCode !== "object") {
        return {
            valid: false,
            errors: ["No decoded participant metadata was provided."]
        };
    }

    const {
        allowedSiteCodes,
        allowedPhaseCodes,
        allowedGroupCodes,
        allowedSexCodes,
        allowedSiteGroupPairs,
        allowedSerialMin,
        allowedSerialMax,
        allowedSerialBands,
        allowedSerialRangesByPhase,
        requireTechnicalTestCode
    } = taskRules;

    if (requireTechnicalTestCode === true && decodedCode.is_technical_test !== true) {
        errors.push("This configuration accepts only reserved 00999NNN technical-test codes.");
    }

    if (
        Array.isArray(allowedSiteCodes) &&
        !allowedSiteCodes.includes(decodedCode.site_code)
    ) {
        errors.push(`Site code ${decodedCode.site_code} is not allowed for this task.`);
    }

    if (
        Array.isArray(allowedPhaseCodes) &&
        !allowedPhaseCodes.includes(decodedCode.phase_code)
    ) {
        errors.push(`Phase/role code ${decodedCode.phase_code} is not allowed for this task.`);
    }

    if (
        Array.isArray(allowedGroupCodes) &&
        !allowedGroupCodes.includes(decodedCode.group_code)
    ) {
        errors.push(`Group code ${decodedCode.group_code} is not allowed for this task.`);
    }

    if (
        Array.isArray(allowedSexCodes) &&
        !allowedSexCodes.includes(decodedCode.sex_code)
    ) {
        errors.push(`Sex/gender code ${decodedCode.sex_code} is not allowed for this task.`);
    }

    if (Array.isArray(allowedSiteGroupPairs)) {
        const pairAllowed = allowedSiteGroupPairs.some((pair) => {
            if (Array.isArray(pair)) {
                return (
                    String(pair[0]) === decodedCode.site_code &&
                    String(pair[1]) === decodedCode.group_code
                );
            }

            return String(pair) ===
                `${decodedCode.site_code}:${decodedCode.group_code}`;
        });

        if (!pairAllowed) {
            errors.push(
                `Site/group combination ${decodedCode.site_code}:${decodedCode.group_code} is not allowed for this task.`
            );
        }
    }

    const serialNumber = Number(decodedCode.serial);

    if (
        Number.isInteger(allowedSerialMin) &&
        (!Number.isInteger(serialNumber) || serialNumber < allowedSerialMin)
    ) {
        errors.push(`Serial ${decodedCode.serial} is below the allowed minimum ${String(allowedSerialMin).padStart(3, "0")} for this task.`);
    }

    if (
        Number.isInteger(allowedSerialMax) &&
        (!Number.isInteger(serialNumber) || serialNumber > allowedSerialMax)
    ) {
        errors.push(`Serial ${decodedCode.serial} is above the allowed maximum ${String(allowedSerialMax).padStart(3, "0")} for this task.`);
    }

    if (
        Array.isArray(allowedSerialBands) &&
        !allowedSerialBands.includes(decodedCode.serial_band)
    ) {
        errors.push(`Serial band ${decodedCode.serial_band || "unknown"} is not allowed for this task.`);
    }

    if (
        allowedSerialRangesByPhase &&
        typeof allowedSerialRangesByPhase === "object" &&
        !Array.isArray(allowedSerialRangesByPhase)
    ) {
        const ranges = allowedSerialRangesByPhase[decodedCode.phase_code];
        const inAllowedPhaseRange =
            Array.isArray(ranges) &&
            ranges.some((range) => {
                if (!Array.isArray(range) || range.length !== 2) return false;
                const min = Number(range[0]);
                const max = Number(range[1]);
                return (
                    Number.isInteger(min) &&
                    Number.isInteger(max) &&
                    Number.isInteger(serialNumber) &&
                    serialNumber >= min &&
                    serialNumber <= max
                );
            });

        if (!inAllowedPhaseRange) {
            errors.push(
                `Serial ${decodedCode.serial} is not allowed for phase/role ${decodedCode.phase_code} in this task.`
            );
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}


function formatParticipantCodeSummary(decodedCode) {
    if (!decodedCode || typeof decodedCode !== "object") {
        return "Invalid participant metadata.";
    }

    return [
        decodedCode.participant_id,
        decodedCode.site_label,
        decodedCode.phase_label,
        decodedCode.group,
        decodedCode.sex_label,
        `serial ${decodedCode.serial}`
    ].join(" | ");
}


function getParticipantDataProperties(decodedCode) {
    return {
        participant_id: decodedCode.participant_id,

        site_code: decodedCode.site_code,
        site: decodedCode.site,
        site_label: decodedCode.site_label,
        site_timezone: decodedCode.site_timezone,

        phase_code: decodedCode.phase_code,
        phase: decodedCode.phase,
        phase_label: decodedCode.phase_label,

        group_code: decodedCode.group_code,
        group: decodedCode.group,
        group_label: decodedCode.group_label,

        sex_code: decodedCode.sex_code,
        sex: decodedCode.sex,
        sex_label: decodedCode.sex_label,
        sex_short: decodedCode.sex_short,

        serial: decodedCode.serial,
        serial_number: decodedCode.serial_number,
        serial_band: decodedCode.serial_band,
        is_technical_test: decodedCode.is_technical_test === true,
        test_serial_category: decodedCode.test_serial_category || null
    };
}


if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        PARTICIPANT_ID_SCHEMA,
        PARTICIPANT_SERIAL_BANDS,
        HOSTED_PARTICIPANT_ENTRY_RULES,
        TECHNICAL_TEST_NAMESPACE,
        cleanParticipantCode,
        splitParticipantCode,
        partsUseReservedTechnicalTestFields,
        isTechnicalTestParts,
        isTechnicalTestCode,
        getTechnicalTestSerialCategory,
        getParticipantSerialBand,
        validateParticipantCode,
        decodeParticipantCode,
        validateParticipantForTask,
        formatParticipantCodeSummary,
        getParticipantDataProperties
    };
}
