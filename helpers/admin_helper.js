function teste (user) {
    if (user && user.eAdmin == 1) {
        return true;
    } else {
        return false;
    }
}

module.exports = teste;

// function teste(params) {
//     return true
// }
