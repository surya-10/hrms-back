const nlp = require('compromise');
const chrono = require('chrono-node');
const { createTimeoff } = require('./timeoff.controller');
const { inferReason } = require('../../utils/Gemini AI/gemini.reasonExtractor');

// exports.getDateAndReason = async (req, res) => {
//     try {
//         const { data } = req.body;
//         if (!data) {
//             return res.status(400).json({ error: "No input data provided" });
//         }

//         const doc = nlp(data);
//         let dates = doc.match('#Date').out('array');

//         // Regex for additional date formats (e.g., "Feb 12 2025", "12-02-2025", etc.)
//         const dateRegex = /\b(\w{3,9} \d{1,2},? \d{4}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\b/gi;
//         const regexDates = data.match(dateRegex) || [];

//         // Remove duplicate and incorrect values
//         dates = [...new Set([...dates, ...regexDates])].filter(d => d.length > 6);
//         console.log(dates, 19)
//         const formattedates = dates.map((data)=>new Date(data));
//         console.log(formattedates)

//         // Keywords for reason extraction
//         const reasonKeywords = ['because of', 'because', 'for', 'due to', 'as', 'since', 'reason is', 'due', 'caused by'];
//         let reason = '';

//         // Find reason in sentence
//         for (const keyword of reasonKeywords) {
//             const lowerData = data.toLowerCase();
//             if (lowerData.includes(keyword)) {
//                 reason = data.split(new RegExp(`${keyword}`, 'i'))[1]?.trim();
//                 break;
//             }
//         }

//         // If no explicit reason found, take the last word (if it's not a date/number)
//         if (!reason) {
//             const words = data.split(/\s+/);
//             if (words.length > 1 && !/\d/.test(words[words.length - 1])) {
//                 reason = words[words.length - 1];
//             }
//         }

//         // Prepare response
//         let response = { 
//             date: dates.length ? dates : ["No date found"],
//             reason: reason || "No reason found"
//         };

//         // Confirmation message
//         response.confirmation = `Please confirm the extracted details: Date(s): ${response.date.join(', ')}, Reason: ${response.reason}. Is this correct?`;

//         console.log(response);
//         return res.status(200).json(response);

//     } catch (error) {
//         console.error("Error extracting date and reason:", error);
//         return res.status(500).json({ error: "Internal Server Error" });
//     }
// };

// exports.getDateAndReason = async (req, res) => {
//     try {
//         const { data } = req.body;
//         console.log(data)
//         if (!data) {
//             return res.status(400).json({ error: "No input data provided" });
//         }

//         const doc = nlp(data);
//         let dates = doc.match('#Date').out('array');
//         const formatChange = dates.map(normalizeDate)
//         console.log(dates, formatChange, 73)
//         const dateRegex = /\b(\w{3,9} \d{1,2},? \d{4}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\b/gi;
//         const regexDates = data.match(dateRegex) || [];
//         dates = [...new Set([...dates, ...regexDates])].filter(d => d.length > 6);
//         const formatDates = (dates) => {
//             return dates.map(dateStr => {
//                 if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(dateStr)) {
//                     const [day, month, year] = dateStr.split(/[-/]/).map(Number);
//                     return new Date(year, month - 1, day); // Months are zero-based in JS
//                 }
//                 const parsedDate = new Date(dateStr);
//                 return isNaN(parsedDate.getTime()) ? null : parsedDate;
//             }).filter(date => date !== null); // Remove invalid dates
//         };

//         const formattedDates = formatDates(dates);
//         // console.log("Extracted Dates:", formattedDates);
//         const reasonKeywords = ['because of', 'because', 'for', 'due to', 'as', 'since', 'reason is', 'due', 'caused by'];
//         let reason = '';
//         for (const keyword of reasonKeywords) {
//             const lowerData = data.toLowerCase();
//             if (lowerData.includes(keyword)) {
//                 reason = data.split(new RegExp(`${keyword}`, 'i'))[1]?.trim();
//                 break;
//             }
//         }

//         // If no explicit reason found, extract the last non-date word
//         if (!reason) {
//             const words = data.split(/\s+/);
//             if (words.length > 1 && !/\d/.test(words[words.length - 1])) {
//                 reason = words[words.length - 1];
//             }
//         }

//         // Prepare response
//         let response = { 
//             date: formattedDates.length ? formattedDates : ["No valid date found"],
//             reason: reason || "No reason found"
//         };

