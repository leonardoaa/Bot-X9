export function unixTime(unix_timestamp) {

    var u = new Date(unix_timestamp * 1000);

    return `${('0' + u.getHours()).slice(-2)}:${('0' + u.getMinutes()).slice(-2)}:${('0' + u.getSeconds()).slice(-2)} ${('0' + u.getDate()).slice(-2)}/${('0' + u.getMonth()).slice(-2)}/${u.getFullYear()}`;
};

export default unixTime;