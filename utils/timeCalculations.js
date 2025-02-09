exports.calculateHours = (start, end) => {
    const diff = new Date(end) - new Date(start);
    return Math.floor(diff / 1000 / 60 / 60);
};

exports.calculateDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate - startDate;
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1; // Inclusive count
};