function getDATETIME(lengthTime = 1) {
    /** 当前时间 **/
    const now = new Date();
    const futureDate = new Date(now.getTime() + (lengthTime * 24 * 60 * 60 * 1000)); // 60天的毫秒数
    return futureDate.toISOString().replace(/T/, ' ').replace(/\..+/, '');

}

function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export default {
    getDATETIME,
    formatDateTime
}