//         // Confirmation message
//         response.confirmation = `Please confirm the extracted details: Date(s): ${response.date.join(', ')}, Reason: ${response.reason}. Is this correct?`;

//         // console.log(response);
//         return res.status(200).json(response);

//     } catch (error) {
//         console.error("Error extracting date and reason:", error);
//         return res.status(500).json({ error: "Internal Server Error" });
//     }
// };
// Assuming you're using the compromise NLP library

// Normalize date helper function
const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    const dateRegex = /(\d{2})[-/](\d{2})[-/](\d{4})/;
    const matched = dateStr.match(dateRegex);
    if (matched) {
        const [, day, month, year] = matched;
        return `${day}-${month}-${year}`;
    }
    return null;
};

// Combine chrono-node and NLP functionality
// Ensure you have an NLP library if needed

// exports.getDateAndReason = async (req, res) => {
//     try {
//         const { data } = req.body;
//         console.log(data)

//         if (!data) {
//             return res.status(400).json({ error: "No input data provided" });
//         }

//         // Extract dates using Chrono
//         const chronoResults = chrono.parse(data);
//         const extractedDates = chronoResults.map(date => ({
//             start: date.start.date().toISOString().split('T')[0],
//             end: date.end ? date.end.date().toISOString().split('T')[0] : date.start.date().toISOString().split('T')[0]
//         }));
//         if (!extractedDates.length) {
//             return res.status(204).json({ response: "No valid date found" });
//         }

//         // Extract reason using NLP and keywords
//         const reasonKeywords = ['because of', 'because', 'for', 'due to', 'as', 'since', 'reason is', 'due', 'caused by'];
//         let reason = '';

//         for (const keyword of reasonKeywords) {
//             const lowerData = data.toLowerCase();
//             if (lowerData.includes(keyword)) {
//                 reason = data.split(new RegExp(`${keyword}`, 'i'))[1]?.trim();
//                 break;
//             }
//         }

//         // If no reason is found, extract all text after the last detected date
//         if (!reason && extractedDates.length > 0) {
//             const lastDateStr = extractedDates[extractedDates.length - 1].end;
//             const lastDateIndex = data.lastIndexOf(lastDateStr);

//             if (lastDateIndex !== -1) {
//                 reason = data.substring(lastDateIndex + lastDateStr.length).trim();
//             }
//         }

//         // Prepare the response
//         let response = {
//             date: extractedDates.length ? extractedDates : ["No valid date found"],
//             reason: reason || ""
//         };

//         // Confirmation message
//         response.confirmation = `Please confirm the extracted details: Date(s): ${response.date.map(d => `${d.start} to ${d.end}`).join(', ')}, Reason: ${response.reason}. Is this correct?`;

//         return res.status(200).json(response);
//         // createTimeoff()

//     } catch (error) {
//         console.error("Error extracting date and reason:", error);
//         return res.status(500).json({ error: "Internal Server Error" });
//     }
// };

exports.getDateAndReason = async (req, res) => {
    try {
        const { data } = req.body;
        console.log(data)

        if (!data) {
            return res.status(400).json({ error: "No input data provided" });
        }
        
        // Enhanced date parsing with chrono
        const chronoResults = chrono.parse(data, {
            forwardDate: true,
            parsers: [
                chrono.parseDate,
                chrono.parseTime,
                chrono.parseDateWithMonthName
            ]
        });

        // Extract and validate dates
        const extractedDates = chronoResults.map(date => {
            const startDate = date.start.date();
            const endDate = date.end ? date.end.date() : date.start.date();

            // Format dates in YYYY-MM-DD format for storage
            const formatDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            return {
                start: formatDate(startDate),
                end: formatDate(endDate)
            };
        });

        console.log("Extracted dates:", extractedDates);

        if (!extractedDates.length) {
            return res.status(204).json({ 
                message: "Please provide dates in format like 'Feb 20 2025' or 'February 20 2025'" 
            });
        }

        // Extract reason using Gemini AI
        const result = await inferReason(data);
        console.log("Extracted reason:", result);

        // Prepare response
        const response = {
            date: extractedDates,
            reason: result || "not found"
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error("Error extracting date and reason:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


// const normalizeDate = (date) => {
//     if (date.includes('.')) {
//       return date.replace(/\./g, '-');
//     } else if (date.includes('-')) {
//       return date;
//     } else if (date.includes('/')) {
//       return date.replace(/\//g, '-');
//     } else {
//       return "Invalid Date Format";
//     }
//   };
