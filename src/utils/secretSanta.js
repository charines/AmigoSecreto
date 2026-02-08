export function performSecretSanta(names) {
    let shuffled = [...names];
    let valid = false;
    let attempts = 0;

    while (!valid && attempts < 500) {
        attempts++;
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        valid = names.every((name, i) => name !== shuffled[i]);
    }
    return shuffled;
}

export function encryptData(data) {
    const salt = Math.random().toString(36).substring(2, 7);
    const stringToEncode = `${salt}|${JSON.stringify(data)}`;
    return btoa(stringToEncode);
}

export function decryptData(code) {
    try {
        const decoded = atob(code);
        const [salt, jsonStr] = decoded.split('|');
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Erro na descriptografia:", e);
        return null;
    }
}